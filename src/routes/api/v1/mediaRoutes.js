const express = require('express');
const router = express.Router();
const mediaController = require('../../../controllers/mediaController');
const { protect } = require('../../../middleware/auth');

// Generate upload parameters for post media
router.get('/upload-post', protect, mediaController.getUploadSignature('posts', 'post'));

// Generate upload parameters for profile pictures
router.get('/upload-avatar', protect, mediaController.getUploadSignature('avatars', 'avatar'));

// Generate upload parameters for cover pictures
router.get('/upload-cover', protect, mediaController.getUploadSignature('covers', 'cover'));

// Generate upload parameters for chat attachments
router.get('/upload-chat', protect, mediaController.getUploadSignature('chat', 'chat'));

// Generate upload parameters for stories
router.get('/upload-story', protect, mediaController.getUploadSignature('stories', 'story'));

module.exports = router;
