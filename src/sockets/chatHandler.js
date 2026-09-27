const SOCKET_EVENTS = require('../constants/events');
const Conversation = require('../models/Conversation');
const chatService = require('../services/chatService');
const pushService = require('../services/pushService');
const logger = require('../utils/logger');
const { isUserOnline } = require('./presenceHandler');

const chatHandler = (io, socket) => {
  const currentUserId = socket.user._id;

  // 1. Join Conversation Room with Server-Side Authorization Guard
  socket.on(SOCKET_EVENTS.CHAT_JOIN, async ({ conversationId }, callback) => {
    try {
      if (!conversationId) return;

      const conversation = await Conversation.findOne({
        _id: conversationId,
        members: currentUserId,
      });

      if (!conversation) {
        logger.warn(`[Socket Chat] Unauthorized room join attempt by user ${socket.user.userId} for conversation ${conversationId}`);
        if (typeof callback === 'function') callback({ error: 'UNAUTHORIZED_CONVERSATION' });
        return;
      }

      socket.join(`conversation:${conversationId}`);
      if (typeof callback === 'function') callback({ success: true });
    } catch (err) {
      logger.error(`[Socket Chat] Error joining conversation: ${err.message}`);
    }
  });

  // 2. Leave Conversation Room
  socket.on(SOCKET_EVENTS.CHAT_LEAVE, ({ conversationId }) => {
    if (conversationId) {
      socket.leave(`conversation:${conversationId}`);
    }
  });

  // 3. Send Message with Server-Side Authorization
  socket.on(SOCKET_EVENTS.MESSAGE_SEND, async (payload, callback) => {
    try {
      const {
        conversationId,
        text = '',
        mediaUrl = '',
        mediaType = 'none',
        messageType = 'TEXT',
        sharedPostId = null,
        replyTo = null,
      } = payload;

      if (!conversationId) {
        if (typeof callback === 'function') callback({ error: 'CONVERSATION_ID_REQUIRED' });
        return;
      }

      // Sender is AUTHORITATIVELY the authenticated socket.user._id, not whatever the client sends
      const result = await chatService.sendMessage(conversationId, currentUserId, {
        text,
        mediaUrl,
        mediaType,
        messageType,
        sharedPostId,
        replyTo,
      });

      const message = result.message;

      // Broadcast new message to all members in the conversation room
      io.to(`conversation:${conversationId}`).emit(SOCKET_EVENTS.MESSAGE_NEW, {
        message,
        conversationId,
      });

      // Notify members who are outside the conversation room
      for (const memberId of result.conversation.members) {
        if (!memberId.equals(currentUserId)) {
          io.to(`user:${memberId.toString()}`).emit(SOCKET_EVENTS.MESSAGE_NEW, {
            message,
            conversationId,
          });

          // Dispatch Web Push notification for background/offline delivery
          const senderAvatar = socket.user.profilePic?.url || '/icon-192.png';
          pushService.sendToUser(memberId, {
            title: socket.user.fullname || socket.user.userId || 'ShiftAura',
            body: text || (mediaUrl ? 'Sent you an attachment' : 'Sent you a message'),
            icon: senderAvatar,
            tag: `chat-${conversationId}`,
            data: {
              url: `/chat?conversationId=${conversationId}`,
              conversationId: conversationId.toString(),
              senderId: currentUserId.toString(),
              senderName: socket.user.fullname || socket.user.userId,
              type: 'MESSAGE',
            },
            actions: [
              { action: 'open', title: 'Open' },
              { action: 'reply', title: 'Reply', type: 'text', placeholder: 'Type a reply...' },
            ],
          }).catch((err) => {
            logger.warn(`[Socket Chat] Push dispatch error: ${err.message}`);
          });
        }
      }

      // If any other conversation member is online, message is delivered!
      const isPeerOnline = result.conversation.members.some(
        (m) => !m.equals(currentUserId) && isUserOnline(m)
      );
      if (isPeerOnline) {
        io.to(`user:${currentUserId.toString()}`).emit(SOCKET_EVENTS.MESSAGE_DELIVERED, {
          messageId: message._id,
          conversationId,
        });
      }

      if (typeof callback === 'function') callback({ success: true, data: message });
    } catch (err) {
      logger.error(`[Socket Chat] Error sending message: ${err.message}`);
      if (typeof callback === 'function') callback({ error: err.message });
    }
  });

  // 4. Live Typing Indicator
  socket.on(SOCKET_EVENTS.MESSAGE_TYPING, async ({ conversationId, isTyping }) => {
    try {
      if (!conversationId) return;

      // Broadcast typing indicator to conversation room (excluding sender)
      socket.to(`conversation:${conversationId}`).emit(SOCKET_EVENTS.MESSAGE_TYPING, {
        conversationId,
        userId: socket.user.userId,
        _id: currentUserId.toString(),
        isTyping: Boolean(isTyping),
      });
    } catch (err) {
      logger.error(`[Socket Chat] Error in typing event: ${err.message}`);
    }
  });

  // 5. Read Receipt
  socket.on(SOCKET_EVENTS.MESSAGE_READ, async ({ conversationId }) => {
    try {
      if (!conversationId) return;
      await chatService.markMessagesRead(conversationId, currentUserId);

      // Notify other members that messages were read
      socket.to(`conversation:${conversationId}`).emit(SOCKET_EVENTS.MESSAGE_READ, {
        conversationId,
        readBy: currentUserId.toString(),
      });
    } catch (err) {
      logger.error(`[Socket Chat] Error marking message read: ${err.message}`);
    }
  });
};

module.exports = chatHandler;
