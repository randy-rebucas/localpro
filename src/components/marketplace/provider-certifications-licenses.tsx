"use client";

import React from "react";
import { Award, Shield } from "lucide-react";

type Certification = {
  name?: string;
  issuer?: string;
  dateIssued?: string;
  issuedAt?: string;
  expiryDate?: string;
  expiresAt?: string;
  document?: {
    url?: string;
    publicId?: string;
  };
};

type License = {
  type?: string;
  number?: string;
  state?: string;
  issuingAuthority?: string;
  expiryDate?: string;
  expiresAt?: string;
  document?: {
    url?: string;
    publicId?: string;
  };
};

type Specialty = {
  certifications?: Certification[];
};

interface ProviderCertificationsLicensesProps {
  specialties?: Specialty[];
  licenses?: License[];
  certifications?: Certification[];
}

/**
 * ProviderCertificationsLicenses Component
 * Displays certifications from specialties, verification, and licenses from verification
 */
export const ProviderCertificationsLicenses: React.FC<ProviderCertificationsLicensesProps> = ({
  specialties,
  licenses,
  certifications
}): React.ReactElement | null => {
  // Check if there are any certifications or licenses to display
  const hasSpecialtyCertifications = specialties?.some(s => s.certifications && s.certifications.length > 0) ?? false;
  const hasVerificationCertifications = Boolean(certifications && certifications.length > 0);
  const hasLicenses = Boolean(licenses && licenses.length > 0);

  if (!hasSpecialtyCertifications && !hasVerificationCertifications && !hasLicenses) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Certifications & Licenses</h2>
      <div className="space-y-3">
        {/* Certifications from specialties */}
        {specialties?.flatMap((specialty, sIdx) => 
          specialty.certifications?.map((cert, cIdx) => {
            const expiryDate = cert.expiresAt || cert.expiryDate;
            return (
              <div key={`cert-specialty-${sIdx}-${cIdx}`} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg">
                <Award className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-gray-700">{cert.name}</div>
                  <div className="text-sm text-gray-600">{cert.issuer}</div>
                  {expiryDate && (
                    <div className="text-xs text-gray-500">
                      Expires: {new Date(expiryDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            );
          }) || []
        )}
        
        {/* Certifications from verification */}
        {certifications?.map((cert, idx) => {
          const expiryDate = cert.expiresAt || cert.expiryDate;
          return (
            <div key={`cert-verification-${idx}`} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg">
              <Award className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-medium text-gray-700">{cert.name}</div>
                <div className="text-sm text-gray-600">{cert.issuer}</div>
                {expiryDate && (
                  <div className="text-xs text-gray-500">
                    Expires: {new Date(expiryDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {/* Licenses from verification */}
        {licenses?.map((license, idx) => {
          const expiryDate = license.expiresAt || license.expiryDate;
          return (
            <div key={`license-${idx}`} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg">
              <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-medium text-gray-700">{license.type}</div>
                <div className="text-sm text-gray-600">License #{license.number}</div>
                {license.state && (
                  <div className="text-xs text-gray-500">State: {license.state}</div>
                )}
                {license.issuingAuthority && (
                  <div className="text-xs text-gray-500">{license.issuingAuthority}</div>
                )}
                {expiryDate && (
                  <div className="text-xs text-gray-500">
                    Expires: {new Date(expiryDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

