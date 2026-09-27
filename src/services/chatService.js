const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Block = require('../models/Block');
const User = require('../models/User');
const { NotFoundError, ForbiddenError, ValidationError } = require('../errors/errorTypes');

class ChatService {
  async getOrCreateConversation(userAId, targetIdentifier) {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(targetIdentifier);
    const query = isObjectId ? { _id: targetIdentifier } : { userId: targetIdentifier.toLowerCase() };

    const targetUser = await User.findOne(query);
    if (!targetUser) {
      throw new NotFoundError('Target user not found');
    }

    if (targetUser._id.equals(userAId)) {
      throw new ValidationError('Cannot create a conversation with yourself');
    }

    // Verify neither user has blocked the other
    const isBlocked = await Block.findOne({
      $or: [
        { blocker: userAId, blocked: targetUser._id },
        { blocker: targetUser._id, blocked: userAId },
      ],
    });
    if (isBlocked) {
      throw new ForbiddenError('Cannot start conversation due to privacy/block settings');
    }

    let conversation = await Conversation.findOne({
      isGroup: false,
      members: { $all: [userAId, targetUser._id], $size: 2 },
    })
      .populate('members', 'userId fullname profilePic')
      .populate('lastMessage');

    if (!conversation) {
      conversation = await Conversation.create({
        members: [userAId, targetUser._id],
        isGroup: false,
      });

      conversation = await Conversation.findById(conversation._id).populate(
        'members',
        'userId fullname profilePic'
      );
    }

    return conversation;
  }

  async getUserConversations(userId) {
    const conversations = await Conversation.find({ members: userId })
      .sort({ lastMessageAt: -1 })
      .populate('members', 'userId fullname profilePic')
      .populate('lastMessage')
      .lean();

    // Attach unread count per conversation
    const results = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          sender: { $ne: userId },
          status: { $ne: 'READ' },
        });

        // Other participant
        const otherUser = conv.members.find((m) => m._id.toString() !== userId.toString());

        return {
          ...conv,
          unreadCount,
          otherUser,
        };
      })
    );

    return results;
  }

  async getMessages(conversationId, userId, { page = 1, limit = 40 }) {
    const conversation = await Conversation.findOne({
      _id: conversationId,
      members: userId,
    });

    if (!conversation) {
      throw new ForbiddenError('You are not a member of this conversation');
    }

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      Message.find({ conversationId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('sender', 'userId fullname profilePic')
        .populate('replyTo')
        .populate({
          path: 'sharedPostId',
          populate: { path: 'postedBy', select: 'userId fullname profilePic' },
        })
        .lean(),
      Message.countDocuments({ conversationId }),
    ]);

    // Reverse so messages are in chronological order for the client
    return {
      messages: messages.reverse(),
      total,
      page,
      limit,
    };
  }

  async sendMessage(conversationId, senderId, { text = '', mediaUrl = '', mediaType = 'none', messageType = 'TEXT', sharedPostId = null, replyTo = null }) {
    if (!text.trim() && !mediaUrl.trim() && !sharedPostId) {
      throw new ValidationError('Message must contain text, media, or shared content');
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      members: senderId,
    });

    if (!conversation) {
      throw new ForbiddenError('You are not a member of this conversation');
    }

    // Verify neither recipient has blocked the sender
    const otherMembers = conversation.members.filter((m) => !m.equals(senderId));
    if (otherMembers.length > 0) {
      const isBlocked = await Block.findOne({
        $or: [
          { blocker: senderId, blocked: { $in: otherMembers } },
          { blocker: { $in: otherMembers }, blocked: senderId },
        ],
      });
      if (isBlocked) {
        throw new ForbiddenError('Cannot send message: user interaction is blocked');
      }
    }

    const resolvedMessageType = sharedPostId ? 'POST_SHARE' : (messageType || 'TEXT');

    const message = await Message.create({
      conversationId,
      sender: senderId,
      text: text.trim(),
      mediaUrl: mediaUrl.trim(),
      mediaType,
      messageType: resolvedMessageType,
      sharedPostId: sharedPostId || null,
      replyTo: replyTo || null,
      status: 'SENT',
    });

    // Update conversation's lastMessage
    await Conversation.findByIdAndUpdate(conversationId, {
      $set: { lastMessage: message._id, lastMessageAt: new Date() },
    });

    const populated = await Message.findById(message._id)
      .populate('sender', 'userId fullname profilePic')
      .populate('replyTo')
      .populate({
        path: 'sharedPostId',
        populate: { path: 'postedBy', select: 'userId fullname profilePic' },
      })
      .lean();

    return { message: populated, conversation };
  }

  async markMessagesRead(conversationId, userId) {
    const conversation = await Conversation.findOne({
      _id: conversationId,
      members: userId,
    });

    if (!conversation) {
      throw new ForbiddenError('You are not a member of this conversation');
    }

    await Message.updateMany(
      {
        conversationId,
        sender: { $ne: userId },
        status: { $ne: 'READ' },
      },
      {
        $set: { status: 'READ' },
        $addToSet: { readBy: { user: userId, readAt: new Date() } },
      }
    );

    return { success: true };
  }
}

module.exports = new ChatService();
