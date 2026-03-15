import { passwordChange, requestPasswordReset } from '../controllers/resetController.js';
import express from 'express'
import { rateLimiter } from '../middlewares/password-limiter.js';

const router = express.Router();

router.post('/link', rateLimiter(120) ,requestPasswordReset)
router.post('/reset', rateLimiter(120) ,passwordChange)

export default router;