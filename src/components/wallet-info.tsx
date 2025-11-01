"use client";

import { Wallet as WalletIcon } from "lucide-react";
import { UserProfileData } from "./user-profile";

interface WalletInfoProps {
  profile: UserProfileData | null;
}

export function WalletInfo({ profile }: WalletInfoProps) {
  if (!profile?.wallet) {
    return null;
  }

  const balance = profile.wallet.balance || 0;
  const currency = profile.wallet.currency || 'PHP';

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <WalletIcon className="w-4 h-4" />
        Wallet
      </h3>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Balance</span>
          <span className="text-lg font-semibold text-gray-700">
            {currency} {balance.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

