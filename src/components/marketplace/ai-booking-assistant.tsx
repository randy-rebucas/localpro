"use client";

import React, { useState, useEffect } from "react";
import { Calendar, Sparkles, Loader2, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useAIBookingAssistant } from "@/hooks/useAIFeatures";
import { useUserSettings } from "@/hooks/useUserSettings";
import { formatDateWithUserSettings, formatTimeWithUserSettings } from "@/lib/date-time-utils";

interface BookingSuggestion {
  date: string;
  time?: string;
  confidence?: number;
  providerAvailability?: boolean;
  reason?: string;
}

interface AIBookingAssistantProps {
  serviceId: string;
  userId?: string;
  location?: string;
  onSuggestionSelect?: (suggestion: BookingSuggestion) => void;
}

export function AIBookingAssistant({
  serviceId,
  userId,
  location,
  onSuggestionSelect,
}: AIBookingAssistantProps) {
  const { settings: userSettings } = useUserSettings();
  const [suggestions, setSuggestions] = useState<BookingSuggestion[]>([]);
  const [preferredDates, setPreferredDates] = useState<string[]>([]);
  const { getSuggestions, loading, error } = useAIBookingAssistant();

  useEffect(() => {
    if (serviceId) {
      getSuggestions({
        serviceId,
        userId,
        location,
        preferredDates: preferredDates.length > 0 ? preferredDates : undefined,
      }).then(setSuggestions).catch(console.error);
    }
  }, [serviceId, userId, location, preferredDates, getSuggestions]);

  const handleDateAdd = (date: string) => {
    if (!preferredDates.includes(date)) {
      setPreferredDates([...preferredDates, date]);
    }
  };

  const handleDateRemove = (date: string) => {
    setPreferredDates(preferredDates.filter((d) => d !== date));
  };

  if (loading && suggestions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Booking Assistant</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-green-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-900">AI Booking Assistant</h3>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Get smart booking suggestions based on provider availability, your schedule, and optimal timing
      </p>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Preferred Dates (optional)
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {preferredDates.map((date) => (
            <div
              key={date}
              className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
            >
              <span>{formatDateWithUserSettings(date, userSettings)}</span>
              <button
                onClick={() => handleDateRemove(date)}
                className="ml-1 text-green-700 hover:text-green-900"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <input
          type="date"
          onChange={(e) => {
            if (e.target.value) handleDateAdd(e.target.value);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
        />
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      {suggestions.length > 0 ? (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900 mb-3">
            Suggested Booking Times
          </h4>
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 hover:border-green-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-semibold text-gray-900">
                      {formatDateWithUserSettings(suggestion.date, userSettings)}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{suggestion.time ? formatTimeWithUserSettings(`2000-01-01T${suggestion.time}`, userSettings) : suggestion.time}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-green-600 mb-1">
                    {Math.round((suggestion.confidence || 0) * 100)}% confidence
                  </div>
                  {suggestion.providerAvailability !== undefined && (
                    <div className="text-xs text-gray-500">
                      {suggestion.providerAvailability ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-3 h-3" />
                          Available
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-orange-600">
                          <AlertCircle className="w-3 h-3" />
                          Limited
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {suggestion.reason && (
                <p className="text-sm text-gray-600 mb-3">{suggestion.reason}</p>
              )}

              <button
                onClick={() => onSuggestionSelect?.(suggestion)}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                Book This Time
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>No booking suggestions available at this time.</p>
          <p className="text-sm mt-1">Try adding preferred dates above.</p>
        </div>
      )}
    </div>
  );
}

