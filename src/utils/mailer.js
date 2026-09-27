const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('./logger');

let transporter = null;

if (env.EMAIL && env.PASS) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.EMAIL,
      pass: env.PASS,
    },
  });
} else {
  logger.warn('[Mailer] SMTP credentials not fully configured. Emails will be logged to console in development mode.');
}

const sendMail = async (userName, userEmail, subject, htmlContent) => {
  try {
    if (!transporter) {
      logger.info(`[Mailer Stub] Email to ${userEmail} (${userName}) | Subject: "${subject}"`);
      logger.info(`[Mailer Content] ${htmlContent.replace(/<[^>]*>?/gm, ' ').trim()}`);
      return { messageId: 'stub-' + Date.now() };
    }

    const mailOptions = {
      from: `"NOVA Platform" <${env.EMAIL}>`,
      to: userEmail,
      subject: subject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; background-color: #0B0F19; color: #F9FAFB; border-radius: 8px;">
          <div style="margin-bottom: 20px;">
            <h1 style="color: #6366F1; margin: 0; font-size: 24px; letter-spacing: -0.5px;">NOVA</h1>
          </div>
          <div style="padding: 20px; background-color: #111827; border: 1px solid #1F2937; border-radius: 6px;">
            <h2 style="font-size: 18px; margin-top: 0; color: #FFFFFF;">Hello ${userName || 'there'},</h2>
            <div style="color: #D1D5DB; line-height: 1.6;">${htmlContent}</div>
          </div>
          <p style="font-size: 12px; color: #6B7280; margin-top: 20px; text-align: center;">
            Sent securely by NOVA Real-Time Communication Platform.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`[Mailer] Email sent successfully to ${userEmail}: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`[Mailer Error] Failed to send email to ${userEmail}: ${error.message}`);
    // Do not crash server if email fails; log and return null
    return null;
  }
};

module.exports = sendMail;
