import 'dotenv/config';
import { createApp } from './src/app.js';

const app = createApp();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 [AWS Cloud Backend] Server is running on http://localhost:${PORT}`);
  console.log(`📦 S3 Bucket: ${process.env.S3_BUCKET_NAME || 'tuantm-assets-bucket'}`);
  console.log(`⚡ Region: ${process.env.REGION || 'ap-southeast-1'}`);
});
