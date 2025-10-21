"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type SearchResultItem = {
  id?: string | number;
  title?: string;
  name?: string;
  label?: string;
  type?: string; // e.g., service, course, job, product, etc.
  href?: string; // optional direct link
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
      if (!q) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || "Search failed");
        }
        // Accept either an object of arrays or a flat array
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-700">Search</h1>
        <div className="text-sm text-gray-500">Query: <span className="font-medium">{q || ""}</span></div>
      </div>

      {loading && (
        <div className="text-gray-500">Loading results…</div>
      )}
      {error && (
        <div className="text-red-600">{error}</div>
      )}

      {!loading && !error && q && Object.keys(results).length === 0 && (
        <div className="text-gray-500">No results found.</div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 gap-6">
          {Object.entries(results).map(([group, items]) => (
            <div key={group} className="bg-white rounded-lg shadow-sm">
              <div className="px-4 py-3 border-b bg-gray-50 rounded-t-lg">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{group}</h2>
              </div>
              <ul className="divide-y">
                {Array.isArray(items) && items.length > 0 ? items.map((item, idx) => (
                  <li key={`${group}-${idx}`} className="px-4 py-3 hover:bg-gray-50">
                    {getItemHref(item) !== "#" ? (
                      <Link href={getItemHref(item)} className="block">
                        <div className="font-medium text-gray-700">{getItemLabel(item)}</div>
                        {item.description && (
                          <div className="text-sm text-gray-500 truncate">{item.description}</div>
                        )}
                        {item.type && (
                          <div className="mt-1 inline-flex items-center text-xs text-gray-500 bg-gray-100 rounded px-2 py-0.5">{item.type}</div>
                        )}
                      </Link>
                    ) : (
                      <div>
                        <div className="font-medium text-gray-700">{getItemLabel(item)}</div>
                        {item.description && (
                          <div className="text-sm text-gray-500 truncate">{item.description}</div>
                        )}
                        {item.type && (
                          <div className="mt-1 inline-flex items-center text-xs text-gray-500 bg-gray-100 rounded px-2 py-0.5">{item.type}</div>
                        )}
                      </div>
                    )}
                  </li>
                )) : (
                  <li className="px-4 py-3 text-sm text-gray-500">No items</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


