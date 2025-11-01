"use client";

interface QuickActionsProps {
  isBusinessRole: boolean;
  isServiceProvider: boolean;
  isSupplier: boolean;
  isInstructor: boolean;
  isAdministrative: boolean;
  onViewPublicProfile?: () => void;
  onDownloadResume?: () => void;
  onServiceDashboard?: () => void;
  onSupplyDashboard?: () => void;
  onAcademyDashboard?: () => void;
  onAgencyDashboard?: () => void;
  onPrivacySettings?: () => void;
}

export function QuickActions({
  isBusinessRole,
  isServiceProvider,
  isSupplier,
  isInstructor,
  isAdministrative,
  onViewPublicProfile,
  onDownloadResume,
  onServiceDashboard,
  onSupplyDashboard,
  onAcademyDashboard,
  onAgencyDashboard,
  onPrivacySettings
}: QuickActionsProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Quick Actions</h3>
      <div className="space-y-3">
        <button
          onClick={onViewPublicProfile}
          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
        >
          View Public Profile
        </button>
        
        {/* Role-specific actions */}
        {isBusinessRole && (
          <button
            onClick={onDownloadResume}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Download Resume
          </button>
        )}
        
        {isServiceProvider && (
          <button
            onClick={onServiceDashboard}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Service Dashboard
          </button>
        )}
        
        {isSupplier && (
          <button
            onClick={onSupplyDashboard}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Supply Dashboard
          </button>
        )}
        
        {isInstructor && (
          <button
            onClick={onAcademyDashboard}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Academy Dashboard
          </button>
        )}
        
        {isAdministrative && (
          <button
            onClick={onAgencyDashboard}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Agency Dashboard
          </button>
        )}
        
        <button
          onClick={onPrivacySettings}
          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
        >
          Privacy Settings
        </button>
      </div>
    </div>
  );
}

