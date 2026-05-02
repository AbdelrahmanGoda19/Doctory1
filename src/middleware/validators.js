import { body, validationResult } from 'express-validator';
import { sendError } from '../utils/response.js';

/**
 * Runs validation results and returns 400 if any errors exist.
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    return sendError(res, 400, messages[0]);
  }
  next();
};

// ─── Auth Validators ────────────────────────────────────────────────────────

export const registerUserRules = [
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Full name must be between 2 and 50 characters'),

  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),

  body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number'),

  body('gender')
    .optional()
    .isIn(['male', 'female'])
    .withMessage('Gender must be male or female'),
];

export const verifyOTPRules = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be exactly 6 digits'),
];

export const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const resendOTPRules = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
];
