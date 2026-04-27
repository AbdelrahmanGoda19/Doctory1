import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DoctorProfile',
        required: true
    },
    appointmentDate: { type: Date, required: true },
    appointmentTime: { type: String, required: true }, // e.g., "10:30 AM"
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled'],
        default: 'pending'
    },
    reasonForVisit: { type: String },
    notes: { type: String } // For the doctor to add notes after the visit
}, { timestamps: true });

const appointmentModel = mongoose.models.Appointment || mongoose.model('Appointment' , appointmentSchema)

export default appointmentModel