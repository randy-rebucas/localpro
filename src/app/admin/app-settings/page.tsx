"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Settings,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Globe,
  Shield,
  Bell,
  CreditCard,
  BarChart3,
  Database
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { AdminErrorState } from "@/components/admin/admin-error-state";
import { makeClientAuthenticatedRequestWithEndpointSafe } from "@/lib/client-api-utils";
import { API_ENDPOINTS } from "@/lib/api";
import { logger } from "@/lib/logger";
import { AppSettings } from "@/types/app-settings";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export default function AppSettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("general");

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await makeClientAuthenticatedRequestWithEndpointSafe(
        API_ENDPOINTS.settingsApp,
        "GET"
      );

      if (response.success && response.data) {
        setSettings(response.data);
      } else {
        throw new Error("Failed to fetch app settings");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching app settings", err instanceof Error ? err : new Error(errorMessage));
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

      const response = await makeClientAuthenticatedRequestWithEndpointSafe(
        API_ENDPOINTS.settingsAppUpdate,
        "PUT",
        settings
      );

      if (response.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        throw new Error("Failed to update app settings");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error saving app settings", err instanceof Error ? err : new Error(errorMessage));
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  }, [settings]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const tabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "business", label: "Business", icon: Globe },
    { id: "features", label: "Features", icon: BarChart3 },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "integrations", label: "Integrations", icon: Database },
  ];

  if (loading) {
    return <Loading />;
  }

  if (error && !settings) {
    return <AdminErrorState error={error} onRetry={fetchSettings} />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">App Settings</h1>
        <p className="text-gray-600">Manage application-wide settings and configuration</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-600">Settings saved successfully</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card className="p-6">
            {settings && (
              <div className="space-y-6">
                {activeTab === "general" && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">General Settings</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">App Name</label>
                        <Input
                          value={settings.general?.appName || ""}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              general: { ...settings.general, appName: e.target.value },
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">App Version</label>
                        <Input
                          value={settings.general?.appVersion || ""}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              general: { ...settings.general, appVersion: e.target.value },
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Environment</label>
                        <Select
                          value={settings.general?.environment || "production"}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              general: { ...settings.general, environment: e.target.value as "development" | "staging" | "production" },
                            })
                          }
                          options={[
                            { value: "development", label: "Development" },
                            { value: "staging", label: "Staging" },
                            { value: "production", label: "Production" },
                          ]}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "business" && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Business Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Company Name</label>
                        <Input
                          value={settings.business?.companyName || ""}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              business: { ...settings.business, companyName: e.target.value },
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Company Email</label>
                        <Input
                          type="email"
                          value={settings.business?.companyEmail || ""}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              business: { ...settings.business, companyEmail: e.target.value },
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Company Phone</label>
                        <Input
                          value={settings.business?.companyPhone || ""}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              business: { ...settings.business, companyPhone: e.target.value },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "features" && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Feature Toggles</h2>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-medium">Marketplace</h3>
                          <p className="text-sm text-gray-600">Enable service marketplace</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.features?.marketplace?.enabled ?? true}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              features: {
                                ...settings.features,
                                marketplace: { ...settings.features?.marketplace, enabled: e.target.checked },
                              },
                            })
                          }
                          className="w-5 h-5"
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-medium">Academy</h3>
                          <p className="text-sm text-gray-600">Enable course academy</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.features?.academy?.enabled ?? true}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              features: {
                                ...settings.features,
                                academy: { ...settings.features?.academy, enabled: e.target.checked },
                              },
                            })
                          }
                          className="w-5 h-5"
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-medium">Job Board</h3>
                          <p className="text-sm text-gray-600">Enable job board</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.features?.jobBoard?.enabled ?? true}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              features: {
                                ...settings.features,
                                jobBoard: { ...settings.features?.jobBoard, enabled: e.target.checked },
                              },
                            })
                          }
                          className="w-5 h-5"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Add more tabs as needed */}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-4">
              <Button variant="outline" onClick={fetchSettings} disabled={saving}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button onClick={saveSettings} disabled={saving || !settings}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

