import nodemailer from 'nodemailer';

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false  // ← add this line
    }
  });
};

/**
 * Send OTP verification email
 * @param {string} to - Recipient email address
 * @param {string} otp - The 6-digit OTP
 * @param {string} name - Recipient's name
 */
export const sendOTPEmail = async (to, otp, name = 'User') => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"Medical Booking" <${process.env.EMAIL_FROM}>`,
    to,
    subject: 'Verify Your Email - Medical Booking',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Email Verification</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Thank you for registering with Medical Booking. Use the OTP below to verify your email address:</p>
        <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1e40af;">${otp}</span>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.
        </p>
        <p style="color: #6b7280; font-size: 14px;">
          If you did not create an account, please ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          © ${new Date().getFullYear()} Medical Booking. All rights reserved.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Send password reset OTP email
 */
export const sendPasswordResetOTPEmail = async (to, otp, name = 'User') => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"Medical Booking" <${process.env.EMAIL_FROM}>`,
    to,
    subject: 'Reset your password - Medical Booking',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Password reset</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>We received a request to reset your password. Use the code below:</p>
        <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1e40af;">${otp}</span>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          This code is valid for <strong>10 minutes</strong>. If you did not request a reset, ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          © ${new Date().getFullYear()} Medical Booking. All rights reserved.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Generic email sender
 */
export const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"Medical Booking" <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    html,
  });
};
