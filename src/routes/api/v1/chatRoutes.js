const express = require('express');
const router = express.Router();
const chatController = require('../../../controllers/chatController');
const { protect } = require('../../../middleware/auth');

router.use(protect); // All chat routes require authentication

router.get('/conversations', (req, res, next) => chatController.getConversations(req, res, next));
router.post('/conversations', (req, res, next) => chatController.getOrCreateConversation(req, res, next));
router.post('/conversations/:targetId', (req, res, next) => chatController.getOrCreateConversation(req, res, next));
router.get('/messages/:conversationId', (req, res, next) => chatController.getMessages(req, res, next));
router.post('/messages/:conversationId', (req, res, next) => chatController.sendMessage(req, res, next));
router.put('/messages/:conversationId/read', (req, res, next) => chatController.markAsRead(req, res, next));

module.exports = router;
