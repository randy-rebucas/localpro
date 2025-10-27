"use client";

import { useState, useEffect } from "react";
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Shield,
  Globe,
  Zap,
  Bell,
  Eye,
  EyeOff,
  Download,
  Upload,
  Trash2,
  Activity,
  Building,
  DollarSign,
  BarChart3,
  ArrowUpRight,
  X
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { AdminErrorState } from "@/components/admin/admin-error-state";

interface SettingsData {
  general: {
    maintenanceMode: {
      enabled: boolean;
      message: string;
    };
    forceUpdate: {
      enabled: boolean;
      minVersion: string;
      message: string;
    };
    appName: string;
    appVersion: string;
    environment: string;
  };
  business: {
    companyAddress: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    businessHours: {
      timezone: string;
      schedule: Array<{
        day: string;
        startTime: string;
        endTime: string;
        isOpen: boolean;
        _id: string;
      }>;
    };
    supportChannels: {
      email: {
        enabled: boolean;
        address: string;
      };
      phone: {
        enabled: boolean;
        number: string;
      };
      chat: {
        hours: {
          start: string;
          end: string;
        };
        enabled: boolean;
      };
    };
    companyName: string;
    companyEmail: string;
    companyPhone: string;
  };
  features: {
    marketplace: {
      enabled: boolean;
      allowNewProviders: boolean;
      requireVerification: boolean;
    };
    academy: {
      enabled: boolean;
      allowNewCourses: boolean;
      requireInstructorVerification: boolean;
    };
    jobBoard: {
      enabled: boolean;
      allowNewJobs: boolean;
      requireCompanyVerification: boolean;
    };
    referrals: {
      enabled: boolean;
      rewardAmount: number;
      maxReferralsPerUser: number;
    };
    payments: {
      paypal: { enabled: boolean };
      paymaya: { enabled: boolean };
      gcash: { enabled: boolean };
      bankTransfer: { enabled: boolean };
    };
    analytics: {
      enabled: boolean;
      trackUserBehavior: boolean;
      trackPerformance: boolean;
    };
  };
  security: {
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
      maxLoginAttempts: number;
      lockoutDuration: number;
    };
    sessionSettings: {
      maxSessionDuration: number;
      allowMultipleSessions: boolean;
      maxConcurrentSessions: number;
    };
    dataProtection: {
      encryptSensitiveData: boolean;
      dataRetentionPeriod: number;
      allowDataExport: boolean;
      allowDataDeletion: boolean;
    };
  };
  rateLimiting: {
    api: {
      windowMs: number;
      maxRequests: number;
    };
    auth: {
      windowMs: number;
      maxRequests: number;
    };
    upload: {
      windowMs: number;
      maxRequests: number;
    };
  };
  uploads: {
    imageCompression: {
      enabled: boolean;
      quality: number;
    };
    maxFileSize: number;
    allowedImageTypes: string[];
    allowedDocumentTypes: string[];
    maxImagesPerUpload: number;
  };
  notifications: {
    email: {
      enabled: boolean;
      provider: string;
      fromEmail: string;
      fromName: string;
    };
    sms: {
      enabled: boolean;
      provider: string;
      fromNumber: string;
    };
    push: {
      enabled: boolean;
      provider: string;
    };
  };
  payments: {
    transactionFees: {
      percentage: number;
      fixed: number;
    };
    payoutSchedule: {
      frequency: string;
      dayOfWeek: number;
      dayOfMonth: number;
    };
    defaultCurrency: string;
    supportedCurrencies: string[];
    minimumPayout: number;
  };
  analytics: {
    googleAnalytics: {
      enabled: boolean;
    };
    mixpanel: {
      enabled: boolean;
    };
    customAnalytics: {
      enabled: boolean;
      retentionPeriod: number;
    };
  };
  integrations: {
    googleMaps: {
      enabled: boolean;
      defaultZoom: number;
    };
    cloudinary: {
      enabled: boolean;
    };
    socialLogin: {
      google: { enabled: boolean };
      facebook: { enabled: boolean };
    };
  };
}

interface SettingsCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  settings: {
    key: string;
    label: string;
    description: string;
    type: 'text' | 'number' | 'boolean' | 'select' | 'textarea' | 'password';
    value: string | number | boolean;
    options?: { value: string; label: string }[];
    min?: number;
    max?: number;
    required?: boolean;
  }[];
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('general');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/admin/settings', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch settings`);
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to load settings');
        }

        setSettings(result.data);
        setLastUpdated(new Date());
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError(err instanceof Error ? err.message : 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const saveSettings = async (category: string, updatedSettings: Record<string, string | number | boolean>) => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          category,
          settings: updatedSettings
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to save settings`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save settings');
      }

      // Update local state
      setSettings(prev => prev ? {
        ...prev,
        [category]: {
          ...prev[category as keyof SettingsData],
          ...updatedSettings
        }
      } : null);
      
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const settingsCategories: SettingsCategory[] = [
    {
      id: 'general',
      name: 'General Settings',
      description: 'App configuration and maintenance settings',
      icon: Settings,
      color: 'bg-blue-500',
      settings: settings?.general ? [
        { key: 'appName', label: 'App Name', description: 'Application name', type: 'text', value: settings.general.appName || '' },
        { key: 'appVersion', label: 'App Version', description: 'Current application version', type: 'text', value: settings.general.appVersion || '' },
        { key: 'environment', label: 'Environment', description: 'Current environment', type: 'select', value: settings.general.environment || 'development', options: [
          { value: 'development', label: 'Development' },
          { value: 'staging', label: 'Staging' },
          { value: 'production', label: 'Production' }
        ]},
        { key: 'maintenanceMode.enabled', label: 'Maintenance Mode', description: 'Enable maintenance mode', type: 'boolean', value: settings.general.maintenanceMode?.enabled || false },
        { key: 'maintenanceMode.message', label: 'Maintenance Message', description: 'Message shown during maintenance', type: 'textarea', value: settings.general.maintenanceMode?.message || '' },
        { key: 'forceUpdate.enabled', label: 'Force Update', description: 'Force users to update app', type: 'boolean', value: settings.general.forceUpdate?.enabled || false },
        { key: 'forceUpdate.minVersion', label: 'Minimum Version', description: 'Minimum required app version', type: 'text', value: settings.general.forceUpdate?.minVersion || '' },
        { key: 'forceUpdate.message', label: 'Force Update Message', description: 'Message shown when forcing update', type: 'textarea', value: settings.general.forceUpdate?.message || '' }
      ] : []
    },
    {
      id: 'business',
      name: 'Business Settings',
      description: 'Company information and business hours',
      icon: Building,
      color: 'bg-green-500',
      settings: settings?.business ? [
        { key: 'companyName', label: 'Company Name', description: 'Official company name', type: 'text', value: settings.business.companyName || '' },
        { key: 'companyEmail', label: 'Company Email', description: 'Primary company email', type: 'text', value: settings.business.companyEmail || '' },
        { key: 'companyPhone', label: 'Company Phone', description: 'Primary company phone', type: 'text', value: settings.business.companyPhone || '' },
        { key: 'companyAddress.street', label: 'Street Address', description: 'Company street address', type: 'text', value: settings.business.companyAddress?.street || '' },
        { key: 'companyAddress.city', label: 'City', description: 'Company city', type: 'text', value: settings.business.companyAddress?.city || '' },
        { key: 'companyAddress.state', label: 'State', description: 'Company state/province', type: 'text', value: settings.business.companyAddress?.state || '' },
        { key: 'companyAddress.zipCode', label: 'ZIP Code', description: 'Company postal code', type: 'text', value: settings.business.companyAddress?.zipCode || '' },
        { key: 'companyAddress.country', label: 'Country', description: 'Company country', type: 'text', value: settings.business.companyAddress?.country || '' },
        { key: 'businessHours.timezone', label: 'Business Timezone', description: 'Business hours timezone', type: 'text', value: settings.business.businessHours?.timezone || '' },
        { key: 'supportChannels.email.enabled', label: 'Email Support', description: 'Enable email support channel', type: 'boolean', value: settings.business.supportChannels?.email?.enabled || false },
        { key: 'supportChannels.email.address', label: 'Support Email', description: 'Support email address', type: 'text', value: settings.business.supportChannels?.email?.address || '' },
        { key: 'supportChannels.phone.enabled', label: 'Phone Support', description: 'Enable phone support channel', type: 'boolean', value: settings.business.supportChannels?.phone?.enabled || false },
        { key: 'supportChannels.phone.number', label: 'Support Phone', description: 'Support phone number', type: 'text', value: settings.business.supportChannels?.phone?.number || '' },
        { key: 'supportChannels.chat.enabled', label: 'Chat Support', description: 'Enable chat support channel', type: 'boolean', value: settings.business.supportChannels?.chat?.enabled || false },
        { key: 'supportChannels.chat.hours.start', label: 'Chat Start Time', description: 'Chat support start time', type: 'text', value: settings.business.supportChannels?.chat?.hours?.start || '' },
        { key: 'supportChannels.chat.hours.end', label: 'Chat End Time', description: 'Chat support end time', type: 'text', value: settings.business.supportChannels?.chat?.hours?.end || '' }
      ] : []
    },
    {
      id: 'features',
      name: 'Feature Flags',
      description: 'Enable or disable platform features',
      icon: Zap,
      color: 'bg-purple-500',
      settings: settings?.features ? [
        { key: 'marketplace.enabled', label: 'Marketplace', description: 'Enable marketplace feature', type: 'boolean', value: settings.features.marketplace?.enabled || false },
        { key: 'marketplace.allowNewProviders', label: 'Allow New Providers', description: 'Allow new provider registrations', type: 'boolean', value: settings.features.marketplace?.allowNewProviders || false },
        { key: 'marketplace.requireVerification', label: 'Require Verification', description: 'Require provider verification', type: 'boolean', value: settings.features.marketplace?.requireVerification || false },
        { key: 'academy.enabled', label: 'Academy', description: 'Enable academy feature', type: 'boolean', value: settings.features.academy?.enabled || false },
        { key: 'academy.allowNewCourses', label: 'Allow New Courses', description: 'Allow new course creation', type: 'boolean', value: settings.features.academy?.allowNewCourses || false },
        { key: 'jobBoard.enabled', label: 'Job Board', description: 'Enable job board feature', type: 'boolean', value: settings.features.jobBoard?.enabled || false },
        { key: 'referrals.enabled', label: 'Referrals', description: 'Enable referral system', type: 'boolean', value: settings.features.referrals?.enabled || false },
        { key: 'referrals.rewardAmount', label: 'Reward Amount', description: 'Referral reward amount', type: 'number', value: settings.features.referrals?.rewardAmount || 0, min: 0 },
        { key: 'referrals.maxReferralsPerUser', label: 'Max Referrals Per User', description: 'Maximum referrals per user', type: 'number', value: settings.features.referrals?.maxReferralsPerUser || 50, min: 1, max: 1000 },
        { key: 'analytics.enabled', label: 'Analytics', description: 'Enable analytics tracking', type: 'boolean', value: settings.features.analytics?.enabled || false },
        { key: 'analytics.trackUserBehavior', label: 'Track User Behavior', description: 'Track user behavior analytics', type: 'boolean', value: settings.features.analytics?.trackUserBehavior || false },
        { key: 'analytics.trackPerformance', label: 'Track Performance', description: 'Track performance analytics', type: 'boolean', value: settings.features.analytics?.trackPerformance || false },
        { key: 'payments.paypal.enabled', label: 'PayPal Payments', description: 'Enable PayPal payment method', type: 'boolean', value: settings.features.payments?.paypal?.enabled || false },
        { key: 'payments.paymaya.enabled', label: 'PayMaya Payments', description: 'Enable PayMaya payment method', type: 'boolean', value: settings.features.payments?.paymaya?.enabled || false },
        { key: 'payments.gcash.enabled', label: 'GCash Payments', description: 'Enable GCash payment method', type: 'boolean', value: settings.features.payments?.gcash?.enabled || false },
        { key: 'payments.bankTransfer.enabled', label: 'Bank Transfer', description: 'Enable bank transfer payment method', type: 'boolean', value: settings.features.payments?.bankTransfer?.enabled || false }
      ] : []
    },
    {
      id: 'security',
      name: 'Security Settings',
      description: 'Authentication and security configuration',
      icon: Shield,
      color: 'bg-red-500',
      settings: settings?.security ? [
        { key: 'passwordPolicy.minLength', label: 'Password Min Length', description: 'Minimum password length', type: 'number', value: settings.security.passwordPolicy?.minLength || 8, min: 6, max: 50 },
        { key: 'passwordPolicy.requireUppercase', label: 'Require Uppercase', description: 'Require uppercase letters', type: 'boolean', value: settings.security.passwordPolicy?.requireUppercase || false },
        { key: 'passwordPolicy.requireLowercase', label: 'Require Lowercase', description: 'Require lowercase letters', type: 'boolean', value: settings.security.passwordPolicy?.requireLowercase || false },
        { key: 'passwordPolicy.requireNumbers', label: 'Require Numbers', description: 'Require numbers', type: 'boolean', value: settings.security.passwordPolicy?.requireNumbers || false },
        { key: 'passwordPolicy.requireSpecialChars', label: 'Require Special Characters', description: 'Require special characters', type: 'boolean', value: settings.security.passwordPolicy?.requireSpecialChars || false },
        { key: 'passwordPolicy.maxLoginAttempts', label: 'Max Login Attempts', description: 'Maximum login attempts before lockout', type: 'number', value: settings.security.passwordPolicy?.maxLoginAttempts || 5, min: 3, max: 10 },
        { key: 'passwordPolicy.lockoutDuration', label: 'Lockout Duration (minutes)', description: 'Account lockout duration', type: 'number', value: settings.security.passwordPolicy?.lockoutDuration || 15, min: 5, max: 60 },
        { key: 'sessionSettings.maxSessionDuration', label: 'Max Session Duration (hours)', description: 'Maximum session duration', type: 'number', value: settings.security.sessionSettings?.maxSessionDuration || 24, min: 1, max: 168 },
        { key: 'sessionSettings.allowMultipleSessions', label: 'Allow Multiple Sessions', description: 'Allow multiple concurrent sessions', type: 'boolean', value: settings.security.sessionSettings?.allowMultipleSessions || false },
        { key: 'sessionSettings.maxConcurrentSessions', label: 'Max Concurrent Sessions', description: 'Maximum concurrent sessions per user', type: 'number', value: settings.security.sessionSettings?.maxConcurrentSessions || 3, min: 1, max: 10 },
        { key: 'dataProtection.encryptSensitiveData', label: 'Encrypt Sensitive Data', description: 'Encrypt sensitive user data', type: 'boolean', value: settings.security.dataProtection?.encryptSensitiveData || false },
        { key: 'dataProtection.dataRetentionPeriod', label: 'Data Retention Period (days)', description: 'How long to retain user data', type: 'number', value: settings.security.dataProtection?.dataRetentionPeriod || 365, min: 30, max: 3650 },
        { key: 'dataProtection.allowDataExport', label: 'Allow Data Export', description: 'Allow users to export their data', type: 'boolean', value: settings.security.dataProtection?.allowDataExport || false },
        { key: 'dataProtection.allowDataDeletion', label: 'Allow Data Deletion', description: 'Allow users to delete their data', type: 'boolean', value: settings.security.dataProtection?.allowDataDeletion || false }
      ] : []
    },
    {
      id: 'notifications',
      name: 'Notifications',
      description: 'Email, SMS, and push notification settings',
      icon: Bell,
      color: 'bg-yellow-500',
      settings: settings?.notifications ? [
        { key: 'email.enabled', label: 'Email Notifications', description: 'Enable email notifications', type: 'boolean', value: settings.notifications.email?.enabled || false },
        { key: 'email.provider', label: 'Email Provider', description: 'Email service provider', type: 'select', value: settings.notifications.email?.provider || 'nodemailer', options: [
          { value: 'nodemailer', label: 'Nodemailer' },
          { value: 'sendgrid', label: 'SendGrid' },
          { value: 'mailgun', label: 'Mailgun' }
        ]},
        { key: 'email.fromEmail', label: 'From Email', description: 'Default sender email', type: 'text', value: settings.notifications.email?.fromEmail || '' },
        { key: 'email.fromName', label: 'From Name', description: 'Default sender name', type: 'text', value: settings.notifications.email?.fromName || '' },
        { key: 'sms.enabled', label: 'SMS Notifications', description: 'Enable SMS notifications', type: 'boolean', value: settings.notifications.sms?.enabled || false },
        { key: 'sms.provider', label: 'SMS Provider', description: 'SMS service provider', type: 'select', value: settings.notifications.sms?.provider || 'twilio', options: [
          { value: 'twilio', label: 'Twilio' },
          { value: 'aws-sns', label: 'AWS SNS' }
        ]},
        { key: 'push.enabled', label: 'Push Notifications', description: 'Enable push notifications', type: 'boolean', value: settings.notifications.push?.enabled || false },
        { key: 'push.provider', label: 'Push Provider', description: 'Push notification provider', type: 'select', value: settings.notifications.push?.provider || 'firebase', options: [
          { value: 'firebase', label: 'Firebase' },
          { value: 'onesignal', label: 'OneSignal' }
        ]}
      ] : []
    },
    {
      id: 'payments',
      name: 'Payment Settings',
      description: 'Payment gateway and transaction settings',
      icon: DollarSign,
      color: 'bg-green-500',
      settings: settings?.payments ? [
        { key: 'defaultCurrency', label: 'Default Currency', description: 'Default payment currency', type: 'select', value: settings.payments.defaultCurrency || 'PHP', options: [
          { value: 'PHP', label: 'Philippine Peso (PHP)' },
          { value: 'USD', label: 'US Dollar (USD)' },
          { value: 'EUR', label: 'Euro (EUR)' },
          { value: 'GBP', label: 'British Pound (GBP)' }
        ]},
        { key: 'transactionFees.percentage', label: 'Transaction Fee Percentage', description: 'Percentage fee per transaction', type: 'number', value: settings.payments.transactionFees?.percentage || 2.9, min: 0, max: 10 },
        { key: 'transactionFees.fixed', label: 'Fixed Transaction Fee', description: 'Fixed fee per transaction', type: 'number', value: settings.payments.transactionFees?.fixed || 0.3, min: 0 },
        { key: 'minimumPayout', label: 'Minimum Payout', description: 'Minimum payout amount', type: 'number', value: settings.payments.minimumPayout || 100, min: 0 },
        { key: 'payoutSchedule.frequency', label: 'Payout Frequency', description: 'How often payouts are processed', type: 'select', value: settings.payments.payoutSchedule?.frequency || 'weekly', options: [
          { value: 'daily', label: 'Daily' },
          { value: 'weekly', label: 'Weekly' },
          { value: 'monthly', label: 'Monthly' }
        ]},
        { key: 'payoutSchedule.dayOfWeek', label: 'Payout Day of Week', description: 'Day of week for weekly payouts (1=Monday)', type: 'number', value: settings.payments.payoutSchedule?.dayOfWeek || 1, min: 1, max: 7 },
        { key: 'payoutSchedule.dayOfMonth', label: 'Payout Day of Month', description: 'Day of month for monthly payouts', type: 'number', value: settings.payments.payoutSchedule?.dayOfMonth || 1, min: 1, max: 31 },
        { key: 'supportedCurrencies', label: 'Supported Currencies', description: 'Comma-separated list of supported currencies', type: 'textarea', value: settings.payments.supportedCurrencies?.join(', ') || '' }
      ] : []
    },
    {
      id: 'uploads',
      name: 'Upload Settings',
      description: 'File upload and storage configuration',
      icon: Upload,
      color: 'bg-indigo-500',
      settings: settings?.uploads ? [
        { key: 'maxFileSize', label: 'Max File Size (bytes)', description: 'Maximum file size allowed', type: 'number', value: settings.uploads.maxFileSize || 10485760, min: 1048576 },
        { key: 'maxImagesPerUpload', label: 'Max Images Per Upload', description: 'Maximum images per upload', type: 'number', value: settings.uploads.maxImagesPerUpload || 10, min: 1, max: 50 },
        { key: 'imageCompression.enabled', label: 'Image Compression', description: 'Enable automatic image compression', type: 'boolean', value: settings.uploads.imageCompression?.enabled || false },
        { key: 'imageCompression.quality', label: 'Image Quality', description: 'Image compression quality (1-100)', type: 'number', value: settings.uploads.imageCompression?.quality || 80, min: 1, max: 100 },
        { key: 'allowedImageTypes', label: 'Allowed Image Types', description: 'Comma-separated list of allowed image MIME types', type: 'textarea', value: settings.uploads.allowedImageTypes?.join(', ') || '' },
        { key: 'allowedDocumentTypes', label: 'Allowed Document Types', description: 'Comma-separated list of allowed document MIME types', type: 'textarea', value: settings.uploads.allowedDocumentTypes?.join(', ') || '' }
      ] : []
    },
    {
      id: 'rateLimiting',
      name: 'Rate Limiting',
      description: 'API rate limiting configuration',
      icon: Activity,
      color: 'bg-orange-500',
      settings: settings?.rateLimiting ? [
        { key: 'api.maxRequests', label: 'API Max Requests', description: 'Maximum API requests per window', type: 'number', value: settings.rateLimiting.api?.maxRequests || 100, min: 10, max: 10000 },
        { key: 'api.windowMs', label: 'API Window (ms)', description: 'API rate limit window in milliseconds', type: 'number', value: settings.rateLimiting.api?.windowMs || 900000, min: 60000 },
        { key: 'auth.maxRequests', label: 'Auth Max Requests', description: 'Maximum auth requests per window', type: 'number', value: settings.rateLimiting.auth?.maxRequests || 5, min: 1, max: 100 },
        { key: 'auth.windowMs', label: 'Auth Window (ms)', description: 'Auth rate limit window in milliseconds', type: 'number', value: settings.rateLimiting.auth?.windowMs || 900000, min: 60000 },
        { key: 'upload.maxRequests', label: 'Upload Max Requests', description: 'Maximum upload requests per window', type: 'number', value: settings.rateLimiting.upload?.maxRequests || 10, min: 1, max: 100 },
        { key: 'upload.windowMs', label: 'Upload Window (ms)', description: 'Upload rate limit window in milliseconds', type: 'number', value: settings.rateLimiting.upload?.windowMs || 3600000, min: 60000 }
      ] : []
    },
    {
      id: 'analytics',
      name: 'Analytics Settings',
      description: 'Analytics and tracking configuration',
      icon: BarChart3,
      color: 'bg-purple-500',
      settings: settings?.analytics ? [
        { key: 'googleAnalytics.enabled', label: 'Google Analytics', description: 'Enable Google Analytics tracking', type: 'boolean', value: settings.analytics.googleAnalytics?.enabled || false },
        { key: 'mixpanel.enabled', label: 'Mixpanel', description: 'Enable Mixpanel tracking', type: 'boolean', value: settings.analytics.mixpanel?.enabled || false },
        { key: 'customAnalytics.enabled', label: 'Custom Analytics', description: 'Enable custom analytics tracking', type: 'boolean', value: settings.analytics.customAnalytics?.enabled || false },
        { key: 'customAnalytics.retentionPeriod', label: 'Data Retention Period (days)', description: 'How long to retain analytics data', type: 'number', value: settings.analytics.customAnalytics?.retentionPeriod || 365, min: 30, max: 1095 }
      ] : []
    },
    {
      id: 'integrations',
      name: 'Integrations',
      description: 'Third-party service integrations',
      icon: Globe,
      color: 'bg-cyan-500',
      settings: settings?.integrations ? [
        { key: 'googleMaps.enabled', label: 'Google Maps', description: 'Enable Google Maps integration', type: 'boolean', value: settings.integrations.googleMaps?.enabled || false },
        { key: 'googleMaps.defaultZoom', label: 'Default Map Zoom', description: 'Default zoom level for maps', type: 'number', value: settings.integrations.googleMaps?.defaultZoom || 13, min: 1, max: 20 },
        { key: 'cloudinary.enabled', label: 'Cloudinary', description: 'Enable Cloudinary image service', type: 'boolean', value: settings.integrations.cloudinary?.enabled || false },
        { key: 'socialLogin.google.enabled', label: 'Google Login', description: 'Enable Google social login', type: 'boolean', value: settings.integrations.socialLogin?.google?.enabled || false },
        { key: 'socialLogin.facebook.enabled', label: 'Facebook Login', description: 'Enable Facebook social login', type: 'boolean', value: settings.integrations.socialLogin?.facebook?.enabled || false }
      ] : []
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="xl" text="Loading settings..." />
      </div>
    );
  }

  if (error) {
    return (
      <AdminErrorState 
        error={error}
        onRetry={() => window.location.reload()}
        retryText="Try Again"
      />
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="xl" text="Loading settings..." />
      </div>
    );
  }

  const activeCategoryData = settingsCategories.find(cat => cat.id === activeCategory);

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            System Settings
          </h1>
          <p className="text-gray-600 text-sm">Configure platform settings and preferences</p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center space-x-2">
          {lastUpdated && (
            <p className="text-xs text-gray-500">
              Updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
          <button
            onClick={() => window.location.reload()}
            disabled={saving}
            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${saving ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Settings Categories */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {settingsCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`bg-white rounded shadow p-3 border-l-4 transition-all duration-200 hover:shadow-md ${
              activeCategory === category.id 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500">{category.name}</p>
                <p className="text-sm font-bold text-gray-900">{category.settings.length} settings</p>
                <p className="text-xs text-gray-500 line-clamp-2">{category.description}</p>
              </div>
              <category.icon className={`w-5 h-5 ${activeCategory === category.id ? 'text-blue-600' : 'text-gray-600'}`} />
            </div>
          </button>
        ))}
      </div>

      {/* Settings Form */}
      {activeCategoryData && (
        <div className="bg-white rounded shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <activeCategoryData.icon className="w-5 h-5 text-gray-600" />
                <h3 className="text-sm font-medium text-gray-900">{activeCategoryData.name}</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {showAdvanced ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                  {showAdvanced ? 'Hide' : 'Show'} Advanced
                </button>
                <button
                  onClick={async () => {
                    const formData = new FormData(document.getElementById('settings-form') as HTMLFormElement);
                    const settingsData: Record<string, string | number | boolean | Record<string, string | number | boolean>> = {};
                    formData.forEach((value, key) => {
                      // Convert FormDataEntryValue to string, number, or boolean
                      let processedValue: string | number | boolean;
                      if (typeof value === 'string') {
                        // Try to parse as number or boolean
                        if (value === 'true') {
                          processedValue = true;
                        } else if (value === 'false') {
                          processedValue = false;
                        } else if (!isNaN(Number(value)) && value !== '') {
                          processedValue = Number(value);
                        } else {
                          processedValue = value;
                        }
                      } else {
                        // Skip file entries
                        return;
                      }

                      if (key.includes('.')) {
                        const [parent, child] = key.split('.');
                        if (!settingsData[parent]) {
                          settingsData[parent] = {} as Record<string, string | number | boolean>;
                        }
                        (settingsData[parent] as Record<string, string | number | boolean>)[child] = processedValue;
                      } else {
                        settingsData[key] = processedValue;
                      }
                    });
                    
                    // Flatten nested objects for saveSettings
                    const flattenedSettings: Record<string, string | number | boolean> = {};
                    Object.keys(settingsData).forEach(key => {
                      const value = settingsData[key];
                      if (typeof value === 'object' && value !== null) {
                        // Flatten nested object
                        Object.keys(value as Record<string, string | number | boolean>).forEach(nestedKey => {
                          flattenedSettings[`${key}.${nestedKey}`] = (value as Record<string, string | number | boolean>)[nestedKey];
                        });
                      } else {
                        flattenedSettings[key] = value as string | number | boolean;
                      }
                    });
                    
                    await saveSettings(activeCategory, flattenedSettings);
                  }}
                  disabled={saving}
                  className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
                >
                  <Save className={`w-3 h-3 mr-1 ${saving ? 'animate-spin' : ''}`} />
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
          
          <form id="settings-form" className="p-4 space-y-4">
            {activeCategoryData.settings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No settings available for this category</p>
              </div>
            ) : (
              activeCategoryData.settings.map((setting) => (
              <div key={setting.key} className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">
                  {setting.label}
                  {setting.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <p className="text-xs text-gray-500">{setting.description}</p>
                
                {setting.type === 'boolean' ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name={setting.key}
                      checked={Boolean(setting.value)}
                      onChange={(e) => {
                        const newValue = e.target.checked;
                        setSettings(prev => prev ? {
                          ...prev,
                          [activeCategory]: {
                            ...prev[activeCategory as keyof SettingsData],
                            [setting.key]: newValue
                          }
                        } : null);
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {setting.value ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                ) : setting.type === 'select' ? (
                  <select
                    name={setting.key}
                    value={String(setting.value)}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setSettings(prev => prev ? {
                        ...prev,
                        [activeCategory]: {
                          ...prev[activeCategory as keyof SettingsData],
                          [setting.key]: newValue
                        }
                      } : null);
                    }}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {setting.options?.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : setting.type === 'textarea' ? (
                  <textarea
                    name={setting.key}
                    value={String(setting.value)}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setSettings(prev => prev ? {
                        ...prev,
                        [activeCategory]: {
                          ...prev[activeCategory as keyof SettingsData],
                          [setting.key]: newValue
                        }
                      } : null);
                    }}
                    rows={3}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <input
                    type={setting.type === 'password' ? 'password' : setting.type}
                    name={setting.key}
                    value={String(setting.value)}
                    onChange={(e) => {
                      const newValue = setting.type === 'number' ? Number(e.target.value) : e.target.value;
                      setSettings(prev => prev ? {
                        ...prev,
                        [activeCategory]: {
                          ...prev[activeCategory as keyof SettingsData],
                          [setting.key]: newValue
                        }
                      } : null);
                    }}
                    min={setting.min}
                    max={setting.max}
                    required={setting.required}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                )}
              </div>
              ))
            )}
          </form>
        </div>
      )}

      {/* Advanced Settings */}
      {showAdvanced && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-yellow-800">Advanced Settings</h3>
            <button
              onClick={() => setShowAdvanced(false)}
              className="text-yellow-600 hover:text-yellow-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            <div className="bg-white p-3 rounded border border-yellow-200">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Danger Zone</h4>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 bg-red-50 hover:bg-red-100 rounded transition-colors group">
                  <div className="flex items-center">
                    <Trash2 className="w-4 h-4 text-red-600 mr-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Reset All Settings</p>
                      <p className="text-xs text-gray-500">Reset all settings to default values</p>
                    </div>
                    <ArrowUpRight className="w-3 h-3 text-gray-400" />
                  </div>
                </button>
                
                <button className="w-full text-left px-3 py-2 bg-orange-50 hover:bg-orange-100 rounded transition-colors group">
                  <div className="flex items-center">
                    <Download className="w-4 h-4 text-orange-600 mr-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Export Settings</p>
                      <p className="text-xs text-gray-500">Download current settings as JSON</p>
                    </div>
                    <ArrowUpRight className="w-3 h-3 text-gray-400" />
                  </div>
                </button>
                
                <button className="w-full text-left px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded transition-colors group">
                  <div className="flex items-center">
                    <Upload className="w-4 h-4 text-blue-600 mr-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Import Settings</p>
                      <p className="text-xs text-gray-500">Upload settings from JSON file</p>
                    </div>
                    <ArrowUpRight className="w-3 h-3 text-gray-400" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
