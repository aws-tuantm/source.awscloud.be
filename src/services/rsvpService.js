import {
  QueryCommand,
  TransactWriteItemsCommand
} from '@aws-sdk/client-dynamodb';
import { dynamo } from '../config/aws.js';
import { getEventById } from './eventService.js';
import { sendRsvpConfirmationEmail } from './sesService.js';

const getTableName = () => process.env.TABLE_NAME || 'ServerlessRsvpPlatform-prod-RSVPTable';

export const saveRsvp = async ({ event_id, email, full_name, response = 'Yes', avatar_url = null }) => {
  const tableName = getTableName();
  const timestamp = new Date().toISOString();
  const normalizedEmail = email.trim().toLowerCase();

  const isYes = response === 'Yes' || response === 'Có';
  const attendeeStatus = isYes ? 'Yes' : 'No';

  // 1. Ghi vào DynamoDB với TransactWriteItems
  const transactItems = [
    {
      Put: {
        TableName: tableName,
        Item: {
          PK: { S: `EVENT#${event_id}` },
          SK: { S: `USER#${normalizedEmail}` },
          event_id: { S: event_id },
          email: { S: normalizedEmail },
          full_name: { S: full_name },
          response: { S: attendeeStatus },
          avatar_url: avatar_url ? { S: avatar_url } : { NULL: true },
          timestamp: { S: timestamp },
          GSI1PK: { S: `EVENT#${event_id}` },
          GSI1SK: { S: `STATUS#${attendeeStatus}` },
        },
      },
    },
    {
      Update: {
        TableName: tableName,
        Key: {
          PK: { S: `EVENT#${event_id}` },
          SK: { S: 'METADATA' },
        },
        UpdateExpression: 'ADD #cnt :inc',
        ExpressionAttributeNames: {
          '#cnt': isYes ? 'yes_count' : 'no_count',
        },
        ExpressionAttributeValues: {
          ':inc': { N: '1' },
        },
      },
    },
  ];

  await dynamo.send(new TransactWriteItemsCommand({ TransactItems: transactItems }));

  // 2. Gửi Email xác nhận qua AWS SES nếu có thể
  try {
    const eventDetails = await getEventById(event_id).catch(() => null);
    await sendRsvpConfirmationEmail({
      toEmail: normalizedEmail,
      fullName: full_name,
      response: attendeeStatus,
      eventId: event_id,
      eventDetails: eventDetails || {},
    });
  } catch (emailErr) {
    console.warn('SES Email send non-blocking error:', emailErr.message);
  }

  return {
    message: 'Đăng ký thành công!',
    data: {
      event_id,
      email: normalizedEmail,
      full_name,
      response: attendeeStatus,
      avatar_url,
      timestamp,
    },
  };
};

export const getAttendeesByEvent = async (eventId, responseFilter = '') => {
  const tableName = getTableName();

  let params;
  if (responseFilter) {
    params = {
      TableName: tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk AND GSI1SK = :sk',
      ExpressionAttributeValues: {
        ':pk': { S: `EVENT#${eventId}` },
        ':sk': { S: `STATUS#${responseFilter}` },
      },
    };
  } else {
    params = {
      TableName: tableName,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
      ExpressionAttributeValues: {
        ':pk': { S: `EVENT#${eventId}` },
        ':skPrefix': { S: 'USER#' },
      },
    };
  }

  const result = await dynamo.send(new QueryCommand(params));
  return (result.Items || []).map((item) => ({
    event_id: item.event_id?.S || eventId,
    email: item.email?.S || '',
    full_name: item.full_name?.S || '',
    response: item.response?.S || '',
    avatar_url: item.avatar_url?.S || null,
    timestamp: item.timestamp?.S || '',
  }));
};

export const getEventStats = async (eventId) => {
  const attendees = await getAttendeesByEvent(eventId);
  let yes = 0;
  let no = 0;
  for (const a of attendees) {
    if (a.response === 'Yes') yes++;
    else if (a.response === 'No') no++;
  }
  return { Yes: yes, No: no, Total: yes + no };
};
