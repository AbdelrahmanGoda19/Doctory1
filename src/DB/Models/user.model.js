import mongoose from "mongoose"
import validator from 'validator'
// import {schema , model} from 'mongoose'
const userSchema = new mongoose.Schema({
    fullName: { type: String, required: [true, 'userName is required'], trim: true, maxlength: 50 },
    email: {
        type: String, required: [true, 'Email is required'],
        unique: true, sparse: true, lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    Nationality: {
        type: String,
        default: 'Egyptian'

    },
    address: {
        street: String,
        city: String,
        governorate: String,
        country: { type: String, default: 'Egypt' }
    },
    password: {
        type: String,
        required: true,
        validate: {
            validator: function (value) {
                return validator.isStrongPassword(value, {
                    minLength: 8,
                    minLowercase: 1,
                    minUppercase: 0,
                    minNumbers: 1,
                    minSymbols: 0
                });
            },
            message: 'Password is too weak, Please insert a Strong password!!'
        }
    },
    phone: { type: String },
    role: {
        type: String,
        enum: ['patient', 'doctor', 'admin'],
        default: 'patient'
    },
    favoriteDoctors: [{ type: mongoose.Types.ObjectId, ref: 'Doctor' }],
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female'] },

}, { timestamps: true })


const userModel = mongoose.models.User || mongoose.model('User', userSchema)

export default userModel;