"use client";

import { useState } from "react";
import { Sparkles, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { prefillServiceForm, type PrefilledFormData } from "@/lib/ai-utils";
import { logger } from "@/lib/logger";

interface AIFormPrefillerProps {
  onPrefill: (data: PrefilledFormData) => void;
}

export default function AIFormPrefiller({ onPrefill }: AIFormPrefillerProps) {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError("Please enter a description of your service");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const prefilledData = await prefillServiceForm({
        description: description.trim(),
      });

      onPrefill(prefilledData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to prefill form";
      setError(errorMessage);
      logger.error("AI form prefiller error", err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 via-white to-primary/10 rounded-xl border-2 border-purple-200 shadow-lg p-6 mb-6">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-primary text-white flex items-center justify-center shadow-lg shadow-purple-500/30">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">AI Form Assistant</h3>
          <p className="text-sm text-gray-600">
            Describe your service in natural language and let AI prefill all form fields for you
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Service Description
          </label>
          <textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setError(null);
              setSuccess(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleGenerate();
              }
            }}
            placeholder="Example: I offer professional house cleaning services in Manila. I provide deep cleaning, regular maintenance, and window cleaning. I work alone, bring all equipment and materials. I charge ₱500 per hour. I'm available Monday to Friday 9am to 5pm. I offer a 30-day satisfaction guarantee and have insurance coverage up to ₱5,000,000. I also offer emergency cleaning services with 2-hour response time for an extra ₱1,000..."
            rows={6}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm hover:shadow-md resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            Press Cmd/Ctrl + Enter to generate, or click the button below
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2 p-3 bg-accent/5 border border-accent/20 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <p className="text-sm text-accent">Form prefilled successfully! Review and adjust the fields as needed.</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading || !description.trim()}
          className="w-full bg-gradient-to-r from-purple-600 to-primary text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/30 hover:shadow-xl hover:scale-[1.02] font-semibold flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Generating form data...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Generate & Prefill Form</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

