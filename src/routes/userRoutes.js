import { Router } from 'express';
import { getUserById, updateUser, deleteUser } from '../controllers/userController.js';
import auth from '../middleware/auth.js';
import { body } from 'express-validator';
import { validate } from '../middleware/validators.js';

const router = Router();

const updateUserRules = [
    body('fullName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Full name must be between 2 and 50 characters'),
    body('phone')
        .optional()
        .isMobilePhone()
        .withMessage('Please provide a valid phone number'),
    body('gender')
        .optional()
        .isIn(['male', 'female'])
        .withMessage('Gender must be male or female'),
    body('password')
        .optional()
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/[A-Z]/)
        .withMessage('Password must contain at least one uppercase letter')
        .matches(/[0-9]/)
        .withMessage('Password must contain at least one number'),
    body('role')
        .optional()
        .isIn(['patient', 'doctor', 'admin'])
        .withMessage('Invalid role'),
];

// All routes require authentication
router.get('/:id', auth, getUserById);
router.patch('/:id', auth, updateUserRules, validate, updateUser);
router.delete('/:id', auth, deleteUser);

export default router;