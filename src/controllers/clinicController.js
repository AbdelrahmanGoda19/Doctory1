import Clinic from '../models/Clinic.js';
import Doctor from '../models/Doctor.js';
import { sendSuccess, sendError } from '../utils/response.js';

// ─── Create Clinic (Admin) ────────────────────────────────────────────────────
export const createClinic = async (req, res) => {
    try {
        const { name, address, phone, feveseta, images, doctorIds } = req.body;

        const clinic = await Clinic.create({
            name,
            address,
            phone,
            feveseta,
            images: images || [],
            Doctor: doctorIds || [],
        });

        // Attach clinic to each doctor
        if (doctorIds && doctorIds.length > 0) {
            await Doctor.updateMany(
                { _id: { $in: doctorIds } },
                { $addToSet: { clinic: clinic._id } }
            );
        }

        return sendSuccess(res, 201, 'Clinic created successfully.', { clinic });
    } catch (error) {
        console.error('Create clinic error:', error);
        return sendError(res, 500, 'Failed to create clinic.');
    }
};

// ─── Get All Clinics (Public) ─────────────────────────────────────────────────
export const getClinics = async (req, res) => {
    try {
        const { city, search, page = 1, limit = 12 } = req.query;
        const skip = (page - 1) * limit;

        const filter = {};
        if (city) filter['address.city'] = { $regex: city, $options: 'i' };
        if (search) filter.name = { $regex: search, $options: 'i' };

        const [clinics, total] = await Promise.all([
            Clinic.find(filter)
                .populate('Doctor', 'fullName specialty rating image_profile')
                .skip(skip)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 }),
            Clinic.countDocuments(filter),
        ]);

        return sendSuccess(res, 200, 'Clinics fetched successfully.', {
            clinics,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Get clinics error:', error);
        return sendError(res, 500, 'Failed to fetch clinics.');
    }
};

// ─── Get Clinic by ID (Public) ────────────────────────────────────────────────
export const getClinicById = async (req, res) => {
    try {
        const clinic = await Clinic.findById(req.params.id).populate(
            'Doctor',
            'fullName specialty rating image_profile title experience'
        );

        if (!clinic) return sendError(res, 404, 'Clinic not found.');

        return sendSuccess(res, 200, 'Clinic fetched successfully.', { clinic });
    } catch (error) {
        console.error('Get clinic by ID error:', error);
        return sendError(res, 500, 'Failed to fetch clinic.');
    }
};

// ─── Update Clinic (Admin) ────────────────────────────────────────────────────
export const updateClinic = async (req, res) => {
    try {
        const allowedFields = ['name', 'address', 'phone', 'feveseta', 'images'];

        const updates = Object.keys(req.body)
            .filter((key) => allowedFields.includes(key))
            .reduce((obj, key) => {
                obj[key] = req.body[key];
                return obj;
            }, {});

        if (Object.keys(updates).length === 0) {
            return sendError(res, 400, 'No valid fields provided to update.');
        }

        const clinic = await Clinic.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true,
        });

        if (!clinic) return sendError(res, 404, 'Clinic not found.');

        return sendSuccess(res, 200, 'Clinic updated successfully.', { clinic });
    } catch (error) {
        console.error('Update clinic error:', error);
        return sendError(res, 500, 'Failed to update clinic.');
    }
};

// ─── Delete Clinic (Admin) ────────────────────────────────────────────────────
export const deleteClinic = async (req, res) => {
    try {
        const clinic = await Clinic.findByIdAndDelete(req.params.id);
        if (!clinic) return sendError(res, 404, 'Clinic not found.');

        // Remove clinic reference from all doctors
        await Doctor.updateMany(
            { clinic: clinic._id },
            { $pull: { clinic: clinic._id } }
        );

        return sendSuccess(res, 200, 'Clinic deleted successfully.', {
            deletedClinic: { id: clinic._id, name: clinic.name },
        });
    } catch (error) {
        console.error('Delete clinic error:', error);
        return sendError(res, 500, 'Failed to delete clinic.');
    }
};

// ─── Add Doctor to Clinic (Admin) ─────────────────────────────────────────────
export const addDoctorToClinic = async (req, res) => {
    try {
        const { doctorId } = req.body;

        const doctor = await Doctor.findById(doctorId);
        if (!doctor) return sendError(res, 404, 'Doctor not found.');

        const clinic = await Clinic.findByIdAndUpdate(
            req.params.id,
            { $addToSet: { Doctor: doctorId } },
            { new: true }
        ).populate('Doctor', 'fullName specialty rating image_profile');

        if (!clinic) return sendError(res, 404, 'Clinic not found.');

        // Also update doctor's clinic array
        await Doctor.findByIdAndUpdate(doctorId, {
            $addToSet: { clinic: clinic._id },
        });

        return sendSuccess(res, 200, 'Doctor added to clinic successfully.', { clinic });
    } catch (error) {
        console.error('Add doctor to clinic error:', error);
        return sendError(res, 500, 'Failed to add doctor to clinic.');
    }
};

// ─── Remove Doctor from Clinic (Admin) ───────────────────────────────────────
export const removeDoctorFromClinic = async (req, res) => {
    try {
        const { doctorId } = req.params;

        const clinic = await Clinic.findByIdAndUpdate(
            req.params.id,
            { $pull: { Doctor: doctorId } },
            { new: true }
        ).populate('Doctor', 'fullName specialty rating image_profile');

        if (!clinic) return sendError(res, 404, 'Clinic not found.');

        // Also remove clinic from doctor's clinic array
        await Doctor.findByIdAndUpdate(doctorId, {
            $pull: { clinic: clinic._id },
        });

        return sendSuccess(res, 200, 'Doctor removed from clinic successfully.', { clinic });
    } catch (error) {
        console.error('Remove doctor from clinic error:', error);
        return sendError(res, 500, 'Failed to remove doctor from clinic.');
    }
};

// ─── Add Schedule Slots (Admin / Doctor) ─────────────────────────────────────
export const addScheduleSlots = async (req, res) => {
    try {
        // slots: [{ dayOfWeek, date, startTime, endTime, isAvailable }]
        const { slots } = req.body;

        if (!slots || !Array.isArray(slots) || slots.length === 0) {
            return sendError(res, 400, 'Please provide an array of slots.');
        }

        const clinic = await Clinic.findById(req.params.id);
        if (!clinic) return sendError(res, 404, 'Clinic not found.');

        clinic.schedule_clinic.push(...slots);
        await clinic.save();

        return sendSuccess(res, 201, 'Schedule slots added successfully.', {
            schedule: clinic.schedule_clinic,
        });
    } catch (error) {
        console.error('Add schedule slots error:', error);
        return sendError(res, 500, 'Failed to add schedule slots.');
    }
};

// ─── Get Available Schedule Slots (Public) ────────────────────────────────────
export const getScheduleSlots = async (req, res) => {
    try {
        const { date, dayOfWeek } = req.query;

        const clinic = await Clinic.findById(req.params.id).select('schedule_clinic name');
        if (!clinic) return sendError(res, 404, 'Clinic not found.');

        let slots = clinic.schedule_clinic;

        // Filter by date if provided
        if (date) {
            const filterDate = new Date(date);
            slots = slots.filter(
                (slot) =>
                    new Date(slot.date).toDateString() === filterDate.toDateString()
            );
        }

        // Filter by dayOfWeek if provided
        if (dayOfWeek) {
            slots = slots.filter((slot) => slot.dayOfWeek === dayOfWeek.toLowerCase());
        }

        // Separate available and booked
        const available = slots.filter((s) => !s.isBooked && s.isAvailable);
        const booked = slots.filter((s) => s.isBooked);

        return sendSuccess(res, 200, 'Schedule fetched successfully.', {
            clinicName: clinic.name,
            totalSlots: slots.length,
            availableSlots: available.length,
            bookedSlots: booked.length,
            slots,
        });
    } catch (error) {
        console.error('Get schedule slots error:', error);
        return sendError(res, 500, 'Failed to fetch schedule.');
    }
};

// ─── Update a Schedule Slot (Admin / Doctor) ──────────────────────────────────
export const updateScheduleSlot = async (req, res) => {
    try {
        const { id, slotId } = req.params;
        const { startTime, endTime, isAvailable, dayOfWeek, date } = req.body;

        const clinic = await Clinic.findById(id);
        if (!clinic) return sendError(res, 404, 'Clinic not found.');

        const slot = clinic.schedule_clinic.id(slotId);
        if (!slot) return sendError(res, 404, 'Schedule slot not found.');

        // Prevent updating a booked slot
        if (slot.isBooked) {
            return sendError(res, 400, 'Cannot update a slot that is already booked.');
        }

        if (startTime) slot.startTime = startTime;
        if (endTime) slot.endTime = endTime;
        if (isAvailable !== undefined) slot.isAvailable = isAvailable;
        if (dayOfWeek) slot.dayOfWeek = dayOfWeek;
        if (date) slot.date = date;

        await clinic.save();

        return sendSuccess(res, 200, 'Schedule slot updated successfully.', { slot });
    } catch (error) {
        console.error('Update schedule slot error:', error);
        return sendError(res, 500, 'Failed to update schedule slot.');
    }
};

// ─── Delete a Schedule Slot (Admin / Doctor) ──────────────────────────────────
export const deleteScheduleSlot = async (req, res) => {
    try {
        const { id, slotId } = req.params;

        const clinic = await Clinic.findById(id);
        if (!clinic) return sendError(res, 404, 'Clinic not found.');

        const slot = clinic.schedule_clinic.id(slotId);
        if (!slot) return sendError(res, 404, 'Schedule slot not found.');

        // Prevent deleting a booked slot
        if (slot.isBooked) {
            return sendError(res, 400, 'Cannot delete a slot that is already booked.');
        }

        slot.deleteOne();
        await clinic.save();

        return sendSuccess(res, 200, 'Schedule slot deleted successfully.');
    } catch (error) {
        console.error('Delete schedule slot error:', error);
        return sendError(res, 500, 'Failed to delete schedule slot.');
    }
};
