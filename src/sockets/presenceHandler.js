const SOCKET_EVENTS = require('../constants/events');
const logger = require('../utils/logger');

// Global online users map: userId -> Set of socket IDs
const onlineUsers = new Map();

const presenceHandler = (io, socket) => {
  const userId = socket.user._id.toString();

  // Add socket to user's active socket set
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
  onlineUsers.get(userId).add(socket.id);

  // Broadcast user is online
  socket.broadcast.emit(SOCKET_EVENTS.USER_ONLINE, {
    userId: socket.user.userId,
    _id: userId,
  });

  // Sync current online roster directly to the newly connected socket
  socket.emit('presence:sync', {
    onlineUserIds: Array.from(onlineUsers.keys()),
  });

  logger.info(`[Presence] User ${socket.user.userId} connected (Socket: ${socket.id}). Online count: ${onlineUsers.size}`);

  socket.on(SOCKET_EVENTS.DISCONNECT, () => {
    if (onlineUsers.has(userId)) {
      onlineUsers.get(userId).delete(socket.id);
      if (onlineUsers.get(userId).size === 0) {
        onlineUsers.delete(userId);
        // Broadcast user is offline
        io.emit(SOCKET_EVENTS.USER_OFFLINE, {
          userId: socket.user.userId,
          _id: userId,
        });
        logger.info(`[Presence] User ${socket.user.userId} went offline.`);

        // Clean up any active/ringing calls to prevent orphan lockouts
        (async () => {
          try {
            const Call = require('../models/Call');
            const activeCalls = await Call.find({
              $or: [{ caller: socket.user._id }, { callee: socket.user._id }],
              status: { $in: ['ringing', 'accepted'] },
            });

            for (const call of activeCalls) {
              const isCaller = call.caller.equals(socket.user._id);
              const otherUserId = isCaller ? call.callee.toString() : call.caller.toString();

              if (call.status === 'ringing') {
                const newStatus = isCaller ? 'cancelled' : 'missed';
                call.status = newStatus;
                call.endedAt = new Date();
                await call.save();

                if (isCaller) {
                  io.to(`user:${otherUserId}`).emit(SOCKET_EVENTS.CALL_CANCELLED, { callId: call._id });
                } else {
                  io.to(`user:${otherUserId}`).emit(SOCKET_EVENTS.CALL_REJECTED, {
                    callId: call._id,
                    reason: 'offline',
                  });
                }
              } else if (call.status === 'accepted') {
                call.status = 'completed';
                call.endedAt = new Date();
                const duration = call.startedAt
                  ? Math.max(0, Math.round((call.endedAt.getTime() - call.startedAt.getTime()) / 1000))
                  : 0;
                call.duration = duration;
                await call.save();

                io.to(`user:${otherUserId}`).emit(SOCKET_EVENTS.CALL_ENDED, {
                  callId: call._id,
                  duration,
                  reason: 'peer_disconnected',
                });
              }
            }
          } catch (callCleanErr) {
            logger.error(`[Presence] Error cleaning up active calls on disconnect: ${callCleanErr.message}`);
          }
        })();
      }
    }
  });
};

const isUserOnline = (userId) => {
  const idStr = userId.toString();
  return onlineUsers.has(idStr) && onlineUsers.get(idStr).size > 0;
};

const getOnlineUserIds = () => Array.from(onlineUsers.keys());

module.exports = { presenceHandler, isUserOnline, getOnlineUserIds, onlineUsers };
