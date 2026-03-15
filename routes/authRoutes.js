
import { checkLocks } from '../middlewares/lock.js';
import { biometricOptions, biometricVerify, login , signupUser } from '../controllers/authController.js';
import express from 'express'

const router = express.Router();

router.post('/login',checkLocks,login);
router.post('/signup', signupUser);
router.post('/biometric/options', biometricOptions);
router.post('/biometric/login',checkLocks, biometricVerify);

// router.get('/test',testHeaders)


export default router;