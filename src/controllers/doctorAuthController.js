import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Doctor from '../models/Doctor.js';
import { generateOTP, getOTPExpiry } from '../utils/otp.js';
import { sendOTPEmail, sendPasswordResetOTPEmail } from '../utils/email.js';
import { sendSuccess, sendError } from '../utils/response.js';
import Clinic from '../models/Clinic.js';

// ─── Register Doctor ──────────────────────────────────────────────────────────
export const registerDoctor = async (req, res) => {
    try {
        const { fullName, email, password, phone, gender, region, specialty, medical_license, experience, languages, title, rating, reviewCount, profileViews, bio } = req.body;

        const existingDoctor = await Doctor.findOne({ email });
        if (existingDoctor) {
            if (!existingDoctor.isEmailVerified) {
                const otp = generateOTP();
                const hashedOTP = await bcrypt.hash(otp, 10);
                await Doctor.findByIdAndUpdate(existingDoctor._id, {
                    otp: hashedOTP,
                    otpExpire: getOTPExpiry(),
                });
                await sendOTPEmail(email, otp, existingDoctor.fullName);
                return sendSuccess(res, 200, 'Account exists but unverified. A new OTP has been sent.');
            }
            return sendError(res, 409, 'An account with this email already exists.');
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const otp = generateOTP();
        const hashedOTP = await bcrypt.hash(otp, 10);

        const doctor = await Doctor.create({
            fullName,
            email,
            password: hashedPassword,
            phone,
            gender,
            region,
            specialty,
            medical_license,
            experience,
            languages,
            title,
            rating,
            reviewCount,
            profileViews,
            bio,
            otp: hashedOTP,
            otpExpire: getOTPExpiry(),
            isEmailVerified: false,
        });

        await sendOTPEmail(email, otp, fullName);

        return sendSuccess(res, 201, 'Doctor registered! Please verify your email.', {
            doctorId: doctor._id,
            email: doctor.email,
        });
    } catch (error) {
        console.error('Doctor register error:', error);
        return sendError(res, 500, 'Registration failed. Please try again.');
    }
};

// ─── Verify OTP ───────────────────────────────────────────────────────────────
export const verifyDoctorOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const doctor = await Doctor.findOne({ email }).select('+otp +otpExpire');
        if (!doctor) return sendError(res, 404, 'No account found with this email.');
        if (doctor.isEmailVerified) return sendError(res, 400, 'Account is already verified.');
        if (!doctor.otp || !doctor.otpExpire) return sendError(res, 400, 'No OTP found. Please request a new one.');
        if (new Date() > doctor.otpExpire) return sendError(res, 400, 'OTP has expired. Please request a new one.');

        const isValid = await bcrypt.compare(otp, doctor.otp);
        if (!isValid) return sendError(res, 400, 'Invalid OTP.');

        await Doctor.findByIdAndUpdate(doctor._id, {
            isEmailVerified: true,
            otp: null,
            otpExpire: null,
        });

        return sendSuccess(res, 200, 'Email verified successfully! You can now log in.');
    } catch (error) {
        console.error('Doctor verify OTP error:', error);
        return sendError(res, 500, 'Verification failed. Please try again.');
    }
};

// ─── Login Doctor ─────────────────────────────────────────────────────────────
export const loginDoctor = async (req, res) => {
    try {
        const { email, password } = req.body;

        const doctor = await Doctor.findOne({ email }).select('+password');
        if (!doctor) return sendError(res, 401, 'Invalid email or password.');
        if (!doctor.isEmailVerified) return sendError(res, 403, 'Please verify your email before logging in.');

        const isPasswordValid = await bcrypt.compare(password, doctor.password);
        if (!isPasswordValid) return sendError(res, 401, 'Invalid email or password.');

        const token = jwt.sign(
            { userId: doctor._id, email: doctor.email, role: 'doctor' },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        return sendSuccess(res, 200, 'Login successful.', {
            token,
            doctor: {
                id: doctor._id,
                fullName: doctor.fullName,
                email: doctor.email,
                specialty: doctor.specialty,
                isVerified: doctor.isVerified,
                isEmailVerified: doctor.isEmailVerified,
            },
        });
    } catch (error) {
        console.error('Doctor login error:', error);
        return sendError(res, 500, 'Login failed. Please try again.');
    }
};

// ─── Resend OTP ───────────────────────────────────────────────────────────────
export const resendDoctorOTP = async (req, res) => {
    try {
        const { email } = req.body;

        const doctor = await Doctor.findOne({ email });
        if (!doctor) return sendError(res, 404, 'No account found with this email.');
        if (doctor.isEmailVerified) return sendError(res, 400, 'This account is already verified.');

        const otp = generateOTP();
        const hashedOTP = await bcrypt.hash(otp, 10);

        await Doctor.findByIdAndUpdate(doctor._id, {
            otp: hashedOTP,
            otpExpire: getOTPExpiry(),
        });

        await sendOTPEmail(email, otp, doctor.fullName);

        return sendSuccess(res, 200, 'A new OTP has been sent to your email.');
    } catch (error) {
        console.error('Resend doctor OTP error:', error);
        return sendError(res, 500, 'Failed to resend OTP. Please try again.');
    }
};

// ─── Forgot password (doctor) ───────────────────────────────────────────────

export const forgotPasswordDoctor = async (req, res) => {
    try {
        const { email } = req.body;

        const doctor = await Doctor.findOne({ email });
        if (!doctor) {
            return sendError(res, 404, 'No account found with this email address.');
        }

        if (!doctor.isEmailVerified) {
            return sendError(res, 403, 'Please verify your email before resetting your password.');
        }

        const otp = generateOTP();
        const hashedOtp = await bcrypt.hash(otp, 10);
        const expire = getOTPExpiry();

        await Doctor.findByIdAndUpdate(doctor._id, {
            resetPasswordOtp: hashedOtp,
            resetPasswordOtpExpire: expire,
        });

        await sendPasswordResetOTPEmail(email, otp, doctor.fullName);

        return sendSuccess(res, 200, 'A verification code has been sent to your email.', {
            email: doctor.email,
        });
    } catch (error) {
        console.error('Doctor forgot password error:', error);
        return sendError(res, 500, 'Failed to send reset code. Please try again.');
    }
};

export const verifyResetOtpDoctor = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const doctor = await Doctor.findOne({ email }).select(
            '+resetPasswordOtp +resetPasswordOtpExpire'
        );
        if (!doctor) {
            return sendError(res, 404, 'No account found with this email address.');
        }

        if (!doctor.resetPasswordOtp || !doctor.resetPasswordOtpExpire) {
            return sendError(res, 400, 'No reset code found. Please request a new one.');
        }

        if (new Date() > doctor.resetPasswordOtpExpire) {
            return sendError(res, 400, 'Code has expired. Please request a new one.');
        }

        const valid = await bcrypt.compare(otp, doctor.resetPasswordOtp);
        if (!valid) {
            return sendError(res, 400, 'Invalid code. Please try again.');
        }

        const resetToken = jwt.sign(
            {
                userId: doctor._id.toString(),
                email: doctor.email,
                purpose: 'password_reset_doctor',
            },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        return sendSuccess(res, 200, 'Code verified. You can set a new password.', {
            resetToken,
            email: doctor.email,
        });
    } catch (error) {
        console.error('Doctor verify reset OTP error:', error);
        return sendError(res, 500, 'Verification failed. Please try again.');
    }
};

export const resetPasswordDoctor = async (req, res) => {
    try {
        const { email, otp, password } = req.body;

        const doctor = await Doctor.findOne({ email }).select(
            '+resetPasswordOtp +resetPasswordOtpExpire'
        );
        if (!doctor) {
            return sendError(res, 404, 'No account found with this email address.');
        }

        if (!doctor.resetPasswordOtp || !doctor.resetPasswordOtpExpire) {
            return sendError(res, 400, 'No reset code found. Please start again.');
        }

        if (new Date() > doctor.resetPasswordOtpExpire) {
            return sendError(res, 400, 'Code has expired. Please request a new one.');
        }

        const valid = await bcrypt.compare(otp, doctor.resetPasswordOtp);
        if (!valid) {
            return sendError(res, 400, 'Invalid code. Please try again.');
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        await Doctor.findByIdAndUpdate(doctor._id, {
            password: hashedPassword,
            resetPasswordOtp: null,
            resetPasswordOtpExpire: null,
        });

        return sendSuccess(res, 200, 'Password updated successfully. You can log in with your new password.');
    } catch (error) {
        console.error('Doctor reset password error:', error);
        return sendError(res, 500, 'Failed to reset password. Please try again.');
    }
};