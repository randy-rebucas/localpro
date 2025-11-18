"use client";

import React from "react";
import { MapPin } from "lucide-react";

type ServiceArea = { 
  city?: string; 
  state?: string; 
  radius?: number;
};

interface ProviderServiceAreasProps {
  specialties?: Array<{
    serviceAreas?: ServiceArea[];
  }>;
}

/**
 * Collects all service areas from provider specialties
 */
function collectServiceAreas(specialties?: ProviderServiceAreasProps['specialties']): ServiceArea[] {
  const allServiceAreas: ServiceArea[] = [];
  
  if (!specialties) {
    return allServiceAreas;
  }

  for (const specialty of specialties) {
    if (specialty.serviceAreas && Array.isArray(specialty.serviceAreas)) {
      for (const area of specialty.serviceAreas) {
        if (area) {
          allServiceAreas.push(area);
        }
      }
    }
  }

  return allServiceAreas;
}

/**
 * Renders a single service area badge
 */
function ServiceAreaBadge({ area, index }: { area: ServiceArea; index: number }) {
  return (
    <div key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
      <MapPin className="w-3 h-3 inline mr-1" />
      {area.city || ''}{area.state ? `, ${area.state}` : ''}
      {area.radius ? ` (${area.radius} mi radius)` : ''}
    </div>
  );
}

/**
 * ProviderServiceAreas Component
 * Displays service areas for a provider based on their specialties
 */
const ProviderServiceAreas: React.FC<ProviderServiceAreasProps> = ({ specialties }) => {
  const allServiceAreas = collectServiceAreas(specialties);

  if (allServiceAreas.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Service Areas</h2>
      <div className="flex flex-wrap gap-2">
        {allServiceAreas.map((area, idx) => (
          <ServiceAreaBadge key={idx} area={area} index={idx} />
        ))}
      </div>
    </div>
  );
};

export { ProviderServiceAreas };
