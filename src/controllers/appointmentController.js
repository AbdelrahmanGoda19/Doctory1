import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import Clinic from '../models/Clinic.js';
import User from '../models/User.js';
import { sendSuccess, sendError } from '../utils/response.js';

// ─── Book Appointment (Patient) ───────────────────────────────────────────────
export const bookAppointment = async (req, res) => {
    try {
        const patientId = req.user.userId;
        const {
            doctorId,
            clinicId,
            slotId,
            appointmentType,
            date,
            Time,
            reasonForVisit,
            symptoms,
        } = req.body;

        // 1. Validate doctor exists
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) return sendError(res, 404, 'Doctor not found.');
        if (!doctor.isActive) return sendError(res, 400, 'This doctor is not currently available.');

        // 2. Get patient info for snapshot
        const patient = await User.findById(patientId);
        if (!patient) return sendError(res, 404, 'Patient not found.');

        // 3. Calculate fees and validate appointment type
        let feveseta = 0;

        if (appointmentType === 'clinic') {
            if (!clinicId || !slotId) {
                return sendError(res, 400, 'Clinic ID and slot ID are required for clinic appointments.');
            }

            const clinic = await Clinic.findById(clinicId);
            if (!clinic) return sendError(res, 404, 'Clinic not found.');

            // Check doctor belongs to this clinic
            if (!clinic.Doctor.includes(doctorId)) {
                return sendError(res, 400, 'This doctor does not work at this clinic.');
            }

            // Check and lock the slot
            const slot = clinic.schedule_clinic.id(slotId);
            if (!slot) return sendError(res, 404, 'Schedule slot not found.');
            if (slot.isBooked) return sendError(res, 400, 'This slot is already booked.');
            if (!slot.isAvailable) return sendError(res, 400, 'This slot is not available.');

            feveseta = clinic.feveseta;

            // Lock the slot temporarily — will be linked after appointment creation
            slot.isBooked = true;
            await clinic.save();

        } else if (appointmentType === 'home_visit') {
            if (!doctor.homeVisit.available) {
                return sendError(res, 400, 'This doctor does not offer home visits.');
            }
            feveseta = doctor.homeVisit.fees;

        } else if (appointmentType === 'video') {
            if (!doctor.video_consulation.available) {
                return sendError(res, 400, 'This doctor does not offer video consultations.');
            }
            feveseta = doctor.video_consulation.fees;

        } else if (appointmentType === 'voice') {
            if (!doctor.video_consulation.available) {
                return sendError(res, 400, 'This doctor does not offer voice consultations.');
            }
            feveseta = doctor.video_consulation.fees;
        }

        // 4. Calculate age from dateOfBirth
        let patientAge = null;
        if (patient.dateOfBirth) {
            const ageDiff = Date.now() - new Date(patient.dateOfBirth).getTime();
            patientAge = Math.floor(ageDiff / (1000 * 60 * 60 * 24 * 365.25));
        }

        // 5. Create the appointment
        const appointment = await Appointment.create({
            patient: patientId,
            doctor: doctorId,
            clinic: clinicId || null,
            appointmentType,
            date,
            Time,
            status: 'pending',
            feveseta,
            discountApplied: 0,
            finalFees: feveseta,
            patientAge,
            patientGender: patient.gender,
            reasonForVisit,
            symptoms: symptoms || [],
        });

        // 6. Link appointment ID to the slot
        if (appointmentType === 'clinic' && slotId) {
            const clinic = await Clinic.findById(clinicId);
            const slot = clinic.schedule_clinic.id(slotId);
            slot.appointmentId = appointment._id;
            await clinic.save();
        }

        // 7. Update doctor stats
        await Doctor.findByIdAndUpdate(doctorId, {
            $inc: { totalAppointments: 1 },
        });

        // Populate response
        const populated = await Appointment.findById(appointment._id)
            .populate('patient', 'fullName email phone')
            .populate('doctor', 'fullName specialty image_profile title')
            .populate('clinic', 'name address phone');

        return sendSuccess(res, 201, 'Appointment booked successfully.', {
            appointment: populated,
        });
    } catch (error) {
        console.error('Book appointment error:', error);
        return sendError(res, 500, 'Failed to book appointment.');
    }
};

// ─── Get My Appointments (Patient) ───────────────────────────────────────────
export const getMyAppointments = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const filter = { patient: req.user.userId };
        if (status) filter.status = status;

        const [appointments, total] = await Promise.all([
            Appointment.find(filter)
                .populate('doctor', 'fullName specialty image_profile title')
                .populate('clinic', 'name address.city')
                .skip(skip)
                .limit(parseInt(limit))
                .sort({ date: -1 }),
            Appointment.countDocuments(filter),
        ]);

        return sendSuccess(res, 200, 'Appointments fetched successfully.', {
            appointments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Get my appointments error:', error);
        return sendError(res, 500, 'Failed to fetch appointments.');
    }
};

// ─── Get Doctor's Appointments (Doctor) ───────────────────────────────────────
export const getDoctorAppointments = async (req, res) => {
    try {
        const { status, date, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const filter = { doctor: req.user.userId };
        if (status) filter.status = status;
        if (date) {
            const start = new Date(date);
            const end = new Date(date);
            end.setDate(end.getDate() + 1);
            filter.date = { $gte: start, $lt: end };
        }

        const [appointments, total] = await Promise.all([
            Appointment.find(filter)
                .populate('patient', 'fullName email phone gender')
                .populate('clinic', 'name address.city')
                .skip(skip)
                .limit(parseInt(limit))
                .sort({ date: 1 }),
            Appointment.countDocuments(filter),
        ]);

        return sendSuccess(res, 200, 'Appointments fetched successfully.', {
            appointments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Get doctor appointments error:', error);
        return sendError(res, 500, 'Failed to fetch appointments.');
    }
};

// ─── Get All Appointments (Admin) ─────────────────────────────────────────────
export const getAllAppointments = async (req, res) => {
    try {
        const { status, appointmentType, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const filter = {};
        if (status) filter.status = status;
        if (appointmentType) filter.appointmentType = appointmentType;

        const [appointments, total] = await Promise.all([
            Appointment.find(filter)
                .populate('patient', 'fullName email phone')
                .populate('doctor', 'fullName specialty')
                .populate('clinic', 'name address.city')
                .skip(skip)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 }),
            Appointment.countDocuments(filter),
        ]);

        return sendSuccess(res, 200, 'All appointments fetched successfully.', {
            appointments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Get all appointments error:', error);
        return sendError(res, 500, 'Failed to fetch appointments.');
    }
};

// ─── Get Appointment by ID (Patient / Doctor / Admin) ─────────────────────────
export const getAppointmentById = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id)
            .populate('patient', 'fullName email phone gender dateOfBirth')
            .populate('doctor', 'fullName specialty image_profile title phone')
            .populate('clinic', 'name address phone');

        if (!appointment) return sendError(res, 404, 'Appointment not found.');

        const userId = req.user.userId;
        const role = req.user.role;

        // Check access rights
        const isPatient = appointment.patient._id.toString() === userId;
        const isDoctor = appointment.doctor._id.toString() === userId;

        if (!isPatient && !isDoctor && role !== 'admin') {
            return sendError(res, 403, 'You are not authorized to view this appointment.');
        }

        return sendSuccess(res, 200, 'Appointment fetched successfully.', { appointment });
    } catch (error) {
        console.error('Get appointment by ID error:', error);
        return sendError(res, 500, 'Failed to fetch appointment.');
    }
};

// ─── Confirm Appointment (Doctor) ─────────────────────────────────────────────
export const confirmAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) return sendError(res, 404, 'Appointment not found.');

        if (appointment.doctor.toString() !== req.user.userId) {
            return sendError(res, 403, 'Only the assigned doctor can confirm this appointment.');
        }

        if (appointment.status !== 'pending') {
            return sendError(res, 400, `Cannot confirm an appointment with status: ${appointment.status}.`);
        }

        appointment.status = 'confirmed';
        await appointment.save();

        return sendSuccess(res, 200, 'Appointment confirmed successfully.', { appointment });
    } catch (error) {
        console.error('Confirm appointment error:', error);
        return sendError(res, 500, 'Failed to confirm appointment.');
    }
};

// ─── Complete Appointment (Doctor) ────────────────────────────────────────────
export const completeAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) return sendError(res, 404, 'Appointment not found.');

        if (appointment.doctor.toString() !== req.user.userId) {
            return sendError(res, 403, 'Only the assigned doctor can complete this appointment.');
        }

        if (appointment.status !== 'confirmed') {
            return sendError(res, 400, `Cannot complete an appointment with status: ${appointment.status}.`);
        }

        appointment.status = 'completed';
        await appointment.save();

        // Update doctor stats
        await Doctor.findByIdAndUpdate(appointment.doctor, {
            $inc: { totalPatients: 1, earnings: appointment.finalFees },
        });

        return sendSuccess(res, 200, 'Appointment marked as completed.', { appointment });
    } catch (error) {
        console.error('Complete appointment error:', error);
        return sendError(res, 500, 'Failed to complete appointment.');
    }
};

// ─── Cancel Appointment (Patient / Doctor / Admin) ────────────────────────────
export const cancelAppointment = async (req, res) => {
    try {
        const { cancellationReason } = req.body;
        const { userId, role } = req.user;

        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) return sendError(res, 404, 'Appointment not found.');

        if (!['pending', 'confirmed'].includes(appointment.status)) {
            return sendError(res, 400, `Cannot cancel an appointment with status: ${appointment.status}.`);
        }

        // Determine who is cancelling
        const isPatient = appointment.patient.toString() === userId;
        const isDoctor = appointment.doctor.toString() === userId;

        if (!isPatient && !isDoctor && role !== 'admin') {
            return sendError(res, 403, 'You are not authorized to cancel this appointment.');
        }

        let cancelledBy = role === 'admin' ? 'admin' : isDoctor ? 'doctor' : 'patient';

        appointment.status = 'cancelled';
        appointment.cancelledBy = cancelledBy;
        appointment.cancellationReason = cancellationReason || 'No reason provided';
        appointment.cancelledAt = new Date();
        await appointment.save();

        // Free up the clinic slot if it was a clinic appointment
        if (appointment.clinic && appointment.appointmentType === 'clinic') {
            const clinic = await Clinic.findById(appointment.clinic);
            if (clinic) {
                const slot = clinic.schedule_clinic.find(
                    (s) => s.appointmentId?.toString() === appointment._id.toString()
                );
                if (slot) {
                    slot.isBooked = false;
                    slot.appointmentId = null;
                    await clinic.save();
                }
            }
        }

        // Decrement doctor total appointments
        await Doctor.findByIdAndUpdate(appointment.doctor, {
            $inc: { totalAppointments: -1 },
        });

        return sendSuccess(res, 200, 'Appointment cancelled successfully.', { appointment });
    } catch (error) {
        console.error('Cancel appointment error:', error);
        return sendError(res, 500, 'Failed to cancel appointment.');
    }
};

// ─── Reschedule Appointment (Patient / Doctor) ────────────────────────────────
export const rescheduleAppointment = async (req, res) => {
    try {
        const { newDate, newTime, newSlotId } = req.body;
        const { userId } = req.user;

        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) return sendError(res, 404, 'Appointment not found.');

        const isPatient = appointment.patient.toString() === userId;
        const isDoctor = appointment.doctor.toString() === userId;

        if (!isPatient && !isDoctor) {
            return sendError(res, 403, 'Only the patient or doctor can reschedule this appointment.');
        }

        if (!['pending', 'confirmed'].includes(appointment.status)) {
            return sendError(res, 400, `Cannot reschedule an appointment with status: ${appointment.status}.`);
        }

        // If clinic appointment, swap the slot
        if (appointment.appointmentType === 'clinic' && newSlotId) {
            const clinic = await Clinic.findById(appointment.clinic);
            if (!clinic) return sendError(res, 404, 'Clinic not found.');

            // Free old slot
            const oldSlot = clinic.schedule_clinic.find(
                (s) => s.appointmentId?.toString() === appointment._id.toString()
            );
            if (oldSlot) {
                oldSlot.isBooked = false;
                oldSlot.appointmentId = null;
            }

            // Lock new slot
            const newSlot = clinic.schedule_clinic.id(newSlotId);
            if (!newSlot) return sendError(res, 404, 'New slot not found.');
            if (newSlot.isBooked) return sendError(res, 400, 'The new slot is already booked.');
            if (!newSlot.isAvailable) return sendError(res, 400, 'The new slot is not available.');

            newSlot.isBooked = true;
            newSlot.appointmentId = appointment._id;
            await clinic.save();
        }

        appointment.date = newDate || appointment.date;
        appointment.Time = newTime || appointment.Time;
        appointment.status = 'rescheduled';
        await appointment.save();

        return sendSuccess(res, 200, 'Appointment rescheduled successfully.', { appointment });
    } catch (error) {
        console.error('Reschedule appointment error:', error);
        return sendError(res, 500, 'Failed to reschedule appointment.');
    }
};

// ─── Add Doctor Notes & Prescription (Doctor) ─────────────────────────────────
export const addDoctorNotes = async (req, res) => {
    try {
        const { doctorNotes, prescription } = req.body;

        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) return sendError(res, 404, 'Appointment not found.');

        if (appointment.doctor.toString() !== req.user.userId) {
            return sendError(res, 403, 'Only the assigned doctor can add notes to this appointment.');
        }

        if (appointment.status !== 'completed') {
            return sendError(res, 400, 'Notes can only be added to completed appointments.');
        }

        if (doctorNotes) appointment.doctorNotes = doctorNotes;
        if (prescription) appointment.prescription = prescription;
        await appointment.save();

        return sendSuccess(res, 200, 'Notes and prescription saved successfully.', { appointment });
    } catch (error) {
        console.error('Add doctor notes error:', error);
        return sendError(res, 500, 'Failed to save notes.');
    }
};

// ─── Mark No Show (Doctor) ────────────────────────────────────────────────────
export const markNoShow = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) return sendError(res, 404, 'Appointment not found.');

        if (appointment.doctor.toString() !== req.user.userId) {
            return sendError(res, 403, 'Only the assigned doctor can mark a no-show.');
        }

        if (appointment.status !== 'confirmed') {
            return sendError(res, 400, `Cannot mark no-show for an appointment with status: ${appointment.status}.`);
        }

        appointment.status = 'no_show';
        await appointment.save();

        // Free up the clinic slot
        if (appointment.clinic && appointment.appointmentType === 'clinic') {
            const clinic = await Clinic.findById(appointment.clinic);
            if (clinic) {
                const slot = clinic.schedule_clinic.find(
                    (s) => s.appointmentId?.toString() === appointment._id.toString()
                );
                if (slot) {
                    slot.isBooked = false;
                    slot.appointmentId = null;
                    await clinic.save();
                }
            }
        }

        return sendSuccess(res, 200, 'Patient marked as no-show.', { appointment });
    } catch (error) {
        console.error('Mark no-show error:', error);
        return sendError(res, 500, 'Failed to mark no-show.');
    }
};
