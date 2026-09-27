const { Resend } = require('resend');
const env = require('../config/env');
const logger = require('./logger');

let resend = null;
const apiKey = env.RESEND_API_KEY || process.env.RESEND_API_KEY;

if (apiKey) {
  resend = new Resend(apiKey);
  logger.info('[Mailer] Resend email service initialized successfully');
} else {
  logger.warn('[Mailer] RESEND_API_KEY not configured. Console / stub delivery will be used.');
}

/**
 * Send transactional email via Resend
 * @param {string} userName
 * @param {string} userEmail
 * @param {string} subject
 * @param {string} htmlContent
 */
const sendMail = async (userName, userEmail, subject, htmlContent) => {
  const fromAddress = env.RESEND_FROM || process.env.RESEND_FROM || 'ShiftAura <noreply@social.shiftaura.in>';

  const brandedTemplate = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px; background-color: #0B0F19; color: #F9FAFB; border-radius: 12px; border: 1px solid #1F2937;">
      <div style="margin-bottom: 24px; text-align: center;">
        <h1 style="color: #6366F1; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">ShiftAura</h1>
        <p style="color: #9CA3AF; font-size: 13px; margin: 4px 0 0; letter-spacing: 0.5px;">Social Communication Platform</p>
      </div>
      <div style="padding: 24px; background-color: #111827; border: 1px solid #1F2937; border-radius: 8px;">
        <h2 style="font-size: 18px; margin-top: 0; color: #FFFFFF; font-weight: 600;">Hello ${userName || 'there'},</h2>
        <div style="color: #D1D5DB; line-height: 1.6; font-size: 14px;">${htmlContent}</div>
      </div>
      <p style="font-size: 12px; color: #6B7280; margin-top: 24px; text-align: center;">
        Sent securely by ShiftAura Social Communication Platform.
      </p>
    </div>
  `;

  try {
    const activeKey = env.RESEND_API_KEY || process.env.RESEND_API_KEY;
    if (activeKey) {
      const client = resend || new Resend(activeKey);

      logger.info(`[Mailer Resend] Dispatching email to ${userEmail} via Resend (from: ${fromAddress})...`);

      const response = await client.emails.send({
        from: fromAddress,
        to: [userEmail],
        subject: subject,
        html: brandedTemplate,
      });

      if (response.error) {
        logger.error(`[Mailer Resend Error] ${response.error.message || JSON.stringify(response.error)}`);

        // If domain is not yet verified or error occurs with custom domain, fallback to onboarding@resend.dev
        if (!fromAddress.includes('resend.dev')) {
          logger.info('[Mailer Resend] Attempting delivery with fallback sender onboarding@resend.dev...');
          const retryRes = await client.emails.send({
            from: 'ShiftAura <onboarding@resend.dev>',
            to: [userEmail],
            subject: subject,
            html: brandedTemplate,
          });
          if (!retryRes.error) {
            logger.info(`[Mailer Resend] Email delivered via onboarding@resend.dev: ${retryRes.data?.id}`);
            return { messageId: retryRes.data?.id, provider: 'resend' };
          }
        }
        return null;
      }

      logger.info(`[Mailer Resend] Email delivered successfully to ${userEmail}: ${response.data?.id}`);
      return { messageId: response.data?.id, provider: 'resend' };
    }

    // Console stub when no API key configured
    logger.info(`[Mailer Stub] Email to ${userEmail} (${userName}) | Subject: "${subject}"`);
    logger.info(`[Mailer Content] ${htmlContent.replace(/<[^>]*>?/gm, ' ').trim()}`);
    return { messageId: 'stub-' + Date.now(), provider: 'stub' };
  } catch (error) {
    logger.error(`[Mailer Resend Exception] ${error.message}`);
    return null;
  }
};

module.exports = sendMail;
