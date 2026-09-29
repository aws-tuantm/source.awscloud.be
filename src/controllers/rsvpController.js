import * as rsvpService from '../services/rsvpService.js';
import * as s3Service from '../services/s3Service.js';
import { isValidEmail } from '../utils/validators.js';

export const handleRsvpSubmit = async (req, res) => {
  try {
    const { event_id, email, full_name, response } = req.body;
    let avatar_url = req.body.avatar_url || null;

    if (!event_id) {
      return res.status(400).json({ error: 'Mã sự kiện (event_id) là bắt buộc.' });
    }
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Địa chỉ email không đúng định dạng.' });
    }
    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ error: 'Họ và tên là bắt buộc.' });
    }

    // Nếu người dùng upload kèm file avatar multipart qua form-data
    if (req.file) {
      const uploadResult = await s3Service.uploadBufferToS3(req.file);
      avatar_url = uploadResult.url;
    }

    const result = await rsvpService.saveRsvp({
      event_id,
      email,
      full_name: full_name.trim(),
      response: response || 'Yes',
      avatar_url,
    });

    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

export const handleGetAttendees = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { response } = req.query;
    const attendees = await rsvpService.getAttendeesByEvent(eventId, response);
    return res.status(200).json(attendees);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const handleGetStats = async (req, res) => {
  try {
    const { eventId } = req.params;
    const stats = await rsvpService.getEventStats(eventId);
    return res.status(200).json(stats);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
