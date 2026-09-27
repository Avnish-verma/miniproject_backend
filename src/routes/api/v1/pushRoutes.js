const express = require('express');
const router = express.Router();
const pushController = require('../../../controllers/pushController');
const { protect } = require('../../../middleware/auth');

router.get('/vapid-public-key', (req, res, next) => pushController.getVapidPublicKey(req, res, next));
router.post('/subscribe', protect, (req, res, next) => pushController.subscribe(req, res, next));
router.post('/unsubscribe', protect, (req, res, next) => pushController.unsubscribe(req, res, next));

module.exports = router;
