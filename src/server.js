const http = require('http');
const app = require('./app');
const env = require('./config/env');
const { connectDB } = require('./config/db');
const { initSocketServer } = require('./sockets/socketServer');
const logger = require('./utils/logger');

const server = http.createServer(app);

// Initialize real-time Socket.IO server on HTTP server
initSocketServer(server);

// Start database and server
async function startServer() {
  try {
    await connectDB();

    server.listen(env.PORT, () => {
      logger.info(`===================================================`);
      logger.info(`🚀 NOVA Platform Server active on port: ${env.PORT}`);
      logger.info(`📡 Socket.IO Real-Time & WebRTC Signaling Ready`);
      logger.info(`🌐 Environment: ${env.NODE_ENV}`);
      logger.info(`===================================================`);
    });
  } catch (error) {
    logger.error(`Fatal error starting server: ${error.message}`);
    process.exit(1);
  }
}

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated.');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
});

if (require.main === module) {
  startServer();
}

module.exports = { app, server, startServer };
