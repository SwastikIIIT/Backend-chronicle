
import { login , signupUser } from '../controllers/authController.js';
import express from 'express'

const router = express.Router();

router.post('/login',login);
router.post('/signup', signupUser);

// router.get('/test',testHeaders)


export default router;