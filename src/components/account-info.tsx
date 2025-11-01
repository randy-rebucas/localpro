"use client";

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
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Account Info</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Member since</span>
          <span className="text-sm font-medium text-gray-700">{formattedCreatedAt}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Role</span>
          <span className="text-sm font-medium text-gray-700 capitalize">
            {profile?.role || "User"}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Status</span>
          <span className="flex items-center text-sm font-medium text-green-600">
            <CheckCircle className="w-4 h-4 mr-1" />
            {profile?.status === 'active' ? 'Active' : profile?.status || 'Active'}
          </span>
        </div>
        
        {profile?.isVerified !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Verification</span>
            <span className={`flex items-center text-sm font-medium ${
              profile.isVerified ? 'text-green-600' : 'text-yellow-600'
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
            <span className="flex items-center text-sm font-medium text-blue-600">
              <Shield className="w-4 h-4 mr-1" />
              {profile.trustScore}/100
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

