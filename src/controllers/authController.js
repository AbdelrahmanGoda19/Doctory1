import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { generateOTP, getOTPExpiry } from '../utils/otp.js';
import { sendOTPEmail, sendPasswordResetOTPEmail } from '../utils/email.js';
import { sendSuccess, sendError } from '../utils/response.js';

// ─── Register ────────────────────────────────────────────────────────────────
export const register = async (req, res) => {
  try {
    const { fullName, email, password, phone, gender, dateOfBirth } = req.body;

    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // If user exists but is not verified, resend OTP
      if (!existingUser.isVerified) {
        const otp = generateOTP();
        const otpExpire = getOTPExpiry();
        const hashedOTP = await bcrypt.hash(otp, 10);

        await User.findByIdAndUpdate(existingUser._id, {
          otp: hashedOTP,
          otpExpire,
        });

        await sendOTPEmail(email, otp, existingUser.fullName);
        return sendSuccess(res, 200, 'Account exists but is unverified. A new OTP has been sent to your email.');
      }
      return sendError(res, 409, 'An account with this email already exists.');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate OTP
    const otp = generateOTP();
    const otpExpire = getOTPExpiry();
    const hashedOTP = await bcrypt.hash(otp, 10);

    // Create user
    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      phone,
      gender,
      dateOfBirth,
      otp: hashedOTP,
      otpExpire,
      isVerified: false,
    });

    // Send OTP email
    await sendOTPEmail(email, otp, fullName);

    return sendSuccess(res, 201, 'Registration successful! Please check your email for the OTP verification code.', {
      userId: user._id,
      email: user.email,
    });
  } catch (error) {
    console.error('Register error:', error);
    return sendError(res, 500, 'Registration failed. Please try again.');
  }
};

// ─── Verify OTP ──────────────────────────────────────────────────────────────
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email }).select('+otp +otpExpire');
    if (!user) {
      return sendError(res, 404, 'No account found with this email address.');
    }

    if (user.isVerified) {
      return sendError(res, 400, 'This account is already verified.');
    }

    if (!user.otp || !user.otpExpire) {
      return sendError(res, 400, 'No OTP found. Please request a new one.');
    }

    // Check expiry
    if (new Date() > user.otpExpire) {
      return sendError(res, 400, 'OTP has expired. Please request a new one.');
    }

    // Verify OTP
    const isOTPValid = await bcrypt.compare(otp, user.otp);
    if (!isOTPValid) {
      return sendError(res, 400, 'Invalid OTP. Please check and try again.');
    }

    // Mark as verified and clear OTP
    await User.findByIdAndUpdate(user._id, {
      isVerified: true,
      otp: null,
      otpExpire: null,
    });

    return sendSuccess(res, 200, 'Email verified successfully! You can now log in.');
  } catch (error) {
    console.error('Verify OTP error:', error);
    return sendError(res, 500, 'Verification failed. Please try again.');
  }
};

// ─── Resend OTP ───────────────────────────────────────────────────────────────
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return sendError(res, 404, 'No account found with this email address.');
    }
    if (user.isVerified) {
      return sendError(res, 400, 'This account is already verified.');
    }

    const otp = generateOTP();
    const otpExpire = getOTPExpiry();
    const hashedOTP = await bcrypt.hash(otp, 10);

    await User.findByIdAndUpdate(user._id, { otp: hashedOTP, otpExpire });
    await sendOTPEmail(email, otp, user.fullName);

    return sendSuccess(res, 200, 'A new OTP has been sent to your email.');
  } catch (error) {
    console.error('Resend OTP error:', error);
    return sendError(res, 500, 'Failed to resend OTP. Please try again.');
  }
};

// ─── Login ───────────────────────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return sendError(res, 401, 'Invalid email or password.');
    }

    if (!user.isVerified) {
      return sendError(res, 403, 'Please verify your email before logging in.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return sendError(res, 401, 'Invalid email or password.');
    }

    // Sign JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return sendSuccess(res, 200, 'Login successful.', {
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        gender: user.gender,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return sendError(res, 500, 'Login failed. Please try again.');
  }
};

// ─── Get Current User (Protected) ───────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate('favoriteDoctors', 'fullName specialty rating image_profile');
    if (!user) {
      return sendError(res, 404, 'User not found.');
    }
    return sendSuccess(res, 200, 'Profile fetched successfully.', { user });
  } catch (error) {
    console.error('Get me error:', error);
    return sendError(res, 500, 'Failed to fetch profile.');
  }
};

// ─── Forgot password (patient / admin — User model) ──────────────────────────

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return sendError(res, 404, 'No account found with this email address.');
    }

    if (user.role === 'doctor') {
      return sendError(res, 404, 'No account found with this email address.');
    }

    if (!user.isVerified) {
      return sendError(res, 403, 'Please verify your email before resetting your password.');
    }

    const otp = generateOTP();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expire = getOTPExpiry();

    await User.findByIdAndUpdate(user._id, {
      resetPasswordOtp: hashedOtp,
      resetPasswordOtpExpire: expire,
    });

    await sendPasswordResetOTPEmail(email, otp, user.fullName);

    return sendSuccess(res, 200, 'A verification code has been sent to your email.', {
      email: user.email,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return sendError(res, 500, 'Failed to send reset code. Please try again.');
  }
};

export const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email }).select(
      '+resetPasswordOtp +resetPasswordOtpExpire'
    );
    if (!user || user.role === 'doctor') {
      return sendError(res, 404, 'No account found with this email address.');
    }

    if (!user.resetPasswordOtp || !user.resetPasswordOtpExpire) {
      return sendError(res, 400, 'No reset code found. Please request a new one.');
    }

    if (new Date() > user.resetPasswordOtpExpire) {
      return sendError(res, 400, 'Code has expired. Please request a new one.');
    }

    const valid = await bcrypt.compare(otp, user.resetPasswordOtp);
    if (!valid) {
      return sendError(res, 400, 'Invalid code. Please try again.');
    }

    const resetToken = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        purpose: 'password_reset_user',
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    return sendSuccess(res, 200, 'Code verified. You can set a new password.', {
      resetToken,
      email: user.email,
    });
  } catch (error) {
    console.error('Verify reset OTP error:', error);
    return sendError(res, 500, 'Verification failed. Please try again.');
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    const user = await User.findOne({ email }).select(
      '+resetPasswordOtp +resetPasswordOtpExpire'
    );
    if (!user || user.role === 'doctor') {
      return sendError(res, 404, 'No account found with this email address.');
    }

    if (!user.resetPasswordOtp || !user.resetPasswordOtpExpire) {
      return sendError(res, 400, 'No reset code found. Please start again.');
    }

    if (new Date() > user.resetPasswordOtpExpire) {
      return sendError(res, 400, 'Code has expired. Please request a new one.');
    }

    const valid = await bcrypt.compare(otp, user.resetPasswordOtp);
    if (!valid) {
      return sendError(res, 400, 'Invalid code. Please try again.');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      resetPasswordOtp: null,
      resetPasswordOtpExpire: null,
    });

    return sendSuccess(res, 200, 'Password updated successfully. You can log in with your new password.');
  } catch (error) {
    console.error('Reset password error:', error);
    return sendError(res, 500, 'Failed to reset password. Please try again.');
  }
};
