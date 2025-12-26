"use client";

import React from "react";
import { AlertCircle } from "lucide-react";

type DayAvailability = {
  available?: boolean;
  start?: string;
  end?: string;
};

type Availability = {
  monday?: DayAvailability;
  tuesday?: DayAvailability;
  wednesday?: DayAvailability;
  thursday?: DayAvailability;
  friday?: DayAvailability;
  saturday?: DayAvailability;
  sunday?: DayAvailability;
};

interface ProviderAvailabilityProps {
  availability?: Availability;
  emergencyServices?: boolean;
}

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

/**
 * ProviderAvailability Component
 * Displays provider's weekly availability schedule and emergency services availability
 */
export const ProviderAvailability: React.FC<ProviderAvailabilityProps> = ({
  availability,
  emergencyServices
}) => {
  if (!availability) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Availability</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {DAYS_OF_WEEK.map((day) => {
          const dayData = availability[day];
          const isAvailable = dayData?.available;
          return (
            <div 
              key={day} 
              className={`p-3 rounded-lg border ${
                isAvailable 
                  ? 'bg-accent/5 border-accent/20' 
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="font-medium text-sm text-gray-700 capitalize mb-1">
                {day}
              </div>
              {isAvailable ? (
                <div className="text-xs text-gray-600">
                  {dayData.start && dayData.end 
                    ? `${dayData.start} - ${dayData.end}` 
                    : 'Available'}
                </div>
              ) : (
                <div className="text-xs text-gray-500">Not available</div>
              )}
            </div>
          );
        })}
      </div>
      {emergencyServices && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">
              Emergency services available
            </span>
          </div>
        </div>
      )}
    </div>
  );
};


