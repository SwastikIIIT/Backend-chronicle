import { passwordChange, requestPasswordReset } from '../controllers/resetController.js';
import express from 'express'

const router = express.Router();

router.post('/link', requestPasswordReset)
router.post('/reset', passwordChange)

export default router;