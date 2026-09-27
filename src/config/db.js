const mongoose = require('mongoose');
const env = require('./env');

let isConnected = false;

async function connectDB() {
  if (isConnected) return mongoose.connection;

  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`[Database] MongoDB connected successfully to host: ${conn.connection.host}`);
    return conn.connection;
  } catch (error) {
    console.error(`[Database Error] MongoDB connection failure: ${error.message}`);
    throw error;
  }
}

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('[Database] MongoDB disconnected. Waiting for reconnect...');
});

mongoose.connection.on('error', (err) => {
  console.error('[Database Error] MongoDB runtime error:', err);
});

module.exports = { connectDB, connection: mongoose.connection };
