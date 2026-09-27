const chatService = require('../services/chatService');
const HTTP_STATUS = require('../constants/httpStatusCodes');
const { getIO } = require('../sockets/socketServer');
const { isUserOnline } = require('../sockets/presenceHandler');
const SOCKET_EVENTS = require('../constants/events');

class ChatController {
  async getOrCreateConversation(req, res, next) {
    try {
      const targetId = req.params.targetId || req.body.targetId || req.body.recipientId;
      const conversation = await chatService.getOrCreateConversation(req.user._id, targetId);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: conversation,
      });
    } catch (error) {
      next(error);
    }
  }

  async getConversations(req, res, next) {
    try {
      const conversations = await chatService.getUserConversations(req.user._id);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: conversations,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMessages(req, res, next) {
    try {
      const { conversationId } = req.params;
      const { page = 1, limit = 50 } = req.query;
      const result = await chatService.getMessages(conversationId, req.user._id, {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      });
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.messages,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req, res, next) {
    try {
      const { conversationId } = req.params;
      const result = await chatService.sendMessage(conversationId, req.user._id, req.body);
      const message = result.message;

      // Authoritative Real-Time Broadcast via Socket.IO
      try {
        const io = getIO();
        if (io) {
          // 1. Broadcast to conversation room
          io.to(`conversation:${conversationId}`).emit(SOCKET_EVENTS.MESSAGE_NEW, {
            message,
            conversationId,
          });

          // 2. Broadcast to members outside the conversation room
          for (const memberId of result.conversation.members) {
            if (!memberId.equals(req.user._id)) {
              io.to(`user:${memberId.toString()}`).emit(SOCKET_EVENTS.MESSAGE_NEW, {
                message,
                conversationId,
              });
            }
          }

          // 3. If recipient is online, message is delivered to sender
          const isPeerOnline = result.conversation.members.some(
            (m) => !m.equals(req.user._id) && isUserOnline(m)
          );
          if (isPeerOnline) {
            io.to(`user:${req.user._id.toString()}`).emit(SOCKET_EVENTS.MESSAGE_DELIVERED, {
              messageId: message._id,
              conversationId,
            });
          }
        }
      } catch (socketErr) {
        console.warn('[ChatController Socket Broadcast Notice]:', socketErr.message);
      }

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: message,
      });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const { conversationId } = req.params;
      await chatService.markMessagesRead(conversationId, req.user._id);

      // Broadcast read receipt to room
      try {
        const io = getIO();
        if (io) {
          io.to(`conversation:${conversationId}`).emit(SOCKET_EVENTS.MESSAGE_READ, {
            conversationId,
            readBy: req.user._id.toString(),
          });
        }
      } catch (socketErr) {
        console.warn('[ChatController Read Receipt Notice]:', socketErr.message);
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Messages marked as read',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ChatController();
