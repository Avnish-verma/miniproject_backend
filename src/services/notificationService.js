const Notification = require('../models/Notification');

class NotificationService {
  async createNotification({ recipient, sender, type, referenceId = null, message = '' }) {
    if (recipient.toString() === sender.toString()) {
      return null; // Do not notify yourself for own actions
    }

    const notification = await Notification.create({
      recipient,
      sender,
      type,
      referenceId,
      message,
    });

    return Notification.findById(notification._id)
      .populate('sender', 'userId fullname profilePic')
      .lean();
  }

  async getUserNotifications(userId, { page = 1, limit = 30 }) {
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('sender', 'userId fullname profilePic')
        .lean(),
      Notification.countDocuments({ recipient: userId }),
      Notification.countDocuments({ recipient: userId, isRead: false }),
    ]);

    return {
      notifications,
      total,
      unreadCount,
      page,
      limit,
    };
  }

  async markAsRead(notificationId, userId) {
    await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { $set: { isRead: true } }
    );
    return { success: true };
  }

  async markAllAsRead(userId) {
    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { $set: { isRead: true } }
    );
    return { success: true };
  }
}

module.exports = new NotificationService();
