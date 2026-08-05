// client/src/hooks/useWebRTC.js

import { useState, useEffect, useRef, useCallback } from 'react';


export const turnCredentials = {
  lastResetTimestamp: '2026-08-05 18:34', // <--- UPDATE THIS (e.g., "2024-08-02 15:30")
  username: "26be278510068767566366475f576e1f88cac557f5302fc32e8f52b1353eb4b7", // <--- UPDATE THIS
  credential: "N1c9oGqcm9feAyxiqVPYzu14uSZMJJxhWny0aqCdrWk=", // <--- UPDATE THIS
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

/**
 * Custom Hook to manage WebRTC streaming logic.
 *
 * @param {{
 *   socket: import('socket.io-client').Socket | null;
 *   sessionId: string | null;
 *   isHost: boolean;
 *   sessionMode: 'sync' | 'stream';
 *   participants: Array<{ id: string; nickname: string }>;
 *   selfId: string | null;
 *   localStreamSourceElement: HTMLVideoElement | null; // Ref to the <video> element for host's stream source
 * }} options
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
  const peerConnections = useRef(new Map());
  const pendingCandidates = useRef(new Map()); // Queue for ICE candidates that arrive before remote description
  const localStreamRef = useRef(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isStreamingActive, setIsStreamingActive] = useState(false);
  const [webRTCError, setWebRTCError] = useState(null);

  const clearError = () => setWebRTCError(null);
  
  // Helper to process queued ICE candidates after remote description is set
  const processPendingCandidates = useCallback(async (peerId) => {
    const pc = peerConnections.current.get(peerId);
    const candidates = pendingCandidates.current.get(peerId) || [];
    
    if (pc && pc.remoteDescription && candidates.length > 0) {
      console.log(`[WebRTC] Processing ${candidates.length} queued ICE candidates for ${peerId}`);
      for (const candidate of candidates) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
          console.log(`[WebRTC] Added queued ICE candidate for ${peerId}`);
        } catch (error) {
          console.warn(`[WebRTC] Error adding queued candidate for ${peerId}:`, error);
        }
      }
      pendingCandidates.current.delete(peerId);
    }
  }, []);

  // Close a specific peer connection
  const closePeerConnection = useCallback((peerId) => {
    const pc = peerConnections.current.get(peerId);
    if (pc) {
      const currentState = pc.connectionState || pc.iceConnectionState; // Get current state before closing
      console.log(`[WebRTC] Closing connection to peer: ${peerId} (State: ${currentState})`);
      pc.onicecandidate = null;
      pc.oniceconnectionstatechange = null;
      pc.onicegatheringstatechange = null; // Clear this handler too
      pc.onsignalingstatechange = null;
      pc.ontrack = null;

      // Stop tracks associated with this connection
      pc.getSenders().forEach(sender => {
         try { if(sender.track) { sender.track.stop(); } }
         catch (error) { console.warn(`[WebRTC] Error stopping sender track for ${peerId}:`, error); }
      });
      pc.getReceivers().forEach(receiver => {
         try { if(receiver.track) { receiver.track.stop(); } } // Also stop receiver tracks
         catch (error) { console.warn(`[WebRTC] Error stopping receiver track for ${peerId}:`, error); }
      });

      pc.close();
      peerConnections.current.delete(peerId);
      pendingCandidates.current.delete(peerId); // Clean up any queued candidates
      console.log(`[WebRTC] Connection to ${peerId} closed and removed.`);

      // If guest, clear remote stream when the connection to the host closes
      if (!isHost && remoteStream) {
          // Check if the closing peer was the source of the stream
          // Simple check: if the connection to the host closes, clear the stream
          const hostIdInMap = Array.from(peerConnections.current.keys())[0]; // Get potential host ID if available
           if (peerId === hostIdInMap || !peerConnections.current.size) { // Clear if host connection closed or no connections left
               console.log(`[WebRTC Guest] Host connection ${peerId} closed or last connection closed. Clearing remote stream.`);
               setRemoteStream(null);
           }
      }
    } else {
         console.log(`[WebRTC] Attempted to close connection for ${peerId}, but none found.`);
    }
  }, [isHost, remoteStream]); // Added remoteStream dependency

  // Close all peer connections
  const closeAllConnections = useCallback(() => {
    console.log('[WebRTC] Closing all connections...');
    // Convert keys to array before iterating to avoid issues with deleting while iterating
    const peerIds = Array.from(peerConnections.current.keys());
    peerIds.forEach(peerId => {
      closePeerConnection(peerId);
    });
    // Ensure map is clear after attempting closes
    peerConnections.current.clear();
    pendingCandidates.current.clear(); // Clear all pending candidates
     if (!isHost && remoteStream) {
        console.log("[WebRTC Guest] Clearing remote stream due to closeAllConnections.");
        setRemoteStream(null);
     }
  }, [closePeerConnection, isHost, remoteStream]); // Added remoteStream dependency

  // Stop local stream tracks
  const stopLocalStream = useCallback(() => {
    if (localStreamRef.current) {
      console.log('[WebRTC] Stopping local stream tracks.');
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
  }, []);


  // Create and configure a peer connection
  const createPeerConnection = useCallback((peerId) => {
     if (peerConnections.current.has(peerId)) {
        console.warn(`[WebRTC] Attempting to create connection for ${peerId} but it already exists. Closing old one first.`);
        closePeerConnection(peerId);
    }

    console.log(`[WebRTC] Creating peer connection for: ${peerId}`);
    clearError();

    try {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      // Handle incoming tracks (video/audio) from the peer
      pc.ontrack = (event) => {
         console.log(`[WebRTC] Track received from ${peerId}: Kind=${event.track.kind}, ID=${event.track.id}, ReadyState=${event.track.readyState}, Muted=${event.track.muted}`);
         // Use event.streams[0] as it's generally more reliable
         if (event.streams && event.streams[0]) {
            if (!isHost) {
                console.log(`[WebRTC Guest] Setting remote stream from ${peerId} (Stream ID: ${event.streams[0].id})`);
                setRemoteStream(event.streams[0]);
            }
         } else {
             console.warn(`[WebRTC] Track event from ${peerId} did not contain streams object. Handling track individually (may cause issues).`);
             if(!isHost) {
                 // Fallback: create stream from track (less ideal)
                 const inboundStream = remoteStream || new MediaStream(); // Reuse existing stream if possible
                 console.log(`[WebRTC Guest] Adding individual track ${event.track.id} to stream.`);
                 inboundStream.addTrack(event.track);
                 setRemoteStream(inboundStream);
             }
         }
      };

      // Handle ICE candidate generation (network path finding)
      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          // Log candidate type for debugging - important to verify TURN is working
          const candidateStr = event.candidate.candidate;
          const candidateType = candidateStr.includes('relay') ? 'relay (TURN)' : 
                                candidateStr.includes('srflx') ? 'srflx (STUN)' : 
                                candidateStr.includes('host') ? 'host' : 'unknown';
          console.log(`[WebRTC] Sending ICE candidate to ${peerId}: type=${candidateType}`);
          
          socket.emit('webrtc:ice-candidate', {
            targetUserId: peerId,
            candidate: event.candidate, // Send the RTCIceCandidate object directly
          });
        } else if (!event.candidate) {
            // An event with a null candidate indicates ICE gathering is complete
            console.log(`[WebRTC] ICE Gathering complete for ${peerId}. All candidates sent.`);
        }
      };

       // Enhanced ICE Connection State Logging
       pc.oniceconnectionstatechange = () => {
          const state = pc.iceConnectionState;
          console.log(`[WebRTC] ICE connection state change for ${peerId}: ${state}`);
          switch(state) {
              case 'checking':
                  console.log(`[WebRTC] ICE checking connection for ${peerId}...`);
                  break;
              case 'connected':
                  console.log(`[WebRTC] ICE connection established for ${peerId}.`);
                  clearError(); // Clear errors on successful connection
                  break;
              case 'completed':
                   console.log(`[WebRTC] ICE connection completed for ${peerId} (all checks done).`);
                   clearError();
                   break;
              case 'failed':
                  console.error(`[WebRTC] ICE connection failed for ${peerId}. This often indicates NAT/Firewall issues or incompatible candidates.`);
                  setWebRTCError(`Connection failed with peer ${peerId}. Check network/firewall.`);
                   closePeerConnection(peerId); // Simple approach: close on failure
                  break;
              case 'disconnected':
                  console.warn(`[WebRTC] ICE connection disconnected for ${peerId}. May reconnect, but often indicates loss of network path.`);
                  setWebRTCError(`Connection issue with peer ${peerId}: disconnected. May recover or fail.`);
                  // Don't close immediately, give it a chance to reconnect. Could add a timer here.
                  break;
              case 'closed':
                  console.log(`[WebRTC] ICE connection closed for ${peerId}.`);
                  // Ensure cleanup if closed unexpectedly
                  closePeerConnection(peerId);
                  break;
              default:
                  console.log(`[WebRTC] Unhandled ICE state for ${peerId}: ${state}`);
                  break;
          }
       };

       // Add ICE Gathering State Logging
       pc.onicegatheringstatechange = () => {
           console.log(`[WebRTC] ICE gathering state change for ${peerId}: ${pc.iceGatheringState}`);
           if (pc.iceGatheringState === 'complete') {
               console.log(`[WebRTC] ICE gathering complete for ${peerId}. Local SDP:`, pc.localDescription?.sdp.substring(0, 100) + '...');
           }
       };

       // Add Signaling State Logging
       pc.onsignalingstatechange = () => {
          console.log(`[WebRTC] Signaling state change for ${peerId}: ${pc.signalingState}`);
          // Handle 'stable' state if needed
          if (pc.signalingState === 'stable' && isHost) {
             console.log(`[WebRTC Host] Signaling state stable for ${peerId}. Connection should be progressing.`);
          }
       };

      peerConnections.current.set(peerId, pc);
      return pc;

    } catch (error) {
        console.error(`[WebRTC] Failed to create Peer Connection for ${peerId}:`, error);
        setWebRTCError(`Failed to initialize connection with peer ${peerId}.`);
        return null;
    }
  // Include closePeerConnection as it's used within
  }, [socket, isHost, closePeerConnection]);


  // --- Host Functions ---
  const startStreaming = useCallback(async () => {
    // --- Added detailed logging ---
    console.log('[WebRTC Host] Entering startStreaming function.');

    if (!isHost) {
        console.warn("[WebRTC Host] startStreaming called, but isHost is false.");
        return;
    }
    if (isStreamingActive) {
        console.warn("[WebRTC Host] startStreaming called, but streaming is already active.");
        return;
    }
     if (!localStreamSourceElement) {
        console.warn("[WebRTC Host] startStreaming called, but localStreamSourceElement is null or undefined.");
        return;
    }
    if (!socket) {
        console.warn("[WebRTC Host] startStreaming called, but socket is null.");
        return;
    }

    console.log('[WebRTC Host] Attempting to start streaming (Checks passed)...');
    clearError();

    // 1. Get MediaStream from the video element
    let stream; // Declare stream variable outside try block
    try {
      console.log('[WebRTC Host] Attempting to captureStream from:', localStreamSourceElement);
      stream = localStreamSourceElement.captureStream(); // Assign to outer variable

      if (!stream) {
         console.error('[WebRTC Host] captureStream() returned null or undefined.');
         throw new Error("captureStream() failed to return a stream object.");
      }
      const tracks = stream.getTracks();
      console.log('[WebRTC Host] captureStream() succeeded. Stream ID:', stream.id, 'Number of tracks:', tracks.length);
      if (tracks.length === 0) {
         console.error('[WebRTC Host] captureStream() returned a stream with zero tracks.');
         console.log('[WebRTC Host] Video Element State: ReadyState=', localStreamSourceElement.readyState, ' NetworkState=', localStreamSourceElement.networkState, ' Error=', localStreamSourceElement.error, ' Paused=', localStreamSourceElement.paused, ' Ended=', localStreamSourceElement.ended);
         throw new Error("captureStream() returned an empty stream (0 tracks). Ensure video is loaded and playing/ready.");
      }
      tracks.forEach(track => console.log(`[WebRTC Host] Captured track: kind=${track.kind}, id=${track.id}, readyState=${track.readyState}`));

      stopLocalStream(); // Stop previous stream first
      localStreamRef.current = stream; // Assign the successfully captured stream
      console.log('[WebRTC Host] Local stream captured and assigned to ref:', localStreamRef.current);

    } catch (error) {
      console.error('[WebRTC Host] Error during stream capture:', error);
      setWebRTCError(`Failed to capture video stream: ${error.message}`);
      setIsStreamingActive(false); // Ensure state is reset
      return; // Stop execution if capture failed
    }

    // If we reach here, stream capture was successful
    setIsStreamingActive(true);
    console.log('[WebRTC Host] Streaming state set to active.');

    // 2. Create Peer Connections for all current guests and send offers
    const guestParticipants = participants.filter((p) => p.id !== selfId);
    console.log('[WebRTC Host] Setting up connections for guests:', guestParticipants.map(p => p.nickname || p.id));

    if (guestParticipants.length === 0) {
        console.log("[WebRTC Host] No guests in session to stream to.");
        return; // Keep streaming active, participant join effect handles new guests
    }

    guestParticipants.forEach(async (guest) => {
      console.log(`[WebRTC Host] Processing guest: ${guest.id}`); // Log inside loop
      const peerId = guest.id;
      const pc = createPeerConnection(peerId);
      if (!pc) {
          console.error(`[WebRTC Host] Failed to create peer connection for ${peerId}. Skipping guest.`);
          return;
      }

      try {
          if (!localStreamRef.current) {
              console.error(`[WebRTC Host] localStreamRef is null when trying to add tracks for ${peerId}. Aborting track addition.`);
              throw new Error("Local stream is not available.");
          }
          localStreamRef.current.getTracks().forEach((track) => {
            console.log(`[WebRTC Host] Adding track (${track.kind}) to connection for ${peerId}`);
            pc.addTrack(track, localStreamRef.current);
          });
      } catch (error) {
         console.error(`[WebRTC Host] Error adding tracks for ${peerId}:`, error);
         setWebRTCError(`Error setting up stream for ${guest.nickname || peerId}.`);
         closePeerConnection(peerId);
         return;
      }

      try {
        console.log(`[WebRTC Host] Creating offer for ${peerId}...`);
        const offer = await pc.createOffer();
        console.log(`[WebRTC Host] Setting local description for ${peerId}...`);
        await pc.setLocalDescription(offer); // Important: Set local description *before* sending offer

        console.log(`[WebRTC Host] Sending offer to ${peerId}`);
        socket.emit('webrtc:offer', {
          targetUserId: peerId,
          offer: { sdp: offer.sdp, type: offer.type }, // Send serializable object
        });
      } catch (error) {
        console.error(`[WebRTC Host] Error creating/sending offer to ${peerId}:`, error);
        setWebRTCError(`Failed to initiate connection with ${guest.nickname || peerId}.`);
        closePeerConnection(peerId);
      }
    });

  // Added closePeerConnection
  }, [isHost, isStreamingActive, localStreamSourceElement, socket, participants, selfId, createPeerConnection, stopLocalStream, closePeerConnection]);

  const stopStreaming = useCallback(() => {
    if (!isHost || !isStreamingActive) return;

    console.log('[WebRTC Host] Stopping streaming...');
    closeAllConnections();
    stopLocalStream();
    setIsStreamingActive(false);
    // Optional: Notify others that stream ended
    // socket?.emit('stream:stopped');

  }, [isHost, isStreamingActive, closeAllConnections, stopLocalStream]);


  // --- Socket Event Listeners for Signaling ---
  useEffect(() => {
    if (!socket || !sessionId) return;

    // --- Guest: Handle incoming offer from Host ---
    const handleOffer = async ({ fromUserId, offer }) => {
      // Do NOT gate on sessionMode === 'stream'. Guests default to 'sync' until
      // session:participants arrives; the host offer often wins that race and was
      // being dropped, leaving ICE candidates queued with no peer connection.
      if (isHost) return;

      if (sessionMode !== 'stream') {
        console.log(`[WebRTC Guest] Offer from ${fromUserId} arrived while mode='${sessionMode}' — accepting anyway (mode sync race).`);
      }

      const existing = peerConnections.current.get(fromUserId);
      const ice = existing?.iceConnectionState;
      if (existing && (ice === 'connected' || ice === 'completed' || ice === 'checking')) {
        console.log(`[WebRTC Guest] Ignoring duplicate offer from ${fromUserId} — connection already ${ice}.`);
        return;
      }

      console.log(`[WebRTC Guest] Received offer from host ${fromUserId}`);
      clearError();
      const pc = createPeerConnection(fromUserId); // fromUserId is the host's ID
      if (!pc) return;

      try {
        console.log(`[WebRTC Guest] Setting remote description for offer from ${fromUserId}...`);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        
        // Process any queued ICE candidates now that remote description is set
        await processPendingCandidates(fromUserId);
        
        console.log(`[WebRTC Guest] Creating answer for host ${fromUserId}...`);
        const answer = await pc.createAnswer();
        console.log(`[WebRTC Guest] Setting local description (answer) for host ${fromUserId}...`);
        await pc.setLocalDescription(answer);

        console.log(`[WebRTC Guest] Sending answer to host ${fromUserId}`);
        socket.emit('webrtc:answer', {
          targetUserId: fromUserId, // Send back to host
          answer: { sdp: answer.sdp, type: answer.type },
        });
      } catch (error) {
        console.error('[WebRTC Guest] Error handling offer/creating answer:', error);
        setWebRTCError('Failed to respond to host stream offer.');
        closePeerConnection(fromUserId);
      }
    };

    // --- Host: Handle incoming answer from Guest ---
    const handleAnswer = async ({ fromUserId, answer }) => {
      if (!isHost || sessionMode !== 'stream') return;

      console.log(`[WebRTC Host] Received answer from guest ${fromUserId}`);
      const pc = peerConnections.current.get(fromUserId);
      if (!pc) {
        console.warn(`[WebRTC Host] No peer connection found for answer from ${fromUserId}`);
        return;
      }
      // Check if remote description is already set (avoid race conditions)
      if (pc.remoteDescription && pc.remoteDescription.sdp === answer.sdp) {
           console.warn(`[WebRTC Host] Received duplicate answer from ${fromUserId}. Ignoring.`);
           return;
      }

      try {
        console.log(`[WebRTC Host] Setting remote description (answer) for ${fromUserId}...`);
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        console.log(`[WebRTC Host] Remote description set for ${fromUserId} successfully.`);
        
        // Process any queued ICE candidates now that remote description is set
        await processPendingCandidates(fromUserId);
      } catch (error) {
        console.error(`[WebRTC Host] Error setting remote description for ${fromUserId}:`, error);
        setWebRTCError(`Failed to establish connection with guest ${fromUserId} (answer).`);
      }
    };

    // --- Both: Handle incoming ICE candidate ---
    const handleIceCandidate = async ({ fromUserId, candidate }) => {
       const pc = peerConnections.current.get(fromUserId);
       if (!pc) {
           console.warn(`[WebRTC] No peer connection found for ICE candidate from ${fromUserId}, queuing...`);
           // Queue the candidate even if PC doesn't exist yet (race condition)
           if (!pendingCandidates.current.has(fromUserId)) {
             pendingCandidates.current.set(fromUserId, []);
           }
           pendingCandidates.current.get(fromUserId).push(candidate);
           return;
       }
       if (pc.signalingState === 'closed') {
            console.warn(`[WebRTC] Cannot add ICE candidate for ${fromUserId}, connection is closed.`);
            return;
       }
       
       // Queue candidate if remote description is not yet set
       if (!pc.remoteDescription) {
            console.log(`[WebRTC] Queuing ICE candidate from ${fromUserId} (remote description not set yet)`);
            if (!pendingCandidates.current.has(fromUserId)) {
              pendingCandidates.current.set(fromUserId, []);
            }
            pendingCandidates.current.get(fromUserId).push(candidate);
            return;
       }

       try {
           const iceCandidate = (candidate instanceof RTCIceCandidate)
               ? candidate
               : new RTCIceCandidate(candidate);

           // Log candidate type for debugging
           const candidateType = iceCandidate.candidate?.includes('relay') ? 'relay (TURN)' : 
                                  iceCandidate.candidate?.includes('srflx') ? 'srflx (STUN)' : 
                                  iceCandidate.candidate?.includes('host') ? 'host' : 'unknown';
           console.log(`[WebRTC] Adding ICE candidate from ${fromUserId}: type=${candidateType}`);
           
           await pc.addIceCandidate(iceCandidate);
           console.log(`[WebRTC] Added ICE candidate from ${fromUserId} successfully.`);
       } catch (error) {
            // Ignore benign errors like adding candidate during incorrect signaling state if remote desc isn't set
            if (!error.message.includes("InvalidStateError") && !error.message.includes("expected state is 'stable' or 'pranswer'")) {
                console.warn(`[WebRTC] Error adding ICE candidate from ${fromUserId}:`, error);
            } else {
               console.log(`[WebRTC] Ignored benign error adding ICE candidate from ${fromUserId}: ${error.message}`);
            }
       }
    };

    socket.on('webrtc:offer', handleOffer);
    socket.on('webrtc:answer', handleAnswer);
    socket.on('webrtc:ice-candidate', handleIceCandidate);

    return () => {
      socket.off('webrtc:offer', handleOffer);
      socket.off('webrtc:answer', handleAnswer);
      socket.off('webrtc:ice-candidate', handleIceCandidate);
    };
  // Ensure createPeerConnection/closePeerConnection are stable or included
  }, [socket, sessionId, isHost, sessionMode, createPeerConnection, closePeerConnection, processPendingCandidates]);


  // --- Handle Participant Changes (Host Only) ---
  useEffect(() => {
    // Check if host, streaming, stream exists, socket connected
    if (!isHost || !isStreamingActive || !localStreamRef.current || !socket?.connected) {
      return;
    }

    console.log('[WebRTC Host] Participant list changed, checking connections...');
    const currentGuestIds = new Set(participants.filter(p => p.id !== selfId).map(p => p.id));
    const connectedGuestIds = new Set(peerConnections.current.keys());

    // 1. Add connections for new guests
    currentGuestIds.forEach(async (guestId) => {
      if (!connectedGuestIds.has(guestId)) {
        console.log(`[WebRTC Host] New guest detected: ${guestId}. Setting up connection.`);
        const pc = createPeerConnection(guestId);
        if (!pc) return;

        try {
            if (!localStreamRef.current) throw new Error("Local stream ref missing");
            localStreamRef.current.getTracks().forEach((track) => {
              console.log(`[WebRTC Host] Adding track (${track.kind}) to new connection for ${guestId}`);
              pc.addTrack(track, localStreamRef.current);
            });
        } catch (error) {
           console.error(`[WebRTC Host] Error adding tracks for new guest ${guestId}:`, error);
           setWebRTCError(`Error setting up stream for new guest.`);
           closePeerConnection(guestId);
           return;
        }

        try {
            console.log(`[WebRTC Host] Creating offer for new guest ${guestId}...`);
            const offer = await pc.createOffer();
            console.log(`[WebRTC Host] Setting local description for new guest ${guestId}...`);
            await pc.setLocalDescription(offer);
            console.log(`[WebRTC Host] Sending offer to new guest ${guestId}`);
            socket.emit('webrtc:offer', {
            targetUserId: guestId,
            offer: { sdp: offer.sdp, type: offer.type },
            });
        } catch(error) {
             console.error(`[WebRTC Host] Error creating/sending offer to new guest ${guestId}:`, error);
             setWebRTCError(`Failed to initiate connection with new guest.`);
             closePeerConnection(guestId);
        }
      }
    });

    // 2. Remove connections for guests who left
    connectedGuestIds.forEach((guestId) => {
      if (!currentGuestIds.has(guestId)) {
        console.log(`[WebRTC Host] Guest left: ${guestId}. Closing connection.`);
        closePeerConnection(guestId);
      }
    });

  // Depend on participants, streaming state, selfId, socket, and connection functions
  }, [participants, isHost, isStreamingActive, selfId, socket, createPeerConnection, closePeerConnection]);

  // --- Guest: if we enter stream mode with no remote stream, ask host to re-offer ---
  const remoteStreamRef = useRef(remoteStream);
  remoteStreamRef.current = remoteStream;

  useEffect(() => {
    if (isHost || sessionMode !== 'stream' || !socket?.connected) return;
    if (remoteStreamRef.current) return;

    const hostId = participants[0]?.id;
    if (!hostId || hostId === selfId) return;

    const timer = setTimeout(() => {
      // Use ref so we don't re-request after a stream already arrived
      if (remoteStreamRef.current) return;
      console.log(`[WebRTC Guest] Still waiting for stream — requesting offer from host ${hostId}`);
      socket.emit('webrtc:request-offer', { targetUserId: hostId });
    }, 1500);

    return () => clearTimeout(timer);
  }, [isHost, sessionMode, socket, participants, selfId]);

  // --- Host: fulfill guest offer requests ---
  useEffect(() => {
    if (!socket || !isHost) return;

    const handleOfferRequest = async ({ fromUserId }) => {
      if (!isStreamingActive || !localStreamRef.current) {
        console.warn(`[WebRTC Host] Offer requested by ${fromUserId} but streaming is not active yet.`);
        return;
      }

      const existing = peerConnections.current.get(fromUserId);
      const state = existing?.iceConnectionState;
      if (existing && (state === 'connected' || state === 'completed' || state === 'checking')) {
        console.log(`[WebRTC Host] Ignoring offer request from ${fromUserId} — connection already ${state}.`);
        return;
      }

      console.log(`[WebRTC Host] Guest ${fromUserId} requested an offer — (re)negotiating (prior state=${state || 'none'}).`);

      if (existing) {
        closePeerConnection(fromUserId);
      }

      const pc = createPeerConnection(fromUserId);
      if (!pc) return;

      try {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc:offer', {
          targetUserId: fromUserId,
          offer: { sdp: offer.sdp, type: offer.type },
        });
      } catch (error) {
        console.error(`[WebRTC Host] Failed to fulfill offer request from ${fromUserId}:`, error);
        closePeerConnection(fromUserId);
      }
    };

    socket.on('webrtc:request-offer', handleOfferRequest);
    return () => socket.off('webrtc:request-offer', handleOfferRequest);
  }, [socket, isHost, isStreamingActive, createPeerConnection, closePeerConnection]);


  // --- Cleanup Effect ---
  useEffect(() => {
    // This runs when the component using the hook unmounts or socket changes
    return () => {
      console.log('[useWebRTC] Cleanup on unmount/socket change: Closing all connections and stopping streams.');
      if (socket) {
          // Remove listeners added by this instance of the hook
          socket.off('webrtc:offer');
          socket.off('webrtc:answer');
          socket.off('webrtc:ice-candidate');
      }
      closeAllConnections();
      stopLocalStream();
      pendingCandidates.current.clear(); // Clear pending candidates on cleanup
      setRemoteStream(null);
      setIsStreamingActive(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]); // Minimal dependencies: only socket change triggers full cleanup


    // --- Effect to stop streaming if mode changes away from 'stream' (Host only) ---
    useEffect(() => {
        if (isHost && sessionMode === 'sync' && isStreamingActive) {
            console.log("[useWebRTC] Mode changed to sync while streaming. Stopping stream.");
            stopStreaming();
        }
    }, [sessionMode, isHost, isStreamingActive, stopStreaming]);

    // --- Effect to clear remote stream only when mode transitions stream → sync (Guest) ---
    // IMPORTANT: Do NOT clear merely because remoteStream arrived while mode is still 'sync'.
    // Host offers often beat session:participants; we accept them in sync, then mode flips to stream.
    // The old effect treated "sync + remoteStream" as "left stream mode" and killed the live PC.
    const prevSessionModeRef = useRef(sessionMode);
    useEffect(() => {
        const prevMode = prevSessionModeRef.current;
        prevSessionModeRef.current = sessionMode;

        if (isHost) return;
        if (prevMode === 'stream' && sessionMode === 'sync') {
            console.log("[useWebRTC Guest] Mode transitioned stream → sync. Clearing remote stream and closing connections.");
            setRemoteStream(null);
            closeAllConnections();
        }
    }, [sessionMode, isHost, closeAllConnections]);


  // --- Return Values ---
  return {
    remoteStream,
    startStreaming,
    stopStreaming,
    isStreamingActive,
    webRTCError,
  };
}

export default useWebRTC;