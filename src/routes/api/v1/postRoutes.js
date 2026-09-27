const express = require('express');
const router = express.Router();
const postController = require('../../../controllers/postController');
const { protect, optionalAuth } = require('../../../middleware/auth');
const validate = require('../../../middleware/validate');
const { createPostSchema, commentSchema, reactionSchema } = require('../../../validators/postValidators');

router.post('/', protect, validate(createPostSchema), (req, res, next) => postController.createPost(req, res, next));
router.get('/saved', protect, (req, res, next) => postController.getSavedPosts(req, res, next));
router.get('/trending-tags', optionalAuth, (req, res, next) => postController.getTrendingTags(req, res, next));
router.get('/:postId', optionalAuth, (req, res, next) => postController.getPost(req, res, next));
router.delete('/:postId', protect, (req, res, next) => postController.deletePost(req, res, next));
router.post('/:postId/like', protect, (req, res, next) => postController.toggleLike(req, res, next));
router.post('/:postId/react', protect, validate(reactionSchema), (req, res, next) => postController.toggleReaction(req, res, next));
router.post('/:postId/save', protect, (req, res, next) => postController.savePost(req, res, next));
router.delete('/:postId/save', protect, (req, res, next) => postController.unsavePost(req, res, next));
router.post('/:postId/comments', protect, validate(commentSchema), (req, res, next) => postController.addComment(req, res, next));
router.get('/:postId/comments', optionalAuth, (req, res, next) => postController.getComments(req, res, next));
router.delete('/:postId/comments/:commentId', protect, (req, res, next) => postController.deleteComment(req, res, next));
router.get('/user/:userId', optionalAuth, (req, res, next) => postController.getUserPosts(req, res, next));
router.get('/user/:userId/media', optionalAuth, (req, res, next) => postController.getUserMediaPosts(req, res, next));

module.exports = router;
