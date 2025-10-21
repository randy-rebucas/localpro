"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { useSession, signOut } from "@/hooks/useAuth";
import {
  Menu,
  X,
  LogOut,
  Search,
  Bell,
  Settings,
  HelpCircle,
  Activity
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<{ 
    name?: string; 
    role?: string; 
    phone?: string; 
    firstName?: string; 
    lastName?: string;
    profileCompleteness?: {
      percentage: number;
      completedFields: number;
      totalFields: number;
      missingFields: string[];
      fields: Record<string, { completed: boolean; required: boolean }>;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Array<{ label?: string; title?: string; name?: string; query?: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const suggestionsContainerRef = useRef<HTMLDivElement | null>(null);
  const desktopInputRef = useRef<HTMLInputElement | null>(null);
  const mobileInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const { data: session, status } = useSession();
  const pathname = usePathname();

  useEffect(() => {
    // Only redirect if we're sure the session is not loading and user is not authenticated
    if (status === "unauthenticated") {
      router.replace("/auth");
      return;
    }

    // Only fetch user data if we have a session
    if (status === "authenticated" && session?.user?.id) {
      const fetchUser = async () => {
        try {
          const response = await fetch(`/api/users/${session.user.id}`);
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          }
        } catch (error) {
          console.error("Failed to fetch user data:", error);
          setError("Failed to load user data. Please try refreshing the page.");
        } finally {
          setLoading(false);
        }
      };

      fetchUser();
    } else if (status === "loading") {
      // Keep loading state while session is being checked
      setLoading(true);
    } else {
      // If no session and not loading, stop loading
      setLoading(false);
    }
  }, [session, status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      const fetchUnread = async () => {
        try {
          const res = await fetch('/api/communication/notifications/count');
          if (res.ok) {
            const data = await res.json();
            setUnreadCount(data.count ?? 0);
          }
        } catch {
          // ignore
        }
      };
      fetchUnread();
    }
  }, [status]);

  const navigateToSearch = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }, [router]);

  // Debounced suggestions fetch
  useEffect(() => {
    const controller = new AbortController();
    const q = searchQuery.trim();
    if (!q || q.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setHighlightedIndex(-1);
      return;
    }
    setSuggestionsLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        if (!res.ok) throw new Error("Failed to fetch suggestions");
        const data = await res.json();
        const items = Array.isArray(data) ? data : (Array.isArray(data?.suggestions) ? data.suggestions : []);
        setSuggestions(items);
        setShowSuggestions(true);
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } finally {
        setSuggestionsLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [searchQuery]);

  // Hide on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!suggestionsContainerRef.current) return;
      const target = e.target as Node;
      if (!suggestionsContainerRef.current.contains(target)) {
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    }
    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSuggestions]);

  const getSuggestionLabel = (item: { label?: string; title?: string; name?: string; query?: string } | string): string => {
    if (typeof item === 'string') return item;
    return item?.label || item?.title || item?.name || item?.query || '';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        navigateToSearch(searchQuery);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const idx = highlightedIndex;
      const chosen = suggestions[idx];
      const label = getSuggestionLabel(chosen);
      navigateToSearch(label || searchQuery);
    }
  };

  const handleSuggestionClick = (item: { label?: string; title?: string; name?: string; query?: string } | string) => {
    const label = getSuggestionLabel(item);
    setSearchQuery(label);
    navigateToSearch(label);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  if (loading || status === "loading") {
    return null; // Let the loading.tsx file handle the loading state
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated" || !session) {
    return null; // Will be handled by the redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <div className="ml-4">
                <Logo />
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full" ref={suggestionsContainerRef}>
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  ref={desktopInputRef}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
                {showSuggestions && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-auto">
                    {suggestionsLoading && (
                      <div className="px-3 py-2 text-sm text-gray-500">Searching…</div>
                    )}
                    {!suggestionsLoading && suggestions.length === 0 && (
                      <div className="px-3 py-2 text-sm text-gray-500">No suggestions</div>
                    )}
                    {!suggestionsLoading && suggestions.map((s, idx) => {
                      const label = getSuggestionLabel(s);
                      return (
                        <button
                          key={`${label}-${idx}`}
                          type="button"
                          onClick={() => handleSuggestionClick(s)}
                          className={(idx === highlightedIndex ? "bg-green-50 " : "") + "w-full text-left px-3 py-2 text-sm hover:bg-green-50 focus:bg-green-50 focus:outline-none"}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link 
                href="/notifications"
                className={
                  `relative p-2 rounded-lg transition-colors ` +
                  (pathname?.startsWith("/notifications")
                    ? "text-green-700 bg-green-50 hover:text-green-800 hover:bg-green-100"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100")
                }
                aria-current={pathname?.startsWith("/notifications") ? "page" : undefined}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 h-4 text-[10px] font-medium text-white bg-green-600 rounded-full">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              <Link 
                href="/help"
                className={
                  `p-2 rounded-lg transition-colors ` +
                  (pathname?.startsWith("/help")
                    ? "text-green-700 bg-green-50 hover:text-green-800 hover:bg-green-100"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100")
                }
                aria-current={pathname?.startsWith("/help") ? "page" : undefined}
              >
                <HelpCircle className="w-5 h-5" />
              </Link>
              <Link 
                href="/settings"
                className={
                  `p-2 rounded-lg transition-colors ` +
                  (pathname?.startsWith("/settings")
                    ? "text-green-700 bg-green-50 hover:text-green-800 hover:bg-green-100"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100")
                }
                aria-current={pathname?.startsWith("/settings") ? "page" : undefined}
              >
                <Settings className="w-5 h-5" />
              </Link>
              <Link
                href="/profile"
                className="flex items-center space-x-2 px-3 py-1 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="flex flex-col text-left">
                  <span className="text-sm font-medium text-gray-700">
                    {user?.name || user?.firstName || "User"}
                  </span>
                  {user?.phone && (
                    <span className="text-xs text-gray-500">
                      {user.phone}
                    </span>
                  )}
                </div>
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Search Bar */}
      <div className="md:hidden px-4 py-4 bg-white border-b">
        <div className="relative" ref={suggestionsContainerRef}>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            ref={mobileInputRef}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          />
          {showSuggestions && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-auto">
              {suggestionsLoading && (
                <div className="px-3 py-2 text-sm text-gray-500">Searching…</div>
              )}
              {!suggestionsLoading && suggestions.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-500">No suggestions</div>
              )}
              {!suggestionsLoading && suggestions.map((s, idx) => {
                const label = getSuggestionLabel(s);
                return (
                  <button
                    key={`${label}-${idx}`}
                    type="button"
                    onClick={() => handleSuggestionClick(s)}
                    className={(idx === highlightedIndex ? "bg-green-50 " : "") + "w-full text-left px-3 py-2 text-sm hover:bg-green-50 focus:bg-green-50 focus:outline-none"}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
