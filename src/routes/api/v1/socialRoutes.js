const express = require('express');
const router = express.Router();
const socialController = require('../../../controllers/socialController');
const { protect } = require('../../../middleware/auth');

router.post('/follow/:userId', protect, (req, res, next) => socialController.toggleFollow(req, res, next));
router.post('/block/:userId', protect, (req, res, next) => socialController.blockUser(req, res, next));
router.delete('/block/:userId', protect, (req, res, next) => socialController.unblockUser(req, res, next));
router.get('/blocked', protect, (req, res, next) => socialController.getBlockedUsers(req, res, next));

module.exports = router;
