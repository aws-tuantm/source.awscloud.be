import {
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  ResendConfirmationCodeCommand
} from '@aws-sdk/client-cognito-identity-provider';
import { cognito } from '../config/aws.js';

const getClientId = () => process.env.COGNITO_CLIENT_ID || '2g6fhbqqkt805nl5g0aicmgp0n';

export const signUpUser = async ({ email, password, name }) => {
  const clientId = getClientId();
  const command = new SignUpCommand({
    ClientId: clientId,
    Username: email.trim().toLowerCase(),
    Password: password,
    UserAttributes: [
      { Name: 'email', Value: email.trim().toLowerCase() },
      ...(name ? [{ Name: 'name', Value: name }] : []),
    ],
  });

  const result = await cognito.send(command);
  return {
    message: 'Đăng ký tài khoản thành công! Vui lòng kiểm tra mã OTP gửi về email của bạn.',
    userSub: result.UserSub,
    isConfirmed: result.UserConfirmed,
  };
};

export const confirmUserSignUp = async ({ email, code }) => {
  const clientId = getClientId();
  const command = new ConfirmSignUpCommand({
    ClientId: clientId,
    Username: email.trim().toLowerCase(),
    ConfirmationCode: code.trim(),
  });

  await cognito.send(command);
  return {
    message: 'Xác thực tài khoản thành công! Bạn có thể đăng nhập ngay bây giờ.',
  };
};

export const loginUser = async ({ email, password }) => {
  const clientId = getClientId();
  const command = new InitiateAuthCommand({
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: clientId,
    AuthParameters: {
      USERNAME: email.trim().toLowerCase(),
      PASSWORD: password,
    },
  });

  const result = await cognito.send(command);
  return {
    message: 'Đăng nhập thành công!',
    tokens: {
      accessToken: result.AuthenticationResult.AccessToken,
      idToken: result.AuthenticationResult.IdToken,
      refreshToken: result.AuthenticationResult.RefreshToken,
      expiresIn: result.AuthenticationResult.ExpiresIn,
    },
    user: {
      email: email.trim().toLowerCase(),
    },
  };
};

export const resendOtpCode = async ({ email }) => {
  const clientId = getClientId();
  const command = new ResendConfirmationCodeCommand({
    ClientId: clientId,
    Username: email.trim().toLowerCase(),
  });

  const result = await cognito.send(command);
  return {
    message: 'Đã gửi lại mã xác thực vào email của bạn.',
    destination: result.CodeDeliveryDetails?.Destination,
  };
};
