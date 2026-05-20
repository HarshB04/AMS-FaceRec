const nodemailer = require("nodemailer");

/**
 * Lazy transporter — only created when first email is sent.
 * Falls back gracefully if SMTP is not configured (just logs a warning).
 */
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn(
      "[emailService] SMTP not configured — approval emails will be skipped. " +
      "Set SMTP_HOST, SMTP_USER, SMTP_PASS in backend/.env to enable them."
    );
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT || "587", 10),
    secure: parseInt(SMTP_PORT || "587", 10) === 465,  // true for port 465 (SSL), false for 587 (TLS)
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return transporter;
}

const FROM_NAME  = process.env.SMTP_FROM_NAME  || "SunnyAttend";
const FROM_EMAIL = process.env.SMTP_USER        || "noreply@sunnyattend.com";

/**
 * Send the account-approved email.
 * @param {object} opts
 * @param {string} opts.to        — recipient email
 * @param {string} opts.name      — recipient display name
 * @param {string} opts.sbrn      — Student Board Roll Number (login ID)
 */
async function sendApprovalEmail({ to, name, sbrn }) {
  const transport = getTransporter();
  if (!transport) return;  // SMTP not configured — skip silently

  const firstName = (name || "Student").split(" ")[0];

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Account Approved — SunnyAttend</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:32px 40px;text-align:center;">
              <div style="display:inline-flex;align-items:center;gap:10px;">
                <div style="width:36px;height:36px;background:rgba(255,255,255,0.2);border-radius:8px;display:inline-flex;align-items:center;justify-content:center;">
                  ☀️
                </div>
                <span style="color:#fff;font-size:20px;font-weight:700;vertical-align:middle;">SunnyAttend</span>
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <!-- Success icon -->
              <div style="text-align:center;margin-bottom:24px;">
                <div style="width:64px;height:64px;background:#d1fae5;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:32px;">✅</div>
              </div>

              <h1 style="font-size:22px;font-weight:700;color:#0f172a;margin:0 0 8px;text-align:center;">
                Your account has been approved!
              </h1>
              <p style="font-size:14px;color:#64748b;text-align:center;margin:0 0 32px;">
                Welcome to SunnyAttend, ${firstName}. You can now sign in to your student dashboard.
              </p>

              <!-- SBRN callout -->
              <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px;margin-bottom:32px;">
                <p style="font-size:12px;font-weight:600;color:#1d4ed8;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.05em;">
                  Your Login ID (Student Board Roll No)
                </p>
                <p style="font-size:28px;font-weight:700;color:#1e3a8a;margin:0;font-family:monospace;letter-spacing:0.1em;">
                  ${sbrn || "See your enrollment details"}
                </p>
                <p style="font-size:12px;color:#3b82f6;margin:8px 0 0;">
                  Use this SBRN together with your password to sign in.
                </p>
              </div>

              <!-- Steps -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr><td style="padding-bottom:12px;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="width:28px;height:28px;background:#dbeafe;border-radius:50%;text-align:center;font-size:12px;font-weight:700;color:#1d4ed8;vertical-align:middle;">1</td>
                      <td style="padding-left:12px;font-size:14px;color:#334155;vertical-align:middle;">Go to the <strong>Student Login</strong> page</td>
                    </tr>
                  </table>
                </td></tr>
                <tr><td style="padding-bottom:12px;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="width:28px;height:28px;background:#dbeafe;border-radius:50%;text-align:center;font-size:12px;font-weight:700;color:#1d4ed8;vertical-align:middle;">2</td>
                      <td style="padding-left:12px;font-size:14px;color:#334155;vertical-align:middle;">Enter your <strong>SBRN</strong> and <strong>password</strong></td>
                    </tr>
                  </table>
                </td></tr>
                <tr><td>
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="width:28px;height:28px;background:#dbeafe;border-radius:50%;text-align:center;font-size:12px;font-weight:700;color:#1d4ed8;vertical-align:middle;">3</td>
                      <td style="padding-left:12px;font-size:14px;color:#334155;vertical-align:middle;">Access your dashboard and track your attendance</td>
                    </tr>
                  </table>
                </td></tr>
              </table>

              <!-- CTA -->
              <div style="text-align:center;">
                <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/login"
                   style="display:inline-block;background:#2563eb;color:#fff;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:600;text-decoration:none;">
                  Sign In Now →
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
              <p style="font-size:12px;color:#94a3b8;margin:0;">
                This email was sent by SunnyAttend. If you did not register, please ignore this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  try {
    await transport.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject: "✅ Your SunnyAttend account has been approved!",
      html,
      text:
        `Hi ${firstName},\n\n` +
        `Your SunnyAttend account has been approved!\n\n` +
        `Your Login ID (SBRN): ${sbrn || "Check your enrollment details"}\n\n` +
        `Sign in at: ${process.env.FRONTEND_URL || "http://localhost:5173"}/login\n\n` +
        `— SunnyAttend`,
    });
    console.log(`[emailService] Approval email sent to ${to}`);
  } catch (err) {
    // Non-fatal — the account is approved regardless. Log and continue.
    console.error(`[emailService] Failed to send approval email to ${to}:`, err.message);
  }
}

/**
 * Send the account-rejected email.
 * @param {object} opts
 * @param {string} opts.to    — recipient email
 * @param {string} opts.name  — recipient display name
 */
async function sendRejectionEmail({ to, name }) {
  const transport = getTransporter();
  if (!transport) return;

  const firstName = (name || "Student").split(" ")[0];

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>Registration Update — SunnyAttend</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:32px 40px;text-align:center;">
            <span style="color:#fff;font-size:20px;font-weight:700;">☀️ SunnyAttend</span>
          </td>
        </tr>
        <tr><td style="padding:40px;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="width:64px;height:64px;background:#fee2e2;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:32px;">❌</div>
          </div>
          <h1 style="font-size:22px;font-weight:700;color:#0f172a;margin:0 0 8px;text-align:center;">Registration Not Approved</h1>
          <p style="font-size:14px;color:#64748b;text-align:center;margin:0 0 24px;">
            Hi ${firstName}, unfortunately your registration request for SunnyAttend was not approved at this time.
          </p>
          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:20px;margin-bottom:32px;">
            <p style="font-size:14px;color:#7f1d1d;margin:0;">
              If you believe this is an error or would like more information, please contact your institution's administrator directly.
            </p>
          </div>
        </td></tr>
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
            <p style="font-size:12px;color:#94a3b8;margin:0;">© 2026 SunnyAttend</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
  `.trim();

  try {
    await transport.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject: "Update on your SunnyAttend registration request",
      html,
      text:
        `Hi ${firstName},\n\n` +
        `Unfortunately your registration request for SunnyAttend was not approved at this time.\n\n` +
        `If you believe this is an error, please contact your institution's administrator.\n\n` +
        `— SunnyAttend`,
    });
    console.log(`[emailService] Rejection email sent to ${to}`);
  } catch (err) {
    console.error(`[emailService] Failed to send rejection email to ${to}:`, err.message);
  }
}

module.exports = { sendApprovalEmail, sendRejectionEmail };
