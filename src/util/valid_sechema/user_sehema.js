import joi from "joi";

// 🔐 Login Schema
export const login_schema = joi.object({
  email: joi.string().email().required(),

  password: joi.string().required()
}).required();


// 📝 Register Schema
export const register_schema = joi.object({
  email: joi.string().email().required(),

  password: joi.string().min(6).required(),

  confirmPassword: joi
    .string()
    .valid(joi.ref("password"))
    .required()
    .messages({
      "any.only": "Passwords do not match"
    }),

  fullName: joi.string().min(4).max(50).required(),

  phone: joi
    .string()
    .pattern(/^[0-9]{10,15}$/)
    .required()
,
role:joi.string().valid('patient', 'admin')
,  gender: joi.string().valid( 'male', 'female')
}).required()