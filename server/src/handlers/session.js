import { generateSessionId } from '../utils/id.js';

/**
 * Registers Socket.IO event handlers for session management and WebRTC signaling.
 */
export function registerSessionHandlers(io, socket, sessions, socketToSessionMap) {

  // --- SESSION MANAGEMENT HANDLERS ---

  /**
   * Create Session
   */
  socket.on('session:create', ({ password, nickname }) => {
    try {
      const sessionId = generateSessionId();
      const name = nickname?.trim() || `Host${Math.floor(Math.random() * 1000)}`;

      const newSession = {
        host: socket.id,
        password: password || null,
        createdAt: Date.now(),
        mode: 'sync', // Default to sync mode
        users: [
          {
            id: socket.id,
            nickname: name,
          },
        ],
      };

      sessions.set(sessionId, newSession);
      socketToSessionMap.set(socket.id, sessionId);
      socket.join(sessionId);

      console.log(`[session] Created session ${sessionId} (Mode: ${newSession.mode}) by ${name} (${socket.id})`);
      socket.emit('session:created', { sessionId, mode: newSession.mode });
      // Emit participants *after* emitting created, so client knows session ID first
      io.to(sessionId).emit('session:participants', { participants: newSession.users, mode: newSession.mode });
    } catch (error) {
      console.error(`[session:create] Error creating session for ${socket.id}:`, error);
      socket.emit('session:error', { error: 'Failed to create session.' });
    }
  });

  /**
   * Join Session
   */
  socket.on('session:join', ({ sessionId, password, nickname }) => {
    try {
      const session = sessions.get(sessionId);

      if (!session) {
        socket.emit('session:error', { error: 'Session not found.' });
        return;
      }

      if (session.password && session.password !== password) {
        socket.emit('session:error', { error: 'Incorrect password.' });
        return;
      }

      const MAX_USERS = 7; // Example limit
      if (session.users.length >= MAX_USERS) {
        socket.emit('session:error', { error: 'This session is full. Please try again later.' });
        return;
      }

      // Prevent duplicate joins (if user is somehow already in)
      if (session.users.some(user => user.id === socket.id)) {
          console.warn(`[session:join] User ${socket.id} attempted to join session ${sessionId} they are already in.`);
          // Re-emit current state just in case client missed it
          socket.emit('session:joined', { sessionId, mode: session.mode });
          io.to(sessionId).emit('session:participants', { participants: session.users, mode: session.mode });
          return;
      }

      const name = nickname?.trim() || `Guest${Math.floor(Math.random() * 1000)}`;

      const newUser = {
        id: socket.id,
        nickname: name,
      };
      session.users.push(newUser);

      socketToSessionMap.set(socket.id, sessionId);
      socket.join(sessionId);
      sessions.set(sessionId, session); // Save the updated session

      console.log(`[session] ${name} (${socket.id}) joined session ${sessionId} (Mode: ${session.mode})`);
      socket.emit('session:joined', { sessionId, mode: session.mode });

      // Notify others about the new user
      socket.to(sessionId).emit('user:joined', { userId: newUser.id, nickname: newUser.nickname }); // Use socket.to to not send to self
      // Send the full participant list to everyone (including the new user)
      io.to(sessionId).emit('session:participants', { participants: session.users, mode: session.mode });

    } catch (error) {
      console.error(`[session:join] Error joining session ${sessionId} for ${socket.id}:`, error);
      socket.emit('session:error', { error: 'Failed to join session.' });
    }
  });

  /**
   * Set Session Mode (Host Only)
   */
  socket.on('session:set_mode', ({ mode }) => {
    const sessionId = socketToSessionMap.get(socket.id);
    if (!sessionId) return;

    const session = sessions.get(sessionId);
    if (!session) return;

    // Authorize: Only the host can change the mode
    if (session.host !== socket.id) {
      console.warn(`[session] Non-host user ${socket.id} attempted to change mode for session ${sessionId}`);
      socket.emit('session:error', { error: 'Only the host can change the session mode.' });
      return;
    }

    // Validate: Mode must be 'sync' or 'stream'
    if (mode !== 'sync' && mode !== 'stream') {
      console.warn(`[session] Invalid mode requested by host ${socket.id} for session ${sessionId}: ${mode}`);
      socket.emit('session:error', { error: 'Invalid session mode specified.' });
      return;
    }

    // Update: Change the mode and save
    if (session.mode !== mode) {
        session.mode = mode;
        sessions.set(sessionId, session);
        console.log(`[session] Host ${socket.id} changed mode for session ${sessionId} to: ${mode}`);

        // Broadcast: Inform all clients of the mode change via the participants update
        io.to(sessionId).emit('session:participants', { participants: session.users, mode: session.mode });

        // --- Optional: Notify about mode change specifically ---
        // You could also emit a dedicated event if needed for specific UI updates
        // io.to(sessionId).emit('session:mode_changed', { mode: session.mode });
        // For now, updating via 'session:participants' is sufficient.
        // --- End Optional ---
    } else {
        console.log(`[session] Mode for session ${sessionId} is already ${mode}. No change needed.`);
    }
  });

  /**
   * Leave Session
   */
  socket.on('session:leave', () => {
    const sessionId = socketToSessionMap.get(socket.id);
    if (!sessionId) {
      console.log(`[session:leave] Socket ${socket.id} tried to leave but was not in a session.`);
      return;
    }

    const session = sessions.get(sessionId);
    if (!session) {
      console.log(`[session:leave] Session ${sessionId} not found for leaving socket ${socket.id}.`);
      socketToSessionMap.delete(socket.id); // Clean up map just in case
      return;
    }

    const leavingUser = session.users.find(u => u.id === socket.id);
    const userNickname = leavingUser?.nickname || socket.id;
    const wasHost = session.host === socket.id;

    // Remove user
    session.users = session.users.filter(u => u.id !== socket.id);
    socketToSessionMap.delete(socket.id);
    socket.leave(sessionId);

    console.log(`[session] ${userNickname} (${socket.id}) left session ${sessionId}`);

    // If host left, terminate the session
    if (wasHost) {
      console.log(`[session] Host (${socket.id}) left. Deleting session ${sessionId}`);
      sessions.delete(sessionId);
      // Notify remaining clients the session is ending *before* disconnecting them
      io.to(sessionId).emit('session:host_disconnected', { message: 'Host left the session.' });
      // Disconnect all remaining sockets from the room server-side
      io.socketsLeave(sessionId);
      return;
    }

    // If no users left, clean up the session
    if (session.users.length === 0) {
      console.log(`[session] Last user left session ${sessionId}. Cleaning up.`);
      sessions.delete(sessionId);
      return;
    }

    // Otherwise, update remaining users
    sessions.set(sessionId, session); // Save the updated session state
    // Notify remaining users about the departure
    io.to(sessionId).emit('user:left', { userId: socket.id });
    // Send updated participant list and current mode
    io.to(sessionId).emit('session:participants', { participants: session.users, mode: session.mode });
  });

  /**
   * Handle socket disconnects (tab close, refresh, network loss etc.)
   */
  socket.on('disconnect', (reason) => {
    const sessionId = socketToSessionMap.get(socket.id);
    if (!sessionId) {
      // User disconnected before joining or after leaving a session, normal.
      // console.log(`[disconnect] Socket ${socket.id} disconnected without active session.`);
      return;
    }

    const session = sessions.get(sessionId);
    // If session doesn't exist, it was likely already cleaned up (e.g., by host leaving)
    if (!session) {
      // console.log(`[disconnect] Session ${sessionId} not found for disconnected socket ${socket.id}. Already cleaned up?`);
      socketToSessionMap.delete(socket.id); // Clean up map just in case
      return;
    }

    const disconnectedUser = session.users.find(u => u.id === socket.id);
    const userNickname = disconnectedUser?.nickname || socket.id;
    const wasHost = session.host === socket.id;

    // Remove user from session data
    session.users = session.users.filter(u => u.id !== socket.id);
    socketToSessionMap.delete(socket.id);
    // socket.leave(sessionId) is implicitly handled by disconnect

    console.log(`[session] ${userNickname} (${socket.id}) disconnected from session ${sessionId}. Reason: ${reason}`);

    // If host disconnected, end the session for everyone
    if (wasHost) {
      console.log(`[session] Host (${socket.id}) disconnected. Ending session ${sessionId}`);
      sessions.delete(sessionId);
      // Notify remaining users the session ended because host disconnected
      io.to(sessionId).emit('session:host_disconnected', { message: 'Host disconnected.' });
      // Force remaining sockets in the room to leave the room server-side
      io.socketsLeave(sessionId);
      return;
    }

    // If the last user disconnected, clean up the session
    if (session.users.length === 0) {
      console.log(`[session] Last user disconnected from session ${sessionId}. Cleaning up.`);
      sessions.delete(sessionId);
      return;
    }

    // Otherwise, update the remaining users
    sessions.set(sessionId, session); // Save the state without the disconnected user
    // Notify remaining users about the departure
    io.to(sessionId).emit('user:left', { userId: socket.id });
    // Send updated participant list and current mode
    io.to(sessionId).emit('session:participants', { participants: session.users, mode: session.mode });
  });


  // --- WEBRTC SIGNALING HANDLERS ---

  /**
   * Relay WebRTC Offer
   * Sent from the initiating peer (usually host in stream mode) to a target peer.
   */
  socket.on('webrtc:offer', ({ targetUserId, offer }) => {
    const sessionId = socketToSessionMap.get(socket.id);
    if (!sessionId) {
       console.warn(`[webrtc:offer] Received from socket ${socket.id} not in a session.`);
       return;
    }
    if (!targetUserId || !offer) {
       console.warn(`[webrtc:offer] Invalid payload from ${socket.id} in session ${sessionId}.`);
       return;
    }
    const session = sessions.get(sessionId);
    // Optional: Verify targetUserId is actually in the session
    if (!session || !session.users.some(u => u.id === targetUserId)) {
        console.warn(`[webrtc:offer] Target user ${targetUserId} not found in session ${sessionId} for offer from ${socket.id}`);
        return;
    }

    // Relay offer ONLY to the specific target user in the same session
    console.log(`[webrtc] Relaying offer from ${socket.id} to ${targetUserId} in session ${sessionId}`);
    // Using socket.to(targetUserId) ensures it only goes to that specific socket
    socket.to(targetUserId).emit('webrtc:offer', {
      fromUserId: socket.id, // Let the recipient know who sent the offer
      offer: offer
    });
  });

  /**
   * Relay WebRTC Answer
   * Sent from the target peer back to the initiating peer.
   */
  socket.on('webrtc:answer', ({ targetUserId, answer }) => {
    const sessionId = socketToSessionMap.get(socket.id);
     if (!sessionId) {
       console.warn(`[webrtc:answer] Received from socket ${socket.id} not in a session.`);
       return;
    }
    if (!targetUserId || !answer) {
       console.warn(`[webrtc:answer] Invalid payload from ${socket.id} in session ${sessionId}.`);
       return;
    }
    const session = sessions.get(sessionId);
     // Optional: Verify targetUserId is actually in the session
    if (!session || !session.users.some(u => u.id === targetUserId)) {
        console.warn(`[webrtc:answer] Target user ${targetUserId} not found in session ${sessionId} for answer from ${socket.id}`);
        return;
    }

    // Relay answer back ONLY to the user who sent the offer (targetUserId in this context)
    console.log(`[webrtc] Relaying answer from ${socket.id} to ${targetUserId} in session ${sessionId}`);
    socket.to(targetUserId).emit('webrtc:answer', {
      fromUserId: socket.id, // Let the original sender know who answered
      answer: answer
    });
  });

  /**
   * Relay ICE Candidate
   * Exchanged between peers to help establish the direct connection.
   */
  socket.on('webrtc:ice-candidate', ({ targetUserId, candidate }) => {
    const sessionId = socketToSessionMap.get(socket.id);
    if (!sessionId) {
       // console.warn(`[webrtc:ice-candidate] Received from socket ${socket.id} not in a session.`); // Can be noisy
       return;
    }
    if (!targetUserId || !candidate) {
       // console.warn(`[webrtc:ice-candidate] Invalid payload from ${socket.id} in session ${sessionId}.`); // Can be noisy
       return;
    }
     const session = sessions.get(sessionId);
     // Optional: Verify targetUserId is actually in the session
    if (!session || !session.users.some(u => u.id === targetUserId)) {
        // console.warn(`[webrtc:ice-candidate] Target user ${targetUserId} not found in session ${sessionId} for candidate from ${socket.id}`); // Can be noisy
        return;
    }

    // Relay ICE candidate ONLY to the target peer
    // console.log(`[webrtc] Relaying ICE candidate from ${socket.id} to ${targetUserId} in session ${sessionId}`); // Usually too noisy to log every candidate
    socket.to(targetUserId).emit('webrtc:ice-candidate', {
      fromUserId: socket.id, // Let the recipient know whose candidate this is
      candidate: candidate
    });
  });

  /**
   * Guest asks host to (re)send a WebRTC offer — covers missed offers from mode-sync races.
   */
  socket.on('webrtc:request-offer', ({ targetUserId }) => {
    const sessionId = socketToSessionMap.get(socket.id);
    if (!sessionId || !targetUserId) return;
    const session = sessions.get(sessionId);
    if (!session || !session.users.some(u => u.id === targetUserId)) return;

    console.log(`[webrtc] Relaying offer request from ${socket.id} to host ${targetUserId} in session ${sessionId}`);
    socket.to(targetUserId).emit('webrtc:request-offer', {
      fromUserId: socket.id,
    });
  });

  socket.on('session:request_participants', () => {
    const sessionId = socketToSessionMap.get(socket.id);
    if (!sessionId) return;
    const session = sessions.get(sessionId);
    if (!session) return;
  
    io.to(socket.id).emit('session:participants', {
      participants: session.users,
      mode: session.mode
    });
  });

} // End of registerSessionHandlers