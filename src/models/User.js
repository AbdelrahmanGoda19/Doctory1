import mongoose from 'mongoose';
import validator from 'validator';

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      sparse: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    phone: { type: String },
    role: {
      type: String,
      enum: ['patient', 'doctor', 'admin'],
      default: 'patient',
    },
    gender: { type: String, enum: ['male', 'female'] },
    dateOfBirth: { type: Date },
    Nationality: { type: String, default: 'Egyptian' },
    address: {
      street: String,
      city: String,
      governorate: String,
      country: { type: String, default: 'Egypt' },
    },
    favoriteDoctors: [{ type: mongoose.Types.ObjectId, ref: 'Doctor' }],

    // Email verification
    isVerified: { type: Boolean, default: false },
    otp: { type: String, default: null, select: false },
    otpExpire: { type: Date, default: null, select: false },
  },
  { timestamps: true }
);

// userSchema.index({ email: 1 });

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
