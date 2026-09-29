import { Router } from 'express';
import multer from 'multer';
import {
  handleRsvpSubmit,
  handleGetAttendees,
  handleGetStats,
} from '../controllers/rsvpController.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/rsvp', upload.single('avatar'), handleRsvpSubmit);
router.get('/attendees/:eventId', handleGetAttendees);
router.get('/stats/:eventId', handleGetStats);

export default router;
