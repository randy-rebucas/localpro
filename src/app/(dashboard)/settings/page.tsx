"use client";

import Link from "next/link";
import { Settings as SettingsIcon, Save, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiRequest, API_ENDPOINTS } from "@/lib/api";
import { defaultUserSettings, type UserSettings } from "@/types/user-settings";
import { useSession } from "@/hooks/useAuth";

type ChangeEvent = React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string>("");
  const { data: session } = useSession();

  const fieldClass = "w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600";
  const selectClass = "w-full px-3 py-2 pr-8 bg-white border border-gray-200 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 appearance-none bg-no-repeat bg-right bg-[length:16px] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQgNkw4IDEwTDEyIDYiIHN0cm9rZT0iIzY2NzU4MSIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K')]";
  const textareaClass = fieldClass;
  const checkboxClass = "rounded border-gray-200 text-green-600 focus:ring-green-600";

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const data = await apiRequest<UserSettings>(API_ENDPOINTS.settingsUser, { method: "GET" });
        if (!isMounted) return;
        setSettings(mergeWithDefaults(data));
      } catch {
        if (!isMounted) return;
        setSettings(defaultUserSettings);
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const canSave = useMemo(() => !!settings && !saving, [settings, saving]);
  
  // Get user role for conditional rendering
  const userRole = session?.user?.role;
  
  // Role-based visibility helpers
  const isClient = userRole === 'CLIENT';
  const isProvider = userRole === 'PROVIDER';
  const isSupplier = userRole === 'SUPPLIER';
  const isInstructor = userRole === 'INSTRUCTOR';
  const isAgencyOwner = userRole === 'AGENCY_OWNER';
  const isAgencyAdmin = userRole === 'AGENCY_ADMIN';
  const isAdmin = userRole === 'ADMIN';
  
  // Business roles (providers, suppliers, instructors, agency roles)
  const isBusinessRole = isProvider || isSupplier || isInstructor || isAgencyOwner || isAgencyAdmin || isAdmin;
  
  // Service provider roles (providers, agency roles)
  const isServiceProvider = isProvider || isAgencyOwner || isAgencyAdmin || isAdmin;
  
  // Administrative roles
  const isAdministrative = isAgencyOwner || isAgencyAdmin || isAdmin;

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

  function onToggle(path: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const checked = e.target.checked;
      setSettings((prev) => updateAtPath(prev, path, checked));
    };
  }

  function onInput(path: string, parser: (v: string) => string | number = (v) => v) {
    return (e: ChangeEvent) => {
      const value = parser(e.target.value);
      setSettings((prev) => updateAtPath(prev, path, value));
    };
  }

  function onArrayToggle(path: string, value: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const checked = e.target.checked;
      setSettings((prev) => {
        if (!prev) return prev;
        const current = getAtPath<string[]>(prev, path) || [];
        const next = checked ? Array.from(new Set([...current, value])) : current.filter((v) => v !== value);
        return updateAtPath(prev, path, next);
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

  async function onSave() {
    if (!settings) return;
    setSaving(true);
    setSaveMessage("");
    try {
      const updated = await apiRequest<UserSettings>(API_ENDPOINTS.settingsUser, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSettings(mergeWithDefaults(updated));
      setSaveMessage("Saved");
    } catch {
      setSaveMessage("Failed to save");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(""), 2000);
    }
  }

  if (loading || !settings) {
    return (
      <div className="flex items-center gap-2 text-gray-600">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading settings…</span>
      </div>
    );
  }

  return (
    <div>
      <nav className="text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          <li>
            <Link href="/dashboard" className="hover:text-gray-700">Dashboard</Link>
          </li>
          <li className="select-none">/</li>
          <li className="text-gray-700 font-medium">Settings</li>
        </ol>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-semibold text-gray-700">Settings</h2>
        </div>
        <button
          onClick={onSave}
          disabled={!canSave}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm disabled:opacity-50 disabled:cursor-not-allowed bg-gray-900 text-white hover:bg-gray-800"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? "Saving…" : "Save"}</span>
        </button>
      </div>

      {saveMessage && (
        <div className="mb-4 text-sm text-gray-700">{saveMessage}</div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {/* Privacy */}
        <section className="bg-white rounded-lg p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Privacy</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Profile visibility</label>
              <select
                className={selectClass}
                value={settings.privacy.profileVisibility}
                onChange={onInput("privacy.profileVisibility", (v) => v)}
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="connections">Connections</option>
              </select>
            </div>
            {[
              ["Show phone number", "privacy.showPhoneNumber"],
              ["Show email", "privacy.showEmail"],
              ["Show location", "privacy.showLocation"],
              ["Show rating", "privacy.showRating"],
              ["Show portfolio", "privacy.showPortfolio"],
              ["Allow direct messages", "privacy.allowDirectMessages"],
              // Role-specific privacy settings
              ...(isServiceProvider ? [
                ["Allow job invitations", "privacy.allowJobInvitations"],
              ] : []),
              ...(isBusinessRole ? [
                ["Allow referral requests", "privacy.allowReferralRequests"],
              ] : []),
            ].map(([label, path]) => (
              <ToggleRow key={path as string} label={label as string} checked={getAtPath(settings, path as string) as boolean} onChange={onToggle(path as string)} />
            ))}
          </div>
        </section>

        {/* Notifications */}
        <section className="bg-white rounded-lg p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Notifications</h3>
          <h4 className="text-sm font-medium text-gray-700">Push</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {[
              ["Enabled", "notifications.push.enabled"],
              ["New messages", "notifications.push.newMessages"],
              // Role-specific notifications
              ...(isServiceProvider ? [
                ["Job matches", "notifications.push.jobMatches"],
                ["Booking updates", "notifications.push.bookingUpdates"],
              ] : []),
              ...(isBusinessRole ? [
                ["Payment updates", "notifications.push.paymentUpdates"],
                ["Referral updates", "notifications.push.referralUpdates"],
              ] : []),
              ["System updates", "notifications.push.systemUpdates"],
              ["Marketing", "notifications.push.marketing"],
            ].map(([label, path]) => (
              <ToggleRow key={path as string} label={label as string} checked={getAtPath(settings, path as string) as boolean} onChange={onToggle(path as string)} />
            ))}
          </div>
          <h4 className="text-sm font-medium text-gray-700">Email</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {[
              ["Enabled", "notifications.email.enabled"],
              ["New messages", "notifications.email.newMessages"],
              // Role-specific email notifications
              ...(isServiceProvider ? [
                ["Job matches", "notifications.email.jobMatches"],
                ["Booking updates", "notifications.email.bookingUpdates"],
              ] : []),
              ...(isBusinessRole ? [
                ["Payment updates", "notifications.email.paymentUpdates"],
                ["Referral updates", "notifications.email.referralUpdates"],
                ["Weekly digest", "notifications.email.weeklyDigest"],
                ["Monthly report", "notifications.email.monthlyReport"],
              ] : []),
              ["System updates", "notifications.email.systemUpdates"],
              ["Marketing", "notifications.email.marketing"],
            ].map(([label, path]) => (
              <ToggleRow key={path as string} label={label as string} checked={getAtPath(settings, path as string) as boolean} onChange={onToggle(path as string)} />
            ))}
          </div>
          <h4 className="text-sm font-medium text-gray-700">SMS</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              ["Enabled", "notifications.sms.enabled"],
              ["Urgent messages", "notifications.sms.urgentMessages"],
              // Role-specific SMS notifications
              ...(isServiceProvider ? [
                ["Booking reminders", "notifications.sms.bookingReminders"],
              ] : []),
              ...(isBusinessRole ? [
                ["Payment alerts", "notifications.sms.paymentAlerts"],
              ] : []),
              ["Security alerts", "notifications.sms.securityAlerts"],
            ].map(([label, path]) => (
              <ToggleRow key={path as string} label={label as string} checked={getAtPath(settings, path as string) as boolean} onChange={onToggle(path as string)} />
            ))}
          </div>
        </section>

        {/* Communication */}
        <section className="bg-white rounded-lg p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Communication</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Preferred language</label>
              <select className={selectClass} value={settings.communication.preferredLanguage} onChange={onInput("communication.preferredLanguage")}>
                <option value="en">English</option>
                <option value="fil">Filipino</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Timezone</label>
              <input className={fieldClass} value={settings.communication.timezone} onChange={onInput("communication.timezone")} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Date format</label>
              <select className={selectClass} value={settings.communication.dateFormat} onChange={onInput("communication.dateFormat")}>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Time format</label>
              <select className={selectClass} value={settings.communication.timeFormat} onChange={onInput("communication.timeFormat")}>
                <option value="12h">12-hour</option>
                <option value="24h">24-hour</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Currency</label>
              <input className={fieldClass} value={settings.communication.currency} onChange={onInput("communication.currency")} />
            </div>
          </div>
          {/* Auto-reply settings - only for business roles */}
          {isBusinessRole && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <ToggleRow label="Auto-reply enabled" checked={settings.communication.autoReply.enabled} onChange={onToggle("communication.autoReply.enabled")} />
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-700 mb-1">Auto-reply message</label>
                <textarea className={textareaClass} rows={3} value={settings.communication.autoReply.message} onChange={onInput("communication.autoReply.message")} />
              </div>
            </div>
          )}
        </section>

        {/* Service - Only show for service providers */}
        {isServiceProvider && (
          <section className="bg-white rounded-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Service</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <NumberInput label="Default service radius (km)" value={settings.service.defaultServiceRadius} onChange={onInput("service.defaultServiceRadius", (v) => Number(v))} min={0} />
              <ToggleRow label="Auto-accept jobs" checked={settings.service.autoAcceptJobs} onChange={onToggle("service.autoAcceptJobs")} />
              <div />
              <NumberInput label="Minimum job value" value={settings.service.minimumJobValue} onChange={onInput("service.minimumJobValue", (v) => Number(v))} min={0} />
              <NumberInput label="Maximum job value" value={settings.service.maximumJobValue} onChange={onInput("service.maximumJobValue", (v) => Number(v))} min={0} />
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Working hours start</label>
                <input type="time" className={fieldClass} value={settings.service.workingHours.start} onChange={onInput("service.workingHours.start")} />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Working hours end</label>
                <input type="time" className={fieldClass} value={settings.service.workingHours.end} onChange={onInput("service.workingHours.end")} />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Working days</label>
                <div className="flex flex-wrap gap-3">
                  {(["monday","tuesday","wednesday","thursday","friday","saturday","sunday"] as const).map((d) => (
                    <label key={d} className="inline-flex items-center gap-2 text-sm">
                      <input type="checkbox" className={checkboxClass} checked={settings.service.workingHours.days.includes(d)} onChange={onArrayToggle("service.workingHours.days", d)} />
                      <span className="capitalize">{d}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <ToggleRow label="Emergency service" checked={settings.service.emergencyService.enabled} onChange={onToggle("service.emergencyService.enabled")} />
              <NumberInput label="Emergency surcharge (%)" value={settings.service.emergencyService.surcharge} onChange={onInput("service.emergencyService.surcharge", (v) => Number(v))} min={0} />
            </div>
          </section>
        )}

        {/* Payment */}
        <section className="bg-white rounded-lg p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Payment</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Preferred method</label>
              <select className={selectClass} value={settings.payment.preferredPaymentMethod} onChange={onInput("payment.preferredPaymentMethod")}>
                <option value="paypal">PayPal</option>
                <option value="paymaya">PayMaya</option>
                <option value="gcash">GCash</option>
                <option value="bank">Bank</option>
                <option value="cash">Cash</option>
              </select>
            </div>
            {/* Auto-withdraw settings - only for business roles */}
            {isBusinessRole && (
              <>
                <ToggleRow label="Auto-withdraw" checked={settings.payment.autoWithdraw.enabled} onChange={onToggle("payment.autoWithdraw.enabled")} />
                <NumberInput label="Auto-withdraw threshold" value={settings.payment.autoWithdraw.threshold} onChange={onInput("payment.autoWithdraw.threshold", (v) => Number(v))} min={0} />
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Auto-withdraw frequency</label>
                  <select className={selectClass} value={settings.payment.autoWithdraw.frequency} onChange={onInput("payment.autoWithdraw.frequency")}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <ToggleRow label="Include tax on invoices" checked={settings.payment.invoiceSettings.includeTax} onChange={onToggle("payment.invoiceSettings.includeTax")} />
                <NumberInput label="Tax rate (%)" value={settings.payment.invoiceSettings.taxRate} onChange={onInput("payment.invoiceSettings.taxRate", (v) => Number(v))} min={0} />
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Invoice template</label>
                  <input className={fieldClass} value={settings.payment.invoiceSettings.invoiceTemplate} onChange={onInput("payment.invoiceSettings.invoiceTemplate")} />
                </div>
              </>
            )}
          </div>
        </section>

        {/* Supplier-specific settings */}
        {isSupplier && (
          <section className="bg-white rounded-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Supply Management</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ToggleRow label="Low stock alerts" checked={true} onChange={() => {}} />
              <ToggleRow label="Order notifications" checked={true} onChange={() => {}} />
              <ToggleRow label="Inventory updates" checked={true} onChange={() => {}} />
              <ToggleRow label="Delivery notifications" checked={true} onChange={() => {}} />
            </div>
          </section>
        )}

        {/* Instructor-specific settings */}
        {isInstructor && (
          <section className="bg-white rounded-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Academy Management</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ToggleRow label="Student enrollment alerts" checked={true} onChange={() => {}} />
              <ToggleRow label="Course completion notifications" checked={true} onChange={() => {}} />
              <ToggleRow label="Content upload reminders" checked={true} onChange={() => {}} />
              <ToggleRow label="Student message notifications" checked={true} onChange={() => {}} />
            </div>
          </section>
        )}

        {/* Agency-specific settings */}
        {isAdministrative && (
          <section className="bg-white rounded-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Agency Management</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ToggleRow label="Team member notifications" checked={true} onChange={() => {}} />
              <ToggleRow label="Performance alerts" checked={true} onChange={() => {}} />
              <ToggleRow label="Business analytics updates" checked={true} onChange={() => {}} />
              <ToggleRow label="Compliance reminders" checked={true} onChange={() => {}} />
            </div>
          </section>
        )}

        {/* Security */}
        <section className="bg-white rounded-lg p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Security</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ToggleRow label="Two-factor authentication" checked={settings.security.twoFactorAuth.enabled} onChange={onToggle("security.twoFactorAuth.enabled")} />
            <div>
              <label className="block text-sm text-gray-700 mb-1">2FA method</label>
              <select className={selectClass} value={settings.security.twoFactorAuth.method} onChange={onInput("security.twoFactorAuth.method")}>
                <option value="sms">SMS</option>
                <option value="email">Email</option>
                <option value="authenticator">Authenticator</option>
              </select>
            </div>
            <ToggleRow label="Login alerts enabled" checked={settings.security.loginAlerts.enabled} onChange={onToggle("security.loginAlerts.enabled")} />
            <ToggleRow label="Alert on new device" checked={settings.security.loginAlerts.newDevice} onChange={onToggle("security.loginAlerts.newDevice")} />
            <ToggleRow label="Alert on suspicious activity" checked={settings.security.loginAlerts.suspiciousActivity} onChange={onToggle("security.loginAlerts.suspiciousActivity")} />
            <NumberInput label="Session timeout (hours)" value={settings.security.sessionTimeout} onChange={onInput("security.sessionTimeout", (v) => Number(v))} min={1} />
            <ToggleRow label="Password change reminder" checked={settings.security.passwordChangeReminder.enabled} onChange={onToggle("security.passwordChangeReminder.enabled")} />
            <NumberInput label="Reminder frequency (days)" value={settings.security.passwordChangeReminder.frequency} onChange={onInput("security.passwordChangeReminder.frequency", (v) => Number(v))} min={1} />
          </div>
        </section>

        {/* App */}
        <section className="bg-white rounded-lg p-4">
          <h3 className="font-semibold text-gray-700 mb-3">App</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Theme</label>
              <select className={selectClass} value={settings.app.theme} onChange={onInput("app.theme")}>
                <option value="auto">Auto</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Font size</label>
              <select className={selectClass} value={settings.app.fontSize} onChange={onInput("app.fontSize")}>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
            <ToggleRow label="Sound effects" checked={settings.app.soundEffects.enabled} onChange={onToggle("app.soundEffects.enabled")} />
            <div>
              <label className="block text-sm text-gray-700 mb-1">Sound volume</label>
              <input type="range" min={0} max={100} className="w-full accent-green-600" value={settings.app.soundEffects.volume} onChange={onInput("app.soundEffects.volume", (v) => Number(v))} />
              <div className="text-xs text-gray-600 mt-1">{settings.app.soundEffects.volume}</div>
            </div>
            <ToggleRow label="Haptic feedback" checked={settings.app.hapticFeedback.enabled} onChange={onToggle("app.hapticFeedback.enabled")} />
            <ToggleRow label="Auto-save" checked={settings.app.autoSave.enabled} onChange={onToggle("app.autoSave.enabled")} />
            <NumberInput label="Auto-save interval (sec)" value={settings.app.autoSave.interval} onChange={onInput("app.autoSave.interval", (v) => Number(v))} min={5} />
            <div>
              <label className="block text-sm text-gray-700 mb-1">Image quality</label>
              <select className={selectClass} value={settings.app.dataUsage.imageQuality} onChange={onInput("app.dataUsage.imageQuality")}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Video quality</label>
              <select className={selectClass} value={settings.app.dataUsage.videoQuality} onChange={onInput("app.dataUsage.videoQuality")}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <ToggleRow label="Auto-download media" checked={settings.app.dataUsage.autoDownload} onChange={onToggle("app.dataUsage.autoDownload")} />
          </div>
        </section>

        {/* Analytics */}
        <section className="bg-white rounded-lg p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Analytics & Personalization</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              ["Share usage data", "analytics.shareUsageData"],
              ["Share location data", "analytics.shareLocationData"],
              ["Share performance data", "analytics.sharePerformanceData"],
              ["Personalized recommendations", "analytics.personalizedRecommendations"],
            ].map(([label, path]) => (
              <ToggleRow key={path as string} label={label as string} checked={getAtPath(settings, path as string) as boolean} onChange={onToggle(path as string)} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function ToggleRow(props: { label: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <label className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-700">{props.label}</span>
      <span className="inline-flex items-center">
        <input type="checkbox" className="sr-only peer" checked={props.checked} onChange={props.onChange} />
        <span className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-green-600 transition-colors relative">
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${props.checked ? 'translate-x-5' : ''}`}></span>
        </span>
      </span>
    </label>
  );
}

function NumberInput(props: { label: string; value: number; onChange: (e: ChangeEvent) => void; min?: number; max?: number }) {
  return (
    <div>
      <label className="block text-sm text-gray-700 mb-1">{props.label}</label>
      <input type="number" className="w-full border border-gray-200 rounded-md px-2 py-2" value={Number.isFinite(props.value) ? props.value : 0} onChange={props.onChange} min={props.min} max={props.max} />
    </div>
  );
}


