import { googleOAuthLogin } from '../controllers/oauthControllers.js';
import express from 'express'

const router = express.Router();

router.post('/google',googleOAuthLogin);

export default router;