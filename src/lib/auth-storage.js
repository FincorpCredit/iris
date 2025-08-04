// src/lib/auth-storage.js

const ACCESS_TOKEN_KEY = 'iris_access_token';
const REFRESH_TOKEN_KEY = 'iris_refresh_token';
const USER_KEY = 'iris_user';

/**
 * Check if we're in a browser environment
 */
const isBrowser = typeof window !== 'undefined';

/**
 * Store authentication tokens
 * @param {string} accessToken - JWT access token
 * @param {string} refreshToken - JWT refresh token
 */
export const storeTokens = (accessToken, refreshToken) => {
  if (!isBrowser) return;

  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } catch (error) {
    console.error('Failed to store tokens:', error);
  }
};

/**
 * Get access token from storage
 * @returns {string|null} Access token or null if not found
 */
export const getAccessToken = () => {
  if (!isBrowser) return null;
  
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to get access token:', error);
    return null;
  }
};

/**
 * Get refresh token from storage
 * @returns {string|null} Refresh token or null if not found
 */
export const getRefreshToken = () => {
  if (!isBrowser) return null;
  
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to get refresh token:', error);
    return null;
  }
};

/**
 * Store user data
 * @param {object} user - User object
 */
export const storeUser = (user) => {
  if (!isBrowser) return;
  
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Failed to store user:', error);
  }
};

/**
 * Get user data from storage
 * @returns {object|null} User object or null if not found
 */
export const getStoredUser = () => {
  if (!isBrowser) return null;
  
  try {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Failed to get user:', error);
    return null;
  }
};

/**
 * Clear all authentication data
 */
export const clearAuthData = () => {
  if (!isBrowser) return;
  
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error('Failed to clear auth data:', error);
  }
};

/**
 * Check if user is authenticated (has valid tokens)
 * @returns {boolean} True if user appears to be authenticated
 */
export const isAuthenticated = () => {
  if (!isBrowser) return false;
  
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  
  return !!(accessToken && refreshToken);
};

/**
 * Get authorization header for API requests
 * @returns {object|null} Authorization header object or null
 */
export const getAuthHeader = () => {
  const accessToken = getAccessToken();
  
  if (!accessToken) return null;
  
  return {
    'Authorization': `Bearer ${accessToken}`
  };
};

/**
 * Store complete authentication data
 * @param {object} authData - Object containing tokens and user data
 */
export const storeAuthData = (authData) => {
  const { accessToken, refreshToken, user } = authData;

  if (accessToken && refreshToken) {
    storeTokens(accessToken, refreshToken);
  }

  if (user) {
    storeUser(user);
  }
};

/**
 * Get all authentication data
 * @returns {object} Object containing tokens and user data
 */
export const getAuthData = () => {
  return {
    accessToken: getAccessToken(),
    refreshToken: getRefreshToken(),
    user: getStoredUser(),
    isAuthenticated: isAuthenticated()
  };
};

/**
 * Create an API client with automatic token refresh
 * @param {string} url - API endpoint URL
 * @param {object} options - Fetch options
 * @returns {Promise} Fetch response
 */
export const authenticatedFetch = async (url, options = {}) => {
  const authHeader = getAuthHeader();

  if (!authHeader) {
    throw new Error('No authentication token available');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...authHeader
    }
  });

  // If token is expired, try to refresh
  if (response.status === 401) {
    const refreshToken = getRefreshToken();

    if (refreshToken) {
      try {
        const refreshResponse = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ refreshToken })
        });

        if (refreshResponse.ok) {
          const refreshResult = await refreshResponse.json();

          // Store new tokens
          storeAuthData({
            accessToken: refreshResult.tokens.accessToken,
            refreshToken: refreshResult.tokens.refreshToken,
            user: refreshResult.user
          });

          // Retry original request with new token
          return fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              'Authorization': `Bearer ${refreshResult.tokens.accessToken}`
            }
          });
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
      }
    }

    // If refresh fails, clear auth data and redirect to login
    clearAuthData();
    window.location.href = '/login';
    throw new Error('Authentication failed');
  }

  return response;
};
