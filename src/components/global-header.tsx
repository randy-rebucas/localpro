"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "@/hooks/useAuth";
import { Logo } from "@/components/ui/logo";
import { useRoleAccess } from "@/components/role-guard";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useRoleView } from "@/shared/hooks/useRoleView";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import {
  Search,
  Bell,
  Heart,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Loader2,
  MessageSquare,
  Store,
  Package,
  GraduationCap,
  Car,
  Briefcase,
  BarChart3,
  Shield,
  HelpCircle,
  Filter,
  Wallet,
  Calendar,
  ShoppingCart,
  Star,
  Megaphone,
  Home,
  DollarSign,
  Gift,
} from "lucide-react";

interface GlobalHeaderProps {
  /** Show role-based navigation icons (Marketplace, Supplies, Academy, etc.) */
  showRoleNavigation?: boolean;
  /** Show favorites link */
  showFavorites?: boolean;
  /** Show notifications dropdown or just link */
  notificationsDropdown?: boolean;
  /** Logo link href (default: "/dashboard" or "/" if unauthenticated) */
  logoHref?: string;
  /** Show mobile sidebar toggle button */
  showMobileMenu?: boolean;
  /** Callback when mobile menu is toggled */
  onMobileMenuToggle?: (open: boolean) => void;
  /** Show filter icon */
  showFilter?: boolean;
  /** Callback when filter icon is clicked */
  onFilterClick?: () => void;
  /** Additional className for the header */
  className?: string;
}

type HeaderNotification = {
  /** Stable unique key for React rendering (not necessarily the backend id) */
  id: string;
  /** Backend id used for marking as read / navigation (may be null if API doesn't provide one) */
  backendId: string | null;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export function GlobalHeader({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showRoleNavigation: _showRoleNavigation = false,
  showFavorites = true,
  notificationsDropdown = true,
  logoHref,
  showMobileMenu = false,
  onMobileMenuToggle,
  showFilter = false,
  onFilterClick,
  className = "",
}: GlobalHeaderProps = {}) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const {
    isAdmin,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isBusinessRole: _isBusinessRole,
  } = useRoleAccess();
  
  // Fetch app settings for feature flags
  const { settings: appSettings } = useAppSettings();

  // Helper to check if a feature is enabled
  const isFeatureEnabled = (featureKey: string): boolean => {
    if (!appSettings?.features) return true; // Default to showing all if settings not loaded
    const features = appSettings.features as Record<string, unknown>;
    const feature = features[featureKey];
    if (feature === undefined) return true; // Show by default if not defined
    if (typeof feature === 'boolean') return feature;
    if (typeof feature === 'object' && feature !== null) {
      return (feature as { enabled?: boolean }).enabled !== false;
    }
    return true;
  };

  // Get user roles and determine available role views
  const userRoles = useMemo(() => session?.user?.roles || [], [session?.user?.roles]);

  // Show switcher if user has multiple roles (client + at least one business role, or multiple business roles)
  const hasMultipleRoles = userRoles.length > 1;
  const shouldShowSwitcher = hasMultipleRoles && session;

  // Canonical role view (syncs via localStorage + roleViewChanged event)
  const { roleView, setRoleView } = useRoleView({ userRoles: userRoles.length ? userRoles : ["client"] });

  // State management
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_showQuickActions, setShowQuickActions] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<Array<{ label: string; type: string; id: string }>>([]);
  const [notifications, setNotifications] = useState<HeaderNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_favoritesCount, _setFavoritesCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // Refs for click outside detection
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const quickActionsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLFormElement>(null);

  // Determine logo href - always links to homepage per requirements
  const logoLink = logoHref || "/";

  // Load favorites count from localStorage
  useEffect(() => {
    const updateCounts = () => {
      try {
        const favoriteServices = JSON.parse(localStorage.getItem('favoriteServices') || '[]');
        const favoriteProviders = JSON.parse(localStorage.getItem('favoriteProviders') || '[]');
        const favoriteCourses = JSON.parse(localStorage.getItem('favoriteCourses') || '[]');
        const favoriteSupplies = JSON.parse(localStorage.getItem('favoriteSupplies') || '[]');
        const totalFavorites = favoriteServices.length + favoriteProviders.length + favoriteCourses.length + favoriteSupplies.length;
        _setFavoritesCount(totalFavorites);
      } catch (error) {
        logger.error('Error loading favorites counts', error instanceof Error ? error : new Error(String(error)));
        _setFavoritesCount(0);
      }
    };

    updateCounts();
    const handleStorageChange = () => updateCounts();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('favoritesUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('favoritesUpdated', handleStorageChange);
    };
  }, []);

  // Load cart count from localStorage and listen for updates
  useEffect(() => {
    const updateCartCount = () => {
      try {
        const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
        const totalItems = cartItems.reduce((sum: number, item: { quantity?: number }) => sum + (item.quantity || 1), 0);
        setCartCount(totalItems);
      } catch (error) {
        logger.error('Error loading cart count', error instanceof Error ? error : new Error(String(error)));
        setCartCount(0);
      }
    };

    updateCartCount();
    const handleStorageChange = () => updateCartCount();
    const handleCartUpdated = () => updateCartCount();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cartUpdated', handleCartUpdated);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cartUpdated', handleCartUpdated);
    };
  }, []);

  // Fetch unread notification count using new endpoint
  useEffect(() => {
    if (!session || !getApiToken()) return;

    const fetchUnreadCount = async () => {
      try {
        // Try new endpoint first, fallback to legacy endpoint
        let url = `${API_BASE_URL}${API_ENDPOINTS.notificationsUnreadCount}`;
        let response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));

        // Fallback to legacy endpoint if new endpoint fails
        if (!response.ok) {
          url = `${API_BASE_URL}${API_ENDPOINTS.communicationNotificationCount}?isRead=false`;
          response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));
        }

        if (response.ok) {
          const data = await response.json();
          const count = data?.data?.count || data?.count || 0;
          setUnreadCount(count);
        } else {
          // Only log non-network errors (4xx, 5xx) to avoid noise from network issues
          if (response.status >= 400) {
            logger.warn(`Failed to fetch notification count: ${response.status} ${response.statusText}`);
          }
          // Silently fail for network errors - they're expected when offline
        }
      } catch (error) {
        // Only log if it's not a network error (Failed to fetch, NetworkError, etc.)
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isNetworkError =
          errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('NetworkError') ||
          errorMessage.includes('Network request failed') ||
          errorMessage.includes('Load failed');

        if (!isNetworkError) {
          logger.error('Error fetching notification count', error instanceof Error ? error : new Error(String(error)));
        }
        // Silently handle network errors - they're expected when offline or API unavailable
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [session]);

  // Fetch notifications when dropdown opens using new endpoint
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!session || !getApiToken() || !showNotifications) return;

      try {
        setLoadingNotifications(true);
        // Try new endpoint first, fallback to legacy endpoint
        let url = `${API_BASE_URL}${API_ENDPOINTS.notifications}?limit=5&page=1`;
        let response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));

        // Fallback to legacy endpoint if new endpoint fails
        if (!response.ok) {
          url = `${API_BASE_URL}${API_ENDPOINTS.communicationNotifications}?limit=5&page=1`;
          response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));
        }

        if (response.ok) {
          const data = await response.json();
          const notificationsData = data?.data?.notifications || data?.notifications || data?.data || [];
          const normalized: HeaderNotification[] = Array.isArray(notificationsData)
            ? notificationsData.slice(0, 5).map((raw: unknown, idx: number) => {
              const n = raw as Record<string, unknown> | null | undefined;
              const backendIdRaw =
                n?.id ??
                n?._id ??
                n?.notificationId ??
                n?.notification_id ??
                n?.uuid;
              const backendId = backendIdRaw != null && String(backendIdRaw).trim() !== "" ? String(backendIdRaw) : null;

              const titleRaw = n?.title ?? n?.subject ?? n?.name ?? "Notification";
              const messageRaw = n?.message ?? n?.body ?? n?.content ?? "";
              const createdAtRaw = n?.createdAt ?? n?.created_at ?? n?.timestamp ?? "";
              const isReadRaw = n?.isRead ?? n?.read ?? n?.is_read ?? false;

              const title = String(titleRaw ?? "Notification");
              const message = String(messageRaw ?? "");
              const createdAt = String(createdAtRaw ?? "");
              const isRead = Boolean(isReadRaw);

              // React key must always be defined and unique.
              const id = backendId ?? `notification-missing-id-${idx}`;

              return { id, backendId, title, message, isRead, createdAt };
            })
            : [];

          setNotifications(normalized);
        } else {
          setNotifications([]);
        }
      } catch (error) {
        logger.error('Error fetching notifications', error instanceof Error ? error : new Error(String(error)));
        setNotifications([]);
      } finally {
        setLoadingNotifications(false);
      }
    };

    if (showNotifications && session) {
      fetchNotifications();
    }
  }, [showNotifications, session]);

  // Search suggestions
  useEffect(() => {
    const fetchSearchSuggestions = async () => {
      if (!searchQuery || searchQuery.length < 2) {
        setSearchSuggestions([]);
        setShowSearchSuggestions(false);
        return;
      }

      try {
        setLoadingSearch(true);

        // Search suggestions is PUBLIC endpoint (per API_ENDPOINTS_WITH_ROLES.md)
        const queryString = new URLSearchParams({ q: searchQuery }).toString();
        const url = `${API_BASE_URL}${API_ENDPOINTS.searchSuggestions}?${queryString}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          const suggestions = data?.data?.suggestions || data?.suggestions || data?.data || [];
          setSearchSuggestions(Array.isArray(suggestions) ? suggestions.slice(0, 5) : []);
          setShowSearchSuggestions(suggestions.length > 0);
        } else {
          setSearchSuggestions([]);
          setShowSearchSuggestions(false);
        }
      } catch (error) {
        logger.error('Error fetching search suggestions', error instanceof Error ? error : new Error(String(error)));
        setSearchSuggestions([]);
        setShowSearchSuggestions(false);
      } finally {
        setLoadingSearch(false);
      }
    };

    const timeoutId = setTimeout(fetchSearchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (quickActionsRef.current && !quickActionsRef.current.contains(event.target as Node)) {
        setShowQuickActions(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearchSuggestions(false);
      setSearchQuery("");
    }
  };

  const handleSuggestionClick = (suggestion: { label: string; type: string; id: string }) => {
    router.push(`/${suggestion.type}/${suggestion.id}`);
    setShowSearchSuggestions(false);
    setSearchQuery("");
  };

  const handleNotificationClick = async (notificationId: string | null) => {
    if (!notificationId || !session || !getApiToken()) return;

    try {
      // Replace [id] placeholder with actual notification ID
      const endpoint = API_ENDPOINTS.communicationNotificationsRead.replace('[id]', notificationId);
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'PUT' }));

      if (response.ok) {
        setNotifications(prev => prev.map(n => n.backendId === notificationId ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      router.push('/notifications');
      setShowNotifications(false);
    } catch (error) {
      logger.error('Error marking notification as read', error instanceof Error ? error : new Error(String(error)));
    }
  };

  const getUserDisplayName = () => {
    if (session?.user?.firstName && session?.user?.lastName) {
      return `${session.user.firstName} ${session.user.lastName}`;
    }
    if (session?.user?.name) {
      return session.user.name;
    }
    return "User";
  };

  const getUserInitial = () => {
    if (session?.user?.firstName) {
      return session.user.firstName.charAt(0).toUpperCase();
    }
    if (session?.user?.name) {
      return session.user.name.charAt(0).toUpperCase();
    }
    return "U";
  };

  const SearchBar = ({ isMobile = false }: { isMobile?: boolean }) => (
    <form onSubmit={handleSearch} className="relative w-full" ref={searchRef}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" aria-hidden="true" />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          if (e.target.value.length >= 2) {
            setShowSearchSuggestions(true);
          }
        }}
        onFocus={() => {
          if (searchSuggestions.length > 0) setShowSearchSuggestions(true);
        }}
        placeholder="Search services, providers, or jobs…"
        className={`w-full pl-10 pr-4 py-2.5 border-2 border-border rounded-lg focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring transition ${isMobile ? 'text-sm' : ''
          }`}
      />

      {showSearchSuggestions && (searchSuggestions.length > 0 || loadingSearch) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border-2 border-gray-200 max-h-64 overflow-y-auto z-50">
          {loadingSearch ? (
            <div className="p-4 text-center text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
              Searching...
            </div>
          ) : (
            <>
              {searchSuggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-gray-900">{suggestion.label}</div>
                  <div className="text-xs text-gray-500 capitalize">{suggestion.type}</div>
                </button>
              ))}
              <button
                type="submit"
                className="w-full text-left px-4 py-2 hover:bg-accent/5 transition-colors border-t border-gray-200 text-accent font-medium"
              >
                View all results for &quot;{searchQuery}&quot;
              </button>
            </>
          )}
        </div>
      )}
    </form>
  );

  return (
    <header className={`bg-white relative z-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo and Mobile Menu */}
          <div className="flex items-center space-x-4">
            {showMobileMenu && onMobileMenuToggle && (
              <button
                onClick={() => onMobileMenuToggle(true)}
                className="md:hidden p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                aria-label="Toggle menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            )}
            <Link href={logoLink} className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <Logo withText={false} size={32} />
              <span className="hidden sm:block text-xl font-bold text-gray-900">LocalPro</span>
            </Link>
          </div>

          {/* Center: Search Bar - Hidden on mobile */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <SearchBar />
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Mobile Search Icon */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle search"
            >
              {mobileSearchOpen ? (
                <X className="w-5 h-5 text-gray-700" aria-hidden="true" />
              ) : (
                <Search className="w-5 h-5 text-gray-700" aria-hidden="true" />
              )}
            </button>

            {/* Filter Icon */}
            {showFilter && onFilterClick && (
              <button
                onClick={onFilterClick}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Open filters"
                title="Filters"
              >
                <Filter className="w-5 h-5 text-gray-700" aria-hidden="true" />
              </button>
            )}

            {/* Notifications */}
            {session && (
              notificationsDropdown ? (
                <div className="relative" ref={notificationsRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    aria-label={`View notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                    aria-expanded={showNotifications}
                  >
                    <Bell className="w-5 h-5 text-gray-700" aria-hidden="true" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 min-w-[18px] h-[18px] bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none border-2 border-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border-2 border-gray-200 z-[9999]">
                      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800 text-sm">Notifications</h3>
                        <Link
                          href="/notifications"
                          className="text-xs text-accent hover:text-accent font-medium"
                          onClick={() => setShowNotifications(false)}
                        >
                          View all
                        </Link>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {loadingNotifications ? (
                          <div className="p-4 text-center">
                            <Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-400" />
                          </div>
                        ) : notifications.length > 0 ? (
                          notifications.map((notification) => (
                            <button
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification.backendId)}
                              className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${!notification.isRead ? 'bg-primary/5' : ''
                                }`}
                            >
                              <div className="flex items-start gap-2">
                                <div className={`flex-1 ${!notification.isRead ? 'font-semibold' : ''}`}>
                                  <p className="text-sm text-gray-900">{notification.title}</p>
                                  <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                                </div>
                                {!notification.isRead && (
                                  <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1"></div>
                                )}
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="p-4 text-center text-sm text-gray-500">No notifications</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/notifications"
                  className={`relative p-2 rounded-lg transition-colors ${pathname?.startsWith("/notifications")
                    ? "text-accent bg-accent/5 hover:text-accent hover:bg-accent/10"
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" aria-hidden="true" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 min-w-[18px] h-[18px] bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none border-2 border-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              )
            )}

            {/* Messages / Chat */}
            {session && (
              <Link
                href="/messages"
                className={`p-2 rounded-lg transition-colors ${pathname?.startsWith("/messages")
                  ? "text-accent bg-accent/5 hover:text-accent hover:bg-accent/10"
                  : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                title="Chat"
                aria-label="Messages"
              >
                <MessageSquare className="w-5 h-5" aria-hidden="true" />
              </Link>
            )}


            {/* Favorites */}
            {showFavorites && session && (
              <Link
                href="/favorites"
                className={`p-2 rounded-lg transition-colors ${pathname?.startsWith("/favorites")
                  ? "text-accent bg-accent/5 hover:text-accent hover:bg-accent/10"
                  : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                title="Favorites"
                aria-label="Favorites"
              >
                <Heart className="w-5 h-5" aria-hidden="true" />
              </Link>
            )}

            {/* Shopping Cart */}
            {session && (
              <Link
                href="/cart"
                className={`relative p-2 rounded-lg transition-colors ${pathname?.startsWith("/cart")
                  ? "text-accent bg-accent/5 hover:text-accent hover:bg-accent/10"
                  : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                title="Shopping Cart"
                aria-label={`Shopping Cart${cartCount > 0 ? ` (${cartCount} items)` : ''}`}
              >
                <ShoppingCart className="w-5 h-5" aria-hidden="true" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none border-2 border-white">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
            )}

            {/* Role Toggle - Show options based on user's actual roles, hide if only client */}
            {shouldShowSwitcher && (
              <div className="hidden sm:flex items-center border-r border-gray-300 pr-3 mr-1">
                <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
                  {userRoles.map((role) => {
                    const roleLabels: Record<string, string> = {
                      'client': 'Client',
                      'provider': 'Provider',
                      'supplier': 'Supplier',
                      'instructor': 'Instructor',
                      'agency_owner': 'Agency Owner',
                      'agency_admin': 'Agency Admin',
                      'admin': 'Admin',
                    };

                    return (
                      <button
                        key={role}
                        onClick={() => {
                          setRoleView(role);
                          // Refresh page if on dashboard to update view
                          if (pathname?.startsWith('/dashboard')) {
                            router.refresh();
                          }
                        }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${roleView === role
                          ? 'bg-white text-accent shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                          }`}
                        title={`Switch to ${roleLabels[role] || role} view`}
                        aria-label={`Switch to ${roleLabels[role] || role} view`}
                      >
                        {roleLabels[role] || role.charAt(0).toUpperCase() + role.slice(1)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* User Menu */}
            {session ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label={`User menu for ${getUserDisplayName()}`}
                  aria-expanded={showUserMenu}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-accent to-accent rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">{getUserInitial()}</span>
                  </div>
                  <span className="hidden lg:block text-sm font-medium text-gray-700">
                    {getUserDisplayName()}
                  </span>
                  <ChevronDown className="hidden lg:block w-4 h-4 text-gray-500" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border-2 border-gray-200 py-2 z-[9999]">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">{getUserDisplayName()}</p>
                      <p className="text-xs text-gray-500">{session?.user?.email || session?.user?.phone}</p>
                    </div>
                    <Link
                      href="/profile"
                      className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="w-4 h-4 text-gray-500" aria-hidden="true" />
                      <span>Profile</span>
                    </Link>
                    {/* Show "My Bookings" only in client view */}
                    {roleView === 'client' && (
                      <Link
                        href="/marketplace/my-bookings"
                        className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Calendar className="w-4 h-4 text-gray-500" aria-hidden="true" />
                        <span>My Bookings</span>
                      </Link>
                    )}
                    {/* Show "My Services" only in provider view (provider, agency_owner, agency_admin, admin) */}
                    {roleView !== 'client' && ['provider', 'agency_owner', 'agency_admin', 'admin'].includes(roleView) && userRoles.includes(roleView) && (
                      <Link
                        href="/marketplace/my-services"
                        className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <BarChart3 className="w-4 h-4 text-gray-500" aria-hidden="true" />
                        <span>My Services</span>
                      </Link>
                    )}
                    <Link
                      href="/wallet"
                      className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Wallet className="w-4 h-4 text-gray-500" aria-hidden="true" />
                      <span>Wallet</span>
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings className="w-4 h-4 text-gray-500" aria-hidden="true" />
                      <span>Settings</span>
                    </Link>
                    <Link
                      href="/help-center"
                      className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <HelpCircle className="w-4 h-4 text-gray-500" aria-hidden="true" />
                      <span>Help</span>
                    </Link>
                    {isAdmin && (
                      <>
                        <div className="border-t border-gray-100 my-1"></div>
                        <Link
                          href="/admin"
                          className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Shield className="w-4 h-4 text-gray-500" aria-hidden="true" />
                          <span>Admin Dashboard</span>
                        </Link>
                      </>
                    )}
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-red-600" aria-hidden="true" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Search Bar */}
        {mobileSearchOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <SearchBar isMobile />
          </div>
        )}
      </div>

      {/* Subheader - Navigation Links (based on app settings features) */}
      <div className="border-t border-gray-100 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 py-2 overflow-x-auto scrollbar-hide">
            {/* Marketplace - check 'marketplace' feature */}
            {isFeatureEnabled('marketplace') && (
              <Link
                href="/marketplace"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  pathname?.startsWith("/marketplace")
                    ? "text-accent bg-accent/10"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
                aria-current={pathname?.startsWith("/marketplace") ? "page" : undefined}
              >
                <Store className="w-4 h-4" aria-hidden="true" />
                <span>Marketplace</span>
              </Link>
            )}

            {/* Supplies - check 'supplies' feature */}
            {isFeatureEnabled('supplies') && (
              <Link
                href="/supplies"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  pathname?.startsWith("/supplies")
                    ? "text-accent bg-accent/10"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
                aria-current={pathname?.startsWith("/supplies") ? "page" : undefined}
              >
                <Package className="w-4 h-4" aria-hidden="true" />
                <span>Supplies</span>
              </Link>
            )}

            {/* Academy - check 'academy' feature */}
            {isFeatureEnabled('academy') && (
              <Link
                href="/academy"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  pathname?.startsWith("/academy")
                    ? "text-accent bg-accent/10"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
                aria-current={pathname?.startsWith("/academy") ? "page" : undefined}
              >
                <GraduationCap className="w-4 h-4" aria-hidden="true" />
                <span>Academy</span>
              </Link>
            )}

            {/* Rentals - check 'rentals' feature */}
            {isFeatureEnabled('rentals') && (
              <Link
                href="/rentals"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  pathname?.startsWith("/rentals")
                    ? "text-accent bg-accent/10"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
                aria-current={pathname?.startsWith("/rentals") ? "page" : undefined}
              >
                <Car className="w-4 h-4" aria-hidden="true" />
                <span>Rentals</span>
              </Link>
            )}

            {/* Jobs - check 'jobBoard' feature */}
            {isFeatureEnabled('jobBoard') && (
              <Link
                href="/jobs"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  pathname?.startsWith("/jobs")
                    ? "text-accent bg-accent/10"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
                aria-current={pathname?.startsWith("/jobs") ? "page" : undefined}
              >
                <Briefcase className="w-4 h-4" aria-hidden="true" />
                <span>Jobs</span>
              </Link>
            )}

            {/* Facility Care - check 'facilityCare' feature */}
            {isFeatureEnabled('facilityCare') && (
              <Link
                href="/facility-care"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  pathname?.startsWith("/facility-care")
                    ? "text-accent bg-accent/10"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
                aria-current={pathname?.startsWith("/facility-care") ? "page" : undefined}
              >
                <Home className="w-4 h-4" aria-hidden="true" />
                <span>Facility Care</span>
              </Link>
            )}

            {/* LocalPro Plus - check 'localProPlus' feature */}
            {isFeatureEnabled('localProPlus') && (
              <Link
                href="/plus"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  pathname?.startsWith("/plus")
                    ? "text-yellow-700 bg-yellow-100"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
                aria-current={pathname?.startsWith("/plus") ? "page" : undefined}
              >
                <Star className="w-4 h-4 text-yellow-500" aria-hidden="true" />
                <span>LocalPro+</span>
              </Link>
            )}

            {/* Ads - check 'ads' feature */}
            {isFeatureEnabled('ads') && (
              <Link
                href="/ads"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  pathname?.startsWith("/ads")
                    ? "text-accent bg-accent/10"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
                aria-current={pathname?.startsWith("/ads") ? "page" : undefined}
              >
                <Megaphone className="w-4 h-4" aria-hidden="true" />
                <span>Ads</span>
              </Link>
            )}

            {/* Finance - check 'finance' feature */}
            {isFeatureEnabled('finance') && (
              <Link
                href="/finance"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  pathname?.startsWith("/finance")
                    ? "text-accent bg-accent/10"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
                aria-current={pathname?.startsWith("/finance") ? "page" : undefined}
              >
                <DollarSign className="w-4 h-4" aria-hidden="true" />
                <span>Finance</span>
              </Link>
            )}

            {/* Referrals - check 'referrals' feature */}
            {isFeatureEnabled('referrals') && (
              <Link
                href="/referrals"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  pathname?.startsWith("/referrals")
                    ? "text-accent bg-accent/10"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
                aria-current={pathname?.startsWith("/referrals") ? "page" : undefined}
              >
                <Gift className="w-4 h-4" aria-hidden="true" />
                <span>Referrals</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

