import type { UserSettings } from "@/types/user-settings";
import { defaultUserSettings } from "@/types/user-settings";

/**
 * Get privacy settings from user settings
 */
export function getPrivacySettings(userSettings: UserSettings | null) {
  return userSettings?.privacy || defaultUserSettings.privacy;
}

/**
 * Check if profile field should be visible based on privacy settings
 */
export function shouldShowProfileField(
  field: "phoneNumber" | "email" | "location" | "rating" | "portfolio",
  userSettings: UserSettings | null,
  viewerIsContact: boolean = false
): boolean {
  const privacy = getPrivacySettings(userSettings);
  const profileVisibility = privacy.profileVisibility;

  // If profile is private, only show to contacts
  if (profileVisibility === "private" && !viewerIsContact) {
    return false;
  }

  // If profile is contacts_only, only show to contacts
  if (profileVisibility === "contacts_only" && !viewerIsContact) {
    return false;
  }

  // Check specific field visibility
  switch (field) {
    case "phoneNumber":
      return privacy.showPhoneNumber;
    case "email":
      return privacy.showEmail;
    case "location":
      return privacy.showLocation;
    case "rating":
      return privacy.showRating;
    case "portfolio":
      return privacy.showPortfolio;
    default:
      return false;
  }
}

/**
 * Check if user allows direct messages
 */
export function allowsDirectMessages(userSettings: UserSettings | null): boolean {
  return getPrivacySettings(userSettings).allowDirectMessages;
}

/**
 * Check if user allows job invitations
 */
export function allowsJobInvitations(userSettings: UserSettings | null): boolean {
  return getPrivacySettings(userSettings).allowJobInvitations;
}

/**
 * Check if user allows referral requests
 */
export function allowsReferralRequests(userSettings: UserSettings | null): boolean {
  return getPrivacySettings(userSettings).allowReferralRequests;
}

/**
 * Get notification settings
 */
export function getNotificationSettings(userSettings: UserSettings | null) {
  return userSettings?.notifications || defaultUserSettings.notifications;
}

/**
 * Check if notification should be sent via push
 */
export function shouldSendPushNotification(
  type: "newMessages" | "jobMatches" | "bookingUpdates" | "paymentUpdates" | "referralUpdates" | "systemUpdates" | "marketing",
  userSettings: UserSettings | null
): boolean {
  const notifications = getNotificationSettings(userSettings);
  if (!notifications.push.enabled) return false;
  return notifications.push[type] ?? false;
}

/**
 * Check if notification should be sent via email
 */
export function shouldSendEmailNotification(
  type: "newMessages" | "jobMatches" | "bookingUpdates" | "paymentUpdates" | "referralUpdates" | "systemUpdates" | "marketing" | "weeklyDigest" | "monthlyReport",
  userSettings: UserSettings | null
): boolean {
  const notifications = getNotificationSettings(userSettings);
  if (!notifications.email.enabled) return false;
  return notifications.email[type] ?? false;
}

/**
 * Check if notification should be sent via SMS
 */
export function shouldSendSmsNotification(
  type: "urgentMessages" | "bookingReminders" | "paymentAlerts" | "securityAlerts",
  userSettings: UserSettings | null
): boolean {
  const notifications = getNotificationSettings(userSettings);
  if (!notifications.sms.enabled) return false;
  return notifications.sms[type] ?? false;
}

/**
 * Get communication settings
 */
export function getCommunicationSettings(userSettings: UserSettings | null) {
  return userSettings?.communication || defaultUserSettings.communication;
}

/**
 * Get preferred language
 */
export function getPreferredLanguage(userSettings: UserSettings | null): string {
  return getCommunicationSettings(userSettings).preferredLanguage || "en";
}

/**
 * Get timezone
 */
export function getTimezone(userSettings: UserSettings | null): string {
  return getCommunicationSettings(userSettings).timezone || "Asia/Manila";
}

/**
 * Get date format
 */
export function getDateFormat(userSettings: UserSettings | null): string {
  return getCommunicationSettings(userSettings).dateFormat || "MM/DD/YYYY";
}

/**
 * Get time format (12h or 24h)
 */
export function getTimeFormat(userSettings: UserSettings | null): "12h" | "24h" {
  return getCommunicationSettings(userSettings).timeFormat || "12h";
}

/**
 * Get preferred currency from user settings (falls back to app settings if needed)
 */
export function getUserPreferredCurrency(userSettings: UserSettings | null): string {
  return getCommunicationSettings(userSettings).currency || "PHP";
}

/**
 * Get auto-reply settings
 */
export function getAutoReplySettings(userSettings: UserSettings | null) {
  return getCommunicationSettings(userSettings).autoReply || defaultUserSettings.communication.autoReply;
}

/**
 * Check if auto-reply is enabled
 */
export function isAutoReplyEnabled(userSettings: UserSettings | null): boolean {
  return getAutoReplySettings(userSettings).enabled;
}

/**
 * Get auto-reply message
 */
export function getAutoReplyMessage(userSettings: UserSettings | null): string {
  return getAutoReplySettings(userSettings).message;
}

/**
 * Get service settings
 */
export function getServiceSettings(userSettings: UserSettings | null) {
  return userSettings?.service || defaultUserSettings.service;
}

/**
 * Get working hours
 */
export function getWorkingHours(userSettings: UserSettings | null) {
  return getServiceSettings(userSettings).workingHours || defaultUserSettings.service.workingHours;
}

/**
 * Check if user is currently working based on working hours
 */
export function isUserWorking(userSettings: UserSettings | null): boolean {
  const workingHours = getWorkingHours(userSettings);
  const now = new Date();
  const dayNames: Array<"monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"> = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const currentDayName = dayNames[now.getDay()];

  if (!workingHours.days.includes(currentDayName)) {
    return false;
  }

  const currentTime = now.toTimeString().substring(0, 5); // "HH:mm"
  return currentTime >= workingHours.start && currentTime <= workingHours.end;
}

/**
 * Get default service radius
 */
export function getDefaultServiceRadius(userSettings: UserSettings | null): number {
  return getServiceSettings(userSettings).defaultServiceRadius || 25;
}

/**
 * Check if auto-accept jobs is enabled
 */
export function isAutoAcceptJobsEnabled(userSettings: UserSettings | null): boolean {
  return getServiceSettings(userSettings).autoAcceptJobs || false;
}

/**
 * Get job value range
 */
export function getJobValueRange(userSettings: UserSettings | null) {
  const service = getServiceSettings(userSettings);
  return {
    minimum: service.minimumJobValue || 0,
    maximum: service.maximumJobValue || 100000,
  };
}

/**
 * Get preferred job types
 */
export function getPreferredJobTypes(userSettings: UserSettings | null): string[] {
  return getServiceSettings(userSettings).preferredJobTypes || [];
}

/**
 * Get emergency service settings
 */
export function getEmergencyServiceSettings(userSettings: UserSettings | null) {
  return getServiceSettings(userSettings).emergencyService || defaultUserSettings.service.emergencyService;
}

/**
 * Check if emergency service is enabled
 */
export function isEmergencyServiceEnabled(userSettings: UserSettings | null): boolean {
  return getEmergencyServiceSettings(userSettings).enabled;
}

/**
 * Get emergency service surcharge
 */
export function getEmergencyServiceSurcharge(userSettings: UserSettings | null): number {
  return getEmergencyServiceSettings(userSettings).surcharge || 0;
}

/**
 * Get payment settings
 */
export function getPaymentSettings(userSettings: UserSettings | null) {
  return userSettings?.payment || defaultUserSettings.payment;
}

/**
 * Get preferred payment method
 */
export function getPreferredPaymentMethod(userSettings: UserSettings | null): string {
  return getPaymentSettings(userSettings).preferredPaymentMethod || "paypal";
}

/**
 * Get auto-withdraw settings
 */
export function getAutoWithdrawSettings(userSettings: UserSettings | null) {
  return getPaymentSettings(userSettings).autoWithdraw || defaultUserSettings.payment.autoWithdraw;
}

/**
 * Check if auto-withdraw is enabled
 */
export function isAutoWithdrawEnabled(userSettings: UserSettings | null): boolean {
  return getAutoWithdrawSettings(userSettings).enabled;
}

/**
 * Get auto-withdraw threshold
 */
export function getAutoWithdrawThreshold(userSettings: UserSettings | null): number {
  return getAutoWithdrawSettings(userSettings).threshold || 1000;
}

/**
 * Get invoice settings
 */
export function getInvoiceSettings(userSettings: UserSettings | null) {
  return getPaymentSettings(userSettings).invoiceSettings || defaultUserSettings.payment.invoiceSettings;
}

/**
 * Check if tax should be included in invoices
 */
export function shouldIncludeTaxInInvoice(userSettings: UserSettings | null): boolean {
  return getInvoiceSettings(userSettings).includeTax || false;
}

/**
 * Get tax rate for invoices
 */
export function getInvoiceTaxRate(userSettings: UserSettings | null): number {
  return getInvoiceSettings(userSettings).taxRate || 12;
}

/**
 * Get security settings
 */
export function getSecuritySettings(userSettings: UserSettings | null) {
  return userSettings?.security || defaultUserSettings.security;
}

/**
 * Check if 2FA is enabled
 */
export function isTwoFactorAuthEnabled(userSettings: UserSettings | null): boolean {
  return getSecuritySettings(userSettings).twoFactorAuth?.enabled || false;
}

/**
 * Get 2FA method
 */
export function getTwoFactorAuthMethod(userSettings: UserSettings | null): "sms" | "email" | "authenticator" {
  return getSecuritySettings(userSettings).twoFactorAuth?.method || "sms";
}

/**
 * Get login alerts settings
 */
export function getLoginAlertsSettings(userSettings: UserSettings | null) {
  return getSecuritySettings(userSettings).loginAlerts || defaultUserSettings.security.loginAlerts;
}

/**
 * Check if login alerts are enabled
 */
export function areLoginAlertsEnabled(userSettings: UserSettings | null): boolean {
  return getLoginAlertsSettings(userSettings).enabled || false;
}

/**
 * Get session timeout in hours
 */
export function getSessionTimeout(userSettings: UserSettings | null): number {
  return getSecuritySettings(userSettings).sessionTimeout || 24;
}

/**
 * Get password change reminder settings
 */
export function getPasswordChangeReminderSettings(userSettings: UserSettings | null) {
  return getSecuritySettings(userSettings).passwordChangeReminder || defaultUserSettings.security.passwordChangeReminder;
}

/**
 * Get app settings
 */
export function getAppUserSettings(userSettings: UserSettings | null) {
  return userSettings?.app || defaultUserSettings.app;
}

/**
 * Get theme preference
 */
export function getTheme(userSettings: UserSettings | null): "light" | "dark" | "auto" {
  return getAppUserSettings(userSettings).theme || "auto";
}

/**
 * Get font size preference
 */
export function getFontSize(userSettings: UserSettings | null): "small" | "medium" | "large" {
  return getAppUserSettings(userSettings).fontSize || "medium";
}

/**
 * Get sound effects settings
 */
export function getSoundEffectsSettings(userSettings: UserSettings | null) {
  return getAppUserSettings(userSettings).soundEffects || defaultUserSettings.app.soundEffects;
}

/**
 * Check if sound effects are enabled
 */
export function areSoundEffectsEnabled(userSettings: UserSettings | null): boolean {
  return getSoundEffectsSettings(userSettings).enabled || false;
}

/**
 * Get sound effects volume
 */
export function getSoundEffectsVolume(userSettings: UserSettings | null): number {
  return getSoundEffectsSettings(userSettings).volume || 50;
}

/**
 * Check if haptic feedback is enabled
 */
export function isHapticFeedbackEnabled(userSettings: UserSettings | null): boolean {
  return getAppUserSettings(userSettings).hapticFeedback?.enabled || false;
}

/**
 * Get auto-save settings
 */
export function getAutoSaveSettings(userSettings: UserSettings | null) {
  return getAppUserSettings(userSettings).autoSave || defaultUserSettings.app.autoSave;
}

/**
 * Check if auto-save is enabled
 */
export function isAutoSaveEnabled(userSettings: UserSettings | null): boolean {
  return getAutoSaveSettings(userSettings).enabled || false;
}

/**
 * Get auto-save interval in seconds
 */
export function getAutoSaveInterval(userSettings: UserSettings | null): number {
  return getAutoSaveSettings(userSettings).interval || 30;
}

/**
 * Get data usage settings
 */
export function getDataUsageSettings(userSettings: UserSettings | null) {
  return getAppUserSettings(userSettings).dataUsage || defaultUserSettings.app.dataUsage;
}

/**
 * Get analytics settings
 */
export function getAnalyticsSettings(userSettings: UserSettings | null) {
  return userSettings?.analytics || defaultUserSettings.analytics;
}

/**
 * Check if user shares usage data
 */
export function sharesUsageData(userSettings: UserSettings | null): boolean {
  return getAnalyticsSettings(userSettings).shareUsageData || false;
}

/**
 * Check if user shares location data
 */
export function sharesLocationData(userSettings: UserSettings | null): boolean {
  return getAnalyticsSettings(userSettings).shareLocationData || false;
}

/**
 * Check if user shares performance data
 */
export function sharesPerformanceData(userSettings: UserSettings | null): boolean {
  return getAnalyticsSettings(userSettings).sharePerformanceData || false;
}

/**
 * Check if personalized recommendations are enabled
 */
export function arePersonalizedRecommendationsEnabled(userSettings: UserSettings | null): boolean {
  return getAnalyticsSettings(userSettings).personalizedRecommendations || false;
}

