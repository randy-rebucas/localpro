"use client";

import { Wallet as WalletIcon } from "lucide-react";
import { UserProfileData } from "./user-profile";
import { useAppSettings } from "@/hooks/useAppSettings";
import { getDefaultCurrency } from "@/lib/settings-utils";
import { formatCurrency } from "@/lib/currency-utils";

interface WalletInfoProps {
  profile: UserProfileData | null;
}

export function WalletInfo({ profile }: WalletInfoProps) {
  const { settings: appSettings } = useAppSettings();
  
  if (!profile?.wallet) {
    return null;
  }

  const balance = profile.wallet.balance || 0;
  const currency = profile.wallet.currency || getDefaultCurrency(appSettings);

  return (
    <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-xl border border-gray-200/50 p-6 hover:shadow-2xl transition-all duration-300">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <WalletIcon className="w-5 h-5 text-green-600" />
        Wallet
      </h3>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Balance</span>
          <span className="text-lg font-semibold text-gray-700">
            {formatCurrency(balance, currency, { appSettings })}
          </span>
        </div>
      </div>
    </div>
  );
}

