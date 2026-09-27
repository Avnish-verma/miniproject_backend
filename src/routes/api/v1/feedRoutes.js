const express = require('express');
const router = express.Router();
const feedController = require('../../../controllers/feedController');
const { optionalAuth } = require('../../../middleware/auth');

router.get('/', optionalAuth, (req, res, next) => feedController.getFeed(req, res, next));

module.exports = router;
