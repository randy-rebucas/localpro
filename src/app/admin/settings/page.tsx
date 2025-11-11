"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Settings,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Shield,
  Bell,
  CreditCard,
  Zap
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { AdminErrorState } from "@/components/admin/admin-error-state";
import { logger } from "@/lib/logger";
import toast from "react-hot-toast";

interface SettingsData {
  general: {
    siteName: string;
    siteDescription: string;
    adminEmail: string;
    supportEmail: string;
    maintenanceMode: boolean;
  };
  security: {
    requireEmailVerification: boolean;
    requirePhoneVerification: boolean;
    twoFactorAuth: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    adminNotifications: boolean;
  };
  payments: {
    paymentEnabled: boolean;
    defaultCurrency: string;
    transactionFee: number;
    minWithdrawal: number;
  };
  features: {
    marketplaceEnabled: boolean;
    academyEnabled: boolean;
    jobBoardEnabled: boolean;
    rentalsEnabled: boolean;
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("general");

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate API call - replace with actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Default settings
      setSettings({
        general: {
          siteName: "LocalPro",
          siteDescription: "Professional services marketplace",
          adminEmail: "admin@localpro.com",
          supportEmail: "support@localpro.com",
          maintenanceMode: false,
        },
        security: {
          requireEmailVerification: true,
          requirePhoneVerification: true,
          twoFactorAuth: false,
          sessionTimeout: 30,
          maxLoginAttempts: 5,
        },
        notifications: {
          emailEnabled: true,
          smsEnabled: true,
          pushEnabled: true,
          adminNotifications: true,
        },
        payments: {
          paymentEnabled: true,
          defaultCurrency: "USD",
          transactionFee: 2.5,
          minWithdrawal: 10,
        },
        features: {
          marketplaceEnabled: true,
          academyEnabled: true,
          jobBoardEnabled: true,
          rentalsEnabled: true,
        },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching settings", err instanceof Error ? err : new Error(errorMessage));
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSettings = useCallback(async () => {
    if (!settings) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      // Simulate API call - replace with actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess(true);
      toast.success("Settings saved successfully");
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error saving settings", err instanceof Error ? err : new Error(errorMessage));
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  }, [settings]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const tabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "features", label: "Features", icon: Zap },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="xl" text="Loading settings..." />
      </div>
    );
  }

  if (error && !settings) {
    return <AdminErrorState error={error} onRetry={fetchSettings} />;
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 text-sm">Manage platform settings and configuration</p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center space-x-2">
          <button
            onClick={fetchSettings}
            disabled={saving}
            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={saveSettings}
            disabled={saving || !settings}
            className="inline-flex items-center px-2 py-1 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
          >
            <Save className={`w-3 h-3 mr-1 ${saving ? 'animate-spin' : ''}`} />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <p className="text-red-600 text-xs">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded p-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
          <p className="text-green-600 text-xs">Settings saved successfully</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded shadow border border-gray-200 p-3">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded transition-colors text-xs font-medium ${
                      activeTab === tab.id
                        ? "bg-blue-50 text-blue-700 border-l-4 border-blue-500"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded shadow border border-gray-200 p-4">
            {settings && (
              <div className="space-y-4">
                {/* General Settings */}
                {activeTab === "general" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-blue-600" />
                      <h2 className="text-base font-semibold text-gray-900">General Settings</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Site Name
                        </label>
                        <input
                          type="text"
                          value={settings.general.siteName}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              general: { ...settings.general, siteName: e.target.value },
                            })
                          }
                          className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Admin Email
                        </label>
                        <input
                          type="email"
                          value={settings.general.adminEmail}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              general: { ...settings.general, adminEmail: e.target.value },
                            })
                          }
                          className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Site Description
                        </label>
                        <textarea
                          value={settings.general.siteDescription}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              general: { ...settings.general, siteDescription: e.target.value },
                            })
                          }
                          rows={2}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Support Email
                        </label>
                        <input
                          type="email"
                          value={settings.general.supportEmail}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              general: { ...settings.general, supportEmail: e.target.value },
                            })
                          }
                          className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                        />
                      </div>
                      
                      <div className="flex items-center">
                        <div className="flex items-center h-5 mt-5">
                          <input
                            type="checkbox"
                            checked={settings.general.maintenanceMode}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                general: { ...settings.general, maintenanceMode: e.target.checked },
                              })
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label className="ml-2 text-xs font-medium text-gray-700">
                            Maintenance Mode
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Settings */}
                {activeTab === "security" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <h2 className="text-base font-semibold text-gray-900">Security Settings</h2>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 border border-gray-200 rounded">
                        <div>
                          <h3 className="text-xs font-medium text-gray-900">Require Email Verification</h3>
                          <p className="text-xs text-gray-600">Users must verify their email address</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.security.requireEmailVerification}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              security: { ...settings.security, requireEmailVerification: e.target.checked },
                            })
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-3 border border-gray-200 rounded">
                        <div>
                          <h3 className="text-xs font-medium text-gray-900">Require Phone Verification</h3>
                          <p className="text-xs text-gray-600">Users must verify their phone number</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.security.requirePhoneVerification}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              security: { ...settings.security, requirePhoneVerification: e.target.checked },
                            })
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-3 border border-gray-200 rounded">
                        <div>
                          <h3 className="text-xs font-medium text-gray-900">Two-Factor Authentication</h3>
                          <p className="text-xs text-gray-600">Enable 2FA for admin accounts</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.security.twoFactorAuth}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              security: { ...settings.security, twoFactorAuth: e.target.checked },
                            })
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Session Timeout (minutes)
                          </label>
                          <input
                            type="number"
                            value={settings.security.sessionTimeout}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                security: { ...settings.security, sessionTimeout: parseInt(e.target.value) || 30 },
                              })
                            }
                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Max Login Attempts
                          </label>
                          <input
                            type="number"
                            value={settings.security.maxLoginAttempts}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                security: { ...settings.security, maxLoginAttempts: parseInt(e.target.value) || 5 },
                              })
                            }
                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notifications Settings */}
                {activeTab === "notifications" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-blue-600" />
                      <h2 className="text-base font-semibold text-gray-900">Notification Settings</h2>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 border border-gray-200 rounded">
                        <div>
                          <h3 className="text-xs font-medium text-gray-900">Email Notifications</h3>
                          <p className="text-xs text-gray-600">Enable email notifications</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.notifications.emailEnabled}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              notifications: { ...settings.notifications, emailEnabled: e.target.checked },
                            })
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-3 border border-gray-200 rounded">
                        <div>
                          <h3 className="text-xs font-medium text-gray-900">SMS Notifications</h3>
                          <p className="text-xs text-gray-600">Enable SMS notifications</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.notifications.smsEnabled}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              notifications: { ...settings.notifications, smsEnabled: e.target.checked },
                            })
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-3 border border-gray-200 rounded">
                        <div>
                          <h3 className="text-xs font-medium text-gray-900">Push Notifications</h3>
                          <p className="text-xs text-gray-600">Enable push notifications</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.notifications.pushEnabled}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              notifications: { ...settings.notifications, pushEnabled: e.target.checked },
                            })
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-3 border border-gray-200 rounded">
                        <div>
                          <h3 className="text-xs font-medium text-gray-900">Admin Notifications</h3>
                          <p className="text-xs text-gray-600">Send notifications to admins</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.notifications.adminNotifications}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              notifications: { ...settings.notifications, adminNotifications: e.target.checked },
                            })
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Payments Settings */}
                {activeTab === "payments" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      <h2 className="text-base font-semibold text-gray-900">Payment Settings</h2>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 border border-gray-200 rounded">
                        <div>
                          <h3 className="text-xs font-medium text-gray-900">Payment Processing</h3>
                          <p className="text-xs text-gray-600">Enable payment processing</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.payments.paymentEnabled}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              payments: { ...settings.payments, paymentEnabled: e.target.checked },
                            })
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Default Currency
                          </label>
                          <select
                            value={settings.payments.defaultCurrency}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                payments: { ...settings.payments, defaultCurrency: e.target.value },
                              })
                            }
                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                          >
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                            <option value="NGN">NGN</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Transaction Fee (%)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={settings.payments.transactionFee}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                payments: { ...settings.payments, transactionFee: parseFloat(e.target.value) || 0 },
                              })
                            }
                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Minimum Withdrawal
                          </label>
                          <input
                            type="number"
                            value={settings.payments.minWithdrawal}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                payments: { ...settings.payments, minWithdrawal: parseFloat(e.target.value) || 0 },
                              })
                            }
                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Features Settings */}
                {activeTab === "features" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-blue-600" />
                      <h2 className="text-base font-semibold text-gray-900">Feature Toggles</h2>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 border border-gray-200 rounded">
                        <div>
                          <h3 className="text-xs font-medium text-gray-900">Marketplace</h3>
                          <p className="text-xs text-gray-600">Enable service marketplace</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.features.marketplaceEnabled}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              features: { ...settings.features, marketplaceEnabled: e.target.checked },
                            })
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-3 border border-gray-200 rounded">
                        <div>
                          <h3 className="text-xs font-medium text-gray-900">Academy</h3>
                          <p className="text-xs text-gray-600">Enable course academy</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.features.academyEnabled}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              features: { ...settings.features, academyEnabled: e.target.checked },
                            })
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-3 border border-gray-200 rounded">
                        <div>
                          <h3 className="text-xs font-medium text-gray-900">Job Board</h3>
                          <p className="text-xs text-gray-600">Enable job board</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.features.jobBoardEnabled}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              features: { ...settings.features, jobBoardEnabled: e.target.checked },
                            })
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-3 border border-gray-200 rounded">
                        <div>
                          <h3 className="text-xs font-medium text-gray-900">Rentals</h3>
                          <p className="text-xs text-gray-600">Enable rental marketplace</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.features.rentalsEnabled}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              features: { ...settings.features, rentalsEnabled: e.target.checked },
                            })
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

