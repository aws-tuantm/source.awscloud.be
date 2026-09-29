// Import MySQL (with async/await support) and AWS SDK clients
import mysql from 'mysql2/promise';
import {
  DynamoDBClient,
  BatchGetItemCommand,
  GetItemCommand,
  QueryCommand,
  TransactWriteItemsCommand
} from "@aws-sdk/client-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  AdminInitiateAuthCommand,
  ResendConfirmationCodeCommand
} from "@aws-sdk/client-cognito-identity-provider";

// Initialize AWS Clients
const awsConfig = {
  region: process.env.REGION || 'ap-southeast-1',
  ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        ...(process.env.AWS_SESSION_TOKEN ? { sessionToken: process.env.AWS_SESSION_TOKEN } : {}),
      },
    }
    : {}),
};

const dynamo = new DynamoDBClient(awsConfig);
const s3 = new S3Client(awsConfig);
const ses = new SESClient(awsConfig);
const cognito = new CognitoIdentityProviderClient(awsConfig);

// Helper function to send email via AWS SES with rich event template
const sendRsvpConfirmationEmail = async ({ toEmail, fullName, response, eventId, eventDetails = {}, avatarUrl }) => {
  const senderEmail = process.env.SES_SENDER_EMAIL || 'devblue404@gmail.com';
  if (!senderEmail) {
    return { success: false, error: 'SES_SENDER_EMAIL not configured' };
  }

  const title = eventDetails.title || eventId;
  const venue = eventDetails.venue || 'Trực tuyến / AWS Singapore Office';
  const startAt = eventDetails.start_at ? new Date(eventDetails.start_at).toLocaleString('vi-VN') : 'Sắp diễn ra';
  const description = eventDetails.description || 'Sự kiện công nghệ Cloud, DevOps, Serverless và AI thực chiến từ AWS Community.';
  const bannerUrl = eventDetails.banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80';

  const subject = `[AWS Event] Thư xác nhận tham gia: ${title}`;
  const isYes = response === 'Yes' || response === 'Có';
  const statusBadge = isYes ? 'ĐÃ ĐĂNG KÝ THAM GIA' : 'KHÔNG THAM GIA';
  const statusBg = isYes ? '#10B981' : '#6B7280';

  const htmlBody = `
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
              
              <!-- Header Image -->
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

                  <!-- Event Meta Table -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #09090b; border: 1px solid #27272a; border-radius: 10px; margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 14px 16px; border-bottom: 1px solid #27272a;">
                        <span style="font-size: 12px; color: #71717a; display: block;">Thời gian bắt đầu</span>
                        <strong style="font-size: 14px; color: #f4f4f5;">📅 ${startAt}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 14px 16px;">
                        <span style="font-size: 12px; color: #71717a; display: block;">Địa điểm tổ chức</span>
                        <strong style="font-size: 14px; color: #f4f4f5;">📍 ${venue}</strong>
                      </td>
                    </tr>
                  </table>

                  <!-- Attendee Details Box -->
                  <div style="background-color: #27272a; border-radius: 10px; padding: 18px; margin-bottom: 24px;">
                    <div style="font-size: 12px; font-weight: 600; color: #a1a1aa; text-transform: uppercase; margin-bottom: 10px;">
                      Thông tin xác nhận của bạn
                    </div>
                    
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="font-size: 14px; color: #e4e4e7; padding: 4px 0;">
                          <strong>Người nhận:</strong> ${fullName}
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 14px; color: #e4e4e7; padding: 4px 0;">
                          <strong>Email:</strong> ${toEmail}
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 14px; color: #e4e4e7; padding: 6px 0;">
                          <strong>Trạng thái RSVP:</strong> 
                          <span style="display: inline-block; padding: 3px 10px; border-radius: 6px; background-color: ${statusBg}; color: #ffffff; font-weight: bold; font-size: 11px; margin-left: 6px;">
                            ${statusBadge}
                          </span>
                        </td>
                      </tr>
                      ${avatarUrl ? `
                      <tr>
                        <td style="padding-top: 10px;">
                          <img src="${avatarUrl}" alt="Avatar" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid #3f3f46;" />
                        </td>
                      </tr>` : ''}
                    </table>
                  </div>

                  <p style="margin: 0; font-size: 13px; color: #71717a; line-height: 1.5; text-align: center;">
                    Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ ban tổ chức tại <a href="mailto:${senderEmail}" style="color: #60a5fa; text-decoration: none;">${senderEmail}</a>.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 16px 24px; background-color: #09090b; border-top: 1px solid #27272a; text-align: center;">
                  <span style="font-size: 12px; color: #71717a;">
                    © 2026 AWS Cloud Events Platform | Powered by AWS Serverless & SES
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const command = new SendEmailCommand({
      Source: senderEmail,
      Destination: {
        ToAddresses: [toEmail],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8',
          },
        },
      },
    });

    await ses.send(command);
    console.log(`📧 Đã gửi email thành công tới: ${toEmail}`);
    return { success: true };
  } catch (err) {
    console.error(`⚠️ Gửi email qua SES thất bại cho ${toEmail}:`, err.message);
    return { success: false, error: err.message };
  }
};

/*
  AWS Lambda main handler function.
*/
export const handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  // Extract useful parts of the API Gateway event
  const method = event.requestContext?.http?.method || event.httpMethod || 'GET';
  const path = event.requestContext?.http?.path || event.path || '/';
  const pathParams = event.pathParameters || {};
  const queryParams = event.queryStringParameters || {};
  const body = event.body ? (typeof event.body === 'string' ? JSON.parse(event.body) : event.body) : {};

  // Handle CORS preflight request for browsers
  if (method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With",
        "Access-Control-Allow-Credentials": true
      },
      body: ''
    };
  }

  let conn = null;

  const getDbConnection = async () => {
    if (!conn) {
      conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
      });
    }
    return conn;
  };

  try {
    /*
      =======================================================
      VALIDATION HELPERS
      =======================================================
    */
    const isValidEmail = (val) => {
      if (!val || typeof val !== 'string') return false;
      return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val.trim().toLowerCase());
    };

    /*
      =======================================================
      COGNITO AUTH ROUTES: ĐĂNG KÝ, XÁC THỰC OTP, ĐĂNG NHẬP
      =======================================================
    */

    // 1. Đăng ký tài khoản (Sign Up)
    if (method === "POST" && path === "/auth/signup") {
      const email = (body.email || '').trim().toLowerCase();
      const password = body.password || '';
      const name = (body.name || '').trim();
      const clientId = process.env.COGNITO_CLIENT_ID || '2g6fhbqqkt805nl5g0aicmgp0n';

      if (!email || !isValidEmail(email)) {
        return json({ message: "Địa chỉ email không đúng định dạng." }, 400);
      }

      if (!password || password.length < 8) {
        return json({ message: "Mật khẩu phải có độ dài tối thiểu 8 ký tự." }, 400);
      }

      const userAttributes = [{ Name: "email", Value: email }];
      if (name) {
        userAttributes.push({ Name: "name", Value: name });
      }

      try {
        const command = new SignUpCommand({
          ClientId: clientId,
          Username: email,
          Password: password,
          UserAttributes: userAttributes,
        });

        const result = await cognito.send(command);
        return json({
          message: "Đăng ký tài khoản thành công! Vui lòng kiểm tra email để lấy mã OTP xác thực.",
          userSub: result.UserSub,
          isConfirmed: result.UserConfirmed,
        }, 200);
      } catch (err) {
        console.error("Cognito SignUp error:", err);
        return json({ error: err.message, code: err.name }, 400);
      }
    }

    // 2. Xác thực mã OTP (Confirm Sign Up)
    if (method === "POST" && path === "/auth/confirm-signup") {
      const email = (body.email || '').trim().toLowerCase();
      const code = (body.code || '').trim();
      const clientId = process.env.COGNITO_CLIENT_ID || '2g6fhbqqkt805nl5g0aicmgp0n';

      if (!email || !isValidEmail(email)) {
        return json({ message: "Địa chỉ email không hợp lệ." }, 400);
      }

      if (!code || !/^\d{6}$/.test(code)) {
        return json({ message: "Mã xác thực OTP phải gồm đúng 6 chữ số." }, 400);
      }

      try {
        const command = new ConfirmSignUpCommand({
          ClientId: clientId,
          Username: email,
          ConfirmationCode: code,
        });

        await cognito.send(command);
        return json({ message: "Xác thực tài khoản thành công! Bạn có thể đăng nhập ngay bây giờ." }, 200);
      } catch (err) {
        console.error("Cognito ConfirmSignUp error:", err);
        return json({ error: err.message, code: err.name }, 400);
      }
    }

    // 3. Đăng nhập (Sign In / Login)
    if (method === "POST" && path === "/auth/login") {
      const email = (body.email || '').trim().toLowerCase();
      const password = body.password || '';
      const clientId = process.env.COGNITO_CLIENT_ID || '2g6fhbqqkt805nl5g0aicmgp0n';
      const userPoolId = process.env.COGNITO_USER_POOL_ID || 'ap-southeast-1_UKuhhnlCk';

      if (!email || !isValidEmail(email)) {
        return json({ message: "Địa chỉ email không đúng định dạng." }, 400);
      }

      if (!password) {
        return json({ message: "Vui lòng nhập mật khẩu." }, 400);
      }

      try {
        let result;
        try {
          // Thử luồng USER_PASSWORD_AUTH thông thường
          const command = new InitiateAuthCommand({
            AuthFlow: "USER_PASSWORD_AUTH",
            ClientId: clientId,
            AuthParameters: {
              USERNAME: email,
              PASSWORD: password,
            },
          });
          result = await cognito.send(command);
        } catch (initiateErr) {
          // Nếu client chưa bật USER_PASSWORD_AUTH, dùng quyền IAM với ADMIN_NO_SRP_AUTH
          if (initiateErr.name === "InvalidParameterException" || initiateErr.name === "NotAuthorizedException") {
            const adminCommand = new AdminInitiateAuthCommand({
              UserPoolId: userPoolId,
              ClientId: clientId,
              AuthFlow: "ADMIN_NO_SRP_AUTH",
              AuthParameters: {
                USERNAME: email,
                PASSWORD: password,
              },
            });
            result = await cognito.send(adminCommand);
          } else {
            throw initiateErr;
          }
        }

        const authResult = result.AuthenticationResult;

        return json({
          message: "Đăng nhập thành công!",
          accessToken: authResult.AccessToken,
          idToken: authResult.IdToken,
          refreshToken: authResult.RefreshToken,
          expiresIn: authResult.ExpiresIn,
          tokenType: authResult.TokenType,
        }, 200);
      } catch (err) {
        console.error("Cognito Login error:", err);
        return json({ error: err.message, code: err.name }, 400);
      }
    }

    // 4. Gửi lại mã OTP (Resend Confirmation Code)
    if (method === "POST" && path === "/auth/resend-code") {
      const email = (body.email || '').trim().toLowerCase();
      const clientId = process.env.COGNITO_CLIENT_ID || '2g6fhbqqkt805nl5g0aicmgp0n';

      if (!email || !isValidEmail(email)) {
        return json({ message: "Vui lòng nhập email hợp lệ để gửi lại mã." }, 400);
      }

      try {
        const command = new ResendConfirmationCodeCommand({
          ClientId: clientId,
          Username: email,
        });

        await cognito.send(command);
        return json({ message: "Đã gửi lại mã OTP mới vào email của bạn!" }, 200);
      } catch (err) {
        console.error("Cognito ResendCode error:", err);
        return json({ error: err.message, code: err.name }, 400);
      }
    }

    /*
      ===============================
      ROUTE: POST /send-email (Hỗ trợ gửi nhiều email)
      ===============================
    */
    if (method === "POST" && (path === "/send-email" || path === "/email")) {
      const { event_id, email, emails } = body;

      // Extract and sanitize email list
      let emailList = [];
      if (Array.isArray(emails)) {
        emailList = emails;
      } else if (typeof emails === 'string' && emails.trim()) {
        emailList = emails.split(/[\n,;]+/).map(e => e.trim()).filter(Boolean);
      } else if (email) {
        if (typeof email === 'string' && (email.includes(',') || email.includes('\n') || email.includes(';'))) {
          emailList = email.split(/[\n,;]+/).map(e => e.trim()).filter(Boolean);
        } else {
          emailList = [email.trim()];
        }
      }

      // Unique emails validation
      const validEmails = [...new Set(emailList.map(e => e.trim().toLowerCase()).filter(isValidEmail))];

      if (!event_id) {
        return json({ message: "Thiếu trường bắt buộc 'event_id'." }, 400);
      }

      if (validEmails.length === 0) {
        return json({
          message: "Vui lòng cung cấp ít nhất một địa chỉ 'email' hợp lệ (VD: user@domain.com)."
        }, 400);
      }

      // Fetch event info from DB if possible
      let eventDetails = body.eventDetails || {};
      try {
        const db = await getDbConnection();
        const [rows] = await db.execute("SELECT * FROM events WHERE event_id = ?", [event_id]);
        if (rows.length > 0) {
          eventDetails = { ...rows[0], ...eventDetails };
        }
      } catch (dbErr) {
        console.warn("Could not query event from DB:", dbErr.message);
      }

      // Process all emails
      const results = [];
      for (const targetEmail of validEmails) {
        let fullName = "Bạn";
        let rsvpResponse = "Đã xác nhận";
        let avatarUrl = null;

        try {
          const attendeeRecord = await dynamo.send(new GetItemCommand({
            TableName: "event-rsvp-responses",
            Key: {
              pk: { S: `EVENT#${event_id}` },
              sk: { S: `RESPONDENT#${targetEmail}` }
            }
          }));

          if (attendeeRecord.Item) {
            fullName = attendeeRecord.Item.full_name?.S || fullName;
            rsvpResponse = attendeeRecord.Item.response?.S || rsvpResponse;
            avatarUrl = attendeeRecord.Item.avatar_url?.S || null;
          }
        } catch (err) {
          console.warn(`Could not retrieve attendee for ${targetEmail}:`, err.message);
        }

        const emailResult = await sendRsvpConfirmationEmail({
          toEmail: targetEmail,
          fullName: fullName,
          response: rsvpResponse,
          eventId: event_id,
          eventDetails: eventDetails,
          avatarUrl: avatarUrl,
        });

        results.push({
          email: targetEmail,
          success: emailResult.success,
          error: emailResult.error || null,
        });
      }

      const successCount = results.filter(r => r.success).length;
      const failedCount = results.length - successCount;

      if (successCount === 0) {
        return json({
          message: `Gửi thất bại cho toàn bộ ${validEmails.length} email. (Nếu đang trong AWS SES Sandbox, hãy đảm bảo các email đã được Verify trên SES Console).`,
          total: validEmails.length,
          successCount: 0,
          failedCount: validEmails.length,
          results: results
        }, 500);
      }

      return json({
        message: failedCount > 0
          ? `Đã gửi thành công ${successCount}/${validEmails.length} email! (${failedCount} email chưa verify trong SES Sandbox).`
          : `Đã gửi thành công toàn bộ ${successCount} email!`,
        total: validEmails.length,
        successCount: successCount,
        failedCount: failedCount,
        event_id: event_id,
        results: results
      }, 200);
    }

    /*
      ===============================
      ROUTE: POST /upload-url
      ===============================
    */
    if (method === "POST" && path === "/upload-url") {
      const { fileName, fileType } = body;

      if (!fileName || !fileType) {
        return json({
          message: "Thiếu trường bắt buộc: fileName và fileType."
        }, 400);
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(fileType.toLowerCase())) {
        return json({
          message: "Định dạng file không được hỗ trợ. Chỉ chấp nhận JPG, PNG, WEBP."
        }, 400);
      }

      const bucketName = process.env.S3_BUCKET_NAME || 'tuantm-assets-bucket';
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const key = `avatars/${Date.now()}-${sanitizedFileName}`;


      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        ContentType: fileType,
      });

      const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
      const fileUrl = `https://${bucketName}.s3.${process.env.REGION || 'ap-southeast-1'}.amazonaws.com/${key}`;

      return json({
        uploadUrl,
        fileUrl,
        key
      }, 200);
    }

    /*
      ===============================
      ROUTE: GET /events/{event_id}
      ===============================
    */
    if (method === "GET" && path.startsWith("/events/")) {
      const eventId = pathParams.event_id || path.split('/')[2];

      const db = await getDbConnection();
      const [rows] = await db.execute("SELECT * FROM events WHERE event_id = ?", [eventId]);
      if (rows.length === 0) {
        return json({ message: "Event not found" }, 404);
      }
      return json(rows[0]);
    }

    /*
      ===============================
      ROUTE: GET /stats/{event_id}
      ===============================
    */
    if (method === "GET" && path.startsWith("/stats/")) {
      const eventId = pathParams.event_id || path.split('/')[2];

      const responses = ['Yes', 'No'];
      const keys = responses.map(r => ({
        pk: { S: `EVENT#${eventId}` },
        sk: { S: `RESPONSE#${r}` },
      }));

      const result = await dynamo.send(new BatchGetItemCommand({
        RequestItems: { "event-rsvp-responses": { Keys: keys } }
      }));

      const items = result.Responses?.["event-rsvp-responses"] || [];
      const counts = { Yes: 0, No: 0 };
      for (const item of items) {
        const key = item.sk.S.split("#")[1];
        counts[key] = Number(item.count?.N || 0);
      }

      return json(counts);
    }

    /*
      ===============================
      ROUTE: POST /rsvp
      ===============================
    */
    if (method === "POST" && path === "/rsvp") {
      const event_id = (body.event_id || '').trim();
      const full_name = (body.full_name || '').trim();
      const email = (body.email || '').trim().toLowerCase();
      const response = (body.response || 'Yes').trim();
      const avatar_url = body.avatar_url;

      if (!event_id) {
        return json({ message: "Thiếu mã sự kiện (event_id)." }, 400);
      }

      if (!full_name || full_name.length < 2) {
        return json({ message: "Họ và tên người tham gia phải có tối thiểu 2 ký tự." }, 400);
      }

      if (!email || !isValidEmail(email)) {
        return json({ message: "Địa chỉ email không đúng định dạng (VD: example@domain.com)." }, 400);
      }

      if (response !== 'Yes' && response !== 'No') {
        return json({ message: "Trạng thái tham gia (response) phải là 'Yes' hoặc 'No'." }, 400);
      }

      const now = Date.now();

      const itemRecord = {
        pk: { S: `EVENT#${event_id}` },
        sk: { S: `RESPONDENT#${email}` },
        full_name: { S: full_name },
        email: { S: email },
        response: { S: response },
        timestamp: { N: String(now) }
      };

      if (avatar_url) {
        itemRecord.avatar_url = { S: avatar_url };
      }

      try {
        await dynamo.send(new TransactWriteItemsCommand({
          TransactItems: [
            {
              Put: {
                TableName: "event-rsvp-responses",
                Item: itemRecord,
                ConditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)"
              }
            },
            {
              Update: {
                TableName: "event-rsvp-responses",
                Key: {
                  pk: { S: `EVENT#${event_id}` },
                  sk: { S: `RESPONSE#${response}` }
                },
                UpdateExpression: "ADD #count :one",
                ExpressionAttributeNames: { "#count": "count" },
                ExpressionAttributeValues: { ":one": { N: "1" } }
              }
            }
          ]
        }));

        return json({
          message: "RSVP recorded!",
          avatar_url: avatar_url || null
        }, 200);

      } catch (err) {
        if (err.name === "TransactionCanceledException" || err.name === "ConditionalCheckFailedException") {
          return json({
            message: "Bạn đã đăng ký sự kiện này với email này trước đó rồi!",
            code: "DUPLICATE_RSVP"
          }, 409);
        }
        console.error('DynamoDB error:', err);
        return json({ error: err.message }, 500);
      }
    }


    /*
      ===============================
      ROUTE: GET /attendees/{event_id}
      ===============================
    */
    if (method === "GET" && path.startsWith("/attendees/")) {
      const eventId = pathParams.event_id || path.split('/')[2];
      const responseType = queryParams.response;

      let keyCondition = "pk = :pk AND begins_with(sk, :prefix)";
      let expressionValues = {
        ":pk": { S: `EVENT#${eventId}` },
        ":prefix": { S: "RESPONDENT#" }
      };

      const result = await dynamo.send(new QueryCommand({
        TableName: "event-rsvp-responses",
        KeyConditionExpression: keyCondition,
        ExpressionAttributeValues: expressionValues,
      }));

      let attendees = (result.Items || []).map(item => ({
        full_name: item.full_name?.S,
        email: item.email?.S,
        response: item.response?.S,
        avatar_url: item.avatar_url?.S || null,
        timestamp: parseInt(item.timestamp?.N)
      }));

      if (responseType) {
        attendees = attendees.filter(attendee => attendee.response === responseType);
      }

      return json(attendees);
    }

    /*
      ===============================
      ROUTE: GET /events
      ===============================
    */
    if (method === "GET" && path === "/events") {
      const db = await getDbConnection();
      const [rows] = await db.execute(`
        SELECT event_id, title, description, start_at, venue, banner_url, created_at
        FROM events
        ORDER BY start_at ASC
      `);
      return json(rows);
    }

    /*
      ===============================
      ROUTE: POST /events (Tạo sự kiện mới)
      ===============================
    */
    if (method === "POST" && path === "/events") {
      const { title, description, start_at, venue, banner_url } = body;
      if (!title) {
        return json({ message: "Tiêu đề sự kiện (title) là bắt buộc." }, 400);
      }

      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const event_id = body.event_id || (slug ? `${slug}-${Date.now().toString().slice(-4)}` : `event-${Date.now()}`);
      const formattedDate = start_at ? new Date(start_at).toISOString().slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' ');

      const db = await getDbConnection();
      await db.execute(
        `INSERT INTO events (event_id, title, description, start_at, venue, banner_url, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [event_id, title, description || '', formattedDate, venue || '', banner_url || '']
      );

      return json({
        message: "Tạo sự kiện mới thành công!",
        event: { event_id, title, description, start_at: formattedDate, venue, banner_url }
      }, 201);
    }

    /*
      ===============================
      ROUTE: PUT /events/{event_id} (Cập nhật sự kiện)
      ===============================
    */
    if (method === "PUT" && path.startsWith("/events/")) {
      const eventId = pathParams.event_id || path.split('/')[2];
      const { title, description, start_at, venue, banner_url } = body;

      const db = await getDbConnection();
      const formattedDate = start_at ? new Date(start_at).toISOString().slice(0, 19).replace('T', ' ') : null;

      await db.execute(
        `UPDATE events 
         SET title = COALESCE(?, title),
             description = COALESCE(?, description),
             start_at = COALESCE(?, start_at),
             venue = COALESCE(?, venue),
             banner_url = COALESCE(?, banner_url)
         WHERE event_id = ?`,
        [title || null, description || null, formattedDate, venue || null, banner_url || null, eventId]
      );

      return json({ message: "Cập nhật sự kiện thành công!", event_id: eventId }, 200);
    }

    /*
      ===============================
      ROUTE: DELETE /events/{event_id} (Xóa sự kiện)
      ===============================
    */
    if (method === "DELETE" && path.startsWith("/events/")) {
      const eventId = pathParams.event_id || path.split('/')[2];
      const db = await getDbConnection();
      await db.execute("DELETE FROM events WHERE event_id = ?", [eventId]);
      return json({ message: "Đã xóa sự kiện thành công!", event_id: eventId }, 200);
    }

    return json({ message: "Route not found" }, 404);
  } catch (err) {
    console.error('Error:', err);
    return json({ error: err.message }, 500);
  } finally {
    if (conn) await conn.end();
  }
};

function json(data, statusCode = 200) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With",
      "Access-Control-Allow-Credentials": true
    },
    body: JSON.stringify(data),
  };
}