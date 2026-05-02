import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
  dayOfWeek: {
    type: String,
    enum: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    required: true,
  },
  isAvailable: { type: Boolean, default: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true }, // "09:00"
  endTime: { type: String, required: true },   // "09:30"
  isBooked: { type: Boolean, default: false },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
});

const clinicSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: {
      street: String,
      city: { type: String, required: true },
      governorate: String,
      country: { type: String, default: 'Egypt' },
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    phone: String,
    feveseta: { type: Number, required: true, min: 0 }, // consultation fee
    images: [String],
    Doctor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }],
    schedule_clinic: [scheduleSchema],
  },
  { timestamps: true }
);

const Clinic = mongoose.models.Clinic || mongoose.model('Clinic', clinicSchema);
export default Clinic;
