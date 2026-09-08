import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { pages } from '../../client/src/seo/pages.js';

import { registerSessionHandlers } from './handlers/session.js';
import { registerSyncHandlers } from './handlers/sync.js';
import { registerChatHandlers } from './handlers/chat.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;
const clientURL = process.env.CLIENT_URL || 'http://localhost:5173';

// For development, allow multiple localhost ports
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? clientURL 
  : [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:5175',
    ];

// Add rate limiting to prevent brute force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later'
});
app.use(limiter);

const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 50, // allow 50 requests per window without delay
    delayMs: 500 // add 500ms delay per request after limit
  });
  app.use(speedLimiter);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
});

const rootDir = path.join(__dirname, '../../client/dist');

// Move health check route before the catch-all route to make it accessible
app.get('/health', (req, res) => {
  res.send('Fliccs Server is running!');
});

// Keep private invite URLs out of search results without blocking crawler access
// to the noindex header. Canonicals never include room IDs or passwords.
app.use((req, res, next) => {
  if ('join' in req.query || 'pass' in req.query) res.set('X-Robots-Tag', 'noindex, nofollow');
  if (process.env.NODE_ENV === 'production' && ['www.fliccs.com', 'fliccs.up.railway.app'].includes(req.hostname)) {
    return res.redirect(301, `https://fliccs.com${req.originalUrl}`);
  }
  if (req.path.endsWith('/index.html')) {
    const canonicalPath = req.path.slice(0, -11) || '/';
    if (Object.hasOwn(pages, canonicalPath)) return res.redirect(301, canonicalPath + req.originalUrl.slice(req.path.length));
  }
  if (req.path.length > 1 && req.path.endsWith('/')) {
    const query = req.originalUrl.slice(req.path.length);
    return res.redirect(301, req.path.replace(/\/+$/, '') + query);
  }
  next();
});
app.use(express.static(rootDir, { index: false, redirect: false }));
app.use((req, res) => {
  if ((req.method === 'GET' || req.method === 'HEAD') && Object.hasOwn(pages, req.path)) {
    return res.sendFile(path.join(rootDir, req.path === '/' ? 'index.html' : `${req.path}/index.html`));
  }
  res.status(404).set('X-Robots-Tag', 'noindex').sendFile(path.join(rootDir, '404.html'));
});

// In-memory session state
const sessions = new Map();
const socketToSessionMap = new Map();

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  registerSessionHandlers(io, socket, sessions, socketToSessionMap);
  registerSyncHandlers(io, socket, sessions);
  registerChatHandlers(io, socket, sessions);
  

});

httpServer.listen(PORT, () => {
  console.log(`Fliccs server listening on port ${httpServer.address().port}`);
});
