import { upload } from '../middlewares/upload.js';
import { fetchFileInfo, uploadToIPFS, deleteFile} from '../controllers/web3Controller.js';
import express from 'express'
const router = express.Router();

// Multer middleware -> pick the file content -> req.file ya req.files 
router.post('/ipfs', upload.single('doc') ,uploadToIPFS);
router.get('/file-info', fetchFileInfo)
router.delete('/delete-file', deleteFile)


export default router;