const express = require('express');
const router = express.Router();
const storyController = require('../../../controllers/storyController');
const { protect, optionalAuth } = require('../../../middleware/auth');

router.post('/', protect, (req, res, next) => storyController.createStory(req, res, next));
router.get('/', optionalAuth, (req, res, next) => storyController.getFeedStories(req, res, next));
router.get('/feed', optionalAuth, (req, res, next) => storyController.getFeedStories(req, res, next));
router.get('/:storyId', optionalAuth, (req, res, next) => storyController.getStoryById(req, res, next));
router.post('/:storyId/view', protect, (req, res, next) => storyController.recordStoryView(req, res, next));
router.get('/:storyId/viewers', protect, (req, res, next) => storyController.getStoryViewers(req, res, next));
router.delete('/:storyId', protect, (req, res, next) => storyController.deleteStory(req, res, next));

module.exports = router;
