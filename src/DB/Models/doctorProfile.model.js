// import mongoose from "mongoose"

// const doctorProfileSchema = new mongoose.Schema({
//     // user: {
//     //     type: mongoose.Schema.Types.ObjectId,
//     //     ref: 'User',
//     //     required: true,
//     //     unique: true
//     // },


//     yearsOfExpreince:{type:String , required:true , default: '1'},
//     specialty: { type: String, required: true },
//     bio: { type: String, required: true },
//     profileImage: { type: String },
//     consultationFee: { type: Number, required: true },
//     clinicLocation: {
//         address: { type: String, required: true },
//         city: { type: String, required: true }
//     },
//     workingDays: [{ type: String, enum: [ 'Sat', 'Sun' ,'Mon', 'Tue', 'Wed', 'Thu', 'Fri'] }],
//     startTime: { type: String }, //"09:00 AM"
//     endTime: { type: String },   //"05:00 PM"
//     isVerified: { type: Boolean, default: false , required:true }
// }, { timestamps: true })

// const doctorProfileModel = mongoose.models.DoctorProfile || mongoose.model('DoctorProfile' , doctorProfileSchema)

// export default doctorProfileModel;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////


import mongoose from 'mongoose';


const doctorSchema = new mongoose.Schema({

    fullName: { type: String, required: [true, 'First name is required'], maxlength: 80 },
    email: {
        type: String, required: [true, 'Email is required'],
        unique: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    password: { type: String, required: [true, 'Password is required'], minlength: 8, select: false },
    phone: { type: String, required: true, match: [/^\+?[\d\s-]{10,15}$/, 'Invalid phone number'] },
    gender: { type: String, enum: ['male', 'female'] },
    dateOfBirth: { type: Date },
    clinicDetails: {
        type: mongoose.Types.ObjectId,
        ref: 'Clinic',
    },
    isEmailVerified: { type: Boolean, default: false },
    region: { type: String, required: true },

    /////////////////////////////profile/////////////////////////////////////////////////////


    specialty: {
        type: String, enum: {
            values: ["Cardiology", "Dermatology" , "Neurology" , "Pediatrics" , "Psychiatry"],
            message: "choose from these values only"
        }
    },
    experience: { type: Number, min: 0, default: 1 }, // years
    medical_license: { type: Number, required: true },
    languages: [{ type: String, default: "English" }],
    image_profile: {
        type: String
    },



    title: { type: String, enum: ['Dr.', 'Prof.', 'Ass. Prof.'], default: 'Dr.' },//not in frontend 
    bio: { type: String, maxlength: 1000 },
    // qualifications: [{
    //     degree: String,
    //     institution: String,
    //     year: Number
    // }],
    isActive: { type: Boolean, default: true },

    clinic: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Clinic' }],

    homeVisit: {                                                // not in front 
        available: { type: Boolean, default: false },
        fees: { type: Number, default: 0 },
        areas: [String] // service areas
    },

    video_consulation: {                                                // not in front 
        available: { type: Boolean, default: false },
        fees: { type: Number, default: 0 },
    },
    /////////////////////////////////////////////////////////////////////////////
    // complete
    isVerified: { type: Boolean, default: false },
    // isProfileComplete: { type: Boolean, default: false },
    // isAvailableForBooking: { type: Boolean, default: true },

    ///////////////////////////////////////////////////////////////
    // Rate acount
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    totalPatients: { type: Number, default: 0 }, // function query => all appiontemt 
    totalAppointments: { type: Number, default: 0 },
    earnings: { type: Number, default: 0 },



    // Statastic on profile
    profileViews: { type: Number, default: 0 },
    responseTime: { type: Number, default: 0 }, // avg hours
    acceptanceRate: { type: Number, default: 100 },


}, {
    timestamps: true,

});

// Indexes
doctorSchema.index({ specialty: 1 });
doctorSchema.index({ rating: -1 });
doctorSchema.index({ 'clinics.address.city': 1 });



const doctorModel = mongoose.models.Doctor || model('Doctor', doctorSchema)
export default doctorModel