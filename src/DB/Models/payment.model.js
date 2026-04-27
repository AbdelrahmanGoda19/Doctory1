const paymentSchema = new mongoose.Schema({
    appointment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        required: true
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'EGP' },
    paymentMethod: {
        type: String,
        enum: ['card', 'cash_at_clinic', 'wallet'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'successful', 'failed', 'refunded'],
        default: 'pending'
    },
    transactionId: { type: String } // Comes from your payment gateway (e.g., Paymob, Stripe)
}, { timestamps: true });

const paymentModel = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

export default paymentModel