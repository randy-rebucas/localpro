"use client";

import React, { useState } from "react";
import { Search, Sparkles, Loader2, CheckCircle, MapPin, DollarSign, Clock } from "lucide-react";
import { useAIServiceMatcher } from "@/hooks/useAIFeatures";
import { useAppSettings } from "@/hooks/useAppSettings";
import { formatCurrency } from "@/lib/currency-utils";
import { getDefaultCurrency } from "@/lib/settings-utils";
import Link from "next/link";

interface Service {
  _id?: string;
  id?: string;
  title?: string;
  name?: string;
  description?: string;
  pricing?: {
    basePrice?: number;
    currency?: string;
  };
  location?: string;
  [key: string]: unknown;
}

interface ServiceMatch {
  service?: Service;
  matchScore?: number;
  reasons?: string[];
  estimatedPrice?: number;
  estimatedDuration?: number;
  _count?: number;
  _empty?: boolean;
}

interface AIServiceMatcherProps {
  location?: string;
  lat?: number;
  lng?: number;
  onServiceSelect?: (service: Service) => void;
}

export function AIServiceMatcher({
  location,
  lat,
  lng,
  onServiceSelect,
}: AIServiceMatcherProps) {
  const { settings: appSettings } = useAppSettings();
  const [serviceType, setServiceType] = useState("");
  const [budget, setBudget] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [specialRequirements, setSpecialRequirements] = useState<string[]>([]);
  const [currentRequirement, setCurrentRequirement] = useState("");
  const [category, setCategory] = useState("");
  const [matches, setMatches] = useState<ServiceMatch[]>([]);
  const { match, loading, error } = useAIServiceMatcher();

  const defaultCurrency = getDefaultCurrency(appSettings);
  const formatPrice = (amount: number, currency?: string) => {
    return formatCurrency(amount, currency || defaultCurrency, { appSettings });
  };

  const handleAddRequirement = () => {
    if (currentRequirement.trim() && !specialRequirements.includes(currentRequirement.trim())) {
      setSpecialRequirements([...specialRequirements, currentRequirement.trim()]);
      setCurrentRequirement("");
    }
  };

  const handleRemoveRequirement = (req: string) => {
    setSpecialRequirements(specialRequirements.filter((r) => r !== req));
  };

  const handleMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceType.trim()) return;

    try {
      const result = await match({
        requirements: {
          serviceType: serviceType.trim(),
          location: location || undefined,
          budget: budget ? parseFloat(budget) : undefined,
          preferredTime: preferredTime || undefined,
          specialRequirements: specialRequirements.length > 0 ? specialRequirements : undefined,
        },
        filters: {
          category: category || undefined,
          location: location || undefined,
          lat,
          lng,
        },
      });
      // Filter out empty placeholder objects
      const actualMatches = result.filter((m: ServiceMatch) => !m._empty);
      setMatches(actualMatches);
    } catch (err) {
      console.error("Service matching failed", err);
      setMatches([]);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-accent" />
        <h3 className="text-lg font-semibold text-gray-900">AI Service Matcher</h3>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Describe what you need, and we&apos;ll find the perfect service providers for you
      </p>

      <form onSubmit={handleMatch} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Service Type *
          </label>
          <input
            type="text"
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            placeholder="e.g., house cleaning, plumbing repair"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category (optional)
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select category (optional)</option>
            <option value="cleaning">Cleaning</option>
            <option value="plumbing">Plumbing</option>
            <option value="electrical">Electrical</option>
            <option value="moving">Moving</option>
            <option value="landscaping">Landscaping</option>
            <option value="painting">Painting</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Budget (optional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                {formatCurrency(0, defaultCurrency, { appSettings }).replace('0', '').trim()}
              </span>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Time (optional)
            </label>
            <select
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select time (optional)</option>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
              <option value="night">Night</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Special Requirements (optional)
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={currentRequirement}
              onChange={(e) => setCurrentRequirement(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddRequirement();
                }
              }}
              placeholder="e.g., eco-friendly products, pet-friendly"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="button"
              onClick={handleAddRequirement}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Add
            </button>
          </div>
          {specialRequirements.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {specialRequirements.map((req, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent rounded-full text-xs"
                >
                  {req}
                  <button
                    type="button"
                    onClick={() => handleRemoveRequirement(req)}
                    className="text-accent hover:text-accent"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !serviceType.trim()}
          className="w-full px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-colors font-medium flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Finding matches...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>Find Matching Services</span>
            </>
          )}
        </button>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}
      </form>

      {matches.length > 0 && (
        <div className="mt-6 space-y-4">
          <h4 className="font-semibold text-gray-900 mb-3">
            Found {matches.length} Matching {matches.length === 1 ? "Service" : "Services"}
          </h4>
          {matches.map((match, index) => {
            const service = (match.service || match) as Service;
            const matchScore = match.matchScore || 0;

            return (
              <div
                key={service._id || service.id || index}
                className="border border-gray-200 rounded-lg p-4 hover:border-accent/30 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-semibold text-gray-900">
                        {service.title || service.name}
                      </h5>
                      <span className="px-2 py-0.5 bg-accent/10 text-accent text-xs font-medium rounded">
                        {Math.round(matchScore * 100)}% match
                      </span>
                    </div>
                    {service.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {service.description}
                      </p>
                    )}
                  </div>
                </div>

                {match.reasons && match.reasons.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-700 mb-1">Why this matches:</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {match.reasons.slice(0, 3).map((reason: string, i: number) => (
                        <li key={i} className="flex items-start gap-1">
                          <CheckCircle className="w-3 h-3 text-accent mt-0.5 flex-shrink-0" />
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                  {match.estimatedPrice && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      <span>Est. {formatPrice(match.estimatedPrice, service.pricing?.currency)}</span>
                    </div>
                  )}
                  {match.estimatedDuration && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>~{match.estimatedDuration} hours</span>
                    </div>
                  )}
                  {service.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{service.location}</span>
                    </div>
                  )}
                </div>

                <Link
                  href={`/marketplace/services/${service._id || service.id}`}
                  className="block w-full text-center px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors text-sm font-medium"
                  onClick={() => onServiceSelect?.(service)}
                >
                  View Service Details
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

