"use client";

import React from "react";
import { ProviderServiceAreas } from "./provider-service-areas";

type Specialty = {
  category?: string;
  subcategories?: string[];
  experience?: number;
  yearsOfExperience?: number;
  certifications?: Array<{
    name?: string;
    issuer?: string;
    dateIssued?: string;
    expiryDate?: string;
  }>;
  skills?: string[] | Array<{
    _id?: string;
    name?: string;
    description?: string;
    category?: string;
  }>;
  hourlyRate?: number;
  serviceAreas?: Array<{
    city?: string;
    state?: string;
    zipCode?: string;
    radius?: number;
  }>;
};

interface ProviderServiceAreasSectionProps {
  specialties?: Specialty[];
}

/**
 * ProviderServiceAreasSection Component
 * Conditionally renders the ProviderServiceAreas component if specialties exist
 */
export const ProviderServiceAreasSection: React.FC<ProviderServiceAreasSectionProps> = ({ 
  specialties 
}): React.ReactElement | null => {
  if (!specialties || specialties.length === 0) {
    return null;
  }

  return <ProviderServiceAreas specialties={specialties} />;
};

