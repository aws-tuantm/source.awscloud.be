export const buildRsvpEmailHtml = ({ title, description, venue, startAt, bannerUrl, fullName, response, isYes }) => {
  const statusBadge = isYes ? 'ĐÃ ĐĂNG KÝ THAM GIA' : 'KHÔNG THAM GIA';
  const statusBg = isYes ? '#10B981' : '#6B7280';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #09090b; padding: 30px 10px;">
        <tr>
          <td align="center">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #18181b; border: 1px solid #27272a; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
              
              <!-- Header Banner Image -->
              ${bannerUrl ? `
              <tr>
                <td>
                  <img src="${bannerUrl}" alt="${title}" style="width: 100%; height: 200px; object-fit: cover; display: block; border-bottom: 1px solid #27272a;" />
                </td>
              </tr>` : ''}

              <!-- Body Content -->
              <tr>
                <td style="padding: 28px 24px;">
                  <div style="display: inline-block; padding: 4px 12px; background-color: #27272a; color: #a1a1aa; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
                    AWS Cloud Event
                  </div>
                  
                  <h1 style="margin: 0 0 14px 0; font-size: 22px; font-weight: 700; color: #ffffff; line-height: 1.3;">
                    ${title}
                  </h1>

                  <p style="margin: 0 0 20px 0; font-size: 14px; color: #a1a1aa; line-height: 1.5;">
                    ${description}
                  </p>

                  <!-- Event Meta Box -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #09090b; border: 1px solid #27272a; border-radius: 10px; margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 14px 16px; border-bottom: 1px solid #27272a;">
                        <span style="font-size: 12px; color: #71717a; display: block;">Thời gian bắt đầu</span>
                        <strong style="font-size: 14px; color: #e4e4e7;">${startAt}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 14px 16px;">
                        <span style="font-size: 12px; color: #71717a; display: block;">Địa điểm tổ chức</span>
                        <strong style="font-size: 14px; color: #e4e4e7;">${venue}</strong>
                      </td>
                    </tr>
                  </table>

                  <!-- Attendee RSVP Box -->
                  <div style="background-color: #27272a; border: 1px solid #3f3f46; border-radius: 10px; padding: 18px; margin-bottom: 24px;">
                    <div style="font-size: 13px; color: #a1a1aa; margin-bottom: 6px;">Thông tin xác nhận:</div>
                    <div style="font-size: 16px; font-weight: 600; color: #ffffff; margin-bottom: 10px;">${fullName || 'Quý khách'}</div>
                    <div>
                      <span style="display: inline-block; padding: 6px 14px; background-color: ${statusBg}; color: #ffffff; font-size: 12px; font-weight: 700; border-radius: 6px; letter-spacing: 0.5px;">
                        ${statusBadge}
                      </span>
                    </div>
                  </div>

                  <p style="margin: 0; font-size: 13px; color: #71717a; line-height: 1.5;">
                    Nếu bạn có bất kỳ câu hỏi hoặc cần hỗ trợ về sự kiện, vui lòng liên hệ với Ban tổ chức AWS Cloud Team.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #09090b; padding: 18px 24px; border-top: 1px solid #27272a; text-align: center;">
                  <p style="margin: 0; font-size: 11px; color: #52525b;">
                    © 2026 AWS Cloud Events Platform | Powered by Amazon SES & AWS Serverless
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};
