"use client";

import MarketplaceNav from "@/components/marketplace-nav";

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Marketplace Navigation */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center">
            <MarketplaceNav />
          </div>
        </div>
      </div>

      {/* Page content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
