import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3 } from '../config/aws.js';
import { validateImageFile } from '../utils/validators.js';

export const uploadBufferToS3 = async (file) => {
  validateImageFile(file);

  const bucketName = process.env.S3_BUCKET_NAME || 'tuantm-assets-bucket';
  const sanitizedFileName = (file.originalname || 'image.png').replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `uploads/${Date.now()}-${sanitizedFileName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3.send(command);

  const region = process.env.REGION || 'ap-southeast-1';
  const url = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;

  return { url, key, bucketName };
};

export const generatePresignedUploadUrl = async (fileName, fileType) => {
  const bucketName = process.env.S3_BUCKET_NAME || 'tuantm-assets-bucket';
  const sanitized = (fileName || 'image.png').replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `uploads/${Date.now()}-${sanitized}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: fileType || 'image/jpeg',
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
  const region = process.env.REGION || 'ap-southeast-1';
  const publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;

  return { uploadUrl, publicUrl, key };
};
