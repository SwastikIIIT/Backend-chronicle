
import { biometricOptions, biometricVerify, login , signupUser } from '../controllers/authController.js';
import express from 'express'

const router = express.Router();

router.post('/login',login);
router.post('/signup', signupUser);
router.post('/biometric/options', biometricOptions);
router.post('/biometric/login', biometricVerify);

// router.get('/test',testHeaders)


export default router;