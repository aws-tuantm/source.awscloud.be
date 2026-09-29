import { Router } from 'express';
import {
  getEvents,
  getEvent,
  postEvent,
  putEvent,
  removeEvent,
} from '../controllers/eventController.js';

const router = Router();

router.get('/', getEvents);
router.get('/:eventId', getEvent);
router.post('/', postEvent);
router.put('/:eventId', putEvent);
router.delete('/:eventId', removeEvent);

export default router;
