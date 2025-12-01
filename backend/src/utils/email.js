const nodemailer = require('nodemailer');

let transporter;

const getTransporter = () => {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE, SMTP_DEBUG } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error('SMTP configuration is incomplete');
  }

  const port = Number(SMTP_PORT) || 587;
  const secure = SMTP_SECURE ? SMTP_SECURE === 'true' : port === 465;

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    logger: SMTP_DEBUG === 'true',
    debug: SMTP_DEBUG === 'true',
  });

  return transporter;
};

exports.sendWishEmail = async ({ to, subject, html }) => {
  const mailer = getTransporter();

  let rawFrom = process.env.SMTP_FROM || process.env.SMTP_USER;
  if (!rawFrom) {
    throw new Error('SMTP_FROM or SMTP_USER must be defined');
  }

  // Some providers reject emojis, quotes or malformed display names.
  // Normalize: extract email, keep simple display name (optional), strip emojis.
  const emailMatch = rawFrom.match(/<([^>]+)>/);
  const address = emailMatch ? emailMatch[1].trim() : rawFrom.trim();

  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(address)) {
    throw new Error(`Invalid SMTP_FROM email address: ${address}`);
  }

  // Build cleaned display name if provided before <...>
  let displayName = '';
  if (emailMatch) {
    const namePart = rawFrom.split('<')[0].trim();
    if (namePart) {
      // Remove quotes and non-basic ASCII characters that may cause rejection
      displayName = namePart.replace(/["']/g, '').replace(/[\u{0080}-\u{FFFF}]/gu, '').trim();
    }
  }

  const fromValue = displayName ? `${displayName} <${address}>` : address;

  // Removed explicit envelope sender usage per request; using RFC5322 From only.

  // Provide a plain text fallback to improve deliverability
  const text = html
    .replace(/<\/?(div|h\d|p|strong|em|ul|li|br|span)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{2,}/g, '\n')
    .trim();

  const info = await mailer.sendMail({
    from: fromValue,
    to,
    subject,
    html,
    text,
    // Helpful headers for deliverability & classification
    headers: {
      'X-Entity-Ref-ID': Date.now().toString(),
      'X-Transactional': 'true',
      'Auto-Submitted': 'auto-generated',
      'X-Notification-Type': 'transactional',
    },
  });
  if (process.env.SMTP_DEBUG === 'true') {
    console.log('[email] Sent message id:', info.messageId);
    console.log('[email] Accepted:', info.accepted);
    console.log('[email] Rejected:', info.rejected);
    console.log('[email] Response:', info.response);
  }
};

exports.sendTestEmail = async (to) => {
  return exports.sendWishEmail({
    to,
    subject: 'SMTP Test - Secret Santa',
    html: '<p>If you see this, SMTP configuration works.</p>',
  });
};
