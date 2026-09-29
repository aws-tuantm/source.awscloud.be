import { SendEmailCommand } from '@aws-sdk/client-ses';
import { ses } from '../config/aws.js';
import { buildRsvpEmailHtml } from '../utils/emailTemplate.js';

export const sendRsvpConfirmationEmail = async ({ toEmail, fullName, response = 'Yes', eventId, eventDetails = {} }) => {
  const senderEmail = process.env.SES_SENDER_EMAIL || 'devblue404@gmail.com';
  if (!senderEmail) {
    return { success: false, error: 'SES_SENDER_EMAIL not configured' };
  }

  const title = eventDetails.title || eventId;
  const venue = eventDetails.venue || 'Trực tuyến / AWS Singapore Office';
  const startAt = eventDetails.start_at ? new Date(eventDetails.start_at).toLocaleString('vi-VN') : 'Sắp diễn ra';
  const description = eventDetails.description || 'Sự kiện chia sẻ kiến trúc Cloud, Serverless và AI thực chiến từ AWS Community.';
  const bannerUrl = eventDetails.banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80';

  const subject = `[AWS Event] Thư xác nhận tham gia: ${title}`;
  const isYes = response === 'Yes' || response === 'Có';

  const htmlBody = buildRsvpEmailHtml({
    title,
    description,
    venue,
    startAt,
    bannerUrl,
    fullName,
    response,
    isYes,
  });

  const textBody = `Xin chào ${fullName || 'bạn'},\n\nBạn đã đăng ký tham gia sự kiện: ${title}\nThời gian: ${startAt}\nĐịa điểm: ${venue}\nTrạng thái: ${isYes ? 'ĐÃ ĐĂNG KÝ THAM GIA' : 'TỪ CHỐI'}\n\nCảm ơn bạn!`;

  const params = {
    Source: senderEmail,
    Destination: {
      ToAddresses: [toEmail],
    },
    Message: {
      Subject: { Data: subject, Charset: 'UTF-8' },
      Body: {
        Html: { Data: htmlBody, Charset: 'UTF-8' },
        Text: { Data: textBody, Charset: 'UTF-8' },
      },
    },
  };

  try {
    const result = await ses.send(new SendEmailCommand(params));
    return { success: true, messageId: result.MessageId };
  } catch (err) {
    console.error(`Error sending SES email to ${toEmail}:`, err);
    return { success: false, error: err.message };
  }
};

export const sendBulkEmails = async ({ emails, eventId, eventDetails }) => {
  const results = [];
  for (const email of emails) {
    const res = await sendRsvpConfirmationEmail({
      toEmail: email,
      fullName: email.split('@')[0],
      response: 'Yes',
      eventId,
      eventDetails,
    });
    results.push({ email, ...res });
  }
  return results;
};
