/**
 * Cookie management utilities for authentication tokens
 * Implements secure cookie storage with proper SameSite and Secure flags
 */

const COOKIE_OPTIONS = {
  maxAge: 60 * 60 * 24 * 30, // 30 days
  path: '/',
  sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax' as 'Strict' | 'Lax',
  secure: process.env.NODE_ENV === 'production',
};

/**
 * Set authentication token in cookie
 */
export function setAuthToken(token: string): void {
  if (typeof document === 'undefined') return;

  const expires = new Date();
  expires.setTime(expires.getTime() + COOKIE_OPTIONS.maxAge * 1000);
  
  const cookieString = [
    `auth_token=${token}`,
    `Path=${COOKIE_OPTIONS.path}`,
    `Max-Age=${COOKIE_OPTIONS.maxAge}`,
    `SameSite=${COOKIE_OPTIONS.sameSite}`,
    ...(COOKIE_OPTIONS.secure ? ['Secure'] : []),
  ].join('; ');

  document.cookie = cookieString;
}

/**
 * Set refresh token in cookie
 */
export function setRefreshToken(refreshToken: string): void {
  if (typeof document === 'undefined') return;

  const expires = new Date();
  expires.setTime(expires.getTime() + COOKIE_OPTIONS.maxAge * 1000);
  
  const cookieString = [
    `refresh_token=${refreshToken}`,
    `Path=${COOKIE_OPTIONS.path}`,
    `Max-Age=${COOKIE_OPTIONS.maxAge}`,
    `SameSite=${COOKIE_OPTIONS.sameSite}`,
    ...(COOKIE_OPTIONS.secure ? ['Secure'] : []),
  ].join('; ');

  document.cookie = cookieString;
}

/**
 * Get authentication token from cookie
 */
export function getAuthToken(): string | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';');
  const authTokenCookie = cookies.find(cookie => 
    cookie.trim().startsWith('auth_token=')
  );

  if (authTokenCookie) {
    return authTokenCookie.split('=')[1]?.trim() || null;
  }

  return null;
}

/**
 * Get refresh token from cookie
 */
export function getRefreshToken(): string | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';');
  const refreshTokenCookie = cookies.find(cookie => 
    cookie.trim().startsWith('refresh_token=')
  );

  if (refreshTokenCookie) {
    return refreshTokenCookie.split('=')[1]?.trim() || null;
  }

  return null;
}

/**
 * Remove authentication token from cookie
 */
export function removeAuthToken(): void {
  if (typeof document === 'undefined') return;
  document.cookie = 'auth_token=; Path=/; Max-Age=0; SameSite=Lax';
}

/**
 * Remove refresh token from cookie
 */
export function removeRefreshToken(): void {
  if (typeof document === 'undefined') return;
  document.cookie = 'refresh_token=; Path=/; Max-Age=0; SameSite=Lax';
}

/**
 * Remove all authentication tokens
 */
export function removeAllTokens(): void {
  removeAuthToken();
  removeRefreshToken();
}

