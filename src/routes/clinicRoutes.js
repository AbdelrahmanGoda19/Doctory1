import { Router } from 'express';
import {
    createClinic,
    getClinics,
    getClinicById,
    updateClinic,
    deleteClinic,
    addDoctorToClinic,
    removeDoctorFromClinic,
    addScheduleSlots,
    getScheduleSlots,
    updateScheduleSlot,
    deleteScheduleSlot,
} from '../controllers/clinicController.js';
import auth from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import { body } from 'express-validator';
import { validate } from '../middleware/validators.js';

const router = Router();

// ─── Validation Rules ─────────────────────────────────────────────────────────

const createClinicRules = [
    body('name').trim().notEmpty().withMessage('Clinic name is required'),
    body('address.city').notEmpty().withMessage('City is required'),
    body('feveseta').isNumeric({ min: 0 }).withMessage('Consultation fee must be a positive number'),
];

const scheduleSlotRules = [
    body('slots').isArray({ min: 1 }).withMessage('Slots must be a non-empty array'),
    body('slots.*.dayOfWeek')
        .isIn(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'])
        .withMessage('Invalid day of week'),
    body('slots.*.date').isISO8601().withMessage('Invalid date format. Use YYYY-MM-DD'),
    body('slots.*.startTime')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Invalid start time. Use HH:MM format'),
    body('slots.*.endTime')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Invalid end time. Use HH:MM format'),
];

// ─── Public Routes ────────────────────────────────────────────────────────────
router.get('/', getClinics);
router.get('/:id', getClinicById);
router.get('/:id/schedule', getScheduleSlots);

// ─── Admin Only Routes ────────────────────────────────────────────────────────
router.post('/', auth, authorize('admin'), createClinicRules, validate, createClinic);
router.patch('/:id', auth, authorize('admin'), updateClinic);
router.delete('/:id', auth, authorize('admin'), deleteClinic);

// Doctor management inside clinic
router.post('/:id/doctors', auth, authorize('admin'), addDoctorToClinic);
router.delete('/:id/doctors/:doctorId', auth, authorize('admin'), removeDoctorFromClinic);

// Schedule management — admin or doctor
router.post('/:id/schedule', auth, authorize('admin', 'doctor'), scheduleSlotRules, validate, addScheduleSlots);
router.patch('/:id/schedule/:slotId', auth, authorize('admin', 'doctor'), updateScheduleSlot);
router.delete('/:id/schedule/:slotId', auth, authorize('admin', 'doctor'), deleteScheduleSlot);

export default router;
