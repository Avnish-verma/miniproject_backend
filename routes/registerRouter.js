const express = require('express');
const router = express.Router();
const authService = require('../src/services/authService');

router.post('/', async (req, res, next) => {
  try {
    const { fullname, userId, password, emailId } = req.body;
    if (!fullname || !emailId || !password || !userId) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const result = await authService.register({ fullname, userId, password, emailId });
    res.status(201).json({
      success: true,
      message: result.message || 'User registered successfully',
      data: {
        userId: result.userId,
        emailId: result.emailId,
        ...(result.devOtp ? { devOtp: result.devOtp } : {}),
      },
    });
  } catch (error) {
    if (error.statusCode === 409 || error.code === 'DUPLICATE_KEY_ERROR') {
      return res.status(409).json({ success: false, message: error.message });
    }
    if (error.statusCode === 400 || error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
});

const handleVerify = async (req, res, next) => {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp) {
      return res.status(400).json({ success: false, message: 'userId and otp are required' });
    }

    const result = await authService.verifyOtp({ userId, otp });
    if (result.accessToken) {
      res.cookie('token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      token: result.accessToken,
      accessToken: result.accessToken,
      user: result.user,
      data: result,
    });
  } catch (error) {
    if (error.statusCode === 400 || error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

router.post('/verify', handleVerify);
router.post('/verify-otp', handleVerify);

module.exports = router;
