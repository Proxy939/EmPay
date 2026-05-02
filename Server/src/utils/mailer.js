// src/utils/mailer.js — Nodemailer + Gmail OAuth2
const nodemailer = require('nodemailer');
const { google }  = require('googleapis');

const OAuth2 = google.auth.OAuth2;

// Build a fresh access token each time (OAuth2 tokens expire)
async function createTransporter() {
  const oauth2Client = new OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );

  oauth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

  const { token: accessToken } = await oauth2Client.getAccessToken();

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type:         'OAuth2',
      user:         process.env.EMAIL_USER,
      clientId:     process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken: process.env.REFRESH_TOKEN,
      accessToken,
    },
  });
}

// ─── Send Welcome / Credentials Email ────────────────────────────────────────
async function sendWelcomeEmail({ to, name, loginId, password, companyName }) {
  try {
    const transporter = await createTransporter();

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" />
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
         background:#f5f5f8; margin:0; padding:24px; }
  .card { background:#fff; border-radius:12px; max-width:480px;
          margin:0 auto; padding:36px; box-shadow:0 1px 4px rgba(0,0,0,.08); }
  .logo { font-size:22px; font-weight:800; color:#6C5CE7; margin-bottom:24px; }
  h1   { font-size:20px; color:#2d3436; margin:0 0 8px; }
  p    { color:#636e72; font-size:14px; line-height:1.6; margin:0 0 16px; }
  .box { background:#f0eeff; border-radius:10px; padding:16px 20px;
         margin:12px 0; border-left:4px solid #6C5CE7; }
  .lbl { font-size:11px; color:#6C5CE7; font-weight:700;
         text-transform:uppercase; letter-spacing:.5px; margin-bottom:4px; }
  .val { font-size:18px; font-weight:700; color:#2d3436;
         font-family:monospace; letter-spacing:1px; }
  .warn { background:#fff5f5; border-radius:8px; padding:12px 16px;
          color:#d63031; font-size:12px; margin-top:16px; }
  .footer { margin-top:28px; font-size:12px; color:#b2bec3; text-align:center; }
</style>
</head>
<body>
  <div class="card">
    <div class="logo">⬡ EmPay</div>
    <h1>Welcome, ${name}! 👋</h1>
    <p>Your <strong>${companyName}</strong> account is ready. Use these credentials to log in.</p>
    <div class="box">
      <div class="lbl">Login ID</div>
      <div class="val">${loginId}</div>
    </div>
    <div class="box">
      <div class="lbl">Temporary Password</div>
      <div class="val">${password}</div>
    </div>
    <div class="warn">⚠️ You will be asked to change this password on first login. Do not share it.</div>
    <div class="footer">Automated message from EmPay HRMS · ${companyName}</div>
  </div>
</body>
</html>`;

    await transporter.sendMail({
      from:    `"${process.env.MAIL_FROM_NAME || 'EmPay HR'}" <${process.env.EMAIL_USER}>`,
      to,
      subject: `Welcome to ${companyName} — Your EmPay Login Credentials`,
      html,
    });

    console.log(`[Mailer] Welcome email sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error('[Mailer] Failed to send email:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { sendWelcomeEmail };
