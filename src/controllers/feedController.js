const feedService = require('../services/feedService');
const HTTP_STATUS = require('../constants/httpStatusCodes');

class FeedController {
  async getFeed(req, res, next) {
    try {
      const { page = 1, limit = 15, feedType = 'for_you' } = req.query;
      const currentUserId = req.user ? req.user._id : null;
      const result = await feedService.getFeed(currentUserId, {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        feedType,
      });

      // Retain `data`, `posts` and `post` (legacy key) for complete frontend compatibility
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.posts,
        post: result.posts,
        posts: result.posts,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FeedController();
