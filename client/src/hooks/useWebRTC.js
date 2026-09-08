// client/src/hooks/useWebRTC.js

import { useState, useEffect, useRef, useCallback } from 'react';


// How often a stream-less guest nudges the host for a fresh offer.
const GUEST_REQUEST_INTERVAL_MS = 5000;
// Give an in-flight negotiation this long before allowing a re-request to replace it.
const NEGOTIATION_GRACE_MS = 45000;

/**
 * Custom Hook to manage WebRTC streaming logic.
 *
 * Design notes (rewritten after repeated race bugs):
 * - All mutable session state (isHost, participants, sessionMode, remoteStream, ...) is
 *   mirrored into refs. Callbacks and socket handlers read the refs, so they stay stable
 *   for the lifetime of the socket and never capture stale state.
 * - Guests accept offers at any time, regardless of sessionMode. New offers always
 *   replace the old peer connection (the host only sends an offer when it has created a
 *   fresh connection on its side, so the old one is dead by definition).
 * - Self-healing: a guest in stream mode without a stream periodically emits
 *   'webrtc:request-offer'; the host always complies by renegotiating from scratch.
 *
 * @returns {{
 *   remoteStream: MediaStream | null;
 *   startStreaming: () => void;
 *   stopStreaming: () => void;
 *   isStreamingActive: boolean;
 *   webRTCError: string | null;
 * }}
 */
function useWebRTC({
  socket,
  sessionId,
  isHost,
  sessionMode,
  participants,
  selfId,
  localStreamSourceRef,
}) {
  // peerId -> { pc: RTCPeerConnection, createdAt: number }
  const peerConnections = useRef(new Map());
  // Candidates are tagged with the negotiation that produced them.
  const pendingCandidates = useRef(new Map());
  const localStreamRef = useRef(null);
  const iceConfig = useRef(null);
  const configRequest = useRef(null);
  const pendingConnections = useRef(new Map());

  const getIceConfig = useCallback(async () => {
    if (iceConfig.current?.expiresAt > Date.now() + 60_000) return iceConfig.current;
    if (!configRequest.current) {
      configRequest.current = new Promise((resolve, reject) => {
        socketRef.current.timeout(12_000).emit('webrtc:config', (error, config) => {
          if (error || config?.error || !config?.iceServers?.length) {
            reject(new Error(config?.error || 'Could not contact the streaming relay. Please try again.'));
          } else { iceConfig.current = config; resolve(config); }
        });
      }).finally(() => { configRequest.current = null; });
    }
    return configRequest.current;
  }, []);

  const [remoteStream, setRemoteStream] = useState(null);
  const [isStreamingActive, setIsStreamingActive] = useState(false);
  const [webRTCError, setWebRTCError] = useState(null);

  // --- Refs mirroring props/state so stable callbacks never go stale ---
  const socketRef = useRef(socket);
  const isHostRef = useRef(isHost);
  const participantsRef = useRef(participants);
  const selfIdRef = useRef(selfId);
  const sessionModeRef = useRef(sessionMode);
  const remoteStreamRef = useRef(remoteStream);
  const isStreamingActiveRef = useRef(isStreamingActive);

  socketRef.current = socket;
  isHostRef.current = isHost;
  participantsRef.current = participants;
  selfIdRef.current = selfId;
  sessionModeRef.current = sessionMode;
  remoteStreamRef.current = remoteStream;
  isStreamingActiveRef.current = isStreamingActive;


  const clearError = useCallback(() => setWebRTCError(null), []);

  // --- Helpers (all stable: they only touch refs) ---

  const processPendingCandidates = useCallback(async (peerId) => {
    const entry = peerConnections.current.get(peerId);
    const pc = entry?.pc;
    const candidates = pendingCandidates.current.get(peerId) || [];

    if (pc && pc.remoteDescription && candidates.length > 0) {
      console.log(`[WebRTC] Processing ${candidates.length} queued ICE candidates for ${peerId}`);
      pendingCandidates.current.delete(peerId);
      for (const { candidate, negotiationId } of candidates) {
        if (negotiationId && negotiationId !== entry.negotiationId) continue;
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
          console.warn(`[WebRTC] Error adding queued candidate for ${peerId}:`, error);
        }
      }
    }
  }, []);

  /**
   * Close one peer connection.
   * keepRemoteStream=true is used when we're about to replace the connection (renegotiation)
   * so the UI doesn't flash back to the loading state.
   */
  const closePeerConnection = useCallback((peerId, { keepRemoteStream = false } = {}) => {
    pendingConnections.current.delete(peerId);
    const entry = peerConnections.current.get(peerId);
    if (!entry) {
      pendingCandidates.current.delete(peerId);
      return;
    }
    const { pc } = entry;
    console.log(`[WebRTC] Closing connection to peer: ${peerId} (State: ${pc.connectionState || pc.iceConnectionState})`);
    pc.onicecandidate = null;
    pc.onicecandidateerror = null;
    pc.oniceconnectionstatechange = null;
    pc.onicegatheringstatechange = null;
    pc.onsignalingstatechange = null;
    pc.ontrack = null;

    // Only stop RECEIVER tracks (incoming media). Never stop sender tracks: on the host
    // they belong to the shared localStream and stopping them kills every other guest's feed.
    pc.getReceivers().forEach((receiver) => {
      try { receiver.track?.stop(); } catch { /* ignore */ }
    });

    try { pc.close(); } catch { /* ignore */ }
    peerConnections.current.delete(peerId);
    pendingCandidates.current.delete(peerId);

    if (!isHostRef.current && !keepRemoteStream && remoteStreamRef.current) {
      console.log(`[WebRTC Guest] Connection to host ${peerId} closed. Clearing remote stream.`);
      remoteStreamRef.current = null;
      setRemoteStream(null);
    }
  }, []);

  const closeAllConnections = useCallback(({ keepRemoteStream = false } = {}) => {
    const peerIds = Array.from(peerConnections.current.keys());
    if (peerIds.length) console.log('[WebRTC] Closing all connections:', peerIds);
    peerIds.forEach((peerId) => closePeerConnection(peerId, { keepRemoteStream }));
    peerConnections.current.clear();
    pendingConnections.current.clear();
    pendingCandidates.current.clear();
    if (!isHostRef.current && !keepRemoteStream && remoteStreamRef.current) {
      remoteStreamRef.current = null;
      setRemoteStream(null);
    }
  }, [closePeerConnection]);

  const stopLocalStream = useCallback(() => {
    if (localStreamRef.current) {
      console.log('[WebRTC] Stopping local stream tracks.');
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
  }, []);

  const createPeerConnection = useCallback(async (peerId, { keepRemoteStream = false, negotiationId = crypto.randomUUID() } = {}) => {
    const attempt = {};
    pendingConnections.current.set(peerId, attempt);
    let config;
    try { config = await getIceConfig(); }
    catch (error) {
      if (pendingConnections.current.get(peerId) === attempt) {
        pendingConnections.current.delete(peerId);
        setWebRTCError(error.message);
      }
      return null;
    }
    if (pendingConnections.current.get(peerId) !== attempt) return null;
    pendingConnections.current.delete(peerId);
    const queued = pendingCandidates.current.get(peerId);
    if (peerConnections.current.has(peerId)) {
      console.log(`[WebRTC] Replacing existing connection for ${peerId}.`);
      closePeerConnection(peerId, { keepRemoteStream });
    }

    if (queued) pendingCandidates.current.set(peerId, queued);
    console.log(`[WebRTC] Creating peer connection for: ${peerId}`);
    clearError();

    try {
      const pc = new RTCPeerConnection({ iceServers: config.iceServers });

      let inbound = null;
      pc.ontrack = (event) => {
        console.log(`[WebRTC] Track received from ${peerId}: Kind=${event.track.kind}, ReadyState=${event.track.readyState}`);
        if (isHostRef.current) return;
        if (event.streams && event.streams[0]) {
          if (remoteStreamRef.current !== event.streams[0]) {
            console.log(`[WebRTC Guest] Setting remote stream from ${peerId} (Stream ID: ${event.streams[0].id})`);
            remoteStreamRef.current = event.streams[0];
            setRemoteStream(event.streams[0]);
          }
        } else {
          // Fallback: build a stream from bare tracks
          inbound ||= new MediaStream();
          inbound.addTrack(event.track);
          remoteStreamRef.current = inbound;
          setRemoteStream(inbound);
        }
      };

      pc.onicecandidate = (event) => {
        const sock = socketRef.current;
        if (event.candidate && sock) {
          const c = event.candidate.candidate || '';
          const type = c.includes('relay') ? 'relay (TURN)' : c.includes('srflx') ? 'srflx (STUN)' : c.includes('host') ? 'host' : 'unknown';
          console.log(`[WebRTC] Sending ICE candidate to ${peerId}: type=${type}`);
          sock.emit('webrtc:ice-candidate', { targetUserId: peerId, candidate: event.candidate, negotiationId });
        } else if (!event.candidate) {
          console.log(`[WebRTC] ICE gathering complete for ${peerId}.`);
        }
      };

      pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        console.log(`[WebRTC] ICE connection state for ${peerId}: ${state}`);
        // Only act if this pc is still the current one for this peer
        const current = peerConnections.current.get(peerId);
        if (!current || current.pc !== pc) return;

        if (state === 'connected' || state === 'completed') {
          clearError();
        } else if (state === 'failed') {
          console.error(`[WebRTC] ICE failed for ${peerId}. Closing; recovery loop will renegotiate.`);
          closePeerConnection(peerId);
        } else if (state === 'closed') {
          closePeerConnection(peerId);
        }
        // 'disconnected' is often transient — let it recover or fail on its own.
      };

      pc.onicecandidateerror = (event) => {
        console.warn(`[WebRTC] ICE server error: ${event.url}, code=${event.errorCode}`);
      };
      pc.onsignalingstatechange = () => {
        console.log(`[WebRTC] Signaling state for ${peerId}: ${pc.signalingState}`);
      };

      peerConnections.current.set(peerId, { pc, negotiationId, createdAt: Date.now() });
      return pc;
    } catch (error) {
      console.error(`[WebRTC] Failed to create peer connection for ${peerId}:`, error);
      setWebRTCError(`Failed to initialize connection with peer ${peerId}.`);
      return null;
    }
  }, [clearError, closePeerConnection, getIceConfig]);

  /**
   * Host: make sure the captured local stream still has live tracks.
   * captureStream() tracks END PERMANENTLY when the source video reaches its end or the
   * element reloads its source. Offers built from a dead stream contain no media at all,
   * which bricks every guest that joins afterwards. Re-capture when that happens.
   */
  const ensureLiveLocalStream = useCallback(() => {
    const existing = localStreamRef.current;
    if (existing && existing.getVideoTracks().some((t) => t.readyState === 'live')) {
      return existing;
    }
    const el = localStreamSourceRef.current;
    if (!el) return existing;
    try {
      const fresh = el.captureStream ? el.captureStream() : el.mozCaptureStream?.();
      const freshTracks = fresh ? fresh.getTracks() : [];
      if (freshTracks.length > 0 && freshTracks.some((t) => t.kind === 'video' && t.readyState === 'live')) {
        console.log('[WebRTC Host] Local stream tracks had ended — re-captured from source element.');
        if (existing) existing.getTracks().forEach((t) => t.stop());
        localStreamRef.current = fresh;
        return fresh;
      }
      console.warn('[WebRTC Host] Re-capture produced no live tracks (video ended or not loaded?).');
    } catch (error) {
      console.warn('[WebRTC Host] Re-capture failed:', error?.message || error);
    }
    return existing;
  }, [localStreamSourceRef]);

  /**
   * Host: create a fresh connection to one guest and send an offer.
   * Always replaces any existing connection for that guest.
   */
  const hostConnectToGuest = useCallback(async (guestId) => {
    const sock = socketRef.current;
    if (!sock) return;

    const stream = ensureLiveLocalStream();
    const tracks = stream ? stream.getTracks() : [];
    if (!stream || tracks.length === 0) {
      console.warn(`[WebRTC Host] Cannot offer to ${guestId}: local stream has no tracks.`);
      return;
    }
    if (!tracks.some((t) => t.readyState === 'live')) {
      console.warn(`[WebRTC Host] Not offering to ${guestId}: all local tracks have ended. Play the video to resume streaming.`);
      return;
    }

    const current = peerConnections.current.get(guestId);
    if (current && Date.now() - current.createdAt < NEGOTIATION_GRACE_MS) return;
    if (pendingConnections.current.has(guestId)) return;
    const pc = await createPeerConnection(guestId);
    if (!pc) return;

    try {
      tracks.forEach((track) => {
        pc.addTrack(track, stream);
      });
      const offer = await pc.createOffer();
      if (peerConnections.current.get(guestId)?.pc !== pc) return;
      await pc.setLocalDescription(offer);
      if (peerConnections.current.get(guestId)?.pc !== pc) return;
      console.log(`[WebRTC Host] Sending offer to ${guestId}`);
      sock.emit('webrtc:offer', {
        targetUserId: guestId,
        offer: { sdp: offer.sdp, type: offer.type },
        negotiationId: peerConnections.current.get(guestId)?.negotiationId,
      });
    } catch (error) {
      if (peerConnections.current.get(guestId)?.pc !== pc) return;
      console.error(`[WebRTC Host] Error creating/sending offer to ${guestId}:`, error);
      setWebRTCError('Failed to initiate connection with a guest.');
      closePeerConnection(guestId);
    }
  }, [ensureLiveLocalStream, createPeerConnection, closePeerConnection]);

  // --- Host controls ---

  const startStreaming = useCallback(async () => {
    if (!isHostRef.current) return;
    if (isStreamingActiveRef.current) return;
    const sourceEl = localStreamSourceRef.current;
    if (!sourceEl) {
      console.warn('[WebRTC Host] startStreaming: no source <video> element yet.');
      return;
    }
    if (!socketRef.current) return;

    console.log('[WebRTC Host] Starting streaming...');
    clearError();

    let stream;
    try {
      stream = sourceEl.captureStream ? sourceEl.captureStream() : sourceEl.mozCaptureStream?.();
      if (!stream) throw new Error('captureStream() is not supported or returned nothing.');
      const tracks = stream.getTracks();
      console.log(`[WebRTC Host] captureStream OK. Tracks: ${tracks.map(t => t.kind).join(', ') || 'none'}`);
      if (!tracks.some(track => track.kind === 'video' && track.readyState === 'live')) {
        tracks.forEach(track => track.stop());
        return;
      }
      stopLocalStream();
      localStreamRef.current = stream;
    } catch (error) {
      console.error('[WebRTC Host] Stream capture failed:', error);
      setWebRTCError(`Failed to capture video stream: ${error.message}`);
      setIsStreamingActive(false);
      return;
    }

    setIsStreamingActive(true);
    isStreamingActiveRef.current = true;

    const guests = participantsRef.current.filter((p) => p.id !== selfIdRef.current);
    console.log('[WebRTC Host] Offering to guests:', guests.map((g) => g.nickname || g.id));
    for (const guest of guests) {
      hostConnectToGuest(guest.id);
    }
  }, [clearError, stopLocalStream, hostConnectToGuest, localStreamSourceRef]);

  const stopStreaming = useCallback(() => {
    if (!isHostRef.current || !isStreamingActiveRef.current) return;
    console.log('[WebRTC Host] Stopping streaming...');
    closeAllConnections();
    stopLocalStream();
    setIsStreamingActive(false);
    isStreamingActiveRef.current = false;
  }, [closeAllConnections, stopLocalStream]);

  // --- Socket signaling listeners (registered once per socket) ---
  useEffect(() => {
    if (!socket || !sessionId) return;

    // Guest: accept offers at ANY time, regardless of sessionMode. The mode update can
    // arrive after the host's offer (join-mid-stream race); dropping the offer bricked guests.
    const handleOffer = async ({ fromUserId, offer, negotiationId }) => {
      if (isHostRef.current) return;

      console.log(`[WebRTC Guest] Received offer from host ${fromUserId} (mode='${sessionModeRef.current}')`);
      clearError();

      // A new offer always supersedes whatever connection we had: the host creates a fresh
      // RTCPeerConnection before every offer, so our old one is orphaned regardless of its state.
      const pc = await createPeerConnection(fromUserId, { keepRemoteStream: true, negotiationId });
      if (!pc) return;

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        if (peerConnections.current.get(fromUserId)?.pc !== pc) return;
        await processPendingCandidates(fromUserId);
        const answer = await pc.createAnswer();
        if (peerConnections.current.get(fromUserId)?.pc !== pc) return;
        await pc.setLocalDescription(answer);
        if (peerConnections.current.get(fromUserId)?.pc !== pc) return;
        console.log(`[WebRTC Guest] Sending answer to host ${fromUserId}`);
        socket.emit('webrtc:answer', {
          targetUserId: fromUserId,
          answer: { sdp: answer.sdp, type: answer.type },
          negotiationId,
        });
      } catch (error) {
        if (peerConnections.current.get(fromUserId)?.pc !== pc) return;
        console.error('[WebRTC Guest] Error handling offer:', error);
        setWebRTCError('Failed to respond to host stream offer.');
        closePeerConnection(fromUserId);
      }
    };

    // Host: apply the guest's answer to the matching connection.
    const handleAnswer = async ({ fromUserId, answer, negotiationId }) => {
      if (!isHostRef.current) return;
      const entry = peerConnections.current.get(fromUserId);
      if (!entry || (negotiationId && entry.negotiationId !== negotiationId)) {
        console.warn(`[WebRTC Host] Answer from ${fromUserId} but no connection (stale answer?). Ignoring.`);
        return;
      }
      const { pc } = entry;
      if (pc.signalingState !== 'have-local-offer') {
        console.warn(`[WebRTC Host] Answer from ${fromUserId} in state '${pc.signalingState}'. Ignoring (stale/duplicate).`);
        return;
      }
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        console.log(`[WebRTC Host] Applied answer from ${fromUserId}.`);
        await processPendingCandidates(fromUserId);
      } catch (error) {
        console.error(`[WebRTC Host] Error applying answer from ${fromUserId}:`, error);
        setWebRTCError('Failed to establish connection with a guest.');
      }
    };

    const handleIceCandidate = async ({ fromUserId, candidate, negotiationId }) => {
      const entry = peerConnections.current.get(fromUserId);
      const pc = entry?.pc;
      if (pendingConnections.current.has(fromUserId) || !pc || !pc.remoteDescription || (negotiationId && entry.negotiationId !== negotiationId)) {
        if (!pendingCandidates.current.has(fromUserId)) {
          pendingCandidates.current.set(fromUserId, []);
        }
        const queue = pendingCandidates.current.get(fromUserId);
        queue.push({ candidate, negotiationId });
        if (queue.length > 64) queue.shift();
        return;
      }
      if (pc.signalingState === 'closed') return;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.warn(`[WebRTC] Error adding ICE candidate from ${fromUserId}:`, error?.message || error);
      }
    };

    // Host: a guest with no stream asked for a fresh offer. Always comply — the guest
    // only asks when its side is broken, even if our side still looks 'connected'.
    const handleOfferRequest = ({ fromUserId }) => {
      if (!isHostRef.current) return;
      if (!isStreamingActiveRef.current || !localStreamRef.current) {
        console.log(`[WebRTC Host] ${fromUserId} requested an offer but streaming isn't active. Ignoring.`);
        return;
      }
      console.log(`[WebRTC Host] ${fromUserId} requested an offer — renegotiating.`);
      hostConnectToGuest(fromUserId);
    };

    socket.on('webrtc:offer', handleOffer);
    socket.on('webrtc:answer', handleAnswer);
    socket.on('webrtc:ice-candidate', handleIceCandidate);
    socket.on('webrtc:request-offer', handleOfferRequest);

    return () => {
      socket.off('webrtc:offer', handleOffer);
      socket.off('webrtc:answer', handleAnswer);
      socket.off('webrtc:ice-candidate', handleIceCandidate);
      socket.off('webrtc:request-offer', handleOfferRequest);
    };
  }, [socket, sessionId, clearError, createPeerConnection, closePeerConnection, processPendingCandidates, hostConnectToGuest]);

  // --- Host: react to participant changes while streaming ---
  useEffect(() => {
    if (!isHost || !isStreamingActive || !localStreamRef.current || !socket?.connected) return;

    const currentGuestIds = new Set(participants.filter((p) => p.id !== selfId).map((p) => p.id));
    const connectedIds = new Set([...peerConnections.current.keys(), ...pendingConnections.current.keys()]);

    currentGuestIds.forEach((guestId) => {
      if (!connectedIds.has(guestId)) {
        console.log(`[WebRTC Host] New guest ${guestId} — sending offer.`);
        hostConnectToGuest(guestId);
      }
    });

    connectedIds.forEach((peerId) => {
      if (!currentGuestIds.has(peerId)) {
        console.log(`[WebRTC Host] Guest ${peerId} left — closing connection.`);
        closePeerConnection(peerId);
      }
    });
  }, [participants, isHost, isStreamingActive, selfId, socket, hostConnectToGuest, closePeerConnection]);

  useEffect(() => {
    if (isHost) return;
    for (const peerId of new Set([...peerConnections.current.keys(), ...pendingConnections.current.keys()])) {
      if (!participants.some(participant => participant.id === peerId)) closePeerConnection(peerId);
    }
  }, [participants, isHost, closePeerConnection]);

  // captureStream can add video/audio tracks after its initial capture.
  // Rebuild offers when the captured track set changes, even with guests already present.
  useEffect(() => {
    if (!isHost || !isStreamingActive) return;
    const reconcile = () => {
      const stream = ensureLiveLocalStream();
      const tracks = stream?.getTracks().filter(track => track.readyState === 'live') || [];
      if (!tracks.some(track => track.kind === 'video')) return;
      for (const guest of participantsRef.current) {
        if (guest.id === selfIdRef.current) continue;
        const entry = peerConnections.current.get(guest.id);
        const sent = entry?.pc.getSenders().map(sender => sender.track) || [];
        if (!entry || tracks.length !== sent.length || tracks.some(track => !sent.includes(track))) {
          if (entry) closePeerConnection(guest.id);
          hostConnectToGuest(guest.id);
        }
      }
    };
    const timer = setInterval(reconcile, 1000);
    return () => clearInterval(timer);
  }, [isHost, isStreamingActive, ensureLiveLocalStream, hostConnectToGuest, closePeerConnection]);

  // --- Guest: if every track of the remote stream ends (host video ended/reloaded),
  // drop the stream so the self-healing loop below can request a fresh offer. ---
  useEffect(() => {
    if (isHost || !remoteStream) return;

    const checkTracks = () => {
      const tracks = remoteStream.getTracks();
      if (tracks.length === 0 || tracks.every((t) => t.readyState === 'ended')) {
        console.log('[WebRTC Guest] All remote tracks ended — clearing stream to trigger renegotiation.');
        remoteStreamRef.current = null;
        setRemoteStream(null);
      }
    };

    const tracks = remoteStream.getTracks();
    tracks.forEach((t) => t.addEventListener('ended', checkTracks));
    return () => tracks.forEach((t) => t.removeEventListener('ended', checkTracks));
  }, [isHost, remoteStream]);

  // --- Guest: self-healing loop. In stream mode with no stream, ask the host to offer. ---
  useEffect(() => {
    if (isHost || sessionMode !== 'stream' || !socket) return;

    const check = () => {
      const sock = socketRef.current;
      if (!sock?.connected) return;

      const hostId = participantsRef.current[0]?.id;
      if (!hostId || hostId === selfIdRef.current) return;

      // If a negotiation is in flight and still young, give it time.
      const entry = peerConnections.current.get(hostId);
      if (entry) {
        const age = Date.now() - entry.createdAt;
        const ice = entry.pc.iceConnectionState;
        if ((ice === 'connected' || ice === 'completed') && remoteStreamRef.current?.getVideoTracks().some(track => track.readyState === 'live')) return;
        const busy = ice === 'new' || ice === 'disconnected' || ice === 'checking' || ice === 'connected' || ice === 'completed' || entry.pc.signalingState === 'have-remote-offer';
        if (busy && age < NEGOTIATION_GRACE_MS) {
          console.log(`[WebRTC Guest] Negotiation with ${hostId} in progress (${ice}, ${Math.round(age / 1000)}s) — waiting.`);
          return;
        }
      }

      console.log(`[WebRTC Guest] No stream yet — requesting offer from host ${hostId}.`);
      sock.emit('webrtc:request-offer', { targetUserId: hostId });
    };

    // First nudge quickly (covers a missed initial offer), then keep retrying.
    const firstTimer = setTimeout(check, 1500);
    const interval = setInterval(check, GUEST_REQUEST_INTERVAL_MS);
    return () => {
      clearTimeout(firstTimer);
      clearInterval(interval);
    };
  }, [isHost, sessionMode, socket]);

  // --- Host: stop streaming when mode returns to sync ---
  useEffect(() => {
    if (isHost && sessionMode === 'sync' && isStreamingActive) {
      console.log('[useWebRTC Host] Mode changed to sync — stopping stream.');
      stopStreaming();
    }
  }, [sessionMode, isHost, isStreamingActive, stopStreaming]);

  // --- Guest: tear down only on a real stream -> sync transition ---
  // (An offer can legitimately arrive while our mode still says 'sync'; never treat
  // "sync + stream present" as a signal to tear down.)
  const prevSessionModeRef = useRef(sessionMode);
  useEffect(() => {
    const prevMode = prevSessionModeRef.current;
    prevSessionModeRef.current = sessionMode;
    if (isHost) return;
    if (prevMode === 'stream' && sessionMode === 'sync') {
      console.log('[useWebRTC Guest] Mode transitioned stream → sync. Cleaning up.');
      closeAllConnections();
    }
  }, [sessionMode, isHost, closeAllConnections]);

  // --- Cleanup on unmount / socket change ---
  useEffect(() => {
    return () => {
      console.log('[useWebRTC] Cleanup: closing all connections and stopping streams.');
      closeAllConnections();
      stopLocalStream();
      remoteStreamRef.current = null;
      setRemoteStream(null);
      setIsStreamingActive(false);
      isStreamingActiveRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  return {
    remoteStream,
    startStreaming,
    stopStreaming,
    isStreamingActive,
    webRTCError,
  };
}

export default useWebRTC;
