const { z } = require('zod');

const registerSchema = z.object({
  fullname: z.string().min(2, 'Full name must be at least 2 characters').max(50),
  userId: z.string().min(3, 'Username must be at least 3 characters').max(30).regex(/^[a-zA-Z0-9_.]+$/, 'Username can only contain letters, numbers, underscores, and dots'),
  emailId: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
});

const loginSchema = z.object({
  userId: z.string().min(1, 'Username or Email is required'),
  password: z.string().min(1, 'Password is required'),
});

const verifyOtpSchema = z.object({
  userId: z.string().min(1, 'Username is required'),
  otp: z.union([z.number(), z.string().regex(/^\d+$/)]).transform((v) => Number(v)),
});

const forgotPasswordSchema = z.object({
  userId: z.string().min(1, 'Username or Email is required'),
});

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'New password must be at least 6 characters').max(100),
});

module.exports = {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
