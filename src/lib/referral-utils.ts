/**
 * Referral Code Management Utilities
 * 
 * Handles capturing, storing, and managing referral codes across the authentication flow.
 * Designed for mobile authentication where users are auto-created.
 */
import { logger } from './logger';

const REFERRAL_CODE_KEY = 'referral_code';
const REFERRAL_CODE_EXPIRY_DAYS = 30;

/**
 * Get referral code from URL search params
 */
export function getReferralCodeFromURL(searchParams: URLSearchParams): string | null {
  return searchParams.get('ref');
}

/**
 * Store referral code in both localStorage and cookie for persistence
 */
export function storeReferralCode(code: string): void {
  if (!code || code.trim().length === 0) {
    return;
  }

  const trimmedCode = code.trim().toUpperCase();

  // Store in localStorage
  try {
    localStorage.setItem(REFERRAL_CODE_KEY, trimmedCode);
  } catch (error) {
    logger.warn('Failed to store referral code in localStorage', { error: error instanceof Error ? error.message : String(error) });
  }

  // Store in cookie for cross-session persistence
  try {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + REFERRAL_CODE_EXPIRY_DAYS);
    
    const cookieValue = `${REFERRAL_CODE_KEY}=${trimmedCode}; expires=${expirationDate.toUTCString()}; path=/; SameSite=Lax`;
    document.cookie = cookieValue;
  } catch (error) {
    logger.warn('Failed to store referral code in cookie', { error: error instanceof Error ? error.message : String(error) });
  }
}

/**
 * Get stored referral code from localStorage or cookie
 */
export function getStoredReferralCode(): string | null {
  // Try cookie first (more reliable for cross-session)
  try {
    const cookies = document.cookie.split('; ');
    const referralCookie = cookies.find(row => row.startsWith(`${REFERRAL_CODE_KEY}=`));
    if (referralCookie) {
      const code = referralCookie.split('=')[1];
      if (code) return code;
    }
  } catch (error) {
    logger.warn('Failed to read referral code from cookie', { error: error instanceof Error ? error.message : String(error) });
  }

  // Fallback to localStorage
  try {
    const code = localStorage.getItem(REFERRAL_CODE_KEY);
    if (code) return code;
  } catch (error) {
    logger.warn('Failed to read referral code from localStorage', { error: error instanceof Error ? error.message : String(error) });
  }

  return null;
}

/**
 * Clear stored referral code from both storage mechanisms
 */
export function clearReferralCode(): void {
  // Clear localStorage
  try {
    localStorage.removeItem(REFERRAL_CODE_KEY);
  } catch (error) {
    logger.warn('Failed to clear referral code from localStorage', { error: error instanceof Error ? error.message : String(error) });
  }

  // Clear cookie
  try {
    document.cookie = `${REFERRAL_CODE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  } catch (error) {
    logger.warn('Failed to clear referral code from cookie', { error: error instanceof Error ? error.message : String(error) });
  }
}

/**
 * Validate referral code format (client-side basic validation)
 * Full validation should be done on backend
 */
export function isValidReferralCodeFormat(code: string): boolean {
  if (!code || code.length < 3 || code.length > 20) {
    return false;
  }
  
  // Allow alphanumeric and common separators (e.g., ABC-123)
  const referralCodePattern = /^[A-Z0-9_-]+$/i;
  return referralCodePattern.test(code);
}

/**
 * Extract referral code from referral link URL
 */
export function extractReferralCodeFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('ref');
  } catch {
    // If URL parsing fails, try regex fallback
    const match = url.match(/[?&]ref=([^&]+)/);
    return match ? match[1] : null;
  }
}

/**
 * Check if we're in a referral signup flow
 */
export function hasPendingReferral(): boolean {
  return getStoredReferralCode() !== null;
}

