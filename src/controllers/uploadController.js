import * as s3Service from '../services/s3Service.js';

export const handleDirectUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Không tìm thấy file tải lên.' });
    }

    const uploadResult = await s3Service.uploadBufferToS3(req.file);
    return res.status(200).json({
      message: 'Upload file lên AWS S3 thành công!',
      url: uploadResult.url,
      key: uploadResult.key,
      bucket: uploadResult.bucketName,
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

export const handleGetPresignedUrl = async (req, res) => {
  try {
    const { fileName, fileType } = req.body;
    const result = await s3Service.generatePresignedUploadUrl(fileName, fileType);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};
