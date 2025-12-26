"use client";

import React, { useState } from "react";
import { MessageSquare, Sparkles, Loader2, Copy, Check, Send } from "lucide-react";
import { useAIResponseAssistant } from "@/hooks/useAIFeatures";

interface AIResponseAssistantProps {
  onResponseGenerated?: (response: string) => void;
  context?: {
    bookingId?: string;
    serviceId?: string;
    previousMessages?: string[];
  };
}

export function AIResponseAssistant({
  onResponseGenerated,
  context,
}: AIResponseAssistantProps) {
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"professional" | "friendly" | "formal">("professional");
  interface GeneratedResponse {
    response?: string;
    alternatives?: string[];
    suggestedActions?: string[];
  }
  
  const [generated, setGenerated] = useState<GeneratedResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const { generate, loading, error } = useAIResponseAssistant();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      const result = await generate({
        message: message.trim(),
        context,
        tone,
      });
      setGenerated(result);
      onResponseGenerated?.(result.response);
    } catch (err) {
      console.error("Response generation failed", err);
    }
  };

  const handleCopy = () => {
    if (generated?.response) {
      navigator.clipboard.writeText(generated.response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-accent" />
        <h3 className="text-lg font-semibold text-gray-900">AI Response Assistant</h3>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Generate professional responses to client messages automatically
      </p>

      {!generated ? (
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client Message *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Paste the client's message here..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring min-h-[100px]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Response Tone
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as "professional" | "friendly" | "formal")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="formal">Formal</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="w-full px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-colors font-medium flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <MessageSquare className="w-4 h-4" />
                <span>Generate Response</span>
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
            <h4 className="font-semibold text-gray-900">Generated Response</h4>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="text-sm text-accent hover:text-accent flex items-center gap-1"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setGenerated(null);
                  setMessage("");
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Generate New
              </button>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-900 whitespace-pre-wrap">{generated.response}</p>
          </div>

          {generated.alternatives && generated.alternatives.length > 0 && (
            <div>
              <h5 className="font-semibold text-gray-900 mb-2">Alternative Responses</h5>
              <div className="space-y-2">
                {generated.alternatives.map((alt: string, i: number) => (
                  <div
                    key={i}
                    className="p-3 bg-primary/5 rounded-lg border border-primary/20 text-sm text-gray-700"
                  >
                    {alt}
                  </div>
                ))}
              </div>
            </div>
          )}

          {generated.suggestedActions && generated.suggestedActions.length > 0 && (
            <div>
              <h5 className="font-semibold text-gray-900 mb-2">Suggested Actions</h5>
              <ul className="space-y-1">
                {generated.suggestedActions.map((action: string, i: number) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <Send className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                    <span>{action}</span>
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

