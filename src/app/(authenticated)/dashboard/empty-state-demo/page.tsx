"use client";

import React from "react";
import EmptyState, { 
  DashboardEmptyState, 
  ServicesEmptyState, 
  ActivityEmptyState, 
  AnnouncementsEmptyState, 
  SearchEmptyState, 
  SettingsEmptyState 
} from "@/components/ui/empty-state";
import { BarChart3, Settings } from "lucide-react";
import { 
  DashboardLoadingState, 
  ServicesLoadingState, 
  ActivityLoadingState, 
  AnnouncementsLoadingState, 
  HeaderLoadingState, 
  StatsLoadingState 
} from "@/components/ui/loading-state";
import { logger } from "@/lib/logger";

export default function EmptyStateDemo() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Empty State & Loading Components</h1>
          <p className="text-gray-600">Beautiful empty states and loading components for the LocalPro dashboard.</p>
        </div>

        {/* Loading States Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Loading States</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Dashboard Loading</h3>
              <DashboardLoadingState />
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Services Loading</h3>
              <ServicesLoadingState />
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Activity Loading</h3>
              <ActivityLoadingState />
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Announcements Loading</h3>
              <AnnouncementsLoadingState />
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Header Loading</h3>
              <HeaderLoadingState />
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Stats Loading</h3>
              <StatsLoadingState />
            </div>
          </div>
        </div>

        {/* Empty States Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Empty States</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Dashboard Empty</h3>
              <DashboardEmptyState onRefresh={handleRefresh} />
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Services Empty</h3>
              <ServicesEmptyState onRefresh={handleRefresh} />
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Activity Empty</h3>
              <ActivityEmptyState onRefresh={handleRefresh} />
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Announcements Empty</h3>
              <AnnouncementsEmptyState onRefresh={handleRefresh} />
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Search Empty</h3>
              <SearchEmptyState 
                query={searchQuery} 
                onClearSearch={handleClearSearch} 
              />
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Settings Empty</h3>
              <SettingsEmptyState />
            </div>
          </div>
        </div>

        {/* Custom Empty States Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Custom Empty States</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Custom Empty State</h3>
              <EmptyState
                title="Custom Empty State"
                description="This is a custom empty state with a custom icon and actions."
                icon={BarChart3}
                actions={[
                  {
                    type: "button",
                    label: "Get Started",
                    onClick: () => logger.debug("Get started clicked"),
                    variant: "primary"
                  },
                  {
                    type: "button",
                    label: "Learn More",
                    onClick: () => logger.debug("Learn more clicked"),
                    variant: "outline"
                  }
                ]}
              />
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Empty State</h3>
              <EmptyState
                title="Basic Empty State"
                description="This is a basic empty state component with simple styling."
                icon={Settings}
                actions={[
                  {
                    type: "button",
                    label: "Explore Now",
                    onClick: () => logger.debug("Explore clicked"),
                    variant: "primary"
                  }
                ]}
              />
            </div>
          </div>
        </div>

        {/* Interactive Demo */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Interactive Demo</h2>
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setIsLoading(!isLoading)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {isLoading ? "Stop Loading" : "Start Loading"}
              </button>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Refresh Demo
              </button>
            </div>
            
            {isLoading ? (
              <DashboardLoadingState />
            ) : (
              <DashboardEmptyState onRefresh={handleRefresh} />
            )}
          </div>
        </div>

        {/* Usage Examples */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Usage Examples</h2>
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Code Examples</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Basic Empty State</h4>
                <pre className="bg-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`<EmptyState
  title="No data found"
  description="There's no data to display at the moment."
  illustration="dashboard"
  action={{
    label: "Get Started",
    onClick: () => logger.debug("Get started"),
    variant: "primary"
  }}
/>`}
                </pre>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Loading State</h4>
                <pre className="bg-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`<LoadingState 
  type="dashboard" 
  size="lg" 
/>`}
                </pre>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Specialized Components</h4>
                <pre className="bg-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`<DashboardEmptyState onRefresh={handleRefresh} />
<ServicesLoadingState />
<ActivityEmptyState onRefresh={handleRefresh} />`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
