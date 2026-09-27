const notificationService = require('../services/notificationService');
const HTTP_STATUS = require('../constants/httpStatusCodes');

class NotificationController {
  async getNotifications(req, res, next) {
    try {
      const { page = 1, limit = 30 } = req.query;
      const result = await notificationService.getUserNotifications(req.user._id, {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      });
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.notifications,
        unreadCount: result.unreadCount,
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

  async markAsRead(req, res, next) {
    try {
      const { notificationId } = req.params;
      await notificationService.markAsRead(notificationId, req.user._id);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Notification marked as read',
      });
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      await notificationService.markAllAsRead(req.user._id);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'All notifications marked as read',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();
