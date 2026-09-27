const express = require('express');
const router = express.Router();
const userController = require('../../../controllers/userController');
const { protect, optionalAuth } = require('../../../middleware/auth');

router.get('/me', protect, (req, res, next) => userController.getMe(req, res, next));
router.get('/me/saved', protect, (req, res, next) => require('../../../controllers/postController').getSavedPosts(req, res, next));
router.get('/profile', protect, (req, res, next) => userController.getMe(req, res, next));
router.get('/profile/:userId', optionalAuth, (req, res, next) => userController.getProfile(req, res, next));
router.get('/profile/:userId/followers', optionalAuth, (req, res, next) => userController.getFollowers(req, res, next));
router.get('/:userId/followers', optionalAuth, (req, res, next) => userController.getFollowers(req, res, next));
router.get('/profile/:userId/following', optionalAuth, (req, res, next) => userController.getFollowing(req, res, next));
router.get('/:userId/following', optionalAuth, (req, res, next) => userController.getFollowing(req, res, next));
router.put('/profile', protect, (req, res, next) => userController.updateProfile(req, res, next));
router.put('/avatar', protect, (req, res, next) => userController.updateAvatar(req, res, next));
router.put('/cover', protect, (req, res, next) => userController.updateCover(req, res, next));
router.get('/search', optionalAuth, (req, res, next) => userController.search(req, res, next));

module.exports = router;
