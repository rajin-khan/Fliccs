// client/src/hooks/useWebRTC.js

import { useState, useEffect, useRef, useCallback } from 'react';


export const turnCredentials = {
  lastResetTimestamp: '2026-09-04 00:00', // <--- UPDATE THIS (e.g., "2024-08-02 15:30")
  username: "31037e9c77b8f4f1294d2584d24eb04236b42d919693ee091f272261d5e4d708", // <--- UPDATE THIS
  credential: "i3IkrLwwpgsUfxcINVe4uirEbcqMWzn1S7L9dvIR4kk=", // <--- UPDATE THIS
};

// Split TURN servers into separate entries for better compatibility
const ICE_SERVERS = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
    // TURN UDP - fastest if available
    {
      urls: "turn:global.turn.twilio.com:3478?transport=udp",
      username: turnCredentials.username,
      credential: turnCredentials.credential,
    },
    // TURN TCP - more reliable through firewalls
    {
      urls: "turn:global.turn.twilio.com:3478?transport=tcp",
      username: turnCredentials.username,
      credential: turnCredentials.credential,
    },
    // TURN TLS on 443 - best for restrictive networks
    {
      urls: "turn:global.turn.twilio.com:443?transport=tcp",
      username: turnCredentials.username,
      credential: turnCredentials.credential,
    },
    // TURNS (TURN over TLS) for maximum compatibility
    {
      urls: "turns:global.turn.twilio.com:443?transport=tcp",
      username: turnCredentials.username,
      credential: turnCredentials.credential,
    },
];

// How often a stream-less guest nudges the host for a fresh offer.
const GUEST_REQUEST_INTERVAL_MS = 5000;
// Give an in-flight negotiation this long before allowing a re-request to replace it.
const NEGOTIATION_GRACE_MS = 12000;

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
  localStreamSourceElement,
}) {
  // peerId -> { pc: RTCPeerConnection, createdAt: number }
  const peerConnections = useRef(new Map());
  // peerId -> RTCIceCandidateInit[] queued before the remote description was set
  const pendingCandidates = useRef(new Map());
  const localStreamRef = useRef(null);

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
  const localSourceRef = useRef(localStreamSourceElement);
  socketRef.current = socket;
  isHostRef.current = isHost;
  participantsRef.current = participants;
  selfIdRef.current = selfId;
  sessionModeRef.current = sessionMode;
  remoteStreamRef.current = remoteStream;
  isStreamingActiveRef.current = isStreamingActive;
  localSourceRef.current = localStreamSourceElement;

  const clearError = useCallback(() => setWebRTCError(null), []);

  // --- Helpers (all stable: they only touch refs) ---

  const processPendingCandidates = useCallback(async (peerId) => {
    const entry = peerConnections.current.get(peerId);
    const pc = entry?.pc;
    const candidates = pendingCandidates.current.get(peerId) || [];

    if (pc && pc.remoteDescription && candidates.length > 0) {
      console.log(`[WebRTC] Processing ${candidates.length} queued ICE candidates for ${peerId}`);
      for (const candidate of candidates) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
          console.warn(`[WebRTC] Error adding queued candidate for ${peerId}:`, error);
        }
      }
      pendingCandidates.current.delete(peerId);
    }
  }, []);

  /**
   * Close one peer connection.
   * keepRemoteStream=true is used when we're about to replace the connection (renegotiation)
   * so the UI doesn't flash back to the loading state.
   */
  const closePeerConnection = useCallback((peerId, { keepRemoteStream = false } = {}) => {
    const entry = peerConnections.current.get(peerId);
    if (!entry) {
      pendingCandidates.current.delete(peerId);
      return;
    }
    const { pc } = entry;
    console.log(`[WebRTC] Closing connection to peer: ${peerId} (State: ${pc.connectionState || pc.iceConnectionState})`);
    pc.onicecandidate = null;
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
      setRemoteStream(null);
    }
  }, []);

  const closeAllConnections = useCallback(({ keepRemoteStream = false } = {}) => {
    const peerIds = Array.from(peerConnections.current.keys());
    if (peerIds.length) console.log('[WebRTC] Closing all connections:', peerIds);
    peerIds.forEach((peerId) => closePeerConnection(peerId, { keepRemoteStream }));
    peerConnections.current.clear();
    pendingCandidates.current.clear();
    if (!isHostRef.current && !keepRemoteStream && remoteStreamRef.current) {
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

  const createPeerConnection = useCallback((peerId, { keepRemoteStream = false } = {}) => {
    if (peerConnections.current.has(peerId)) {
      console.log(`[WebRTC] Replacing existing connection for ${peerId}.`);
      closePeerConnection(peerId, { keepRemoteStream });
    }

    console.log(`[WebRTC] Creating peer connection for: ${peerId}`);
    clearError();

    try {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      pc.ontrack = (event) => {
        console.log(`[WebRTC] Track received from ${peerId}: Kind=${event.track.kind}, ReadyState=${event.track.readyState}`);
        if (isHostRef.current) return;
        if (event.streams && event.streams[0]) {
          if (remoteStreamRef.current?.id !== event.streams[0].id) {
            console.log(`[WebRTC Guest] Setting remote stream from ${peerId} (Stream ID: ${event.streams[0].id})`);
            setRemoteStream(event.streams[0]);
          }
        } else {
          // Fallback: build a stream from bare tracks
          const inbound = remoteStreamRef.current || new MediaStream();
          inbound.addTrack(event.track);
          setRemoteStream(inbound);
        }
      };

      pc.onicecandidate = (event) => {
        const sock = socketRef.current;
        if (event.candidate && sock) {
          const c = event.candidate.candidate || '';
          const type = c.includes('relay') ? 'relay (TURN)' : c.includes('srflx') ? 'srflx (STUN)' : c.includes('host') ? 'host' : 'unknown';
          console.log(`[WebRTC] Sending ICE candidate to ${peerId}: type=${type}`);
          sock.emit('webrtc:ice-candidate', { targetUserId: peerId, candidate: event.candidate });
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

      pc.onsignalingstatechange = () => {
        console.log(`[WebRTC] Signaling state for ${peerId}: ${pc.signalingState}`);
      };

      peerConnections.current.set(peerId, { pc, createdAt: Date.now() });
      return pc;
    } catch (error) {
      console.error(`[WebRTC] Failed to create peer connection for ${peerId}:`, error);
      setWebRTCError(`Failed to initialize connection with peer ${peerId}.`);
      return null;
    }
  }, [clearError, closePeerConnection]);

  /**
   * Host: make sure the captured local stream still has live tracks.
   * captureStream() tracks END PERMANENTLY when the source video reaches its end or the
   * element reloads its source. Offers built from a dead stream contain no media at all,
   * which bricks every guest that joins afterwards. Re-capture when that happens.
   */
  const ensureLiveLocalStream = useCallback(() => {
    const existing = localStreamRef.current;
    if (existing && existing.getTracks().some((t) => t.readyState === 'live')) {
      return existing;
    }
    const el = localSourceRef.current;
    if (!el) return existing;
    try {
      const fresh = el.captureStream ? el.captureStream() : el.mozCaptureStream?.();
      const freshTracks = fresh ? fresh.getTracks() : [];
      if (freshTracks.length > 0 && freshTracks.some((t) => t.readyState === 'live')) {
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
  }, []);

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

    const pc = createPeerConnection(guestId);
    if (!pc) return;

    try {
      tracks.forEach((track) => {
        pc.addTrack(track, stream);
      });
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log(`[WebRTC Host] Sending offer to ${guestId}`);
      sock.emit('webrtc:offer', {
        targetUserId: guestId,
        offer: { sdp: offer.sdp, type: offer.type },
      });
    } catch (error) {
      console.error(`[WebRTC Host] Error creating/sending offer to ${guestId}:`, error);
      setWebRTCError('Failed to initiate connection with a guest.');
      closePeerConnection(guestId);
    }
  }, [ensureLiveLocalStream, createPeerConnection, closePeerConnection]);

  // --- Host controls ---

  const startStreaming = useCallback(async () => {
    if (!isHostRef.current) return;
    if (isStreamingActiveRef.current) return;
    const sourceEl = localSourceRef.current;
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
      if (tracks.length === 0) {
        throw new Error('captureStream() returned 0 tracks. Ensure the video is loaded and playing.');
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
  }, [clearError, stopLocalStream, hostConnectToGuest]);

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
    const handleOffer = async ({ fromUserId, offer }) => {
      if (isHostRef.current) return;

      console.log(`[WebRTC Guest] Received offer from host ${fromUserId} (mode='${sessionModeRef.current}')`);
      clearError();

      // A new offer always supersedes whatever connection we had: the host creates a fresh
      // RTCPeerConnection before every offer, so our old one is orphaned regardless of its state.
      const pc = createPeerConnection(fromUserId, { keepRemoteStream: true });
      if (!pc) return;

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        await processPendingCandidates(fromUserId);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log(`[WebRTC Guest] Sending answer to host ${fromUserId}`);
        socket.emit('webrtc:answer', {
          targetUserId: fromUserId,
          answer: { sdp: answer.sdp, type: answer.type },
        });
      } catch (error) {
        console.error('[WebRTC Guest] Error handling offer:', error);
        setWebRTCError('Failed to respond to host stream offer.');
        closePeerConnection(fromUserId);
      }
    };

    // Host: apply the guest's answer to the matching connection.
    const handleAnswer = async ({ fromUserId, answer }) => {
      if (!isHostRef.current) return;
      const entry = peerConnections.current.get(fromUserId);
      if (!entry) {
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

    const handleIceCandidate = async ({ fromUserId, candidate }) => {
      const entry = peerConnections.current.get(fromUserId);
      const pc = entry?.pc;
      if (!pc || !pc.remoteDescription) {
        if (!pendingCandidates.current.has(fromUserId)) {
          pendingCandidates.current.set(fromUserId, []);
        }
        pendingCandidates.current.get(fromUserId).push(candidate);
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
    const connectedIds = new Set(peerConnections.current.keys());

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

  // --- Guest: if every track of the remote stream ends (host video ended/reloaded),
  // drop the stream so the self-healing loop below can request a fresh offer. ---
  useEffect(() => {
    if (isHost || !remoteStream) return;

    const checkTracks = () => {
      const tracks = remoteStream.getTracks();
      if (tracks.length === 0 || tracks.every((t) => t.readyState === 'ended')) {
        console.log('[WebRTC Guest] All remote tracks ended — clearing stream to trigger renegotiation.');
        setRemoteStream(null);
      }
    };

    const tracks = remoteStream.getTracks();
    tracks.forEach((t) => t.addEventListener('ended', checkTracks));
    return () => tracks.forEach((t) => t.removeEventListener('ended', checkTracks));
  }, [isHost, remoteStream]);

  // --- Guest: self-healing loop. In stream mode with no stream, ask the host to offer. ---
  useEffect(() => {
    if (isHost || sessionMode !== 'stream' || !socket || remoteStream) return;

    const check = () => {
      if (remoteStreamRef.current) return;
      const sock = socketRef.current;
      if (!sock?.connected) return;

      const hostId = participantsRef.current[0]?.id;
      if (!hostId || hostId === selfIdRef.current) return;

      // If a negotiation is in flight and still young, give it time.
      const entry = peerConnections.current.get(hostId);
      if (entry) {
        const age = Date.now() - entry.createdAt;
        const ice = entry.pc.iceConnectionState;
        const busy = ice === 'checking' || ice === 'connected' || ice === 'completed' || entry.pc.signalingState === 'have-remote-offer';
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
  }, [isHost, sessionMode, socket, remoteStream]);

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
      pendingCandidates.current.clear();
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
