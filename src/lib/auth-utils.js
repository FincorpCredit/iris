// src/lib/auth-utils.js

import bcrypt from 'bcrypt';
import crypto from 'crypto';

/**
 * Generate a secure temporary password
 * @param {number} length - Length of the password (default: 12)
 * @returns {string} Generated password
 */
export const generateTemporaryPassword = (length = 12) => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  
  // Ensure at least one character from each category
  let password = '';
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest with random characters from all categories
  const allChars = lowercase + uppercase + numbers + symbols;
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password to randomize the order
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * Generate a 6-digit numeric code
 * @returns {string} 6-digit code
 */
export const generateSixDigitCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generate a secure random code using crypto
 * @param {number} length - Length of the code (default: 6)
 * @returns {string} Generated code
 */
export const generateSecureCode = (length = 6) => {
  const digits = '0123456789';
  let code = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, digits.length);
    code += digits[randomIndex];
  }
  
  return code;
};

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @param {number} saltRounds - Number of salt rounds (default: 10)
 * @returns {Promise<string>} Hashed password
 */
export const hashPassword = async (password, saltRounds = 10) => {
  try {
    return await bcrypt.hash(password, saltRounds);
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
};

/**
 * Verify a password against its hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} True if password matches
 */
export const verifyPassword = async (password, hash) => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
};

/**
 * Generate expiry time for temporary codes
 * @param {number} minutes - Minutes from now (default: 10)
 * @returns {Date} Expiry date
 */
export const generateCodeExpiry = (minutes = 10) => {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + minutes);
  return expiry;
};

/**
 * Check if a code has expired
 * @param {Date} expiryDate - The expiry date to check
 * @returns {boolean} True if expired
 */
export const isCodeExpired = (expiryDate) => {
  return new Date() > new Date(expiryDate);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result with isValid and errors
 */
export const validatePasswordStrength = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Generate a secure session token
 * @param {number} length - Length of the token (default: 32)
 * @returns {string} Generated token
 */
export const generateSessionToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Sanitize email address
 * @param {string} email - Email to sanitize
 * @returns {string} Sanitized email
 */
export const sanitizeEmail = (email) => {
  return email.toLowerCase().trim();
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
