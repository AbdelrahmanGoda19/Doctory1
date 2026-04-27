import mongoose from "mongoose"
import userModel from "../DB/Models/user.model.js"
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
export const getUsers = async (req, res) => {
    try {
        const users = await userModel.find().select('role firstName lastName email phone gender dateOfBirth')
        return res.status(200).json({ data: 'users', data: users })
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}
export const getSpecificUsers = async (req, res) => {
    try {
        const {id} = req.params
        if(!mongoose.Types.ObjectId.isValid(id) || !id){
            return res.status(409).json({ message: 'Invalid Id' })
        }
        const users = await userModel.findById(id).select('role firstName lastName email phone gender dateOfBirth')
        return res.status(200).json({ data: 'users', data: users })
    } catch (error) {
        return res.status(500).json({ message: error.message , stack:error.stack })
    }
}

export const signUp = async (req, res) => {

    try {
        let { role, firstName, lastName,email, password, phone, gender, dateOfBirth } = req.body


        if (!role || !firstName || !lastName || !email || !password || !phone || !gender || !dateOfBirth) {
            return res.status(400).json({ message: 'please fill all required fields' })
        } else {

            const isExistUser = await userModel.findOne({ email })
            if (isExistUser) {
                return res.status(409).json({ message: 'user is already exist' })
            } else {
                const hashedPassword = bcrypt.hashSync(password, 8)
                await userModel.create({
                    role,
                    firstName,
                    lastName,
                    email,
                    phone,
                    gender,
                    password: hashedPassword,
                    dateOfBirth: dateOfBirth
                })
                let user = await userModel.findOne({email}).select('role firstName lastName email phone gender dateOfBirth')
                return res.status(201).json({ message: 'User created successfully', user })
            }
        }
    } catch (error) {
        return res.status(500).json({ message: 'Error while adding user', msg: error.message })
    }
}

export const signIn = async (req, res) => {

    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ message: 'please fill all required fields' })
        } else {
            const user = await userModel.findOne({ email })
            if (!user) {
                return res.status(401).json({ message: 'user is not exist' })
            } else {
                const isComapared = bcrypt.compareSync(password, user.password)
                if (!isComapared) {
                    return res.status(400).json({ message: 'Username or password is incorrect' })
                } else { // payload and secret key
                    //adding email to token
                    const token = jwt.sign({ id: user._id, role: user.role, email: user.email, isLoggedIn: true }, process.env.JWT_SECRET, { expiresIn: '1h' })
                    return res.status(200).json({ message: 'user logged in successfully', token })
                }
            }
        }
    } catch (error) {
        return res.status(500).json({ message: 'Error while logging user', msg: error.message })
    }
}
