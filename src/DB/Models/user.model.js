import mongoose from "mongoose"
import validator from 'validator'
const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        minLength: [3, 'First name must be at least 3 characters'],
        maxLength: [15, 'First name maximum length is 15 characters']
    },
    lastName: {
        type: String,
        required: true,
        minLength: [3, 'Last name must be at least 3 characters'],
        maxLength: [15, 'Last name maximum length is 15 characters']
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        validate: {
            validator: validator.isEmail,
            message: '{VALUE} is not a valid email',
        }
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
    phone: { type: String, required: true },
    role: {
        type: String,
        enum: ['patient', 'doctor', 'admin'],
        default: 'patient'
    },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female'] }
}, { timestamps: true })


const userModel = mongoose.models.User || mongoose.model('User' , userSchema)

export default userModel;