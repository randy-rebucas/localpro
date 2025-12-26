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
    <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-xl border border-gray-200/50 p-6 hover:shadow-2xl transition-all duration-300">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
      <div className="space-y-2">
        <button
          onClick={() => onViewPublicProfile?.()}
          className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-accent/10 hover:to-primary/10 hover:text-accent rounded-xl transition-all duration-200 hover:shadow-md"
        >
          View Public Profile
        </button>
        
        {/* Role-specific actions */}
        {isBusinessRole && (
          <button
            onClick={() => onDownloadResume?.()}
            className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-accent/10 hover:to-primary/10 hover:text-accent rounded-xl transition-all duration-200 hover:shadow-md"
          >
            Download Resume
          </button>
        )}
        
        {isServiceProvider && (
          <button
            onClick={() => onServiceDashboard?.()}
            className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-accent/10 hover:to-primary/10 hover:text-accent rounded-xl transition-all duration-200 hover:shadow-md"
          >
            Service Dashboard
          </button>
        )}
        
        {isSupplier && (
          <button
            onClick={() => onSupplyDashboard?.()}
            className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-accent/10 hover:to-primary/10 hover:text-accent rounded-xl transition-all duration-200 hover:shadow-md"
          >
            Supply Dashboard
          </button>
        )}
        
        {isInstructor && (
          <button
            onClick={() => onAcademyDashboard?.()}
            className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-accent/10 hover:to-primary/10 hover:text-accent rounded-xl transition-all duration-200 hover:shadow-md"
          >
            Academy Dashboard
          </button>
        )}
        
        {isAdministrative && (
          <button
            onClick={() => onAgencyDashboard?.()}
            className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-accent/10 hover:to-primary/10 hover:text-accent rounded-xl transition-all duration-200 hover:shadow-md"
          >
            Agency Dashboard
          </button>
        )}
        
        <button
          onClick={() => onPrivacySettings?.()}
          className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-accent/10 hover:to-primary/10 hover:text-accent rounded-xl transition-all duration-200 hover:shadow-md"
        >
          Privacy Settings
        </button>
      </div>
    </div>
  );
}

