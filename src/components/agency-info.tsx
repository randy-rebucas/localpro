/**
 * @deprecated This file is maintained for backward compatibility.
 * Please import from '@/features/agencies/components/agency-info' instead.
 */
export * from '@/features/agencies/components/agency-info';

import { Users } from "lucide-react";
import { UserProfileData } from "./user-profile";

interface AgencyInfoProps {
  profile: UserProfileData | null;
}

export function AgencyInfo({ profile }: AgencyInfoProps) {
  if (!profile?.agency?.agencyId) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <Users className="w-4 h-4" />
        Agency
      </h3>
      <div className="space-y-2">
        {profile.agency.role && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Role</span>
            <span className="text-sm font-medium text-gray-700 capitalize">
              {profile.agency.role}
            </span>
          </div>
        )}
        
        {profile.agency.status && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Status</span>
            <span className="text-sm font-medium text-gray-700 capitalize">
              {profile.agency.status}
            </span>
          </div>
        )}
        
        {profile.agency.commissionRate !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Commission</span>
            <span className="text-sm font-medium text-gray-700">
              {profile.agency.commissionRate}%
            </span>
          </div>
        )}
        
        {profile.agency.joinedAt && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Joined</span>
            <span className="text-sm font-medium text-gray-700">
              {new Date(profile.agency.joinedAt).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

