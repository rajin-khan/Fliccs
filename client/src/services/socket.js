// client/src/services/socket.js
import { io } from 'socket.io-client';

// Railway serves the client and Socket.IO from the same origin. Keeping the
// production URL implicit prevents a local development URL from being baked
// into the deployed bundle.
const configuredUrl = import.meta.env.VITE_SERVER_URL?.trim();
const URL = import.meta.env.DEV ? (configuredUrl || 'http://localhost:3001') : undefined;

export const socket = io(URL, {
  autoConnect: false,
  transports: ['websocket', 'polling']
});

// Optional: Log socket events for debugging
socket.on('connect', () => {
  console.log('Socket connected:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('Socket disconnected:', reason);
});

socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
});