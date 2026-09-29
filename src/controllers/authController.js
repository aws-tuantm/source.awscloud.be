import * as cognitoService from '../services/cognitoService.js';
import { isValidEmail } from '../utils/validators.js';

export const handleSignUp = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Địa chỉ email không đúng định dạng.' });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Mật khẩu phải có tối thiểu 8 ký tự.' });
    }

    const result = await cognitoService.signUpUser({ email, password, name });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

export const handleConfirmSignUp = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Email không hợp lệ.' });
    }
    if (!code) {
      return res.status(400).json({ error: 'Mã xác thực OTP là bắt buộc.' });
    }

    const result = await cognitoService.confirmUserSignUp({ email, code });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

export const handleLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Email không hợp lệ.' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Mật khẩu là bắt buộc.' });
    }

    const result = await cognitoService.loginUser({ email, password });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

export const handleResendCode = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Email không hợp lệ.' });
    }

    const result = await cognitoService.resendOtpCode({ email });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};
