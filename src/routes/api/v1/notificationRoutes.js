const express = require('express');
const router = express.Router();
const notificationController = require('../../../controllers/notificationController');
const { protect } = require('../../../middleware/auth');

router.use(protect);

router.get('/', (req, res, next) => notificationController.getNotifications(req, res, next));
router.put('/:notificationId/read', (req, res, next) => notificationController.markAsRead(req, res, next));
router.put('/read-all', (req, res, next) => notificationController.markAllAsRead(req, res, next));

module.exports = router;
