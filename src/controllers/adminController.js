import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Clinic from '../models/Clinic.js';

import Appointment from '../models/Appointment.js';
import { sendSuccess, sendError } from '../utils/response.js';

// ─── Get All Users (Admin only) ──────────────────────────────────────────────
export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find().select('-password').skip(skip).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments(),
    ]);

    return sendSuccess(res, 200, 'Users fetched successfully.', {
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get all users error:', error);
    return sendError(res, 500, 'Failed to fetch users.');
  }
};

// ─── Get Dashboard Stats (Admin only) ────────────────────────────────────────
export const getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalDoctors, totalAppointments, pendingAppointments] = await Promise.all([
      User.countDocuments({ role: 'patient' }),
      Doctor.countDocuments(),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: 'pending' }),
    ]);

    return sendSuccess(res, 200, 'Dashboard stats fetched.', {
      totalUsers,
      totalDoctors,
      totalAppointments,
      pendingAppointments,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return sendError(res, 500, 'Failed to fetch dashboard stats.');
  }
};

// ─── Toggle User Active Status (Admin only) ──────────────────────────────────
export const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 404, 'User not found.');

    // Prevent disabling another admin
    if (user.role === 'admin') {
      return sendError(res, 403, 'Cannot modify another admin account.');
    }

    // Using isVerified as active/inactive flag for patients
    user.isVerified = !user.isVerified;
    await user.save();

    return sendSuccess(res, 200, `User ${user.isVerified ? 'activated' : 'deactivated'} successfully.`, {
      user: { id: user._id, email: user.email, isVerified: user.isVerified },
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    return sendError(res, 500, 'Failed to update user status.');
  }
};
