"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Save, RefreshCw } from "lucide-react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";

interface WalletSettings {
  currency: string;
  autoWithdraw: boolean;
  withdrawThreshold: number;
  withdrawMethod: string;
  notifications: {
    lowBalance: boolean;
    withdrawalComplete: boolean;
    monthlyReport: boolean;
  };
}

interface FinanceWalletSettingsProps {
  onSave: (settings: WalletSettings) => void;
  className?: string;
}

export function FinanceWalletSettings({ onSave, className = "" }: FinanceWalletSettingsProps) {
  const [settings, setSettings] = useState<WalletSettings>({
    currency: 'USD',
    autoWithdraw: false,
    withdrawThreshold: 1000,
    withdrawMethod: 'bank',
    notifications: {
      lowBalance: true,
      withdrawalComplete: true,
      monthlyReport: true
    }
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load settings from API
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.financeWalletSettings}`, createAuthFetchOptions());
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      logger.error('Error loading wallet settings', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(settings);
    } catch (error) {
      logger.error('Error saving wallet settings', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (key: keyof WalletSettings, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleNotificationChange = (key: keyof WalletSettings['notifications'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value }
    }));
  };

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Settings className="w-5 h-5 mr-2 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Wallet Settings</h3>
        </div>
        <Button
          onClick={loadSettings}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="space-y-6">
        {/* Currency Settings */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Currency & Withdrawal</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Default Currency
              </label>
              <select
                value={settings.currency}
                onChange={(e) => handleSettingChange('currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="PHP">PHP - Philippine Peso</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Withdrawal Method
              </label>
              <select
                value={settings.withdrawMethod}
                onChange={(e) => handleSettingChange('withdrawMethod', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              >
                <option value="bank">Bank Transfer</option>
                <option value="paypal">PayPal</option>
                <option value="check">Check</option>
              </select>
            </div>
          </div>
        </div>

        {/* Auto Withdrawal */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Auto Withdrawal</h4>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.autoWithdraw}
                onChange={(e) => handleSettingChange('autoWithdraw', e.target.checked)}
                className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Enable automatic withdrawals
              </span>
            </label>

            {settings.autoWithdraw && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Withdrawal Threshold
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={settings.withdrawThreshold}
                  onChange={(e) => handleSettingChange('withdrawThreshold', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Automatically withdraw when balance reaches this amount
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Notifications</h4>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.notifications.lowBalance}
                onChange={(e) => handleNotificationChange('lowBalance', e.target.checked)}
                className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Low balance alerts
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.notifications.withdrawalComplete}
                onChange={(e) => handleNotificationChange('withdrawalComplete', e.target.checked)}
                className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Withdrawal completion notifications
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.notifications.monthlyReport}
                onChange={(e) => handleNotificationChange('monthlyReport', e.target.checked)}
                className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Monthly financial reports
              </span>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
