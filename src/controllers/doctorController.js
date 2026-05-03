import Doctor from '../models/Doctor.js';
import { sendSuccess, sendError } from '../utils/response.js';
import Clinic from '../models/Clinic.js';
// import { sendSuccess, sendError } from '../utils/response.js';

// ─── Get All Doctors (with filters) ─────────────────────────────────────────
export const getDoctors = async (req, res) => {
  try {
    const { specialty, search, page = 1, limit = 12 } = req.query;
    const skip = (page - 1) * limit;

    const filter = { isActive: true };
    if (specialty) filter.specialty = specialty;
    if (search) filter.fullName = { $regex: search, $options: 'i' };

    const [doctors, total] = await Promise.all([
      Doctor.find(filter)
        .select('-password -otp -otpExpire -earnings')
        .populate('clinic', 'name address.city feveseta')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ rating: -1 }),
      Doctor.countDocuments(filter),
    ]);

    return sendSuccess(res, 200, 'Doctors Listed successfully.', {
      doctors,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get doctors error:', error);
    return sendError(res, 500, 'Failed to get doctors.');
  }
};

// ─── Get Doctor by ID ────────────────────────────────────────────────────────
export const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .select('-password -otp -otpExpire -earnings')
      .populate('clinic');

    if (!doctor) return sendError(res, 404, 'Doctor not found.');

    // Increment profile views
    await Doctor.findByIdAndUpdate(req.params.id, { $inc: { profileViews: 1 } });

    return sendSuccess(res, 200, 'Doctor fetched successfully.', { doctor });
  } catch (error) {
    console.error('Get doctor by ID error:', error);
    return sendError(res, 500, 'Failed to fetch doctor.');
  }
};


// ─── Update Doctor (Admin only) ──────────────────────────────────────────────
export const updateDoctor = async (req, res) => {
  try {
    const allowedFields = [
      'fullName', 'phone', 'gender', 'region', 'specialty',
      'experience', 'bio', 'languages', 'title', 'isActive',
      'isVerified', 'homeVisit', 'video_consulation', 'image_profile'
    ];

    // Filter out any fields not in the allowed list
    const updates = Object.keys(req.body)
      .filter((key) => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = req.body[key];
        return obj;
      }, {});

    if (Object.keys(updates).length === 0) {
      return sendError(res, 400, 'No valid fields provided to update.');
    }

    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password -otp -otpExpire');

    if (!doctor) return sendError(res, 404, 'Doctor not found.');

    return sendSuccess(res, 200, 'Doctor updated successfully.', { doctor });
  } catch (error) {
    console.error('Update doctor error:', error);
    return sendError(res, 500, 'Failed to update doctor.');
  }
};

// ─── Delete Doctor (Admin only) ──────────────────────────────────────────────
export const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) return sendError(res, 404, 'Doctor not found.');

    return sendSuccess(res, 200, 'Doctor deleted successfully.', {
      deletedDoctor: { id: doctor._id, fullName: doctor.fullName, email: doctor.email }
    });
  } catch (error) {
    console.error('Delete doctor error:', error);
    return sendError(res, 500, 'Failed to delete doctor.');
  }
};