"use client";

import React, { useState } from "react";
import { Sparkles, Loader2, Copy, Check, FileText } from "lucide-react";
import { useAIDescriptionGenerator } from "@/hooks/useAIFeatures";
import { useAppSettings } from "@/hooks/useAppSettings";
import { formatCurrency } from "@/lib/currency-utils";
import { getDefaultCurrency } from "@/lib/settings-utils";

interface GeneratedDescription {
  title?: string;
  description?: string;
  shortDescription?: string;
  keywords?: string[];
  seoSuggestions?: string[];
}

interface AIDescriptionGeneratorProps {
  onDescriptionGenerated?: (description: GeneratedDescription) => void;
}

export function AIDescriptionGenerator({ onDescriptionGenerated }: AIDescriptionGeneratorProps) {
  const { settings: appSettings } = useAppSettings();
  const [formData, setFormData] = useState({
    serviceType: "",
    category: "",
    keyFeatures: [] as string[],
    pricing: {
      type: "fixed",
      basePrice: "",
    },
    location: "",
  });
  const [currentFeature, setCurrentFeature] = useState("");
  const [generated, setGenerated] = useState<GeneratedDescription | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const { generate, loading, error } = useAIDescriptionGenerator();

  const defaultCurrency = getDefaultCurrency(appSettings);

  const handleAddFeature = () => {
    if (currentFeature.trim() && !formData.keyFeatures.includes(currentFeature.trim())) {
      setFormData({
        ...formData,
        keyFeatures: [...formData.keyFeatures, currentFeature.trim()],
      });
      setCurrentFeature("");
    }
  };

  const handleRemoveFeature = (feature: string) => {
    setFormData({
      ...formData,
      keyFeatures: formData.keyFeatures.filter((f) => f !== feature),
    });
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.serviceType || !formData.category) return;

    try {
      const result = await generate({
        serviceType: formData.serviceType,
        category: formData.category,
        keyFeatures: formData.keyFeatures.length > 0 ? formData.keyFeatures : undefined,
        pricing:
          formData.pricing.basePrice
            ? {
                type: formData.pricing.type,
                basePrice: parseFloat(formData.pricing.basePrice),
              }
            : undefined,
        location: formData.location || undefined,
      });
      setGenerated(result);
      onDescriptionGenerated?.(result);
    } catch (err) {
      console.error("Description generation failed", err);
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-900">AI Description Generator</h3>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Generate optimized service descriptions with SEO-friendly content
      </p>

      {!generated ? (
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service Type *
            </label>
            <input
              type="text"
              value={formData.serviceType}
              onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
              placeholder="e.g., Professional House Cleaning"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">Select category</option>
              <option value="cleaning">Cleaning</option>
              <option value="plumbing">Plumbing</option>
              <option value="electrical">Electrical</option>
              <option value="moving">Moving</option>
              <option value="landscaping">Landscaping</option>
              <option value="painting">Painting</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Key Features
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={currentFeature}
                onChange={(e) => setCurrentFeature(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
                placeholder="Add a feature and press Enter"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Add
              </button>
            </div>
            {formData.keyFeatures.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.keyFeatures.map((feature) => (
                  <span
                    key={feature}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-sm"
                  >
                    {feature}
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(feature)}
                      className="text-green-700 hover:text-green-900"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pricing Type
              </label>
              <select
                value={formData.pricing.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pricing: { ...formData.pricing, type: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="fixed">Fixed</option>
                <option value="hourly">Hourly</option>
                <option value="per_sqft">Per Square Foot</option>
                <option value="per_item">Per Item</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                  {formatCurrency(0, defaultCurrency, { appSettings }).replace('0', '').trim()}
                </span>
                <input
                  type="number"
                  value={formData.pricing.basePrice}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pricing: { ...formData.pricing, basePrice: e.target.value },
                    })
                  }
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="City or service area"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Description</span>
              </>
            )}
          </button>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">Generated Content</h4>
            <button
              onClick={() => {
                setGenerated(null);
                setFormData({
                  serviceType: "",
                  category: "",
                  keyFeatures: [],
                  pricing: { type: "fixed", basePrice: "" },
                  location: "",
                });
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Generate New
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Title</label>
              <button
                onClick={() => handleCopy(generated.title || "", "title")}
                className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1"
              >
                {copied === "title" ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-900">{generated.title}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <button
                onClick={() => handleCopy(generated.description || "", "description")}
                className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1"
              >
                {copied === "description" ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
              <p className="text-gray-900 whitespace-pre-wrap">{generated.description}</p>
            </div>
          </div>

          {generated.shortDescription && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Short Description</label>
                <button
                  onClick={() => handleCopy(generated.shortDescription || "", "short")}
                  className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1"
                >
                  {copied === "short" ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-900">{generated.shortDescription}</p>
              </div>
            </div>
          )}

          {generated.keywords && generated.keywords.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Keywords</label>
              <div className="flex flex-wrap gap-2">
                {generated.keywords.map((keyword: string, i: number) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {generated.seoSuggestions && generated.seoSuggestions.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                SEO Suggestions
              </label>
              <ul className="space-y-1 text-sm text-gray-600">
                {generated.seoSuggestions.map((suggestion: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

