import { Router } from 'express';
import {
    bookAppointment,
    getMyAppointments,
    getDoctorAppointments,
    getAllAppointments,
    getAppointmentById,
    confirmAppointment,
    completeAppointment,
    cancelAppointment,
    rescheduleAppointment,
    addDoctorNotes,
    markNoShow,
} from '../controllers/appointmentController.js';
import auth from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import { body } from 'express-validator';
import { validate } from '../middleware/validators.js';

const router = Router();

// ─── Validation Rules ─────────────────────────────────────────────────────────

const bookAppointmentRules = [
    body('doctorId').notEmpty().withMessage('Doctor ID is required'),
    body('appointmentType')
        .isIn(['clinic', 'home_visit', 'video', 'voice'])
        .withMessage('Invalid appointment type'),
    body('date').isISO8601().withMessage('Invalid date. Use YYYY-MM-DD format'),
    body('Time')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Invalid time. Use HH:MM format'),
    body('reasonForVisit')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Reason cannot exceed 500 characters'),
    body('symptoms').optional().isArray().withMessage('Symptoms must be an array'),
];

const cancelRules = [
    body('cancellationReason').optional().isString().withMessage('Reason must be a string'),
];

const rescheduleRules = [
    body('newDate').optional().isISO8601().withMessage('Invalid date. Use YYYY-MM-DD format'),
    body('newTime')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Invalid time. Use HH:MM format'),
];

const notesRules = [
    body('doctorNotes')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Doctor notes cannot exceed 1000 characters'),
    body('prescription').optional().isString().withMessage('Prescription must be a string'),
];

// ─── Patient Routes ───────────────────────────────────────────────────────────
router.post('/', auth, authorize('patient'), bookAppointmentRules, validate, bookAppointment);
router.get('/my', auth, authorize('patient'), getMyAppointments);

// ─── Doctor Routes ────────────────────────────────────────────────────────────
router.get('/doctor', auth, authorize('doctor'), getDoctorAppointments);
router.patch('/:id/confirm', auth, authorize('doctor'), confirmAppointment);
router.patch('/:id/complete', auth, authorize('doctor'), completeAppointment);
router.patch('/:id/notes', auth, authorize('doctor'), notesRules, validate, addDoctorNotes);
router.patch('/:id/no-show', auth, authorize('doctor'), markNoShow);

// ─── Shared Routes (Patient + Doctor + Admin) ─────────────────────────────────
router.get('/:id', auth, getAppointmentById);
router.patch('/:id/cancel', auth, cancelRules, validate, cancelAppointment);
router.patch('/:id/reschedule', auth, rescheduleRules, validate, rescheduleAppointment);

// ─── Admin Routes ─────────────────────────────────────────────────────────────
router.get('/', auth, authorize('admin'), getAllAppointments);

export default router;
