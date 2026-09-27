const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const logger = require('../utils/logger');
const { presenceHandler } = require('./presenceHandler');
const chatHandler = require('./chatHandler');
const callHandler = require('./callHandler');
const { allowedOrigins } = require('../middleware/security');

let ioInstance = null;

const initSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
          return callback(null, true);
        }
        return callback(new Error('CORS policy: Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Socket Handshake Authentication Middleware
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth ? socket.handshake.auth.token : null;

      if (!token && socket.handshake.headers.cookie) {
        // Parse cookie header if available
        const match = socket.handshake.headers.cookie.match(/(?:^|;\s*)token=([^;]+)/);
        if (match) token = match[1];
      }

      if (!token) {
        return next(new Error('AUTHENTICATION_ERROR: Token required for socket connection'));
      }

      // Verify token
      let decoded;
      try {
        decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
      } catch {
        return next(new Error('AUTHENTICATION_ERROR: Invalid or expired socket token'));
      }

      const query = decoded.id ? { _id: decoded.id } : { userId: decoded.userId };
      const user = await User.findOne(query).select('-password -otp -otpExpiresAt');

      if (!user) {
        return next(new Error('AUTHENTICATION_ERROR: User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      logger.error(`[Socket Auth Middleware Error] ${err.message}`);
      next(new Error('INTERNAL_ERROR: Socket authentication failure'));
    }
  });

  io.on('connection', (socket) => {
    // 1. Join personal user room: user:{userId}
    const userRoom = `user:${socket.user._id.toString()}`;
    socket.join(userRoom);
    logger.debug(`[Socket] Socket ${socket.id} joined personal room ${userRoom}`);

    // 2. Wire domain event handlers
    presenceHandler(io, socket);
    chatHandler(io, socket);
    callHandler(io, socket);
  });

  ioInstance = io;
  return io;
};

const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.IO has not been initialized yet');
  }
  return ioInstance;
};

module.exports = { initSocketServer, getIO };
