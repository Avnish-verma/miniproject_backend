const { connection, connectDB } = require('./src/config/db');

connectDB().catch((err) => {
  console.error('[Database Connection Error]:', err.message);
});

module.exports = connection;