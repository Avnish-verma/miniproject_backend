const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('./logger');

let transporter = null;

if (env.EMAIL && env.PASS) {
  const isGmail = env.EMAIL.endsWith('@gmail.com') || (env.SMTP_HOST && env.SMTP_HOST.includes('gmail'));

  const transportConfig = isGmail
    ? {
        service: 'gmail',
        auth: {
          user: env.EMAIL,
          pass: env.PASS,
        },
        tls: {
          rejectUnauthorized: false,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
      }
    : {
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.EMAIL,
          pass: env.PASS,
        },
        tls: {
          rejectUnauthorized: false,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
      };

  transporter = nodemailer.createTransport(transportConfig);
} else {
  logger.warn('[Mailer] SMTP credentials not fully configured. Emails will be logged to console in development mode.');
}

// Support HTTP REST APIs (Resend, Brevo) which run over HTTPS port 443 and are NEVER blocked by cloud hosts
const sendMailViaHttp = async (userEmail, subject, htmlContent) => {
  // 1. Resend API (https://resend.com - free 3000 emails/month, 100/day)
  if (process.env.RESEND_API_KEY) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || 'NOVA <onboarding@resend.dev>',
        to: [userEmail],
        subject: subject,
        html: htmlContent,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(`Resend error (${res.status}): ${JSON.stringify(data)}`);
    }
    return { messageId: data.id, provider: 'Resend (HTTP Port 443)' };
  }

  // 2. Brevo API (https://brevo.com - free 300 emails/day)
  if (process.env.BREVO_API_KEY) {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY.trim(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'NOVA Platform', email: env.EMAIL || 'noreply@shiftaura.in' },
        to: [{ email: userEmail }],
        subject: subject,
        htmlContent: htmlContent,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(`Brevo error (${res.status}): ${JSON.stringify(data)}`);
    }
    return { messageId: data.messageId, provider: 'Brevo (HTTP Port 443)' };
  }

  return null;
};

const sendMail = async (userName, userEmail, subject, htmlContent) => {
  try {
    // 1. First priority: HTTP API if configured (bypasses Render/AWS SMTP port blocks)
    if (process.env.RESEND_API_KEY || process.env.BREVO_API_KEY) {
      const httpResult = await sendMailViaHttp(userEmail, subject, htmlContent);
      if (httpResult) {
        logger.info(`[Mailer] Email sent successfully via ${httpResult.provider} to ${userEmail}: ${httpResult.messageId}`);
        return httpResult;
      }
    }

    // 2. Second priority: Nodemailer SMTP
    if (transporter) {
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
      logger.info(`[Mailer] Email sent successfully via SMTP to ${userEmail}: ${info.messageId}`);
      return info;
    }

    // 3. Stub fallback
    logger.info(`[Mailer Stub] Email to ${userEmail} (${userName}) | Subject: "${subject}"`);
    logger.info(`[Mailer Content] ${htmlContent.replace(/<[^>]*>?/gm, ' ').trim()}`);
    return { messageId: 'stub-' + Date.now() };
  } catch (error) {
    logger.error(`[Mailer Error] Failed to send email to ${userEmail}: ${error.message}`);
    return null;
  }
};

module.exports = sendMail;
