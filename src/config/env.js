require('dotenv').config();

const env = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI || process.env.URI || 'mongodb://127.0.0.1:27017/nova',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || process.env.SECRET || 'nova_default_super_secret_access_key',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || process.env.SECRET_FOR_FORGOT || 'nova_default_refresh_secret_key',
  JWT_FORGOT_SECRET: process.env.SECRET_FOR_FORGOT || 'nova_forgot_password_secret_key',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Cloudinary
  CLOUDINARY_CLOUD_NAME: (process.env.CLOUDINARY_CLOUD_NAME || '').trim(),
  CLOUDINARY_API_KEY: (process.env.CLOUDINARY_API_KEY || '').trim(),
  CLOUDINARY_API_SECRET: (process.env.CLOUDINARY_API_SECRET || '').trim(),
  
  // Resend Email Service
  RESEND_API_KEY: (process.env.RESEND_API_KEY || '').trim(),
  RESEND_FROM: (process.env.RESEND_FROM || 'ShiftAura <noreply@social.shiftaura.in>').trim(),

  // Email / SMTP Fallback
  EMAIL: process.env.EMAIL || '',
  PASS: process.env.PASS || '',
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
  
  // WebRTC STUN/TURN
  STUN_SERVER: process.env.STUN_SERVER || 'stun:stun.l.google.com:19302',
  TURN_SERVER: process.env.TURN_SERVER || '',
  TURN_USERNAME: process.env.TURN_USERNAME || '',
  TURN_PASSWORD: process.env.TURN_PASSWORD || '',
  
  API_BASE_URL: process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`
};

module.exports = env;
