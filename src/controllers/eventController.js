import * as eventService from '../services/eventService.js';

export const getEvents = async (req, res) => {
  try {
    const events = await eventService.listAllEvents();
    return res.status(200).json(events);
  } catch (err) {
    return res.status(500).json({ error: 'Không thể tải danh sách sự kiện: ' + err.message });
  }
};

export const getEvent = async (req, res) => {
  try {
    const event = await eventService.getEventById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ error: 'Không tìm thấy sự kiện.' });
    }
    return res.status(200).json(event);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const postEvent = async (req, res) => {
  try {
    const { event_id, title, description, venue, start_at, banner_url } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Tiêu đề sự kiện là bắt buộc.' });
    }

    const newEvent = await eventService.createEvent({
      event_id,
      title: title.trim(),
      description,
      venue,
      start_at,
      banner_url,
    });
    return res.status(201).json(newEvent);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

export const putEvent = async (req, res) => {
  try {
    const { title, description, venue, start_at, banner_url } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Tiêu đề sự kiện là bắt buộc.' });
    }

    const updated = await eventService.updateEvent(req.params.eventId, {
      title: title.trim(),
      description,
      venue,
      start_at,
      banner_url,
    });
    return res.status(200).json(updated);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

export const removeEvent = async (req, res) => {
  try {
    const result = await eventService.deleteEvent(req.params.eventId);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};
