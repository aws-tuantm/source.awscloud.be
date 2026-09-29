export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email.trim().toLowerCase());
};

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

export const validateImageFile = (file) => {
  if (!file) {
    throw new Error('Không tìm thấy file hình ảnh.');
  }

  const mime = (file.mimetype || '').toLowerCase();
  if (!ALLOWED_IMAGE_TYPES.includes(mime)) {
    throw new Error('Định dạng file không hợp lệ. Chỉ chấp nhận các định dạng ảnh: JPG, PNG, WEBP.');
  }

  if (file.size > MAX_IMAGE_SIZE) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    throw new Error(`Kích thước file (${sizeInMB}MB) vượt quá giới hạn cho phép tối đa 2MB.`);
  }

  return true;
};
