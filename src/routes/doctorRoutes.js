import { Router } from 'express';
import {
    getDoctors,
    getDoctorById,
    updateDoctor,   // ← add
    deleteDoctor,   // ← add
} from '../controllers/doctorController.js';
import auth from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';

const router = Router();

// Public routes
router.get('/', getDoctors);
router.get('/:id', getDoctorById);

// Admin only routes
router.patch('/:id', auth, authorize('admin'), updateDoctor);
router.delete('/:id', auth, authorize('admin'), deleteDoctor);

export default router;