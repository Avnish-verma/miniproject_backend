const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const socialRoutes = require('./socialRoutes');
const postRoutes = require('./postRoutes');
const feedRoutes = require('./feedRoutes');
const chatRoutes = require('./chatRoutes');
const callRoutes = require('./callRoutes');
const notificationRoutes = require('./notificationRoutes');
const mediaRoutes = require('./mediaRoutes');
const storyRoutes = require('./storyRoutes');
const pushRoutes = require('./pushRoutes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/social', socialRoutes);
router.use('/posts', postRoutes);
router.use('/feed', feedRoutes);
router.use('/chat', chatRoutes);
router.use('/calls', callRoutes);
router.use('/notifications', notificationRoutes);
router.use('/media', mediaRoutes);
router.use('/stories', storyRoutes);
router.use('/push', pushRoutes);

// Health check endpoint
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'online',
    platform: 'ShiftAura Social Communication Platform',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
