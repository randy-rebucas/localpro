/**
 * @deprecated This file is maintained for backward compatibility.
 * Please import from '@/features/finance/components/account-info' instead.
 */
export * from '@/features/finance/components/account-info';

import { CheckCircle, AlertCircle, Shield } from "lucide-react";
import { UserProfileData } from "./user-profile";

interface AccountInfoProps {
  profile: UserProfileData | null;
  formattedCreatedAt: string;
}

export function AccountInfo({ profile, formattedCreatedAt }: AccountInfoProps) {
  if (!profile) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-xl border border-gray-200/50 p-6 hover:shadow-2xl transition-all duration-300">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Account Info</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Member since</span>
          <span className="text-sm font-medium text-gray-700">{formattedCreatedAt}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Roles</span>
          <span className="text-sm font-medium text-gray-700 capitalize">
            {profile?.roles && profile.roles.length > 0
              ? profile.roles.map(r => r.charAt(0).toUpperCase() + r.slice(1).replace('_', ' ')).join(', ')
              : "User"}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Status</span>
          <span className="flex items-center text-sm font-medium text-accent">
            <CheckCircle className="w-4 h-4 mr-1" />
            {profile?.status === 'active' ? 'Active' : profile?.status || 'Active'}
          </span>
        </div>
        
        {profile?.isVerified !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Verification</span>
            <span className={`flex items-center text-sm font-medium ${
              profile.isVerified ? 'text-accent' : 'text-yellow-600'
            }`}>
              {profile.isVerified ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Verified
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Pending
                </>
              )}
            </span>
          </div>
        )}
        
        {profile?.trustScore !== undefined && profile.trustScore > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Trust Score</span>
            <span className="flex items-center text-sm font-medium text-primary">
              <Shield className="w-4 h-4 mr-1" />
              {profile.trustScore}/100
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

