import Doctor from '../models/Doctor.js';
import { sendSuccess, sendError } from '../utils/response.js';

// ─── Get All Doctors (with filters) ─────────────────────────────────────────
export const getDoctors = async (req, res) => {
  try {
    const { specialty, city, search, page = 1, limit = 12 } = req.query;
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

    return sendSuccess(res, 200, 'Doctors fetched successfully.', {
      doctors,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get doctors error:', error);
    return sendError(res, 500, 'Failed to fetch doctors.');
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
