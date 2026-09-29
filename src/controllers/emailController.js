import * as sesService from '../services/sesService.js';
import * as eventService from '../services/eventService.js';
import { isValidEmail } from '../utils/validators.js';

export const handleSendEmail = async (req, res) => {
  try {
    const { event_id, emails, email, eventDetails } = req.body;

    if (!event_id) {
      return res.status(400).json({ error: 'Mã sự kiện (event_id) là bắt buộc để gửi email.' });
    }

    // Hỗ trợ cả mảng emails hoặc chuỗi email đơn lẻ
    let emailList = [];
    if (Array.isArray(emails)) {
      emailList = emails;
    } else if (typeof emails === 'string') {
      emailList = [emails];
    } else if (email) {
      emailList = [email];
    }

    const validEmails = emailList.map((e) => (typeof e === 'string' ? e.trim().toLowerCase() : '')).filter(isValidEmail);

    if (validEmails.length === 0) {
      return res.status(400).json({ error: 'Không tìm thấy địa chỉ email người nhận hợp lệ nào.' });
    }

    // Lấy thông tin sự kiện nếu client không truyền
    let targetEvent = eventDetails;
    if (!targetEvent || !targetEvent.title) {
      targetEvent = await eventService.getEventById(event_id).catch(() => ({}));
    }

    const results = await sesService.sendBulkEmails({
      emails: validEmails,
      eventId: event_id,
      eventDetails: targetEvent || {},
    });

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.length - successCount;

    return res.status(200).json({
      message: `Đã gửi thành công ${successCount}/${validEmails.length} email qua Amazon SES.${
        failCount > 0 ? ` (${failCount} email thất bại)` : ''
      }`,
      details: results,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
