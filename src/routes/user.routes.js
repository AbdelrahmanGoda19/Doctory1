import { Router } from "express";
import * as userController from '../controllers/user.controller.js'

const router = Router();
router.get('/' , userController.getUsers)
router.get('/:id' , userController.getSpecificUsers)
router.post('/' , userController.signUp)
router.post('/login' , userController.signIn)

export default router