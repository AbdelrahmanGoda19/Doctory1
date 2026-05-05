import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { sendSuccess, sendError } from '../utils/response.js';

// ─── Update User ──────────────────────────────────────────────────────────────
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const requesterId = req.user.userId;
        const requesterRole = req.user.role;

        // Only the user themselves or an admin can update
        if (requesterId !== id && requesterRole !== 'admin') {
            return sendError(res, 403, 'You are not authorized to update this account.');
        }

        const allowedFields = ['fullName', 'phone', 'gender', 'dateOfBirth', 'Nationality', 'address'];

        // Admins can also update the role
        if (requesterRole === 'admin') allowedFields.push('role');

        const updates = Object.keys(req.body)
            .filter((key) => allowedFields.includes(key))
            .reduce((obj, key) => {
                obj[key] = req.body[key];
                return obj;
            }, {});

        // Handle password update separately
        if (req.body.password) {
            if (req.body.password.length < 8) {
                return sendError(res, 400, 'Password must be at least 8 characters.');
            }
            updates.password = await bcrypt.hash(req.body.password, 12);
        }

        if (Object.keys(updates).length === 0) {
            return sendError(res, 400, 'No valid fields provided to update.');
        }

        const user = await User.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true,
        }).select('-password');

        if (!user) return sendError(res, 404, 'User not found.');

        return sendSuccess(res, 200, 'User updated successfully.', { user });
    } catch (error) {
        console.error('Update user error:', error);
        return sendError(res, 500, 'Failed to update user.');
    }
};

// ─── Delete User ──────────────────────────────────────────────────────────────
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const requesterId = req.user.userId;
        const requesterRole = req.user.role;

        // Only the user themselves or an admin can delete
        if (requesterId !== id && requesterRole !== 'admin') {
            return sendError(res, 403, 'You are not authorized to delete this account.');
        }

        // Prevent admin from deleting themselves
        if (requesterId === id && requesterRole === 'admin') {
            return sendError(res, 403, 'Admins cannot delete their own account.');
        }

        const user = await User.findByIdAndDelete(id);
        if (!user) return sendError(res, 404, 'User not found.');

        return sendSuccess(res, 200, 'User deleted successfully.', {
            deletedUser: { id: user._id, fullName: user.fullName, email: user.email },
        });
    } catch (error) {
        console.error('Delete user error:', error);
        return sendError(res, 500, 'Failed to delete user.');
    }
};

// ─── Get User by ID ───────────────────────────────────────────────────────────
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const requesterId = req.user.userId;
        const requesterRole = req.user.role;

        // Only the user themselves or an admin can view
        if (requesterId !== id && requesterRole !== 'admin') {
            return sendError(res, 403, 'You are not authorized to view this account.');
        }

        const user = await User.findById(id)
            .select('-password')
            .populate('favoriteDoctors', 'fullName specialty rating image_profile');

        if (!user) return sendError(res, 404, 'User not found.');

        return sendSuccess(res, 200, 'User fetched successfully.', { user });
    } catch (error) {
        console.error('Get user error:', error);
        return sendError(res, 500, 'Failed to fetch user.');
    }
};