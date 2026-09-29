import { getDbPool } from '../config/db.js';

export const listAllEvents = async () => {
  const pool = getDbPool();
  const [rows] = await pool.query('SELECT * FROM events ORDER BY start_at DESC');
  return rows;
};

export const getEventById = async (eventId) => {
  const pool = getDbPool();
  const [rows] = await pool.query('SELECT * FROM events WHERE event_id = ?', [eventId]);
  return rows[0] || null;
};

export const createEvent = async ({ event_id, title, description, venue, start_at, banner_url }) => {
  const pool = getDbPool();
  const id = event_id || `event-${Date.now()}`;
  
  await pool.query(
    'INSERT INTO events (event_id, title, description, venue, start_at, banner_url) VALUES (?, ?, ?, ?, ?, ?)',
    [id, title, description || null, venue || null, start_at || new Date().toISOString(), banner_url || null]
  );

  return { event_id: id, title, description, venue, start_at, banner_url };
};

export const updateEvent = async (eventId, { title, description, venue, start_at, banner_url }) => {
  const pool = getDbPool();
  await pool.query(
    'UPDATE events SET title = ?, description = ?, venue = ?, start_at = ?, banner_url = ? WHERE event_id = ?',
    [title, description || null, venue || null, start_at || new Date().toISOString(), banner_url || null, eventId]
  );

  return { event_id: eventId, title, description, venue, start_at, banner_url };
};

export const deleteEvent = async (eventId) => {
  const pool = getDbPool();
  await pool.query('DELETE FROM events WHERE event_id = ?', [eventId]);
  return { message: `Đã xóa sự kiện ${eventId} thành công.` };
};
