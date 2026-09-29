import { Router } from 'express';
import {
  handleSignUp,
  handleConfirmSignUp,
  handleLogin,
  handleResendCode,
} from '../controllers/authController.js';

const router = Router();

router.post('/signup', handleSignUp);
router.post('/confirm-signup', handleConfirmSignUp);
router.post('/login', handleLogin);
router.post('/resend-code', handleResendCode);

export default router;
