// src/lib/jwt.js

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

// Only validate JWT_SECRET on server side
if (typeof window === 'undefined' && !JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

/**
 * Generate access token
 * @param {object} payload - User data to include in token
 * @returns {string} JWT access token
 */
export const generateAccessToken = (payload) => {
  if (typeof window !== 'undefined') {
    throw new Error('generateAccessToken can only be called on the server side');
  }

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: 'iris-app',
    audience: 'iris-users'
  });
};

/**
 * Generate refresh token
 * @param {object} payload - User data to include in token
 * @returns {string} JWT refresh token
 */
export const generateRefreshToken = (payload) => {
  if (typeof window !== 'undefined') {
    throw new Error('generateRefreshToken can only be called on the server side');
  }

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    issuer: 'iris-app',
    audience: 'iris-users'
  });
};

/**
 * Verify and decode JWT token
 * @param {string} token - JWT token to verify
 * @returns {object|null} Decoded token payload or null if invalid
 */
export const verifyToken = (token) => {
  if (typeof window !== 'undefined') {
    throw new Error('verifyToken can only be called on the server side');
  }

  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'iris-app',
      audience: 'iris-users'
    });
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
};

/**
 * Generate token pair (access + refresh)
 * @param {object} user - User object
 * @returns {object} Object containing access and refresh tokens
 */
export const generateTokenPair = (user) => {
  if (typeof window !== 'undefined') {
    throw new Error('generateTokenPair can only be called on the server side');
  }

  const payload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role.name,
    permissions: user.role.permissions
  };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken({ userId: user.id }),
    expiresIn: 15 * 60 // 15 minutes in seconds
  };
};

/**
 * Decode token without verification (for expired tokens)
 * @param {string} token - JWT token to decode
 * @returns {object|null} Decoded token payload or null if invalid
 */
export const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    console.error('Token decode failed:', error.message);
    return null;
  }
};

/**
 * Check if token is expired
 * @param {string} token - JWT token to check
 * @returns {boolean} True if token is expired
 */
export const isTokenExpired = (token) => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  
  return Date.now() >= decoded.exp * 1000;
};

/**
 * Get token expiry time
 * @param {string} token - JWT token
 * @returns {Date|null} Expiry date or null if invalid
 */
export const getTokenExpiry = (token) => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return null;
  
  return new Date(decoded.exp * 1000);
};
