const nodemailer = require('nodemailer');

/**
 * Email Service — sends transactional emails via SMTP (Gmail / any provider).
 *
 * Setup:
 *   Set EMAIL_USER and EMAIL_PASS in your .env file.
 *   For Gmail, generate an App Password at:
 *   https://myaccount.google.com/apppasswords
 *
 * If EMAIL_USER is not configured, emails are silently skipped
 * (so the app works without email setup during development).
 */

// ─── Transport ────────────────────────────────────────────────────────────
// Lazily create the transporter so the app starts even without email config.
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null; // email not configured — skip silently
  }

  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return transporter;
}

// ─── Helper ───────────────────────────────────────────────────────────────
async function sendMail({ to, subject, html }) {
  const t = getTransporter();
  if (!t) {
    // Email not configured — log in dev, skip in prod
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Email skipped — not configured] To: ${to} | Subject: ${subject}`);
    }
    return;
  }

  try {
    await t.sendMail({
      from: `"CampusConnect" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    // Never throw — email failure should never crash the main request
    console.error('[EmailService] Failed to send email:', err.message);
  }
}

// ─── Email Templates ──────────────────────────────────────────────────────

/**
 * Notify a requester that their recovery request was ACCEPTED.
 */
async function sendRequestAcceptedEmail({ requesterEmail, requesterName, itemTitle, itemOwnerName }) {
  await sendMail({
    to: requesterEmail,
    subject: `✅ Recovery request accepted — "${itemTitle}"`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <div style="background: #2563eb; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: white; margin: 0; font-size: 22px;">CampusConnect</h1>
          <p style="color: #bfdbfe; margin: 8px 0 0; font-size: 13px;">Smart Campus Lost &amp; Found</p>
        </div>

        <h2 style="color: #166534; font-size: 18px; margin-bottom: 8px;">🎉 Good news, ${requesterName}!</h2>
        <p style="color: #374151; font-size: 14px; line-height: 1.6;">
          <strong>${itemOwnerName}</strong> has <strong style="color: #16a34a;">accepted</strong>
          your recovery request for:
        </p>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; font-size: 15px; font-weight: 600; color: #15803d;">📦 ${itemTitle}</p>
        </div>

        <p style="color: #374151; font-size: 14px; line-height: 1.6;">
          Please <strong>contact ${itemOwnerName}</strong> directly to arrange a handover on campus.
          You can view your request status at any time in the
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/requests" style="color: #2563eb;">Requests page</a>.
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          © ${new Date().getFullYear()} CampusConnect · You received this because you sent a recovery request.
        </p>
      </div>
    `,
  });
}

/**
 * Notify a requester that their recovery request was REJECTED.
 */
async function sendRequestRejectedEmail({ requesterEmail, requesterName, itemTitle }) {
  await sendMail({
    to: requesterEmail,
    subject: `❌ Recovery request rejected — "${itemTitle}"`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <div style="background: #2563eb; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: white; margin: 0; font-size: 22px;">CampusConnect</h1>
          <p style="color: #bfdbfe; margin: 8px 0 0; font-size: 13px;">Smart Campus Lost &amp; Found</p>
        </div>

        <h2 style="color: #991b1b; font-size: 18px; margin-bottom: 8px;">Update on your request, ${requesterName}</h2>
        <p style="color: #374151; font-size: 14px; line-height: 1.6;">
          Unfortunately, the reporter has <strong style="color: #dc2626;">rejected</strong>
          your recovery request for:
        </p>

        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; font-size: 15px; font-weight: 600; color: #b91c1c;">📦 ${itemTitle}</p>
        </div>

        <p style="color: #374151; font-size: 14px; line-height: 1.6;">
          This may mean the item belongs to someone else. You can continue
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/items" style="color: #2563eb;">browsing other items</a>
          on CampusConnect.
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          © ${new Date().getFullYear()} CampusConnect · You received this because you sent a recovery request.
        </p>
      </div>
    `,
  });
}

/**
 * Notify an item reporter that a new recovery request was received.
 */
async function sendNewRequestEmail({ ownerEmail, ownerName, requesterName, itemTitle, requestsUrl }) {
  await sendMail({
    to: ownerEmail,
    subject: `📬 New recovery request for "${itemTitle}"`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <div style="background: #2563eb; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: white; margin: 0; font-size: 22px;">CampusConnect</h1>
          <p style="color: #bfdbfe; margin: 8px 0 0; font-size: 13px;">Smart Campus Lost &amp; Found</p>
        </div>

        <h2 style="color: #1e3a5f; font-size: 18px; margin-bottom: 8px;">Hi ${ownerName}, someone sent a claim!</h2>
        <p style="color: #374151; font-size: 14px; line-height: 1.6;">
          <strong>${requesterName}</strong> has submitted a recovery request for your item:
        </p>

        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; font-size: 15px; font-weight: 600; color: #1d4ed8;">📦 ${itemTitle}</p>
        </div>

        <p style="color: #374151; font-size: 14px; line-height: 1.6;">
          Review their message and decide to <strong>accept</strong> or <strong>reject</strong> the claim.
        </p>

        <a href="${requestsUrl || (process.env.CLIENT_URL || 'http://localhost:5173') + '/requests'}"
           style="display: inline-block; background: #2563eb; color: white; text-decoration: none;
                  padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; margin-top: 8px;">
          View Request →
        </a>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          © ${new Date().getFullYear()} CampusConnect · You received this because you reported an item.
        </p>
      </div>
    `,
  });
}

module.exports = {
  sendRequestAcceptedEmail,
  sendRequestRejectedEmail,
  sendNewRequestEmail,
};
