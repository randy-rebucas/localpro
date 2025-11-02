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
        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
          <Search className="w-4 h-4" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-700">Search</h1>
          <p className="text-sm text-gray-500">Query: <span className="font-medium">{q || "No query"}</span></p>
        </div>
      </div>

      {loading && <div className="text-gray-500 text-sm">Loading results…</div>}
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {!loading && !error && q && Object.keys(results).length === 0 && (
        <div className="text-gray-500 text-sm">No results found.</div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 gap-4">
          {Object.entries(results).map(([group, items]) => (
            <div key={group} className="bg-white rounded-lg shadow-sm">
              <div className="px-3 py-2 border-b bg-gray-50 rounded-t-lg">
                <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{group}</h2>
              </div>
              <ul className="divide-y">
                {Array.isArray(items) && items.length > 0 ? items.map((item, idx) => (
                  <li key={`${group}-${idx}`} className="px-3 py-2 hover:bg-gray-50">
                    {getItemHref(item) !== "#" ? (
                      <Link href={getItemHref(item)} className="block">
                        <div className="font-medium text-gray-700 text-sm">{getItemLabel(item)}</div>
                        {item.description && (
                          <div className="text-xs text-gray-500 truncate">{item.description}</div>
                        )}
                        {item.type && (
                          <div className="mt-1 inline-flex items-center text-xs text-gray-500 bg-gray-100 rounded px-2 py-0.5">{item.type}</div>
                        )}
                      </Link>
                    ) : (
                      <div>
                        <div className="font-medium text-gray-700 text-sm">{getItemLabel(item)}</div>
                        {item.description && (
                          <div className="text-xs text-gray-500 truncate">{item.description}</div>
                        )}
                        {item.type && (
                          <div className="mt-1 inline-flex items-center text-xs text-gray-500 bg-gray-100 rounded px-2 py-0.5">{item.type}</div>
                        )}
                      </div>
                    )}
                  </li>
                )) : (
                  <li className="px-3 py-2 text-xs text-gray-500">No items</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


