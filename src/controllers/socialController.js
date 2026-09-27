const socialService = require('../services/socialService');
const HTTP_STATUS = require('../constants/httpStatusCodes');

class SocialController {
  async toggleFollow(req, res, next) {
    try {
      const target = req.params.userId;
      const result = await socialService.toggleFollow(req.user._id, target);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: result.message,
        data: { isFollowing: result.isFollowing },
      });
    } catch (error) {
      next(error);
    }
  }

  async blockUser(req, res, next) {
    try {
      const { userId } = req.params;
      const result = await socialService.blockUser(req.user._id, userId);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  async unblockUser(req, res, next) {
    try {
      const { userId } = req.params;
      const result = await socialService.unblockUser(req.user._id, userId);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBlockedUsers(req, res, next) {
    try {
      const users = await socialService.getBlockedUsers(req.user._id);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SocialController();
