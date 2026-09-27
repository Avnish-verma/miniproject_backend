const userService = require('../services/userService');
const HTTP_STATUS = require('../constants/httpStatusCodes');

class UserController {
  async getProfile(req, res, next) {
    try {
      const target = req.params.userId || req.params.username;
      const currentUserId = req.user ? req.user._id : null;
      const profile = await userService.getProfile(target, currentUserId);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: profile.user,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const updatedUser = await userService.updateProfile(req.user._id, req.body);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateAvatar(req, res, next) {
    try {
      const { url, public_id } = req.body;
      const user = await userService.updateAvatar(req.user._id, { url, public_id });
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Profile picture updated',
        data: { profilePic: user.profilePic },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCover(req, res, next) {
    try {
      const { url, public_id } = req.body;
      const user = await userService.updateCover(req.user._id, { url, public_id });
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Cover picture updated',
        data: { coverPic: user.coverPic },
      });
    } catch (error) {
      next(error);
    }
  }

  async search(req, res, next) {
    try {
      const { q = '', page = 1, limit = 20 } = req.query;
      const currentUserId = req.user ? req.user._id : null;
      const result = await userService.searchUsers(q, currentUserId, {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      });
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      const profile = await userService.getProfile(req.user._id, req.user._id);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: profile.user,
      });
    } catch (error) {
      next(error);
    }
  }

  async getFollowers(req, res, next) {
    try {
      const target = req.params.userId || req.params.username;
      const { page = 1, limit = 20 } = req.query;
      const result = await userService.getUserFollowers(target, {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      });
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.followers,
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

  async getFollowing(req, res, next) {
    try {
      const target = req.params.userId || req.params.username;
      const { page = 1, limit = 20 } = req.query;
      const result = await userService.getUserFollowing(target, {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      });
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.following,
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
}

module.exports = new UserController();
