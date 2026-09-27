const express = require('express');
const router = express.Router();
const feedService = require('../src/services/feedService');
const { optionalAuth } = require('../src/middleware/auth');

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const currentUserId = req.user ? req.user._id : null;

    const result = await feedService.getFeed(currentUserId, { page, limit });
    res.json({
      success: true,
      post: result.posts,
      posts: result.posts,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;