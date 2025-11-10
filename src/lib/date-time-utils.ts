import type { UserSettings } from "@/types/user-settings";
import { getDateFormat, getTimeFormat, getTimezone } from "./user-settings-utils";

/**
 * Format date according to user's date format preference
 */
export function formatDateWithUserSettings(
  date: Date | string,
  userSettings: UserSettings | null
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const dateFormat = getDateFormat(userSettings);
  const timezone = getTimezone(userSettings);

  // Parse date format pattern
  const formatMap: Record<string, string> = {
    'MM/DD/YYYY': 'en-US',
    'DD/MM/YYYY': 'en-GB',
    'YYYY-MM-DD': 'en-CA',
  };

  const locale = formatMap[dateFormat] || 'en-US';

  // Convert date format pattern to Intl options
  let options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
  };

  if (dateFormat === 'MM/DD/YYYY') {
    options = { ...options, year: 'numeric', month: '2-digit', day: '2-digit' };
  } else if (dateFormat === 'DD/MM/YYYY') {
    options = { ...options, year: 'numeric', month: '2-digit', day: '2-digit' };
  } else if (dateFormat === 'YYYY-MM-DD') {
    options = { ...options, year: 'numeric', month: '2-digit', day: '2-digit' };
  } else {
    options = { ...options, year: 'numeric', month: 'long', day: 'numeric' };
  }

  const formatted = new Intl.DateTimeFormat(locale, options).format(dateObj);

  // Apply custom format if needed
  if (dateFormat === 'YYYY-MM-DD') {
    const parts = formatted.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[0]}-${parts[1]}`;
    }
  }

  return formatted;
}

/**
 * Format time according to user's time format preference
 */
export function formatTimeWithUserSettings(
  date: Date | string,
  userSettings: UserSettings | null
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const timeFormat = getTimeFormat(userSettings);
  const timezone = getTimezone(userSettings);

  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: timeFormat === '12h',
  };

  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
}

/**
 * Format date and time together
 */
export function formatDateTimeWithUserSettings(
  date: Date | string,
  userSettings: UserSettings | null
): string {
  const dateStr = formatDateWithUserSettings(date, userSettings);
  const timeStr = formatTimeWithUserSettings(date, userSettings);
  return `${dateStr} ${timeStr}`;
}

