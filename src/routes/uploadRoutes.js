import { Router } from 'express';
import multer from 'multer';
import {
  handleDirectUpload,
  handleGetPresignedUrl,
} from '../controllers/uploadController.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('file'), handleDirectUpload);
router.post('/upload-url', handleGetPresignedUrl);

export default router;
