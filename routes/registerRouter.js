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
    });
  } catch (error) {
    if (error.statusCode === 409) {
      return res.status(409).json({ success: false, message: error.message });
    }
    next(error);
  }
});

router.post('/verify', async (req, res, next) => {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp) {
      return res.status(400).json({ success: false, message: 'userId and otp are required' });
    }

    const result = await authService.verifyOtp({ userId, otp });
    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: result,
    });
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
});

module.exports = router;