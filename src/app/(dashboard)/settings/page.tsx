"use client";

import { Settings as SettingsIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { apiRequest, API_ENDPOINTS } from "@/lib/api";
import { defaultUserSettings, type UserSettings } from "@/types/user-settings";
import { useSession } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import { Loading } from "@/components/ui/loading";

type ChangeEvent = React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { data: session } = useSession();

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
    return () => { isMounted = false; };
  }, []);

  const userRole = session?.user?.role;
  const isProvider = userRole === 'PROVIDER';
  const isSupplier = userRole === 'SUPPLIER';
  const isInstructor = userRole === 'INSTRUCTOR';
  const isAgencyOwner = userRole === 'AGENCY_OWNER';
  const isAgencyAdmin = userRole === 'AGENCY_ADMIN';
  const isAdmin = userRole === 'ADMIN';
  const isBusinessRole = isProvider || isSupplier || isInstructor || isAgencyOwner || isAgencyAdmin || isAdmin;
  const isServiceProvider = isProvider || isAgencyOwner || isAgencyAdmin || isAdmin;
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

  if (loading || !settings) {
    return <Loading variant="dashboard" fullScreen text="Loading Settings" subtitle="Preparing your account settings..." />;
  }

  return (
    <div>
      <Breadcrumbs
        className="text-sm text-gray-500 mb-4"
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Settings" },
        ]}
      />

      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-green-50 text-green-700 flex items-center justify-center">
          <SettingsIcon className="w-4 h-4" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-700">Settings</h1>
          <p className="text-sm text-gray-500">Manage your account preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <section className="bg-white rounded-lg p-3">
          <h3 className="font-semibold text-gray-700 mb-3 text-sm">Privacy</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Select
                label="Profile visibility"
                value={settings.privacy.profileVisibility}
                onValueChange={(value) => onInput("privacy.profileVisibility", (v) => v)({ target: { value } } as React.ChangeEvent<HTMLSelectElement>)}
                options={[
                  { value: "public", label: "Public" },
                  { value: "private", label: "Private" },
                  { value: "connections", label: "Connections" }
                ]}
              />
            </div>
            {[
              ["Show phone number", "privacy.showPhoneNumber"],
              ["Show email", "privacy.showEmail"],
              ["Show location", "privacy.showLocation"],
              ["Show rating", "privacy.showRating"],
              ["Show portfolio", "privacy.showPortfolio"],
              ["Allow direct messages", "privacy.allowDirectMessages"],
              ...(isServiceProvider ? [["Allow job invitations", "privacy.allowJobInvitations"]] : []),
              ...(isBusinessRole ? [["Allow referral requests", "privacy.allowReferralRequests"]] : []),
            ].map(([label, path]) => (
              <ToggleRow key={path as string} label={label as string} checked={getAtPath(settings, path as string) as boolean} onChange={onToggle(path as string)} />
            ))}
          </div>
        </section>

        <section className="bg-white rounded-lg p-3">
          <h3 className="font-semibold text-gray-700 mb-3 text-sm">Notifications</h3>
          <h4 className="text-xs font-medium text-gray-700 mb-2">Push</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            {[
              ["Enabled", "notifications.push.enabled"],
              ...(isServiceProvider ? [["Job matches", "notifications.push.jobMatches"], ["Booking updates", "notifications.push.bookingUpdates"]] : []),
              ...(isBusinessRole ? [["Payment updates", "notifications.push.paymentUpdates"], ["Referral updates", "notifications.push.referralUpdates"]] : []),
              ["System updates", "notifications.push.systemUpdates"],
              ["Marketing", "notifications.push.marketing"],
            ].map(([label, path]) => (
              <ToggleRow key={path as string} label={label as string} checked={getAtPath(settings, path as string) as boolean} onChange={onToggle(path as string)} />
            ))}
          </div>
          <h4 className="text-xs font-medium text-gray-700 mb-2">Email</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            {[
              ["Enabled", "notifications.email.enabled"],
              ...(isServiceProvider ? [["Job matches", "notifications.email.jobMatches"], ["Booking updates", "notifications.email.bookingUpdates"]] : []),
              ...(isBusinessRole ? [["Payment updates", "notifications.email.paymentUpdates"], ["Referral updates", "notifications.email.referralUpdates"], ["Weekly digest", "notifications.email.weeklyDigest"], ["Monthly report", "notifications.email.monthlyReport"]] : []),
              ["System updates", "notifications.email.systemUpdates"],
              ["Marketing", "notifications.email.marketing"],
            ].map(([label, path]) => (
              <ToggleRow key={path as string} label={label as string} checked={getAtPath(settings, path as string) as boolean} onChange={onToggle(path as string)} />
            ))}
          </div>
          <h4 className="text-xs font-medium text-gray-700 mb-2">SMS</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              ["Enabled", "notifications.sms.enabled"],
              ...(isServiceProvider ? [["Booking reminders", "notifications.sms.bookingReminders"]] : []),
              ...(isBusinessRole ? [["Payment alerts", "notifications.sms.paymentAlerts"]] : []),
              ["Security alerts", "notifications.sms.securityAlerts"],
            ].map(([label, path]) => (
              <ToggleRow key={path as string} label={label as string} checked={getAtPath(settings, path as string) as boolean} onChange={onToggle(path as string)} />
            ))}
          </div>
        </section>

        <section className="bg-white rounded-lg p-3">
          <h3 className="font-semibold text-gray-700 mb-3 text-sm">Communication</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Select
                label="Preferred language"
                value={settings.communication.preferredLanguage}
                onValueChange={(value) => onInput("communication.preferredLanguage")({ target: { value } } as React.ChangeEvent<HTMLSelectElement>)}
                options={[
                  { value: "en", label: "English" },
                  { value: "fil", label: "Filipino" }
                ]}
              />
            </div>
            <div>
              <Input
                label="Timezone"
                value={settings.communication.timezone}
                onChange={onInput("communication.timezone")}
              />
            </div>
            <div>
              <Select
                label="Date format"
                value={settings.communication.dateFormat}
                onValueChange={(value) => onInput("communication.dateFormat")({ target: { value } } as React.ChangeEvent<HTMLSelectElement>)}
                options={[
                  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
                  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
                  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" }
                ]}
              />
            </div>
            <div>
              <Select
                label="Time format"
                value={settings.communication.timeFormat}
                onValueChange={(value) => onInput("communication.timeFormat")({ target: { value } } as React.ChangeEvent<HTMLSelectElement>)}
                options={[
                  { value: "12h", label: "12-hour" },
                  { value: "24h", label: "24-hour" }
                ]}
              />
            </div>
            <div>
              <Input
                label="Currency"
                value={settings.communication.currency}
                onChange={onInput("communication.currency")}
              />
            </div>
          </div>
          {isBusinessRole && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <ToggleRow label="Auto-reply enabled" checked={settings.communication.autoReply.enabled} onChange={onToggle("communication.autoReply.enabled")} />
              <div className="md:col-span-2">
                <Textarea
                  label="Auto-reply message"
                  rows={2}
                  value={settings.communication.autoReply.message}
                  onChange={onInput("communication.autoReply.message")}
                />
              </div>
            </div>
          )}
        </section>

        {isServiceProvider && (
          <section className="bg-white rounded-lg p-3">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm">Service</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <NumberInput label="Default service radius (km)" value={settings.service.defaultServiceRadius} onChange={onInput("service.defaultServiceRadius", (v) => Number(v))} min={0} />
              <ToggleRow label="Auto-accept jobs" checked={settings.service.autoAcceptJobs} onChange={onToggle("service.autoAcceptJobs")} />
              <div />
              <NumberInput label="Minimum job value" value={settings.service.minimumJobValue} onChange={onInput("service.minimumJobValue", (v) => Number(v))} min={0} />
              <NumberInput label="Maximum job value" value={settings.service.maximumJobValue} onChange={onInput("service.maximumJobValue", (v) => Number(v))} min={0} />
            </div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Input
                  label="Working hours start"
                  type="time"
                  value={settings.service.workingHours.start}
                  onChange={onInput("service.workingHours.start")}
                />
              </div>
              <div>
                <Input
                  label="Working hours end"
                  type="time"
                  value={settings.service.workingHours.end}
                  onChange={onInput("service.workingHours.end")}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Working days</label>
                <div className="flex flex-wrap gap-2">
                  {(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const).map((d) => (
                    <Checkbox
                      key={d}
                      label={d.charAt(0).toUpperCase() + d.slice(1)}
                      checked={settings.service.workingHours.days.includes(d)}
                      onChange={onArrayToggle("service.workingHours.days", d)}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              <ToggleRow label="Emergency service" checked={settings.service.emergencyService.enabled} onChange={onToggle("service.emergencyService.enabled")} />
              <NumberInput label="Emergency surcharge (%)" value={settings.service.emergencyService.surcharge} onChange={onInput("service.emergencyService.surcharge", (v) => Number(v))} min={0} />
            </div>
          </section>
        )}

        <section className="bg-white rounded-lg p-3">
          <h3 className="font-semibold text-gray-700 mb-3 text-sm">Payment</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Select
                label="Preferred method"
                value={settings.payment.preferredPaymentMethod}
                onValueChange={(value) => onInput("payment.preferredPaymentMethod")({ target: { value } } as React.ChangeEvent<HTMLSelectElement>)}
                options={[
                  { value: "paypal", label: "PayPal" },
                  { value: "paymaya", label: "PayMaya" },
                  { value: "gcash", label: "GCash" },
                  { value: "bank", label: "Bank" },
                  { value: "cash", label: "Cash" }
                ]}
              />
            </div>
            {isBusinessRole && (
              <>
                <ToggleRow label="Auto-withdraw" checked={settings.payment.autoWithdraw.enabled} onChange={onToggle("payment.autoWithdraw.enabled")} />
                <NumberInput label="Auto-withdraw threshold" value={settings.payment.autoWithdraw.threshold} onChange={onInput("payment.autoWithdraw.threshold", (v) => Number(v))} min={0} />
                <div>
                  <Select
                    label="Auto-withdraw frequency"
                    value={settings.payment.autoWithdraw.frequency}
                    onValueChange={(value) => onInput("payment.autoWithdraw.frequency")({ target: { value } } as React.ChangeEvent<HTMLSelectElement>)}
                    options={[
                      { value: "daily", label: "Daily" },
                      { value: "weekly", label: "Weekly" },
                      { value: "monthly", label: "Monthly" }
                    ]}
                  />
                </div>
                <ToggleRow label="Include tax on invoices" checked={settings.payment.invoiceSettings.includeTax} onChange={onToggle("payment.invoiceSettings.includeTax")} />
                <NumberInput label="Tax rate (%)" value={settings.payment.invoiceSettings.taxRate} onChange={onInput("payment.invoiceSettings.taxRate", (v) => Number(v))} min={0} />
                <div>
                  <Input
                    label="Invoice template"
                    value={settings.payment.invoiceSettings.invoiceTemplate}
                    onChange={onInput("payment.invoiceSettings.invoiceTemplate")}
                  />
                </div>
              </>
            )}
          </div>
        </section>

        {isSupplier && (
          <section className="bg-white rounded-lg p-3">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm">Supply Management</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <ToggleRow label="Low stock alerts" checked={true} onChange={() => { }} />
              <ToggleRow label="Order notifications" checked={true} onChange={() => { }} />
              <ToggleRow label="Inventory updates" checked={true} onChange={() => { }} />
              <ToggleRow label="Delivery notifications" checked={true} onChange={() => { }} />
            </div>
          </section>
        )}

        {isInstructor && (
          <section className="bg-white rounded-lg p-3">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm">Academy Management</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <ToggleRow label="Student enrollment alerts" checked={true} onChange={() => { }} />
              <ToggleRow label="Course completion notifications" checked={true} onChange={() => { }} />
              <ToggleRow label="Content upload reminders" checked={true} onChange={() => { }} />
              <ToggleRow label="Student message notifications" checked={true} onChange={() => { }} />
            </div>
          </section>
        )}

        {isAdministrative && (
          <section className="bg-white rounded-lg p-3">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm">Agency Management</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <ToggleRow label="Team member notifications" checked={true} onChange={() => { }} />
              <ToggleRow label="Performance alerts" checked={true} onChange={() => { }} />
              <ToggleRow label="Business analytics updates" checked={true} onChange={() => { }} />
              <ToggleRow label="Compliance reminders" checked={true} onChange={() => { }} />
            </div>
          </section>
        )}

        <section className="bg-white rounded-lg p-3">
          <h3 className="font-semibold text-gray-700 mb-3 text-sm">Security</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <ToggleRow label="Two-factor authentication" checked={settings.security.twoFactorAuth.enabled} onChange={onToggle("security.twoFactorAuth.enabled")} />
            <div>
              <Select
                label="2FA method"
                value={settings.security.twoFactorAuth.method}
                onValueChange={(value) => onInput("security.twoFactorAuth.method")({ target: { value } } as React.ChangeEvent<HTMLSelectElement>)}
                options={[
                  { value: "sms", label: "SMS" },
                  { value: "email", label: "Email" },
                  { value: "authenticator", label: "Authenticator" }
                ]}
              />
            </div>
            <ToggleRow label="Login alerts enabled" checked={settings.security.loginAlerts.enabled} onChange={onToggle("security.loginAlerts.enabled")} />
            <ToggleRow label="Alert on new device" checked={settings.security.loginAlerts.newDevice} onChange={onToggle("security.loginAlerts.newDevice")} />
            <ToggleRow label="Alert on suspicious activity" checked={settings.security.loginAlerts.suspiciousActivity} onChange={onToggle("security.loginAlerts.suspiciousActivity")} />
            <NumberInput label="Session timeout (hours)" value={settings.security.sessionTimeout} onChange={onInput("security.sessionTimeout", (v) => Number(v))} min={1} />
            <ToggleRow label="Password change reminder" checked={settings.security.passwordChangeReminder.enabled} onChange={onToggle("security.passwordChangeReminder.enabled")} />
            <NumberInput label="Reminder frequency (days)" value={settings.security.passwordChangeReminder.frequency} onChange={onInput("security.passwordChangeReminder.frequency", (v) => Number(v))} min={1} />
          </div>
        </section>

        <section className="bg-white rounded-lg p-3">
          <h3 className="font-semibold text-gray-700 mb-3 text-sm">App</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Select
                label="Theme"
                value={settings.app.theme}
                onValueChange={(value) => onInput("app.theme")({ target: { value } } as React.ChangeEvent<HTMLSelectElement>)}
                options={[
                  { value: "auto", label: "Auto" },
                  { value: "light", label: "Light" },
                  { value: "dark", label: "Dark" }
                ]}
              />
            </div>
            <div>
              <Select
                label="Font size"
                value={settings.app.fontSize}
                onValueChange={(value) => onInput("app.fontSize")({ target: { value } } as React.ChangeEvent<HTMLSelectElement>)}
                options={[
                  { value: "small", label: "Small" },
                  { value: "medium", label: "Medium" },
                  { value: "large", label: "Large" }
                ]}
              />
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
              <Select
                label="Image quality"
                value={settings.app.dataUsage.imageQuality}
                onValueChange={(value) => onInput("app.dataUsage.imageQuality")({ target: { value } } as React.ChangeEvent<HTMLSelectElement>)}
                options={[
                  { value: "low", label: "Low" },
                  { value: "medium", label: "Medium" },
                  { value: "high", label: "High" }
                ]}
              />
            </div>
            <div>
              <Select
                label="Video quality"
                value={settings.app.dataUsage.videoQuality}
                onValueChange={(value) => onInput("app.dataUsage.videoQuality")({ target: { value } } as React.ChangeEvent<HTMLSelectElement>)}
                options={[
                  { value: "low", label: "Low" },
                  { value: "medium", label: "Medium" },
                  { value: "high", label: "High" }
                ]}
              />
            </div>
            <ToggleRow label="Auto-download media" checked={settings.app.dataUsage.autoDownload} onChange={onToggle("app.dataUsage.autoDownload")} />
          </div>
        </section>

        <section className="bg-white rounded-lg p-3">
          <h3 className="font-semibold text-gray-700 mb-3 text-sm">Analytics & Personalization</h3>
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
        </section>
      </div>
    </div>
  );
}

function ToggleRow(props: { label: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <label className="flex items-center justify-between py-1">
      <span className="text-xs text-gray-700">{props.label}</span>
      <span className="inline-flex items-center">
        <input type="checkbox" className="sr-only peer" checked={props.checked} onChange={props.onChange} />
        <span className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-green-600 transition-colors relative">
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${props.checked ? 'translate-x-4' : ''}`}></span>
        </span>
      </span>
    </label>
  );
}

function NumberInput(props: { label: string; value: number; onChange: (e: ChangeEvent) => void; min?: number; max?: number }) {
  return (
    <div>
      <label className="block text-xs text-gray-700 mb-1">{props.label}</label>
      <input type="number" className="w-full border border-gray-200 rounded-md px-2 py-1 text-sm" value={Number.isFinite(props.value) ? props.value : 0} onChange={props.onChange} min={props.min} max={props.max} />
    </div>
  );
}