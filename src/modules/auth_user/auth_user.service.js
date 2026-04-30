import user from "../../DB/Models/user.model.js"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

import send_email from "../../util/email/send_email.js"
import page_email from "../../util/email/page_email.js"
/////////////////////////////////////Login//////////////////////////////////////
export const user_login=async(req, res , next)=>{
const {email , password} = req.body
const result = await user.findOne({email})

if(!result)
    return next(new Error("user not found " , {cause:404}))


const hash = bcrypt.compareSync(password , result.password)

if (!hash)
    return next(new Error("password wrong  " , {cause:400}))

if (result.isEmailVerified ==false)
    return next(new Error("the account not acteviate " , {cause:401}))

const token = jwt.sign({id:result._id  , email:result.email} , process.env.key_token, {expiresIn:"30d"})

res.status(200).json({msg:result , token :token })
}


////////////////////////////////////activate///////////////////////////


export const isactivate_user = async (req, res , next)=>{

const {token} = req.params 

const {email}=jwt.verify(token , process.env.key_token)

const result = await user.findOne({email})

if(! result)
    return next (new Error("this email not found"  , {cause:404}))

result.isEmailVerified= true 
await result.save()

res.status(200).json({sucess:true , msg:"email is activate"})

}

//////////////////////////////////////resgister///////////////////////////////////

export const resgister_user = async(req, res,next)=>{

// const result= req
  const { email, password, fullName, phone, role, gender } = req.body;

const hash = bcrypt.hashSync(password , Number(process.env.number_iteration_hash))

const result = await user.create({  email, fullName, phone, role, gender , password:hash})

if (!result)
    return next(new Error("error in create user"))

const token = jwt.sign({email :email} , process.env.key_token)

const sent = await send_email({to :email , html :page_email(`http://localhost:3000/user/auth/activate/${token}`)} )

if(!sent)
     return next (new Error("this error in send email"  , {cause:500}))

res.status(200).json({sucess:true , msg :"Registeration Done please verify account ", data:result})
}