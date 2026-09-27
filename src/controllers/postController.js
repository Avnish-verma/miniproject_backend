const postService = require('../services/postService');
const HTTP_STATUS = require('../constants/httpStatusCodes');

class PostController {
  async createPost(req, res, next) {
    try {
      const post = await postService.createPost(req.user._id, req.body);
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Post created successfully',
        data: post,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPost(req, res, next) {
    try {
      const { postId } = req.params;
      const currentUserId = req.user ? req.user._id : null;
      const post = await postService.getPostById(postId, currentUserId);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: post,
      });
    } catch (error) {
      next(error);
    }
  }

  async deletePost(req, res, next) {
    try {
      const { postId } = req.params;
      const result = await postService.deletePost(postId, req.user._id);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleLike(req, res, next) {
    try {
      const { postId } = req.params;
      const result = await postService.toggleLike(postId, req.user._id);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: result.isLiked ? 'Post liked' : 'Post unliked',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleReaction(req, res, next) {
    try {
      const { postId } = req.params;
      const { type = 'LIKE' } = req.body;
      const result = await postService.toggleReaction(postId, req.user._id, type);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async addComment(req, res, next) {
    try {
      const { postId } = req.params;
      const comment = await postService.addComment(postId, req.user._id, req.body);
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Comment added successfully',
        data: comment,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteComment(req, res, next) {
    try {
      const { postId, commentId } = req.params;
      const result = await postService.deleteComment(postId, commentId, req.user._id);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  async getComments(req, res, next) {
    try {
      const { postId } = req.params;
      const { page = 1, limit = 50 } = req.query;
      const result = await postService.getComments(postId, {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      });
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.comments,
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

  async getUserPosts(req, res, next) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const currentUserId = req.user ? req.user._id : null;
      const result = await postService.getUserPosts(userId, currentUserId, {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      });
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.posts,
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

  async getUserMediaPosts(req, res, next) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const currentUserId = req.user ? req.user._id : null;
      const result = await postService.getUserMediaPosts(userId, currentUserId, {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      });
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.posts,
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

  async savePost(req, res, next) {
    try {
      const { postId } = req.params;
      const result = await postService.savePost(postId, req.user._id);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: result.message,
        data: { isSaved: result.isSaved, saved: result.isSaved },
      });
    } catch (error) {
      next(error);
    }
  }

  async unsavePost(req, res, next) {
    try {
      const { postId } = req.params;
      const result = await postService.unsavePost(postId, req.user._id);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: result.message,
        data: { isSaved: result.isSaved, saved: result.isSaved },
      });
    } catch (error) {
      next(error);
    }
  }

  async getSavedPosts(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const result = await postService.getSavedPosts(req.user._id, {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      });
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.posts,
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

  async getTrendingTags(req, res, next) {
    try {
      const { limit = 10 } = req.query;
      const tags = await postService.getTrendingTags(parseInt(limit, 10));
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: tags,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PostController();
