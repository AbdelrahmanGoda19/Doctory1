import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Doctor from '../models/Doctor.js';

/**
 * Recompute Doctor.rating (average of all reviews, 1 decimal) and Doctor.reviewCount.
 */
export async function recomputeDoctorRatingStats(doctorId) {
  const doctorObjectId = new mongoose.Types.ObjectId(doctorId);

  const [agg] = await Review.aggregate([
    { $match: { doctor: doctorObjectId } },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  const reviewCount = agg?.count ?? 0;
  const rating =
    reviewCount === 0 ? 0 : Math.round(agg.avgRating * 10) / 10;

  await Doctor.findByIdAndUpdate(doctorId, {
    rating,
    reviewCount,
  });

  return { rating, reviewCount };
}
