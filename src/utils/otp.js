import crypto from 'crypto';

/**
 * Generates a secure 6-digit numeric OTP
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Returns OTP expiry Date (default 10 minutes from now)
 */
export const getOTPExpiry = (minutes = 10) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};
