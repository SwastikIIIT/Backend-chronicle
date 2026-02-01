
import { upload } from '../middlewares/upload.js';
import { getUserDetail, setup2FA, verify2FA , disable2FA, uploadAvatar, saveAvatar, sendEmailCode, verifyEmailCode} from '../controllers/userController.js';
import express from 'express'

const router = express.Router();

router.get('/', getUserDetail);

// multer middleware for file uploads
router.post('/avatar/upload',upload.single('image'),uploadAvatar)
router.post('/avatar/save',saveAvatar)

router.get('/2fa/setup',setup2FA);
router.post('/2fa/verify',verify2FA);
router.post('/2fa/disable',disable2FA);

router.post('/email/send', sendEmailCode)
router.post('/email/verify', verifyEmailCode)


export default router;