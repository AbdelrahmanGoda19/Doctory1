import mongoose, { model } from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    appointmentType: {
      type: String,
      enum: ['clinic', 'home_visit', 'video', 'voice'],
      required: true,
    },
    clinic: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic' },
    date: { type: Date, required: true },
    Time: { type: String, required: true },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no_show', 'rescheduled'],
      default: 'pending',
    },

    // Fees
    feveseta: { type: Number, required: true },
    discountApplied: { type: Number, default: 0 },
    finalFees: { type: Number, required: true },

    // Patient info snapshot
    patientAge: Number,
    patientGender: String,

    // Reason & notes
    reasonForVisit: { type: String, maxlength: 500 },
    symptoms: [String],
    doctorNotes: { type: String, maxlength: 1000 },
    prescription: { type: String },

    // Cancellation
    cancelledBy: { type: String, enum: ['patient', 'doctor', 'admin'] },
    cancellationReason: String,
    cancelledAt: Date,

    // Review
    hasReview: { type: Boolean, default: false },
    review: { type: mongoose.Schema.Types.ObjectId, ref: 'Review' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

appointmentSchema.index({ patient: 1, date: -1 });
appointmentSchema.index({ doctor: 1, date: -1 });
appointmentSchema.index({ status: 1 });

const Appointment = mongoose.models.Appointment || model('Appointment', appointmentSchema);
export default Appointment;
