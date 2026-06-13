import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPasswordResetEmail(
  email: string,
  token: string
) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;

  await transporter.sendMail({
    from: `"Spammer Listings" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Reset your Spammer Listings password",
    html: `
      <div style="max-width: 480px; margin: 0 auto; padding: 32px 24px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #dc2626; font-size: 24px; margin: 0;">Spammer Listings</h1>
        </div>
        <h2 style="font-size: 18px; margin-bottom: 16px;">Reset Your Password</h2>
        <p style="color: #555; line-height: 1.6; margin-bottom: 24px;">
          You requested a password reset. Click the button below to set a new password. 
          This link expires in 1 hour.
        </p>
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${resetUrl}" 
             style="display: inline-block; background-color: #dc2626; color: white; 
                    padding: 12px 32px; border-radius: 6px; text-decoration: none; 
                    font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p style="color: #999; font-size: 12px; line-height: 1.4;">
          If you didn't request this, you can safely ignore this email.
          <br>
          Your password won't change unless you click the link and create a new one.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
        <p style="color: #999; font-size: 11px; text-align: center;">
          Spammer Listings — Community-Driven Spam Reporting
        </p>
      </div>
    `,
  });
}