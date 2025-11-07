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
  LucideIcon
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { apiRequest, API_ENDPOINTS } from "@/lib/api";
import { defaultUserSettings, type UserSettings } from "@/types/user-settings";
import { useSession } from "@/hooks/useAuth";
import { logger } from "@/lib/logger";
import { Checkbox } from "@/components/ui/checkbox";
import Breadcrumbs from "@/components/ui/breadcrumbs";
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
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200 hover:from-gray-100 hover:to-gray-200 transition-colors"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-600">
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 text-base">{title}</h3>
              {description && (
                <p className="text-xs text-gray-500 mt-0.5">{description}</p>
              )}
            </div>
          </div>
          <ChevronIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
        </div>
      </button>
      {expanded && (
        <div className="p-6 transition-all duration-200 ease-in-out">
          {children}
        </div>
      )}
    </section>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    privacy: true, // Privacy expanded by default
    notifications: false,
    communication: false,
    service: false,
    payment: false,
    security: false,
    app: false,
    analytics: false,
  });
  const { data: session } = useSession();

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const data = await apiRequest<UserSettings>(API_ENDPOINTS.settingsUser, { method: "GET" });
        if (!isMounted) return;
        setSettings(mergeWithDefaults(data));
        setHasChanges(false);
      } catch {
        if (!isMounted) return;
        setSettings(defaultUserSettings);
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, []);

  const userRole = session?.user?.role;
  // Normalize role format (handle both uppercase and lowercase)
  const normalizedRole = userRole?.toUpperCase();
  const isClient = normalizedRole === 'CLIENT' || userRole === 'client';
  const isProvider = normalizedRole === 'PROVIDER' || userRole === 'provider';
  const isSupplier = normalizedRole === 'SUPPLIER' || userRole === 'supplier';
  const isInstructor = normalizedRole === 'INSTRUCTOR' || userRole === 'instructor';
  const isAgencyOwner = normalizedRole === 'AGENCY_OWNER' || userRole === 'agency_owner';
  const isAgencyAdmin = normalizedRole === 'AGENCY_ADMIN' || userRole === 'agency_admin';
  const isAdmin = normalizedRole === 'ADMIN' || userRole === 'admin';
  const isBusinessRole = isProvider || isSupplier || isInstructor || isAgencyOwner || isAgencyAdmin || isAdmin;
  const isServiceProvider = isProvider || isAgencyOwner || isAgencyAdmin || isAdmin;

  function mergeWithDefaults(incoming: Partial<UserSettings>): UserSettings {
    return {
      ...defaultUserSettings,
      ...incoming,
      privacy: { ...defaultUserSettings.privacy, ...(incoming.privacy || {}) },
      notifications: {
        push: { ...defaultUserSettings.notifications.push, ...(incoming.notifications?.push || {}) },
        email: { ...defaultUserSettings.notifications.email, ...(incoming.notifications?.email || {}) },
        sms: { ...defaultUserSettings.notifications.sms, ...(incoming.notifications?.sms || {}) },
      },
      communication: {
        ...defaultUserSettings.communication,
        ...(incoming.communication || {}),
        autoReply: {
          ...defaultUserSettings.communication.autoReply,
          ...(incoming.communication?.autoReply || {}),
        },
      },
      service: {
        ...defaultUserSettings.service,
        ...(incoming.service || {}),
        workingHours: {
          ...defaultUserSettings.service.workingHours,
          ...(incoming.service?.workingHours || {}),
        },
        emergencyService: {
          ...defaultUserSettings.service.emergencyService,
          ...(incoming.service?.emergencyService || {}),
        },
      },
      payment: {
        ...defaultUserSettings.payment,
        ...(incoming.payment || {}),
        autoWithdraw: {
          ...defaultUserSettings.payment.autoWithdraw,
          ...(incoming.payment?.autoWithdraw || {}),
        },
        invoiceSettings: {
          ...defaultUserSettings.payment.invoiceSettings,
          ...(incoming.payment?.invoiceSettings || {}),
        },
      },
      security: {
        ...defaultUserSettings.security,
        ...(incoming.security || {}),
        twoFactorAuth: {
          ...defaultUserSettings.security.twoFactorAuth,
          ...(incoming.security?.twoFactorAuth || {}),
        },
        loginAlerts: {
          ...defaultUserSettings.security.loginAlerts,
          ...(incoming.security?.loginAlerts || {}),
        },
        passwordChangeReminder: {
          ...defaultUserSettings.security.passwordChangeReminder,
          ...(incoming.security?.passwordChangeReminder || {}),
        },
      },
      app: {
        ...defaultUserSettings.app,
        ...(incoming.app || {}),
        soundEffects: {
          ...defaultUserSettings.app.soundEffects,
          ...(incoming.app?.soundEffects || {}),
        },
        hapticFeedback: {
          ...defaultUserSettings.app.hapticFeedback,
          ...(incoming.app?.hapticFeedback || {}),
        },
        autoSave: {
          ...defaultUserSettings.app.autoSave,
          ...(incoming.app?.autoSave || {}),
        },
        dataUsage: {
          ...defaultUserSettings.app.dataUsage,
          ...(incoming.app?.dataUsage || {}),
        },
      },
      analytics: { ...defaultUserSettings.analytics, ...(incoming.analytics || {}) },
    };
  }

  const handleSave = useCallback(async () => {
    if (!settings || saving) return;
    
    setSaving(true);
    try {
      await apiRequest<UserSettings>(API_ENDPOINTS.settingsUser, {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      setHasChanges(false);
      setLastSaved(new Date());
      toast.success("Settings saved successfully!");
    } catch (error) {
      logger.error("Error saving settings", error instanceof Error ? error : new Error(String(error)));
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }, [settings, saving]);

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

  if (loading || !settings) {
    return <Loading variant="dashboard" fullScreen text="Loading Settings" subtitle="Preparing your account settings..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pb-8">
      <Breadcrumbs
        className="text-sm text-gray-500 mb-6"
        items={[
          { label: "Marketplace", href: "/marketplace" },
          { label: "Settings" },
        ]}
      />

      {/* Header with Save Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 text-green-600 flex items-center justify-center shadow-sm">
            <SettingsIcon className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your account preferences and privacy</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {lastSaved && (
            <span className="text-xs text-gray-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
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
            className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 shadow-sm ${
              hasChanges
                ? 'bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg disabled:opacity-50'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save Changes'}</span>
            <span className="sm:hidden">{saving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings Column */}
        <div className="lg:col-span-2 space-y-6">
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
                value={settings.privacy.profileVisibility}
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
                  <ToggleRow key={path as string} label={label as string} checked={getAtPath(settings, path as string) as boolean} onChange={onToggle(path as string)} />
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
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
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
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
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
                value={settings.communication.preferredLanguage}
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
                value={settings.communication.timezone}
                onChange={onInput("communication.timezone")}
                placeholder="Asia/Manila"
              />
              <RowSelect
                label="Date format"
                value={settings.communication.dateFormat}
                onChange={(value) => onInput("communication.dateFormat")({ target: { value } } as React.ChangeEvent<HTMLSelectElement>)}
                options={[
                  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
                  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
                  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" }
                ]}
              />
              <RowSelect
                label="Time format"
                value={settings.communication.timeFormat}
                onChange={(value) => onInput("communication.timeFormat")({ target: { value } } as React.ChangeEvent<HTMLSelectElement>)}
                options={[
                  { value: "12h", label: "12-hour" },
                  { value: "24h", label: "24-hour" }
                ]}
              />
              <RowSelect
                label="Currency"
                value={settings.communication.currency}
                onChange={(value) => onInput("communication.currency")({ target: { value } } as React.ChangeEvent<HTMLSelectElement>)}
                options={[
                  { value: "PHP", label: "PHP (Philippine Peso)" },
                  { value: "USD", label: "USD (US Dollar)" },
                  { value: "EUR", label: "EUR (Euro)" },
                  { value: "GBP", label: "GBP (British Pound)" },
                  { value: "JPY", label: "JPY (Japanese Yen)" },
                  { value: "KRW", label: "KRW (Korean Won)" },
                  { value: "CNY", label: "CNY (Chinese Yuan)" }
                ]}
              />
            </div>
            {/* Auto-reply: Non-client only (business roles) */}
            {isBusinessRole && !isClient && (
              <div className="mt-5 pt-5 border-t border-gray-100">
                <div className="space-y-1">
                  <ToggleRow label="Auto-reply enabled" checked={settings.communication.autoReply.enabled} onChange={onToggle("communication.autoReply.enabled")} />
                  {settings.communication.autoReply.enabled && (
                    <RowTextarea
                      label="Auto-reply message"
                      rows={3}
                      value={settings.communication.autoReply.message}
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
                <RowNumberInput label="Service radius (km)" value={settings.service.defaultServiceRadius} onChange={onInput("service.defaultServiceRadius", (v) => Number(v))} min={1} max={100} />
                <ToggleRow label="Auto-accept jobs" checked={settings.service.autoAcceptJobs} onChange={onToggle("service.autoAcceptJobs")} />
                <div className="pt-3 border-t border-gray-100 space-y-1">
                  <RowNumberInput label="Minimum job value" value={settings.service.minimumJobValue} onChange={onInput("service.minimumJobValue", (v) => Number(v))} min={0} />
                  <RowNumberInput label="Maximum job value" value={settings.service.maximumJobValue} onChange={onInput("service.maximumJobValue", (v) => Number(v))} min={0} />
                </div>
                <div className="pt-3 border-t border-gray-100">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preferred job types</label>
                  <div className="flex flex-wrap gap-2">
                    {(["cleaning", "maintenance", "repair", "installation", "consultation", "other"] as const).map((jobType) => (
                      <Checkbox
                        key={jobType}
                        label={jobType.charAt(0).toUpperCase() + jobType.slice(1)}
                        checked={settings.service.preferredJobTypes.includes(jobType)}
                        onChange={onArrayToggle("service.preferredJobTypes", jobType)}
                      />
                    ))}
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-100 space-y-1">
                  <RowInput
                    label="Working hours start"
                    type="time"
                    value={settings.service.workingHours.start}
                    onChange={onInput("service.workingHours.start")}
                  />
                  <RowInput
                    label="Working hours end"
                    type="time"
                    value={settings.service.workingHours.end}
                    onChange={onInput("service.workingHours.end")}
                  />
                  <div className="flex items-start gap-4 py-2">
                    <label className="text-sm font-medium text-gray-700 w-32 flex-shrink-0 pt-2">Working days</label>
                    <div className="flex flex-wrap gap-2 flex-1">
                      {(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const).map((d) => (
                        <Checkbox
                          key={d}
                          label={d.charAt(0).toUpperCase() + d.slice(1).substring(0, 3)}
                          checked={settings.service.workingHours.days.includes(d)}
                          onChange={onArrayToggle("service.workingHours.days", d)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-100 space-y-1">
                  <ToggleRow label="Emergency service" checked={settings.service.emergencyService.enabled} onChange={onToggle("service.emergencyService.enabled")} />
                  <RowNumberInput label="Emergency surcharge (%)" value={settings.service.emergencyService.surcharge} onChange={onInput("service.emergencyService.surcharge", (v) => Number(v))} min={0} />
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
                value={settings.payment.preferredPaymentMethod}
                onChange={(value) => onInput("payment.preferredPaymentMethod")({ target: { value } } as React.ChangeEvent<HTMLSelectElement>)}
                options={[
                  { value: "paypal", label: "PayPal" },
                  { value: "paymaya", label: "PayMaya" },
                  { value: "gcash", label: "GCash" },
                  { value: "bank_transfer", label: "Bank Transfer" },
                  { value: "cash", label: "Cash" }
                ]}
              />
              {/* Auto-withdrawal and Invoice settings: Non-client only (business roles) */}
              {isBusinessRole && !isClient && (
                <>
                  <div className="pt-3 border-t border-gray-100 space-y-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Auto-Withdrawal</p>
                    <ToggleRow label="Enable auto-withdraw" checked={settings.payment.autoWithdraw.enabled} onChange={onToggle("payment.autoWithdraw.enabled")} />
                    {settings.payment.autoWithdraw.enabled && (
                      <>
                        <RowNumberInput label="Threshold amount" value={settings.payment.autoWithdraw.threshold} onChange={onInput("payment.autoWithdraw.threshold", (v) => Number(v))} min={0} />
                        <RowSelect
                          label="Frequency"
                          value={settings.payment.autoWithdraw.frequency}
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
                    <ToggleRow label="Include tax" checked={settings.payment.invoiceSettings.includeTax} onChange={onToggle("payment.invoiceSettings.includeTax")} />
                    <RowNumberInput label="Tax rate (%)" value={settings.payment.invoiceSettings.taxRate} onChange={onInput("payment.invoiceSettings.taxRate", (v) => Number(v))} min={0} max={100} />
                    <RowSelect
                      label="Invoice template"
                      value={settings.payment.invoiceSettings.invoiceTemplate}
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
              <ToggleRow label="Two-factor authentication" checked={settings.security.twoFactorAuth.enabled} onChange={onToggle("security.twoFactorAuth.enabled")} />
              {settings.security.twoFactorAuth.enabled && (
                <RowSelect
                  label="2FA method"
                  value={settings.security.twoFactorAuth.method}
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
                <ToggleRow label="Enable login alerts" checked={settings.security.loginAlerts.enabled} onChange={onToggle("security.loginAlerts.enabled")} />
                <ToggleRow label="Alert on new device" checked={settings.security.loginAlerts.newDevice} onChange={onToggle("security.loginAlerts.newDevice")} />
                <ToggleRow label="Alert on suspicious activity" checked={settings.security.loginAlerts.suspiciousActivity} onChange={onToggle("security.loginAlerts.suspiciousActivity")} />
              </div>
              <div className="pt-3 border-t border-gray-100 space-y-1">
                <RowNumberInput label="Session timeout (hours)" value={settings.security.sessionTimeout} onChange={onInput("security.sessionTimeout", (v) => Number(v))} min={1} max={168} />
                <ToggleRow label="Password change reminder" checked={settings.security.passwordChangeReminder.enabled} onChange={onToggle("security.passwordChangeReminder.enabled")} />
                {settings.security.passwordChangeReminder.enabled && (
                  <RowNumberInput label="Reminder frequency (days)" value={settings.security.passwordChangeReminder.frequency} onChange={onInput("security.passwordChangeReminder.frequency", (v) => Number(v))} min={30} max={365} />
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
                value={settings.app.theme}
                onChange={(value) => onInput("app.theme")({ target: { value } } as React.ChangeEvent<HTMLSelectElement>)}
                options={[
                  { value: "auto", label: "Auto" },
                  { value: "light", label: "Light" },
                  { value: "dark", label: "Dark" }
                ]}
              />
              <RowSelect
                label="Font size"
                value={settings.app.fontSize}
                onChange={(value) => onInput("app.fontSize")({ target: { value } } as React.ChangeEvent<HTMLSelectElement>)}
                options={[
                  { value: "small", label: "Small" },
                  { value: "medium", label: "Medium" },
                  { value: "large", label: "Large" }
                ]}
              />
              <div className="pt-3 border-t border-gray-100 space-y-1">
                <ToggleRow label="Sound effects" checked={settings.app.soundEffects.enabled} onChange={onToggle("app.soundEffects.enabled")} />
                {settings.app.soundEffects.enabled && (
                  <div className="flex items-center gap-4 py-2">
                    <label className="text-sm font-medium text-gray-700 w-32 flex-shrink-0">Sound volume</label>
                    <div className="flex items-center gap-3 flex-1">
                      <input 
                        type="range" 
                        min={0} 
                        max={100} 
                        className="flex-1 accent-green-600" 
                        value={settings.app.soundEffects.volume} 
                        onChange={onInput("app.soundEffects.volume", (v) => Number(v))} 
                      />
                      <span className="text-sm text-gray-600 w-12 text-right">{settings.app.soundEffects.volume}%</span>
                    </div>
                  </div>
                )}
                <ToggleRow label="Haptic feedback" checked={settings.app.hapticFeedback.enabled} onChange={onToggle("app.hapticFeedback.enabled")} />
                <ToggleRow label="Auto-save" checked={settings.app.autoSave.enabled} onChange={onToggle("app.autoSave.enabled")} />
                {settings.app.autoSave.enabled && (
                  <RowNumberInput label="Auto-save interval (sec)" value={settings.app.autoSave.interval} onChange={onInput("app.autoSave.interval", (v) => Number(v))} min={10} max={300} />
                )}
              </div>
              <div className="pt-3 border-t border-gray-100 space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Data Usage</p>
                <RowSelect
                  label="Image quality"
                  value={settings.app.dataUsage.imageQuality}
                  onChange={(value) => onInput("app.dataUsage.imageQuality")({ target: { value } } as React.ChangeEvent<HTMLSelectElement>)}
                  options={[
                    { value: "low", label: "Low" },
                    { value: "medium", label: "Medium" },
                    { value: "high", label: "High" }
                  ]}
                />
                <RowSelect
                  label="Video quality"
                  value={settings.app.dataUsage.videoQuality}
                  onChange={(value) => onInput("app.dataUsage.videoQuality")({ target: { value } } as React.ChangeEvent<HTMLSelectElement>)}
                  options={[
                    { value: "low", label: "Low" },
                    { value: "medium", label: "Medium" },
                    { value: "high", label: "High" }
                  ]}
                />
                <ToggleRow label="Auto-download media" checked={settings.app.dataUsage.autoDownload} onChange={onToggle("app.dataUsage.autoDownload")} />
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
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
            <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
            <p className="text-sm text-gray-600 mb-4">Having trouble with your settings? We&apos;re here to help.</p>
            <button className="w-full px-4 py-2 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors border border-gray-200">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow(props: { label: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <label className="flex items-center justify-between py-2 px-1 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
      <span className="text-sm text-gray-700 font-medium">{props.label}</span>
      <span className="inline-flex items-center">
        <input type="checkbox" className="sr-only peer" checked={props.checked} onChange={props.onChange} />
        <span className={`w-11 h-6 rounded-full transition-all duration-200 relative ${
          props.checked ? 'bg-green-600' : 'bg-gray-300'
        }`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
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
        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all" 
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
        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white"
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
        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all" 
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
        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
        value={props.value}
        onChange={props.onChange}
        rows={props.rows || 3}
        placeholder={props.placeholder}
      />
    </div>
  );
}

