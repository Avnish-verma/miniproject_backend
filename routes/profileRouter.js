const express = require('express');
const router = express.Router();
const userService = require('../src/services/userService');
const socialService = require('../src/services/socialService');
const mediaService = require('../src/services/mediaService');

router.get('/', async (req, res, next) => {
  try {
    const profile = await userService.getProfile(req.user.userId, req.user._id);
    res.status(200).json({ success: true, message: 'profile found', data: profile.user });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const updated = await userService.updateProfile(req.user._id, req.body);
    res.status(200).json({ success: true, message: 'profile updated', data: updated });
  } catch (error) {
    next(error);
  }
});

router.get('/upload-profile-pic', (req, res) => {
  const uploadInfo = mediaService.generateUploadSignature('avatars', 'profile', req.user.userId);
  req.uploadInfo = uploadInfo;
  res.status(200).json({ success: true, message: 'upload info', data: uploadInfo, uploadInfo });
});

router.put('/update-profile-pic', async (req, res, next) => {
  try {
    const { url, public_id } = req.body;
    const user = await userService.updateAvatar(req.user._id, { url, public_id });
    res.status(200).json({ success: true, message: 'profile pic updated', data: { profilePic: user.profilePic } });
  } catch (error) {
    next(error);
  }
});

router.post('/follow/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const result = await socialService.toggleFollow(req.user._id, userId);
    res.status(200).json({ success: true, message: result.message, data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/user/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user ? req.user._id : null;
    const profile = await userService.getProfile(userId, currentUserId);
    res.status(200).json({ success: true, data: profile.user });
  } catch (error) {
    next(error);
  }
});

module.exports = router;