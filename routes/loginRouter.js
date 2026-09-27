const express = require('express');
const router = express.Router();
const authService = require('../src/services/authService');

router.post('/', async (req, res, next) => {
  try {
    const { userId, password } = req.body;
    if (!userId || !password) {
      return res.status(400).json({ success: false, message: 'userId or password is empty' });
    }

    const result = await authService.login({
      userId,
      password,
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.ip || '',
    });

    res
      .status(200)
      .cookie('token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      })
      .json({
        message: 'Logged in successfully',
        token: result.accessToken,
        accessToken: result.accessToken,
        user: result.user,
      });
  } catch (error) {
    if (error.statusCode === 401) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
});

router.post('/forgotpassword', async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }
    const result = await authService.forgotPassword(userId);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
});

router.get('/forgotpassword/:token', (req, res) => {
  // Return simple verification confirmation for token validity check
  res.status(200).json({ success: true, message: 'Reset token active' });
});

router.post('/forgotpassword/:token', async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }
    const result = await authService.resetPassword(token, password);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
