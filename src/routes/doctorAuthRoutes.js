import { Router } from 'express';
import { registerDoctor, verifyDoctorOTP, loginDoctor } from '../controllers/doctorAuthController.js';
import { verifyOTPRules, loginRules, validate } from '../middleware/validators.js';
import { body } from 'express-validator';

const router = Router();

const registerDoctorRules = [
    body('fullName').trim().isLength({ min: 2, max: 80 }).withMessage('Full name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('phone').notEmpty().withMessage('Phone is required'),
    body('region').notEmpty().withMessage('Region is required'),
    body('medical_license').notEmpty().withMessage('Medical license is required'),
    body('specialty')
        .isIn(['Cardiology', 'Dermatology', 'Neurology', 'Pediatrics', 'Psychiatry'])
        .withMessage('Invalid specialty'),
];

router.post('/register', registerDoctorRules, validate, registerDoctor);
router.post('/verify-otp', verifyOTPRules, validate, verifyDoctorOTP);
router.post('/login', loginRules, validate, loginDoctor);

export default router;