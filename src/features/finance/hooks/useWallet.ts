"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import type { Wallet } from "@/features/finance/types";

export interface WalletSettings {
  autoWithdraw?: boolean;
  minBalance?: number;
  notificationSettings?: {
    lowBalance?: boolean;
    withdrawal?: boolean;
    payment?: boolean;
  };
}

export function useWallet() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchWallet = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      // Get wallet from finance overview or user profile
      const url = `${API_BASE_URL}${API_ENDPOINTS.financeOverview}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch wallet: ${response.status}`);
      }

      const data = await response.json();
      const walletData = data?.data?.wallet || data?.wallet || null;

      if (mountedRef.current) {
        setWallet(walletData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching wallet", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setWallet(null);
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchWallet();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchWallet]);

  const updateWalletSettings = useCallback(async (settings: WalletSettings) => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}${API_ENDPOINTS.financeWalletSettings}`;
      const response = await fetch(url, {
        ...createAuthFetchOptions(),
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error(`Failed to update wallet settings: ${response.status}`);
      }

      const data = await response.json();
      const updatedWallet = data?.data?.wallet || data?.wallet || null;

      if (mountedRef.current) {
        setWallet(updatedWallet);
        setLoading(false);
        // Refetch to ensure consistency
        fetchWallet();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error updating wallet settings", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setLoading(false);
      }
    }
  }, [fetchWallet]);

  return {
    wallet,
    loading,
    error,
    refetch: fetchWallet,
    updateSettings: updateWalletSettings,
  };
}

export function useWalletSettings() {
  const [settings, setSettings] = useState<WalletSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchSettings = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}${API_ENDPOINTS.financeWalletSettings}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch wallet settings: ${response.status}`);
      }

      const data = await response.json();
      const settingsData = data?.data || data;

      if (mountedRef.current) {
        setSettings(settingsData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching wallet settings", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setSettings(null);
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchSettings();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchSettings]);

  const updateSettings = useCallback(async (newSettings: WalletSettings) => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}${API_ENDPOINTS.financeWalletSettings}`;
      const response = await fetch(url, {
        ...createAuthFetchOptions(),
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSettings),
      });

      if (!response.ok) {
        throw new Error(`Failed to update wallet settings: ${response.status}`);
      }

      const data = await response.json();
      const updatedSettings = data?.data || data;

      if (mountedRef.current) {
        setSettings(updatedSettings);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error updating wallet settings", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setLoading(false);
      }
    }
  }, []);

  return {
    settings,
    loading,
    error,
    refetch: fetchSettings,
    updateSettings,
  };
}

