import mongoose, { model } from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      unique: true,
    },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 2000, default: '' },
  },
  { timestamps: true }
);

reviewSchema.index({ doctor: 1, createdAt: -1 });

const Review = mongoose.models.Review || model('Review', reviewSchema);
export default Review;
