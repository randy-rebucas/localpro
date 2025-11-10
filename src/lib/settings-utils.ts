import type { AppSettings } from "@/types/app-settings";

/**
 * Get enabled payment methods from app settings
 */
export function getEnabledPaymentMethods(appSettings: AppSettings | null): string[] {
  if (!appSettings?.features?.payments) {
    // Default to all methods if settings not available
    return ["paypal", "paymaya", "gcash", "bank_transfer"];
  }

  const enabledMethods: string[] = [];
  const payments = appSettings.features.payments;

  if (payments.paypal?.enabled) enabledMethods.push("paypal");
  if (payments.paymaya?.enabled) enabledMethods.push("paymaya");
  if (payments.gcash?.enabled) enabledMethods.push("gcash");
  if (payments.bankTransfer?.enabled) enabledMethods.push("bank_transfer");

  // Cash is always available
  enabledMethods.push("cash");

  return enabledMethods;
}

/**
 * Check if a payment method is enabled
 */
export function isPaymentMethodEnabled(
  method: string,
  appSettings: AppSettings | null
): boolean {
  if (!appSettings?.features?.payments) {
    return true; // Default to enabled if settings not available
  }

  const payments = appSettings.features.payments;

  switch (method) {
    case "paypal":
      return payments.paypal?.enabled ?? false;
    case "paymaya":
      return payments.paymaya?.enabled ?? false;
    case "gcash":
      return payments.gcash?.enabled ?? false;
    case "bank_transfer":
      return payments.bankTransfer?.enabled ?? false;
    case "cash":
      return true; // Cash is always available
    default:
      return false;
  }
}

/**
 * Get default currency from app settings
 */
export function getDefaultCurrency(appSettings: AppSettings | null): string {
  return appSettings?.payments?.defaultCurrency || "PHP";
}

/**
 * Get supported currencies from app settings
 */
export function getSupportedCurrencies(appSettings: AppSettings | null): string[] {
  return appSettings?.payments?.supportedCurrencies || ["PHP", "USD", "EUR", "GBP", "JPY", "KRW", "CNY"];
}

/**
 * Get maximum file size from app settings (in bytes)
 */
export function getMaxFileSize(appSettings: AppSettings | null): number {
  return appSettings?.uploads?.maxFileSize || 10485760; // Default 10MB
}

/**
 * Get maximum file size in MB
 */
export function getMaxFileSizeMB(appSettings: AppSettings | null): number {
  return Math.round((getMaxFileSize(appSettings) / (1024 * 1024)) * 100) / 100;
}

/**
 * Get allowed image types from app settings
 */
export function getAllowedImageTypes(appSettings: AppSettings | null): string[] {
  return appSettings?.uploads?.allowedImageTypes || ["image/jpeg", "image/png", "image/gif", "image/webp"];
}

/**
 * Get allowed document types from app settings
 */
export function getAllowedDocumentTypes(appSettings: AppSettings | null): string[] {
  return appSettings?.uploads?.allowedDocumentTypes || ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
}

/**
 * Get maximum images per upload from app settings
 */
export function getMaxImagesPerUpload(appSettings: AppSettings | null): number {
  return appSettings?.uploads?.maxImagesPerUpload || 10;
}

/**
 * Check if image compression is enabled
 */
export function isImageCompressionEnabled(appSettings: AppSettings | null): boolean {
  return appSettings?.uploads?.imageCompression?.enabled ?? true;
}

/**
 * Get image compression quality
 */
export function getImageCompressionQuality(appSettings: AppSettings | null): number {
  return appSettings?.uploads?.imageCompression?.quality || 80;
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(
  feature: "marketplace" | "academy" | "jobBoard" | "referrals" | "analytics",
  appSettings: AppSettings | null
): boolean {
  if (!appSettings?.features) return true; // Default to enabled

  switch (feature) {
    case "marketplace":
      return appSettings.features.marketplace?.enabled ?? true;
    case "academy":
      return appSettings.features.academy?.enabled ?? true;
    case "jobBoard":
      return appSettings.features.jobBoard?.enabled ?? true;
    case "referrals":
      return appSettings.features.referrals?.enabled ?? true;
    case "analytics":
      return appSettings.features.analytics?.enabled ?? true;
    default:
      return true;
  }
}

/**
 * Get transaction fee percentage
 */
export function getTransactionFeePercentage(appSettings: AppSettings | null): number {
  return appSettings?.payments?.transactionFees?.percentage || 0;
}

/**
 * Get transaction fee fixed amount
 */
export function getTransactionFeeFixed(appSettings: AppSettings | null): number {
  return appSettings?.payments?.transactionFees?.fixed || 0;
}

/**
 * Calculate transaction fee for an amount
 */
export function calculateTransactionFee(amount: number, appSettings: AppSettings | null): number {
  const percentage = getTransactionFeePercentage(appSettings);
  const fixed = getTransactionFeeFixed(appSettings);
  return (amount * percentage / 100) + fixed;
}

/**
 * Get minimum payout amount
 */
export function getMinimumPayout(appSettings: AppSettings | null): number {
  return appSettings?.payments?.minimumPayout || 0;
}

/**
 * Get payout schedule from app settings
 */
export function getPayoutSchedule(appSettings: AppSettings | null) {
  return appSettings?.payments?.payoutSchedule || {
    frequency: 'weekly' as const,
    dayOfWeek: 1, // Monday
    dayOfMonth: 1
  };
}

/**
 * Format payout schedule as human-readable string
 */
export function formatPayoutSchedule(appSettings: AppSettings | null): string {
  const schedule = getPayoutSchedule(appSettings);
  const { frequency, dayOfWeek, dayOfMonth } = schedule;
  
  if (!frequency) return 'Not configured';
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  switch (frequency) {
    case 'daily':
      return 'Daily';
    case 'weekly':
      if (dayOfWeek !== undefined && dayOfWeek >= 0 && dayOfWeek <= 6) {
        return `Weekly on ${dayNames[dayOfWeek]}`;
      }
      return 'Weekly';
    case 'monthly':
      if (dayOfMonth !== undefined) {
        const day = dayOfMonth === 1 ? '1st' : dayOfMonth === 2 ? '2nd' : dayOfMonth === 3 ? '3rd' : `${dayOfMonth}th`;
        return `Monthly on the ${day}`;
      }
      return 'Monthly';
    default:
      return 'Not configured';
  }
}

/**
 * Calculate next payout date based on schedule
 */
export function getNextPayoutDate(appSettings: AppSettings | null): Date | null {
  const schedule = getPayoutSchedule(appSettings);
  const { frequency, dayOfWeek, dayOfMonth } = schedule;
  
  if (!frequency) return null;
  
  const now = new Date();
  const nextPayout = new Date(now);
  nextPayout.setHours(0, 0, 0, 0);
  
  switch (frequency) {
    case 'daily':
      // Next payout is tomorrow
      nextPayout.setDate(now.getDate() + 1);
      return nextPayout;
      
    case 'weekly':
      if (dayOfWeek !== undefined && dayOfWeek >= 0 && dayOfWeek <= 6) {
        const currentDay = now.getDay();
        let daysUntilNext = dayOfWeek - currentDay;
        
        // If the day has passed this week, move to next week
        if (daysUntilNext <= 0) {
          daysUntilNext += 7;
        }
        
        nextPayout.setDate(now.getDate() + daysUntilNext);
        return nextPayout;
      }
      // Default to next Monday if dayOfWeek not set
      const currentDay = now.getDay();
      const daysUntilMonday = (1 - currentDay + 7) % 7 || 7;
      nextPayout.setDate(now.getDate() + daysUntilMonday);
      return nextPayout;
      
    case 'monthly':
      if (dayOfMonth !== undefined && dayOfMonth >= 1 && dayOfMonth <= 31) {
        const currentDate = now.getDate();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        // Get last day of current month
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const targetDay = Math.min(dayOfMonth, lastDayOfMonth);
        
        if (currentDate < targetDay) {
          // This month's payout date hasn't passed yet
          nextPayout.setDate(targetDay);
          nextPayout.setMonth(currentMonth);
        } else {
          // Move to next month
          nextPayout.setDate(targetDay);
          nextPayout.setMonth(currentMonth + 1);
        }
        
        return nextPayout;
      }
      // Default to 1st of next month
      nextPayout.setDate(1);
      nextPayout.setMonth(now.getMonth() + 1);
      return nextPayout;
      
    default:
      return null;
  }
}

/**
 * Get password policy from app settings
 */
export function getPasswordPolicy(appSettings: AppSettings | null): {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxLoginAttempts: number;
  lockoutDuration: number;
} {
  const defaults = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
  };
  const policy = appSettings?.security?.passwordPolicy;
  return {
    ...defaults,
    ...policy,
    minLength: policy?.minLength ?? defaults.minLength,
  };
}

/**
 * Validate password against policy
 */
export function validatePassword(password: string, appSettings: AppSettings | null): {
  valid: boolean;
  errors: string[];
} {
  const policy = getPasswordPolicy(appSettings);
  const errors: string[] = [];

  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters long`);
  }
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (policy.requireNumbers && !/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get session settings
 */
export function getSessionSettings(appSettings: AppSettings | null) {
  return appSettings?.security?.sessionSettings || {
    maxSessionDuration: 24,
    allowMultipleSessions: true,
    maxConcurrentSessions: 3,
  };
}

/**
 * Get business information
 */
export function getBusinessInfo(appSettings: AppSettings | null) {
  return appSettings?.business || null;
}

/**
 * Get support channels
 */
export function getSupportChannels(appSettings: AppSettings | null) {
  return appSettings?.business?.supportChannels || null;
}

/**
 * Check if support channel is enabled
 */
export function isSupportChannelEnabled(
  channel: "email" | "phone" | "chat",
  appSettings: AppSettings | null
): boolean {
  const channels = getSupportChannels(appSettings);
  if (!channels) return false;

  switch (channel) {
    case "email":
      return channels.email?.enabled ?? false;
    case "phone":
      return channels.phone?.enabled ?? false;
    case "chat":
      return channels.chat?.enabled ?? false;
    default:
      return false;
  }
}

/**
 * Get business hours
 */
export function getBusinessHours(appSettings: AppSettings | null) {
  return appSettings?.business?.businessHours || null;
}

/**
 * Check if business is currently open
 */
export function isBusinessOpen(appSettings: AppSettings | null): boolean {
  const businessHours = getBusinessHours(appSettings);
  if (!businessHours?.schedule) return true; // Default to open

  const now = new Date();
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const currentDay = dayNames[now.getDay()];
  const currentTime = now.toTimeString().slice(0, 5); // HH:mm format

  const todaySchedule = businessHours.schedule.find(
    (s) => s.day?.toLowerCase() === currentDay
  );

  if (!todaySchedule || !todaySchedule.isOpen) {
    return false;
  }

  if (todaySchedule.startTime && todaySchedule.endTime) {
    return currentTime >= todaySchedule.startTime && currentTime <= todaySchedule.endTime;
  }

  return true;
}

