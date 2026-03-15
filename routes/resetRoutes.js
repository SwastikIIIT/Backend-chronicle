import { rateLimiter } from '../middlewares/rate-limiter.js';
import { passwordChange, requestPasswordReset } from '../controllers/resetController.js';
import express from 'express'


const router = express.Router();

router.post('/link', rateLimiter(120) ,requestPasswordReset)
router.post('/reset', rateLimiter(120) ,passwordChange)

export default router;