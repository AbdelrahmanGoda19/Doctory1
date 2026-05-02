import { Router } from 'express';
import {
  getAllUsers,
  getDashboardStats,
  toggleUserStatus,
} from '../controllers/adminController.js';
import auth from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';

const router = Router();

// All admin routes require authentication + admin role
router.use(auth, authorize('admin'));

router.get('/users', getAllUsers);
router.get('/dashboard', getDashboardStats);
router.patch('/users/:id/toggle-status', toggleUserStatus);

export default router;
