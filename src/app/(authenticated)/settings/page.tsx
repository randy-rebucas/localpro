"use client";

import { 
  Settings as SettingsIcon, 
  Lock, 
  Bell, 
  MessageSquare, 
  Briefcase, 
  CreditCard, 
  Shield, 
  Smartphone,
  BarChart3,
  Save,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  LucideIcon,
  X,
  RefreshCw,
  TestTube2,
  Headphones,
  User
} from "lucide-react";
import Link from "next/link";
import { Broadcaster } from "@/components/broadcaster";
import { useState, useEffect, useCallback } from "react";
import { defaultUserSettings, type UserSettings } from "@/types/user-settings";
import { useSession } from "@/hooks/useAuth";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useFCMDevices, useNotificationAdmin } from "@/hooks/useNotifications";
import { getEnabledPaymentMethods } from "@/lib/settings-utils";
import { logger } from "@/lib/logger";
import { Checkbox } from "@/components/ui/checkbox";
import { Loading } from "@/components/ui/loading";
import toast from "react-hot-toast";

type ChangeEvent = React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;

// Settings Section Component with Toggle
function SettingsSection({ 
  icon: Icon, 
  title, 
  description, 
  children,
  isExpanded,
  onToggle
}: { 
  icon: LucideIcon; 
  title: string; 
  description?: string; 
  children: React.ReactNode;
  isExpanded?: boolean;
  onToggle?: () => void;
}) {
  const expanded = isExpanded ?? true;
  const ChevronIcon = expanded ? ChevronUp : ChevronDown;

  return (
    <section className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden backdrop-blur-sm">
      <button
        onClick={onToggle}
        className="w-full bg-gradient-to-r from-gray-50 via-white to-gray-50 px-6 py-5 border-b border-gray-200 hover:from-accent/10/50 hover:via-white hover:to-emerald-50/50 transition-all duration-300"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-emerald-500 shadow-md shadow-green-500/30 flex items-center justify-center text-white">
              <Icon className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
              {description && (
                <p className="text-sm text-gray-500 mt-1">{description}</p>
              )}
            </div>
          </div>
          <ChevronIcon className="w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-300" />
        </div>
      </button>
      {expanded && (
        <div className="px-6 py-7 transition-all duration-200 ease-in-out animate-fade-in-up">
          {children}
        </div>
      )}
    </section>
  );
}

export default function SettingsPage() {
  const { settings: fetchedSettings, loading, updateSettings: updateUserSettings } = useUserSettings();
  const { settings: appSettings } = useAppSettings();
  const { 
    devices, 
    loading: devicesLoading, 
    refetch: refetchDevices, 
    removeToken
  } = useFCMDevices();
  const { sendTestNotification, loading: testLoading } = useNotificationAdmin();
  
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    privacy: true, // Privacy expanded by default
    notifications: false,
    devices: false,
    communication: false,
    service: false,
    payment: false,
    security: false,
    app: false,
    analytics: false,
  });
  const { data: session } = useSession();

  // Sync fetched settings to local state
  useEffect(() => {
    if (fetchedSettings) {
      setSettings(fetchedSettings);
      setHasChanges(false);
    }
  }, [fetchedSettings]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Get user roles
  const userRoles = session?.user?.roles || ['client'];
  
  // Role-based visibility helpers (check if user has specific roles)
  const isClient = userRoles.includes('client');
  const isProvider = userRoles.includes('provider');
  const isSupplier = userRoles.includes('supplier');
  const isInstructor = userRoles.includes('instructor');
  const isAgencyOwner = userRoles.includes('agency_owner');
  const isAgencyAdmin = userRoles.includes('agency_admin');
  const isAdmin = userRoles.includes('admin');
  const isBusinessRole = isProvider || isSupplier || isInstructor || isAgencyOwner || isAgencyAdmin || isAdmin;
  const isServiceProvider = isProvider || isAgencyOwner || isAgencyAdmin || isAdmin;

  const handleSave = useCallback(async () => {
    if (!settings || saving) return;
    
    setSaving(true);
    try {
      await updateUserSettings(settings);
      setHasChanges(false);
      setLastSaved(new Date());
      toast.success("Settings saved successfully!");
    } catch (error) {
      logger.error("Error saving settings", error instanceof Error ? error : new Error(String(error)));
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }, [settings, saving, updateUserSettings]);

  function onToggle(path: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const checked = e.target.checked;
      setSettings((prev) => {
        const updated = updateAtPath(prev, path, checked);
        setHasChanges(true);
        return updated;
      });
    };
  }

  function onInput(path: string, parser: (v: string) => string | number = (v) => v) {
    return (e: ChangeEvent) => {
      const value = parser(e.target.value);
      setSettings((prev) => {
        const updated = updateAtPath(prev, path, value);
        setHasChanges(true);
        return updated;
      });
    };
  }

  function onArrayToggle(path: string, value: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const checked = e.target.checked;
      setSettings((prev) => {
        if (!prev) return prev;
        const current = getAtPath<string[]>(prev, path) || [];
        const next = checked ? Array.from(new Set([...current, value])) : current.filter((v) => v !== value);
        const updated = updateAtPath(prev, path, next);
        setHasChanges(true);
        return updated;
      });
    };
  }

  function getAtPath<T = unknown>(obj: unknown, path: string): T {
    return path.split(".").reduce((acc: unknown, key: string) => {
      if (acc && typeof acc === 'object' && acc !== null) {
        return (acc as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj) as T;
  }

  function updateAtPath<T = unknown>(obj: T | null, path: string, value: unknown): T | null {
    if (!obj) return obj;
    const keys = path.split(".");
    const last = keys.pop() as string;
    const target: Record<string, unknown> = keys.reduce((acc: Record<string, unknown>, key: string) => (acc[key] = { ...(acc[key] as Record<string, unknown> || {}) }), {} as Record<string, unknown>);
    let cursor: Record<string, unknown> = target;
    for (const key of keys) {
      cursor[key] = cursor[key] || {};
      cursor = cursor[key] as Record<string, unknown>;
    }
    cursor[last] = value;
    return deepMerge(obj as Record<string, unknown>, target) as T;
  }

  function deepMerge(target: unknown, source: unknown) {
    if (typeof source !== "object" || source === null) return target;
    const output = Array.isArray(target) ? [...(target as unknown[])] : { ...(target as Record<string, unknown>) };
    for (const key of Object.keys(source as Record<string, unknown>)) {
      const srcVal = (source as Record<string, unknown>)[key];
      const tgtVal = (output as Record<string, unknown>)[key];
      if (Array.isArray(srcVal)) {
        (output as Record<string, unknown>)[key] = [...srcVal];
      } else if (typeof srcVal === "object" && srcVal !== null) {
        (output as Record<string, unknown>)[key] = deepMerge(tgtVal ?? {}, srcVal);
      } else {
        (output as Record<string, unknown>)[key] = srcVal;
      }
    }
    return output;
  }

  // Use fetched settings if local state is not set yet
  const currentSettings = settings || fetchedSettings || defaultUserSettings;

  if (loading || !currentSettings) {
    return <Loading variant="dashboard" fullScreen text="Loading Settings" subtitle="Preparing your account settings..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-accent/10/30 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float animation-delay-4000"></div>
      </div>

      <div className="relative z-0">
        {/* Broadcaster - Only shown for clients */}
        <Broadcaster />

        {/* Header Section - Following Reference Layout */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Settings — Manage Your Account Preferences
              </h1>
              <p className="text-gray-600">
                Configure your privacy, notifications, communication, and app preferences.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {lastSaved && (
                <span className="text-xs text-gray-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                  <span className="hidden sm:inline">Saved {lastSaved.toLocaleTimeString()}</span>
                </span>
              )}
              {hasChanges && (
                <span className="text-xs text-amber-600 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Unsaved changes</span>
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 shadow-sm ${
                  hasChanges
                    ? 'bg-gradient-to-r from-accent to-accent/90 text-white hover:from-accent/90 hover:to-accent shadow-md hover:shadow-lg disabled:opacity-50 transform hover:scale-105'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save Changes'}</span>
                <span className="sm:hidden">{saving ? 'Saving...' : 'Save'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Links Row */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 border-b border-gray-200 pb-4">
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-accent transition-colors group"
            >
              <User className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Profile</span>
            </Link>
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-accent transition-colors group"
            >
              <SettingsIcon className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Settings</span>
            </Link>
            <Link
              href="/security"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-accent transition-colors group"
            >
              <Shield className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Security</span>
            </Link>
            <Link
              href="/support"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-accent transition-colors group"
            >
              <Headphones className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Support</span>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Settings Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Privacy Settings */}
          <SettingsSection
            icon={Lock}
            title="Privacy"
            description="Control who can see your information and contact you"
            isExpanded={expandedSections.privacy}
            onToggle={() => toggleSection('privacy')}
          >
            <div className="space-y-1">
              <RowSelect
                label="Profile visibility"
                value={currentSettings.privacy.profileVisibility}
                onChange={(value) => onInput("privacy.profileVisibility", (v) => v)({ target: { value } } as React.ChangeEvent<HTMLSelectElement>)}
                options={[
                  { value: "public", label: "Public" },
                  { value: "contacts_only", label: "Contacts Only" },
                  { value: "private", label: "Private" }
                ]}
              />
              <div className="pt-4 border-t border-gray-100 space-y-1">
                <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">Visibility Controls</p>
                {[
                  ["Show phone number", "privacy.showPhoneNumber"],
                  ["Show email", "privacy.showEmail"],
                  ["Show location", "privacy.showLocation"],
                  ["Show rating", "privacy.showRating"],
                  ["Show portfolio", "privacy.showPortfolio"],
                  ["Allow direct messages", "privacy.allowDirectMessages"],
                  // Non-client only: Job invitations (service providers)
                  ...(isServiceProvider && !isClient ? [["Allow job invitations", "privacy.allowJobInvitations"]] : []),
                  // Non-client only: Referral requests (business roles)
                  ...(isBusinessRole && !isClient ? [["Allow referral requests", "privacy.allowReferralRequests"]] : []),
                ].map(([label, path]) => (
                  <ToggleRow key={path as string} label={label as string} checked={getAtPath(currentSettings, path as string) as boolean} onChange={onToggle(path as string)} />
                ))}
              </div>
            </div>
          </SettingsSection>

          {/* Notifications Settings */}
          <SettingsSection
            icon={Bell}
            title="Notifications"
            description="Manage how and when you receive notifications"
            isExpanded={expandedSections.notifications}
            onToggle={() => toggleSection('notifications')}
          >
            <div className="space-y-6">
              {/* Push Notifications */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  Push Notifications
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    ["Enabled", "notifications.push.enabled"],
                    ["New messages", "notifications.push.newMessages"],
                    // Non-client only: Job-related notifications (service providers)
                    ...(isServiceProvider && !isClient ? [["Job matches", "notifications.push.jobMatches"], ["Booking updates", "notifications.push.bookingUpdates"]] : []),
                    // Non-client only: Business-related notifications (business roles)
                    ...(isBusinessRole && !isClient ? [["Payment updates", "notifications.push.paymentUpdates"], ["Referral updates", "notifications.push.referralUpdates"]] : []),
                    ["System updates", "notifications.push.systemUpdates"],
                    ["Marketing", "notifications.push.marketing"],
                  ].map(([label, path]) => (
                    <ToggleRow key={path as string} label={label as string} checked={getAtPath(settings, path as string) as boolean} onChange={onToggle(path as string)} />
                  ))}
                </div>
              </div>

              {/* Email Notifications */}
              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                  Email Notifications
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    ["Enabled", "notifications.email.enabled"],
                    ["New messages", "notifications.email.newMessages"],
                    // Non-client only: Job-related notifications (service providers)
                    ...(isServiceProvider && !isClient ? [["Job matches", "notifications.email.jobMatches"], ["Booking updates", "notifications.email.bookingUpdates"]] : []),
                    // Non-client only: Business-related notifications and reports (business roles)
                    ...(isBusinessRole && !isClient ? [["Payment updates", "notifications.email.paymentUpdates"], ["Referral updates", "notifications.email.referralUpdates"], ["Weekly digest", "notifications.email.weeklyDigest"], ["Monthly report", "notifications.email.monthlyReport"]] : []),
                    ["System updates", "notifications.email.systemUpdates"],
                    ["Marketing", "notifications.email.marketing"],
                  ].map(([label, path]) => (
                    <ToggleRow key={path as string} label={label as string} checked={getAtPath(settings, path as string) as boolean} onChange={onToggle(path as string)} />
                  ))}
                </div>
              </div>

              {/* SMS Notifications */}
              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                  SMS Notifications
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    ["Enabled", "notifications.sms.enabled"],
                    ["Urgent messages", "notifications.sms.urgentMessages"],
                    // Non-client only: Booking reminders (service providers)
                    ...(isServiceProvider && !isClient ? [["Booking reminders", "notifications.sms.bookingReminders"]] : []),
                    // Non-client only: Payment alerts (business roles)
                    ...(isBusinessRole && !isClient ? [["Payment alerts", "notifications.sms.paymentAlerts"]] : []),
                    ["Security alerts", "notifications.sms.securityAlerts"],
                  ].map(([label, path]) => (
                    <ToggleRow key={path as string} label={label as string} checked={getAtPath(settings, path as string) as boolean} onChange={onToggle(path as string)} />
                  ))}
                </div>
              </div>
            </div>
          </SettingsSection>

          {/* Registered Devices Section */}
          <SettingsSection
            icon={Smartphone}
            title="Registered Devices"
            description="Manage devices registered for push notifications"
            isExpanded={expandedSections.devices}
            onToggle={() => toggleSection('devices')}
          >
            <div className="space-y-4">
              {/* Actions */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {devices.length} device{devices.length !== 1 ? 's' : ''} registered for push notifications
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      sendTestNotification({
                        title: "Test Notification",
                        message: "Your push notifications are working correctly!",
                        type: "system_announcement"
                      }).then(success => {
                        if (success) {
                          toast.success("Test notification sent!");
                        } else {
                          toast.error("Failed to send test notification");
                        }
                      });
                    }}
                    disabled={testLoading}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-all border border-purple-200"
                  >
                    {testLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <TestTube2 className="w-4 h-4" />
                    )}
                    Test Notification
                  </button>
                  <button
                    onClick={() => refetchDevices()}
                    disabled={devicesLoading}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all border border-gray-200"
                  >
                    <RefreshCw className={`w-4 h-4 ${devicesLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Device List */}
              {devicesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-accent" />
                  <span className="ml-2 text-gray-500">Loading devices...</span>
                </div>
              ) : devices.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                  <Smartphone className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium text-gray-700">No devices registered</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Push notifications will be enabled when you allow notifications in your browser.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {devices.map((device) => {
                    const deviceId = device._id || device.id || '';
                    const formatDate = (dateStr: string | Date | undefined) => {
                      if (!dateStr) return 'Unknown';
                      const date = new Date(dateStr);
                      const now = new Date();
                      const diffMs = now.getTime() - date.getTime();
                      const diffMins = Math.floor(diffMs / 60000);
                      const diffHours = Math.floor(diffMs / 3600000);
                      const diffDays = Math.floor(diffMs / 86400000);
                      
                      if (diffMins < 1) return 'Just now';
                      if (diffMins < 60) return `${diffMins}m ago`;
                      if (diffHours < 24) return `${diffHours}h ago`;
                      if (diffDays < 7) return `${diffDays}d ago`;
                      return date.toLocaleDateString();
                    };
                    
                    return (
                      <div 
                        key={deviceId} 
                        className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            device.deviceType === 'ios' ? 'bg-gray-100' :
                            device.deviceType === 'android' ? 'bg-accent/10' :
                            'bg-primary/10'
                          }`}>
                            <Smartphone className={`w-5 h-5 ${
                              device.deviceType === 'ios' ? 'text-gray-600' :
                              device.deviceType === 'android' ? 'text-accent' :
                              'text-primary'
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{device.deviceName || 'Unknown Device'}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span className="capitalize">{device.deviceType || 'web'}</span>
                              {device.browser && (
                                <>
                                  <span>•</span>
                                  <span>{device.browser}</span>
                                </>
                              )}
                              {device.os && (
                                <>
                                  <span>•</span>
                                  <span>{device.os}</span>
                                </>
                              )}
                              {device.lastUsed && (
                                <>
                                  <span>•</span>
                                  <span>Last used: {formatDate(device.lastUsed)}</span>
                                </>
                              )}
                              {device.isActive && (
                                <>
                                  <span>•</span>
                                  <span className="text-accent font-medium">Active</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            removeToken(deviceId).then(success => {
                              if (success) {
                                toast.success("Device removed");
                              } else {
                                toast.error("Failed to remove device");
                              }
                            });
                          }}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Remove device"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Info */}
              <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm text-primary">
                  <strong>Tip:</strong> Push notifications help you stay updated on important events like new bookings, 
                  messages, and payment updates. Enable notifications in your browser to receive them even when you&apos;re 
                  not actively using the app.
                </p>
              </div>
            </div>
          </SettingsSection>

          {/* Communication Settings */}
          <SettingsSection
            icon={MessageSquare}
            title="Communication"
            description="Language, timezone, and formatting preferences"
            isExpanded={expandedSections.communication}
            onToggle={() => toggleSection('communication')}
          >
            <div className="space-y-1">
              <RowSelect
                label="Preferred language"
                value={currentSettings.communication.preferredLanguage}
                onChange={(value) => onInput("communication.preferredLanguage")({ target: { value } } as React.ChangeEvent<HTMLSelectElement>)}
                options={[
                  { value: "en", label: "English" },
                  { value: "fil", label: "Filipino" },
                  { value: "es", label: "Spanish" },
                  { value: "zh", label: "Chinese" },
                  { value: "ja", label: "Japanese" },
                  { value: "ko", label: "Korean" }
                ]}
              />
              <RowInput
                label="Timezone"
                value={currentSettings.communication.timezone}
                onChange={onInput("communication.timezone")}
                placeholder="Asia/Manila"
              />
              <RowSelect
                label="Date format"
                value={currentSettings.communication.dateFormat}
                onChange={(value) => onInput("communication.dateFormat")({ target: { value } } as React.ChangeEvent<HTMLSelectElement>)}
                options={[
                  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
                  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
                  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" }
                ]}
              />
              <RowSelect
                label="Time format"
                value={currentSettings.communication.timeFormat}
                onChange={(value) => onInput("communication.timeFormat")({ target: { value } } as React.ChangeEvent<HTMLSelectElement>)}
                options={[
                  { value: "12h", label: "12-hour" },
                  { value: "24h", label: "24-hour" }
                ]}
              />
              <RowSelect
                label="Currency"
                value={currentSettings.communication.currency}
                onChange={(value) => onInput("communication.currency")({ target: { value } } as React.ChangeEvent<HTMLSelectElement>)}
                options={[
                  { value: "PHP", label: "PHP (Philippine Peso)" }
                ]}
              />
            </div>
            {/* Auto-reply: Non-client only (business roles) */}
            {isBusinessRole && !isClient && (
              <div className="mt-5 pt-5 border-t border-gray-100">
                <div className="space-y-1">
                  <ToggleRow label="Auto-reply enabled" checked={currentSettings.communication.autoReply.enabled} onChange={onToggle("communication.autoReply.enabled")} />
                  {currentSettings.communication.autoReply.enabled && (
                    <RowTextarea
                      label="Auto-reply message"
                      rows={3}
                      value={currentSettings.communication.autoReply.message}
                      onChange={onInput("communication.autoReply.message")}
                      placeholder="Thank you for your message. I will get back to you soon."
                    />
                  )}
                </div>
              </div>
            )}
          </SettingsSection>

          {/* Service Settings - Non-client only (service providers) */}
          {isServiceProvider && !isClient && (
            <SettingsSection
              icon={Briefcase}
              title="Service Preferences"
              description="Configure your service area, job preferences, and availability"
              isExpanded={expandedSections.service}
              onToggle={() => toggleSection('service')}
            >
              <div className="space-y-1">
                <RowNumberInput label="Service radius (km)" value={currentSettings.service.defaultServiceRadius} onChange={onInput("service.defaultServiceRadius", (v) => Number(v))} min={1} max={100} />
                <ToggleRow label="Auto-accept jobs" checked={currentSettings.service.autoAcceptJobs} onChange={onToggle("service.autoAcceptJobs")} />
                <div className="pt-3 border-t border-gray-100 space-y-1">
                  <RowNumberInput label="Minimum job value" value={currentSettings.service.minimumJobValue} onChange={onInput("service.minimumJobValue", (v) => Number(v))} min={0} />
                  <RowNumberInput label="Maximum job value" value={currentSettings.service.maximumJobValue} onChange={onInput("service.maximumJobValue", (v) => Number(v))} min={0} />
                </div>
                <div className="pt-3 border-t border-gray-100">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preferred job types</label>
                  <div className="flex flex-wrap gap-2">
                    {(["cleaning", "maintenance", "repair", "installation", "consultation", "other"] as const).map((jobType) => (
                      <Checkbox
                        key={jobType}
                        label={jobType.charAt(0).toUpperCase() + jobType.slice(1)}
                        checked={currentSettings.service.preferredJobTypes.includes(jobType)}
                        onChange={onArrayToggle("service.preferredJobTypes", jobType)}
                      />
                    ))}
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-100 space-y-1">
                  <RowInput
                    label="Working hours start"
                    type="time"
                    value={currentSettings.service.workingHours.start}
                    onChange={onInput("service.workingHours.start")}
                  />
                  <RowInput
                    label="Working hours end"
                    type="time"
                    value={currentSettings.service.workingHours.end}
                    onChange={onInput("service.workingHours.end")}
                  />
                  <div className="flex items-start gap-4 py-2">
                    <label className="text-sm font-medium text-gray-700 w-32 flex-shrink-0 pt-2">Working days</label>
                    <div className="flex flex-wrap gap-2 flex-1">
                      {(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const).map((d) => (
                        <Checkbox
                          key={d}
                          label={d.charAt(0).toUpperCase() + d.slice(1).substring(0, 3)}
                          checked={currentSettings.service.workingHours.days.includes(d)}
                          onChange={onArrayToggle("service.workingHours.days", d)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-100 space-y-1">
                  <ToggleRow label="Emergency service" checked={currentSettings.service.emergencyService.enabled} onChange={onToggle("service.emergencyService.enabled")} />
                  <RowNumberInput label="Emergency surcharge (%)" value={currentSettings.service.emergencyService.surcharge} onChange={onInput("service.emergencyService.surcharge", (v) => Number(v))} min={0} />
                </div>
              </div>
            </SettingsSection>
          )}

          {/* Payment Settings */}
          <SettingsSection
            icon={CreditCard}
            title="Payment"
            description={isClient ? "Choose your preferred payment method" : "Payment methods, withdrawal, and invoice preferences"}
            isExpanded={expandedSections.payment}
            onToggle={() => toggleSection('payment')}
          >
            <div className="space-y-1">
              <RowSelect
                label="Preferred payment method"
                value={currentSettings.payment.preferredPaymentMethod}
                onChange={(value) => onInput("payment.preferredPaymentMethod")({ target: { value } } as React.ChangeEvent<HTMLSelectElement>)}
                options={(() => {
                  const enabledMethods = getEnabledPaymentMethods(appSettings);
                  const methodLabels: Record<string, string> = {
                    paypal: "PayPal",
                    paymaya: "PayMaya",
                    gcash: "GCash",
                    bank_transfer: "Bank Transfer",
                    cash: "Cash"
                  };
                  return enabledMethods.map(method => ({
                    value: method,
                    label: methodLabels[method] || method
                  }));
                })()}
              />
              {/* Auto-withdrawal and Invoice settings: Non-client only (business roles) */}
              {isBusinessRole && !isClient && (
                <>
                  <div className="pt-3 border-t border-gray-100 space-y-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Auto-Withdrawal</p>
                    <ToggleRow label="Enable auto-withdraw" checked={currentSettings.payment.autoWithdraw.enabled} onChange={onToggle("payment.autoWithdraw.enabled")} />
                    {currentSettings.payment.autoWithdraw.enabled && (
                      <>
                        <RowNumberInput label="Threshold amount" value={currentSettings.payment.autoWithdraw.threshold} onChange={onInput("payment.autoWithdraw.threshold", (v) => Number(v))} min={0} />
                        <RowSelect
                          label="Frequency"
                          value={currentSettings.payment.autoWithdraw.frequency}
                          onChange={(value) => onInput("payment.autoWithdraw.frequency")({ target: { value } } as React.ChangeEvent<HTMLSelectElement>)}
                          options={[
                            { value: "daily", label: "Daily" },
                            { value: "weekly", label: "Weekly" },
                            { value: "monthly", label: "Monthly" }
                          ]}
                        />
                      </>
                    )}
                  </div>
                  <div className="pt-3 border-t border-gray-100 space-y-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Invoice Settings</p>
                    <ToggleRow label="Include tax" checked={currentSettings.payment.invoiceSettings.includeTax} onChange={onToggle("payment.invoiceSettings.includeTax")} />
                    <RowNumberInput label="Tax rate (%)" value={currentSettings.payment.invoiceSettings.taxRate} onChange={onInput("payment.invoiceSettings.taxRate", (v) => Number(v))} min={0} max={100} />
                    <RowSelect
                      label="Invoice template"
                      value={currentSettings.payment.invoiceSettings.invoiceTemplate}
                      onChange={(value) => onInput("payment.invoiceSettings.invoiceTemplate")({ target: { value } } as React.ChangeEvent<HTMLSelectElement>)}
                      options={[
                        { value: "standard", label: "Standard" },
                        { value: "detailed", label: "Detailed" },
                        { value: "minimal", label: "Minimal" }
                      ]}
                    />
                  </div>
                </>
              )}
            </div>
          </SettingsSection>

          {/* Security Settings */}
          <SettingsSection
            icon={Shield}
            title="Security"
            description="Protect your account with authentication and alerts"
            isExpanded={expandedSections.security}
            onToggle={() => toggleSection('security')}
          >
            <div className="space-y-1">
              <ToggleRow label="Two-factor authentication" checked={currentSettings.security.twoFactorAuth.enabled} onChange={onToggle("security.twoFactorAuth.enabled")} />
              {currentSettings.security.twoFactorAuth.enabled && (
                <RowSelect
                  label="2FA method"
                  value={currentSettings.security.twoFactorAuth.method}
                  onChange={(value) => onInput("security.twoFactorAuth.method")({ target: { value } } as React.ChangeEvent<HTMLSelectElement>)}
                  options={[
                    { value: "sms", label: "SMS" },
                    { value: "email", label: "Email" },
                    { value: "authenticator", label: "Authenticator App" }
                  ]}
                />
              )}
              <div className="pt-3 border-t border-gray-100 space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Login Alerts</p>
                <ToggleRow label="Enable login alerts" checked={currentSettings.security.loginAlerts.enabled} onChange={onToggle("security.loginAlerts.enabled")} />
                <ToggleRow label="Alert on new device" checked={currentSettings.security.loginAlerts.newDevice} onChange={onToggle("security.loginAlerts.newDevice")} />
                <ToggleRow label="Alert on suspicious activity" checked={currentSettings.security.loginAlerts.suspiciousActivity} onChange={onToggle("security.loginAlerts.suspiciousActivity")} />
              </div>
              <div className="pt-3 border-t border-gray-100 space-y-1">
                <RowNumberInput label="Session timeout (hours)" value={currentSettings.security.sessionTimeout} onChange={onInput("security.sessionTimeout", (v) => Number(v))} min={1} max={168} />
                <ToggleRow label="Password change reminder" checked={currentSettings.security.passwordChangeReminder.enabled} onChange={onToggle("security.passwordChangeReminder.enabled")} />
                {currentSettings.security.passwordChangeReminder.enabled && (
                  <RowNumberInput label="Reminder frequency (days)" value={currentSettings.security.passwordChangeReminder.frequency} onChange={onInput("security.passwordChangeReminder.frequency", (v) => Number(v))} min={30} max={365} />
                )}
              </div>
            </div>
          </SettingsSection>

          {/* App Settings */}
          <SettingsSection
            icon={Smartphone}
            title="App Preferences"
            description="Customize your app experience"
            isExpanded={expandedSections.app}
            onToggle={() => toggleSection('app')}
          >
            <div className="space-y-1">
              <RowSelect
                label="Theme"
                value={currentSettings.app.theme}
                onChange={(value) => onInput("app.theme")({ target: { value } } as React.ChangeEvent<HTMLSelectElement>)}
                options={[
                  { value: "auto", label: "Auto" },
                  { value: "light", label: "Light" },
                  { value: "dark", label: "Dark" }
                ]}
              />
              <RowSelect
                label="Font size"
                value={currentSettings.app.fontSize}
                onChange={(value) => onInput("app.fontSize")({ target: { value } } as React.ChangeEvent<HTMLSelectElement>)}
                options={[
                  { value: "small", label: "Small" },
                  { value: "medium", label: "Medium" },
                  { value: "large", label: "Large" }
                ]}
              />
              <div className="pt-3 border-t border-gray-100 space-y-1">
                <ToggleRow label="Sound effects" checked={currentSettings.app.soundEffects.enabled} onChange={onToggle("app.soundEffects.enabled")} />
                {currentSettings.app.soundEffects.enabled && (
                  <div className="flex items-center gap-4 py-2">
                    <label className="text-sm font-medium text-gray-700 w-32 flex-shrink-0">Sound volume</label>
                    <div className="flex items-center gap-3 flex-1">
                      <input 
                        type="range" 
                        min={0} 
                        max={100} 
                        className="flex-1 accent-green-600" 
                        value={currentSettings.app.soundEffects.volume} 
                        onChange={onInput("app.soundEffects.volume", (v) => Number(v))} 
                      />
                      <span className="text-sm text-gray-600 w-12 text-right">{currentSettings.app.soundEffects.volume}%</span>
                    </div>
                  </div>
                )}
                <ToggleRow label="Haptic feedback" checked={currentSettings.app.hapticFeedback.enabled} onChange={onToggle("app.hapticFeedback.enabled")} />
                <ToggleRow label="Auto-save" checked={currentSettings.app.autoSave.enabled} onChange={onToggle("app.autoSave.enabled")} />
                {currentSettings.app.autoSave.enabled && (
                  <RowNumberInput label="Auto-save interval (sec)" value={currentSettings.app.autoSave.interval} onChange={onInput("app.autoSave.interval", (v) => Number(v))} min={10} max={300} />
                )}
              </div>
              <div className="pt-3 border-t border-gray-100 space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Data Usage</p>
                <RowSelect
                  label="Image quality"
                  value={currentSettings.app.dataUsage.imageQuality}
                  onChange={(value) => onInput("app.dataUsage.imageQuality")({ target: { value } } as React.ChangeEvent<HTMLSelectElement>)}
                  options={[
                    { value: "low", label: "Low" },
                    { value: "medium", label: "Medium" },
                    { value: "high", label: "High" }
                  ]}
                />
                <RowSelect
                  label="Video quality"
                  value={currentSettings.app.dataUsage.videoQuality}
                  onChange={(value) => onInput("app.dataUsage.videoQuality")({ target: { value } } as React.ChangeEvent<HTMLSelectElement>)}
                  options={[
                    { value: "low", label: "Low" },
                    { value: "medium", label: "Medium" },
                    { value: "high", label: "High" }
                  ]}
                />
                <ToggleRow label="Auto-download media" checked={currentSettings.app.dataUsage.autoDownload} onChange={onToggle("app.dataUsage.autoDownload")} />
              </div>
            </div>
          </SettingsSection>

          {/* Analytics Settings */}
          <SettingsSection
            icon={BarChart3}
            title="Analytics & Personalization"
            description="Control data sharing and personalized recommendations"
            isExpanded={expandedSections.analytics}
            onToggle={() => toggleSection('analytics')}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                ["Share usage data", "analytics.shareUsageData"],
                ["Share location data", "analytics.shareLocationData"],
                ["Share performance data", "analytics.sharePerformanceData"],
                ["Personalized recommendations", "analytics.personalizedRecommendations"],
              ].map(([label, path]) => (
                <ToggleRow key={path as string} label={label as string} checked={getAtPath(settings, path as string) as boolean} onChange={onToggle(path as string)} />
              ))}
            </div>
          </SettingsSection>
        </div>

          {/* Sidebar */}
          <div className="space-y-8 lg:sticky lg:top-8">
            <div className="bg-gradient-to-br from-accent/10 via-emerald-50 to-accent/10 rounded-xl p-6 border border-accent/20 shadow-md hover:shadow-lg transition-all duration-300">
              <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
              <p className="text-sm text-gray-600 mb-4">Having trouble with your settings? We&apos;re here to help.</p>
              <Link
                href="/support"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-accent rounded-lg hover:bg-accent/10 transition-all border border-accent/20 font-medium text-sm shadow-sm hover:shadow-md transform hover:scale-105"
              >
                <Headphones className="w-4 h-4" />
                Contact Support
              </Link>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow(props: { label: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <label className="flex items-center justify-between py-2 px-1 hover:bg-gradient-to-r hover:from-accent/10/50 hover:to-emerald-50/50 rounded-lg transition-all duration-300 cursor-pointer group">
      <span className="text-sm text-gray-700 font-medium group-hover:text-gray-900 transition-colors">{props.label}</span>
      <span className="inline-flex items-center">
        <input type="checkbox" className="sr-only peer" checked={props.checked} onChange={props.onChange} />
        <span className={`w-11 h-6 rounded-full transition-all duration-200 relative shadow-inner ${
          props.checked ? 'bg-gradient-to-r from-accent to-emerald-600 shadow-green-500/30' : 'bg-gray-300'
        }`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-lg transition-transform duration-200 ${
            props.checked ? 'translate-x-5' : 'translate-x-0'
          }`}></span>
        </span>
      </span>
    </label>
  );
}

// Row-based input components with label and input in same row
function RowInput(props: { label: string; value: string; onChange: (e: ChangeEvent) => void; type?: string; placeholder?: string }) {
  return (
    <div className="flex items-center gap-4 py-2">
      <label className="text-sm font-medium text-gray-700 w-32 flex-shrink-0">{props.label}</label>
      <input 
        type={props.type || "text"}
        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all shadow-sm hover:shadow-md focus:shadow-lg" 
        value={props.value} 
        onChange={props.onChange} 
        placeholder={props.placeholder}
      />
    </div>
  );
}

function RowSelect(props: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return (
    <div className="flex items-center gap-4 py-2">
      <label className="text-sm font-medium text-gray-700 w-32 flex-shrink-0">{props.label}</label>
      <select
        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all bg-white shadow-sm hover:shadow-md focus:shadow-lg"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
      >
        {props.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function RowNumberInput(props: { label: string; value: number; onChange: (e: ChangeEvent) => void; min?: number; max?: number }) {
  return (
    <div className="flex items-center gap-4 py-2">
      <label className="text-sm font-medium text-gray-700 w-32 flex-shrink-0">{props.label}</label>
      <input 
        type="number" 
        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all shadow-sm hover:shadow-md focus:shadow-lg" 
        value={Number.isFinite(props.value) ? props.value : 0} 
        onChange={props.onChange} 
        min={props.min} 
        max={props.max} 
      />
    </div>
  );
}

function RowTextarea(props: { label: string; value: string; onChange: (e: ChangeEvent) => void; rows?: number; placeholder?: string }) {
  return (
    <div className="flex items-start gap-4 py-2">
      <label className="text-sm font-medium text-gray-700 w-32 flex-shrink-0 pt-2">{props.label}</label>
      <textarea
        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all resize-none shadow-sm hover:shadow-md focus:shadow-lg"
        value={props.value}
        onChange={props.onChange}
        rows={props.rows || 3}
        placeholder={props.placeholder}
      />
    </div>
  );
}

