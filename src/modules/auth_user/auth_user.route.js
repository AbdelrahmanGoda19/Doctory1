import { Router } from "express";
import Handeler from "../../util/error/Handeler_error.js"
import * as auth_service from "./auth_user.service.js"
import vaild_schema from "../../middleware/validation.js";
import * as schema from "../../util/valid_sechema/user_sehema.js"
const router = Router()

// console.log(schema.register_schema);

router.post("/login" ,vaild_schema(schema.login_schema), Handeler(auth_service.user_login) )
router.post("/register" , vaild_schema(schema.register_schema) ,Handeler(auth_service.resgister_user))
router.get("/activate/:token" ,Handeler(auth_service.isactivate_user))




export default router