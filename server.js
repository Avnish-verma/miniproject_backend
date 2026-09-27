/**
 * Root Server Entry Point
 * Delegates to the modular, scalable architecture in src/server.js
 */
const { startServer, app, server } = require('./src/server');

if (require.main === module) {
  startServer();
}

module.exports = { app, server };