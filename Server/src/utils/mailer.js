// src/utils/mailer.js
// Nodemailer with Google OAuth2 — no App Password needed
// Reads: EMAIL_USER, CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN from .env

const nodemailer = require('nodemailer');

// ─── OAuth2 Transporter ───────────────────────────────────────────────────────
// Uses the Google OAuth2 token flow instead of a plain password.
// The REFRESH_TOKEN is used to automatically get a fresh ACCESS_TOKEN on each send.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type:         'OAuth2',
    user:         process.env.EMAIL_USER,
    clientId:     process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// ─── Verify connection on startup ────────────────────────────────────────────
transporter.verify((error) => {
  if (error) {
    console.warn('⚠️  Mailer: OAuth2 connection failed —', error.message);
  } else {
    console.log('✅ Mailer: Gmail OAuth2 ready →', process.env.EMAIL_USER);
  }
});

// ─── sendWelcomeEmail ─────────────────────────────────────────────────────────
// Sends a welcome email to a newly created user with their system credentials.
// Called by: users.controller.js → createUser
//
// @param {object} opts
//   opts.to          – recipient email address
//   opts.name        – recipient's full name
//   opts.loginId     – auto-generated Login ID e.g. OIJODO20260001
//   opts.password    – plain-text one-time password (generated once)
//   opts.role        – user role string e.g. 'EMPLOYEE'
//   opts.companyName – company name for email branding
const sendWelcomeEmail = async ({ to, name, loginId, password, role, companyName }) => {
  const roleLabel = {
    EMPLOYEE:        'Employee',
    HR_OFFICER:      'HR Officer',
    PAYROLL_OFFICER: 'Payroll Officer',
    ADMIN:           'Administrator',
  }[role] || role;

  const fromName = process.env.MAIL_FROM_NAME || 'EmPay HR';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to EmPay</title>
</head>
<body style="margin:0;padding:0;background-color:#0f0f1a;font-family:'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f1a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
               style="background-color:#161628;border-radius:16px;overflow:hidden;
                      border:1px solid rgba(124,58,237,0.25);
                      box-shadow:0 8px 40px rgba(0,0,0,0.6);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);
                        padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:11px;letter-spacing:4px;
                         color:rgba(255,255,255,0.6);text-transform:uppercase;
                         margin-bottom:8px;">
                ${companyName || 'Your Company'}
              </p>
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;
                          letter-spacing:-0.5px;">
                Em<span style="color:#c4b5fd;">Pay</span>
              </h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">
                Smart HR Management System
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 6px;color:#a78bfa;font-size:12px;
                          font-weight:600;text-transform:uppercase;letter-spacing:2px;">
                Welcome Aboard
              </p>
              <h2 style="margin:0 0 20px;color:#f1f5f9;font-size:22px;font-weight:600;">
                Hello, ${name}! 👋
              </h2>
              <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.7;">
                Your <strong style="color:#e2e8f0;">${roleLabel}</strong> account has been
                created on <strong style="color:#e2e8f0;">EmPay</strong>.
                Below are your login credentials — please keep them safe.
              </p>

              <!-- Credentials Card -->
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background-color:#1e1e38;border-radius:12px;
                            border:1px solid rgba(124,58,237,0.2);margin-bottom:28px;">
                <tr>
                  <td style="padding:28px;">
                    <p style="margin:0 0 4px;color:#6b7280;font-size:11px;
                                font-weight:600;text-transform:uppercase;letter-spacing:1.5px;">
                      Login ID
                    </p>
                    <p style="margin:0 0 20px;color:#a78bfa;font-size:24px;
                                font-weight:700;letter-spacing:3px;font-family:monospace;">
                      ${loginId}
                    </p>

                    <p style="margin:0 0 4px;color:#6b7280;font-size:11px;
                                font-weight:600;text-transform:uppercase;letter-spacing:1.5px;">
                      Temporary Password
                    </p>
                    <p style="margin:0;color:#f1f5f9;font-size:20px;font-weight:700;
                                letter-spacing:2px;font-family:monospace;
                                background:rgba(124,58,237,0.12);padding:10px 14px;
                                border-radius:8px;border:1px solid rgba(124,58,237,0.2);
                                display:inline-block;">
                      ${password}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Warning -->
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background-color:rgba(239,68,68,0.08);border-radius:10px;
                            border:1px solid rgba(239,68,68,0.25);margin-bottom:28px;">
                <tr>
                  <td style="padding:14px 18px;">
                    <p style="margin:0;color:#fca5a5;font-size:13px;line-height:1.6;">
                      ⚠️ <strong>Action Required:</strong> You will be prompted to change
                      this password on your first login. Do not share it with anyone.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;color:#94a3b8;font-size:14px;line-height:1.6;">
                Sign in using your <strong style="color:#e2e8f0;">Login ID</strong> or
                <strong style="color:#e2e8f0;">email address</strong> at:
              </p>
              <p style="margin:0;color:#a78bfa;font-size:14px;font-weight:600;">
                🔗 http://localhost:5173/login
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);
                        text-align:center;">
              <p style="margin:0;color:#374151;font-size:12px;line-height:1.6;">
                This is an automated email from
                <strong style="color:#6b7280;">EmPay HRMS</strong>.
                Please do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;

  await transporter.sendMail({
    from:    `"${fromName}" <${process.env.EMAIL_USER}>`,
    to,
    subject: `🎉 Welcome to EmPay — Your Login Credentials`,
    html,
    text: `
Welcome to EmPay, ${name}!

Your ${roleLabel} account has been created.

  Login ID : ${loginId}
  Password : ${password}

IMPORTANT: Change your password on first login.
Login at  : http://localhost:5173/login

— EmPay HR Team
    `.trim(),
  });
};

module.exports = { sendWelcomeEmail };
