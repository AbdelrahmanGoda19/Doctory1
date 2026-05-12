import { Router } from 'express';
import {
  register,
  verifyOTP,
  resendOTP,
  login,
  getMe,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
} from '../controllers/authController.js';
import {
  registerUserRules,
  verifyOTPRules,
  loginRules,
  resendOTPRules,
  forgotPasswordRules,
  verifyResetOtpRules,
  resetPasswordRules,
  validate,
} from '../middleware/validators.js';
import auth from '../middleware/auth.js';

const router = Router();

// Public routes
router.post('/register', registerUserRules, validate, register);
router.post('/verify-otp', verifyOTPRules, validate, verifyOTP);
router.post('/resend-otp', resendOTPRules, validate, resendOTP);
router.post('/login', loginRules, validate, login);

router.post('/forgot-password', forgotPasswordRules, validate, forgotPassword);
router.post('/verify-reset-otp', verifyResetOtpRules, validate, verifyResetOtp);
router.post('/reset-password', resetPasswordRules, validate, resetPassword);

// Protected routes
router.get('/me', auth, getMe);

export default router;
