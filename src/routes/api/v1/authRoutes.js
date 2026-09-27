const express = require('express');
const router = express.Router();
const authController = require('../../../controllers/authController');
const { protect } = require('../../../middleware/auth');
const { authLimiter } = require('../../../middleware/rateLimiter');
const validate = require('../../../middleware/validate');
const {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../../../validators/authValidators');

router.post('/register', authLimiter, validate(registerSchema), (req, res, next) => authController.register(req, res, next));
router.post('/verify-otp', authLimiter, validate(verifyOtpSchema), (req, res, next) => authController.verifyOtp(req, res, next));
router.post('/verify', authLimiter, validate(verifyOtpSchema), (req, res, next) => authController.verifyOtp(req, res, next));
router.post('/login', authLimiter, validate(loginSchema), (req, res, next) => authController.login(req, res, next));
router.post('/refresh-token', (req, res, next) => authController.refreshToken(req, res, next));
router.post('/logout', protect, (req, res, next) => authController.logout(req, res, next));
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), (req, res, next) => authController.forgotPassword(req, res, next));
router.post('/reset-password/:token', authLimiter, validate(resetPasswordSchema), (req, res, next) => authController.resetPassword(req, res, next));
router.get('/me', protect, (req, res, next) => authController.getMe(req, res, next));

module.exports = router;
