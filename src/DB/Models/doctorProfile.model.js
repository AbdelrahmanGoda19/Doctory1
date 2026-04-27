import mongoose from "mongoose"

const doctorProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    yearsOfExpreince:{type:String , required:true , default: '1'},
    specialty: { type: String, required: true },
    bio: { type: String, required: true },
    profileImage: { type: String },
    consultationFee: { type: Number, required: true },
    clinicLocation: {
        address: { type: String, required: true },
        city: { type: String, required: true }
    },
    workingDays: [{ type: String, enum: [ 'Sat', 'Sun' ,'Mon', 'Tue', 'Wed', 'Thu', 'Fri'] }],
    startTime: { type: String }, //"09:00 AM"
    endTime: { type: String },   //"05:00 PM"
    isVerified: { type: Boolean, default: false , required:true }
}, { timestamps: true })

const doctorProfileModel = mongoose.models.DoctorProfile || mongoose.model('DoctorProfile' , doctorProfileSchema)

export default doctorProfileModel;