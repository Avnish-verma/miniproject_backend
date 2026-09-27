const express = require('express');
const router = express.Router();
const protect = require('../controller/protect');
const postService = require('../src/services/postService');
const mediaService = require('../src/services/mediaService');

router.get('/upload-post', (req, res) => {
  const userId = req.user ? req.user.userId : 'legacy_user';
  const uploadInfo = mediaService.generateUploadSignature('posts', 'post', userId);
  req.uploadInfo = uploadInfo;
  res.status(200).json({ success: true, message: 'upload info', data: uploadInfo, uploadInfo });
});

router.post('/create-post', protect, async (req, res, next) => {
  try {
    const post = await postService.createPost(req.user._id, req.body);
    res.status(201).json({ success: true, message: 'Post created', data: post });
  } catch (error) {
    next(error);
  }
});

router.post('/like/:postId', protect, async (req, res, next) => {
  try {
    const { postId } = req.params;
    const result = await postService.toggleLike(postId, req.user._id);
    res.status(200).json({
      success: true,
      message: result.isLiked ? 'Post liked' : 'Post unliked',
      data: result.post,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/comment/:postId', protect, async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;
    const comment = await postService.addComment(postId, req.user._id, { text });
    res.status(201).json({ success: true, message: 'Comment added successfully', data: comment });
  } catch (error) {
    next(error);
  }
});

router.get('/comments/:postId', async (req, res, next) => {
  try {
    const { postId } = req.params;
    const result = await postService.getComments(postId, { page: 1, limit: 100 });
    res.status(200).json({ success: true, data: result.comments });
  } catch (error) {
    next(error);
  }
});

module.exports = router;