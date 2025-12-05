"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";

type SearchResultItem = {
  id?: string | number;
  title?: string;
  name?: string;
  label?: string;
  type?: string;
  href?: string;
  description?: string;
};

export default function SearchPage() {
  const searchParams = useSearchParams();
  const q = (searchParams.get("q") || "").trim();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, SearchResultItem[]>>({});

  useEffect(() => {
    const controller = new AbortController();
    async function run() {
      if (!q || !getApiToken()) return;
      setLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams({ q }).toString();
        const url = `${API_BASE_URL}${API_ENDPOINTS.search}?${queryParams}`;
        const res = await fetch(url, {
          ...createAuthFetchOptions({ method: 'GET' }),
          signal: controller.signal
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Search failed");
        
        if (Array.isArray(data)) {
          setResults({ results: data });
        } else if (data && typeof data === 'object') {
          setResults(data);
        } else {
          setResults({ results: [] });
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          setError(error.message || 'Search failed');
        }
      } finally {
        setLoading(false);
      }
    }
    run();
    return () => controller.abort();
  }, [q]);

  const getItemLabel = (item: SearchResultItem) => item.title || item.name || item.label || String(item.id || "");
  const getItemHref = (item: SearchResultItem) => item.href || "#";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
          <Search className="w-4 h-4" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-white">Search</h1>
          <p className="text-sm text-slate-400">Query: <span className="font-medium">{q || "No query"}</span></p>
        </div>
      </div>

      {loading && <div className="text-slate-400 text-sm">Loading results…</div>}
      {error && <div className="text-red-400 text-sm">{error}</div>}
      {!loading && !error && q && Object.keys(results).length === 0 && (
        <div className="text-slate-400 text-sm">No results found.</div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 gap-4">
          {Object.entries(results).map(([group, items]) => (
            <div key={group} className="bg-slate-900/80 rounded-lg shadow-lg border border-slate-800">
              <div className="px-3 py-2 border-b border-slate-800 bg-slate-900/50 rounded-t-lg">
                <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">{group}</h2>
              </div>
              <ul className="divide-y divide-slate-800">
                {Array.isArray(items) && items.length > 0 ? items.map((item, idx) => (
                  <li key={`${group}-${idx}`} className="px-3 py-2 hover:bg-slate-800">
                    {getItemHref(item) !== "#" ? (
                      <Link href={getItemHref(item)} className="block">
                        <div className="font-medium text-white text-sm">{getItemLabel(item)}</div>
                        {item.description && (
                          <div className="text-xs text-slate-400 truncate">{item.description}</div>
                        )}
                        {item.type && (
                          <div className="mt-1 inline-flex items-center text-xs text-slate-400 bg-slate-800 rounded px-2 py-0.5">{item.type}</div>
                        )}
                      </Link>
                    ) : (
                      <div>
                        <div className="font-medium text-white text-sm">{getItemLabel(item)}</div>
                        {item.description && (
                          <div className="text-xs text-slate-400 truncate">{item.description}</div>
                        )}
                        {item.type && (
                          <div className="mt-1 inline-flex items-center text-xs text-slate-400 bg-slate-800 rounded px-2 py-0.5">{item.type}</div>
                        )}
                      </div>
                    )}
                  </li>
                )) : (
                  <li className="px-3 py-2 text-xs text-slate-500">No items</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


