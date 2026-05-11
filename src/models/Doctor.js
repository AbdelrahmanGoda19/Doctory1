import mongoose, { model } from 'mongoose';

const doctorSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: [true, 'Full name is required'], maxlength: 80 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false,
    },
    phone: {
      type: String,
      required: true,
      match: [/^\+?[\d\s-]{10,15}$/, 'Invalid phone number'],
    },
    gender: { type: String, enum: ['male', 'female'] },
    dateOfBirth: { type: Date },
    region: { type: String, required: true },

    // Profile
    specialty: {
      type: String,
      enum: {
        values: ['Cardiology', 'Dermatology', 'Neurology', 'Pediatrics', 'Psychiatry'],
        message: 'Choose from the allowed specialties only',
      },
    },
    experience: { type: Number, min: 0, default: 1 },
    medical_license: { type: Number, required: true },
    languages: [{ type: String, default: 'English' }],
    image_profile: { type: String },
    title: { type: String, enum: ['Dr.', 'Prof.', 'Ass. Prof.'], default: 'Dr.' },
    bio: { type: String, maxlength: 1000 },
    isActive: { type: Boolean, default: true },

    clinic: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Clinic' }],

    homeVisit: {
      available: { type: Boolean, default: true },
      fees: { type: Number, default: 450 },
      areas: [String],
    },

    video_consulation: {
      available: { type: Boolean, default: true },
      fees: { type: Number, default: 300 },
    },

    // Verification & status
    isEmailVerified: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    otp: { type: String, default: null, select: false },
    otpExpire: { type: Date, default: null, select: false },

    // Stats
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    totalPatients: { type: Number, default: 0 },
    totalAppointments: { type: Number, default: 0 },
    earnings: { type: Number, default: 0 },
    profileViews: { type: Number, default: 0 },
    responseTime: { type: Number, default: 0 },
    acceptanceRate: { type: Number, default: 100 },
  },
  { timestamps: true }
);

doctorSchema.index({ specialty: 1 });
doctorSchema.index({ rating: -1 });
doctorSchema.index({ 'clinic': 1 });

const Doctor = mongoose.models.Doctor || model('Doctor', doctorSchema);
export default Doctor;
