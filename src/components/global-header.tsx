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
  Shield,
  HelpCircle,
  Filter,
  Wallet,
  Calendar,
  Star,
  Megaphone,
  Home,
  DollarSign,
  Gift,
  Building,
  UserCircle,
  Sparkles,
  BarChart3,
  Users,
  FileText,
  AlertTriangle,
  ShoppingCart
} from "lucide-react";
import { Modal } from "@/shared/components/ui/modal";
import { usePreferredFeature, PreferredFeature } from "@/hooks/usePreferredFeature";
import { PACKAGE_REGISTRY } from "@/shared/config/package-registry";

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

  // Canonical role view (syncs via localStorage + roleViewChanged event + backend)
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
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);

  // Refs for click outside detection
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const quickActionsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLFormElement>(null);

  // Get role icon and label
  const getRoleIcon = (role: string) => {
    const roleIcons: Record<string, React.ComponentType<{ className?: string }>> = {
      'client': UserCircle,
      'provider': Briefcase,
      'supplier': Package,
      'instructor': GraduationCap,
      'agency_owner': Building,
      'agency_admin': Building,
      'admin': Shield,
    };
    return roleIcons[role] || UserCircle;
  };

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      'client': 'Client',
      'provider': 'Provider',
      'supplier': 'Supplier',
      'instructor': 'Instructor',
      'agency_owner': 'Agency Owner',
      'agency_admin': 'Agency Admin',
      'admin': 'Admin',
    };
    return roleLabels[role] || role.charAt(0).toUpperCase() + role.slice(1);
  };

  const ActiveRoleIcon = getRoleIcon(roleView);

  // Feature options for the switcher
  const allFeatureOptions = useMemo(() => [
    {
      id: "marketplace" as PreferredFeature,
      name: "Marketplace",
      description: "Buy & sell locally",
      icon: Store,
      iconBgColor: "bg-primary/10",
      iconTextColor: "text-primary",
      route: PACKAGE_REGISTRY.marketplace.route,
      featureKey: "marketplace",
    },
    {
      id: "supplies" as PreferredFeature,
      name: "Supplies",
      description: "Equipment & tools",
      icon: Package,
      iconBgColor: "bg-orange-100",
      iconTextColor: "text-orange-600",
      route: PACKAGE_REGISTRY.supplies.route,
      featureKey: "supplies",
    },
    {
      id: "academy" as PreferredFeature,
      name: "Academy",
      description: "Learn & grow",
      icon: GraduationCap,
      iconBgColor: "bg-accent/10",
      iconTextColor: "text-accent",
      route: PACKAGE_REGISTRY.academy.route,
      featureKey: "academy",
    },
    {
      id: "rentals" as PreferredFeature,
      name: "Rentals",
      description: "Rent equipment",
      icon: Car,
      iconBgColor: "bg-red-100",
      iconTextColor: "text-red-600",
      route: PACKAGE_REGISTRY.rentals.route,
      featureKey: "rentals",
    },
    {
      id: "jobs" as PreferredFeature,
      name: "Jobs",
      description: "Find work opportunities",
      icon: Briefcase,
      iconBgColor: "bg-blue-100",
      iconTextColor: "text-blue-600",
      route: PACKAGE_REGISTRY.jobs.route,
      featureKey: "jobBoard",
    },
    {
      id: "facility" as PreferredFeature,
      name: "Facility Care",
      description: "Maintenance services",
      icon: Home,
      iconBgColor: "bg-emerald-100",
      iconTextColor: "text-emerald-600",
      route: PACKAGE_REGISTRY.facility.route,
      featureKey: "facilityCare",
    },
    {
      id: "plus" as PreferredFeature,
      name: "LocalPro+",
      description: "Premium features",
      icon: Star,
      iconBgColor: "bg-yellow-100",
      iconTextColor: "text-yellow-600",
      route: PACKAGE_REGISTRY.plus.route,
      featureKey: "localProPlus",
    },
    {
      id: "ads" as PreferredFeature,
      name: "Ads",
      description: "Promote business",
      icon: Megaphone,
      iconBgColor: "bg-teal-100",
      iconTextColor: "text-teal-600",
      route: PACKAGE_REGISTRY.ads.route,
      featureKey: "ads",
    },
    {
      id: "finance" as PreferredFeature,
      name: "Finance",
      description: "Manage money",
      icon: DollarSign,
      iconBgColor: "bg-purple-100",
      iconTextColor: "text-purple-600",
      route: PACKAGE_REGISTRY.finance.route,
      featureKey: "finance",
    },
    {
      id: "referrals" as PreferredFeature,
      name: "Referrals",
      description: "Earn rewards",
      icon: Gift,
      iconBgColor: "bg-pink-100",
      iconTextColor: "text-pink-600",
      route: PACKAGE_REGISTRY.referrals.route,
      featureKey: "referrals",
    },
  ], []);

  // Filter features based on app settings
  const availableFeatures = useMemo(() => {
    return allFeatureOptions.filter(feature => isFeatureEnabled(feature.featureKey));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allFeatureOptions, appSettings?.features]);

  // Get preferred feature hook (for both indicator and modal)
  const { preferredFeature, setPreferredFeature, clearPreferredFeature } = usePreferredFeature();

  // Determine logo href - link to dashboard for authenticated users, homepage for unauthenticated
  const logoLink = logoHref || (session ? "/dashboard" : "/");

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
            {/* Home/Dashboard Link - Only for authenticated users */}
            {session && (
              <Link
                href="/dashboard"
                className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === "/dashboard" || pathname?.startsWith("/dashboard")
                    ? "text-accent bg-accent/10"
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                }`}
                title="Dashboard"
                aria-label="Dashboard"
              >
                <Home className="w-5 h-5" aria-hidden="true" />
                <span className="hidden lg:inline">Dashboard</span>
              </Link>
            )}

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

            {/* Role Toggle - Icon button that opens modal */}
            {shouldShowSwitcher && (
              <button
                onClick={() => setShowRoleModal(true)}
                className="p-2 rounded-lg transition-colors text-gray-700 hover:text-gray-900 hover:bg-gray-100 relative"
                title={`Current view: ${getRoleLabel(roleView)}. Click to switch role.`}
                aria-label={`Switch role view. Current: ${getRoleLabel(roleView)}`}
              >
                <ActiveRoleIcon className="w-5 h-5" aria-hidden="true" />
                {userRoles.length > 1 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full border-2 border-white"></span>
                )}
              </button>
            )}

            {/* Feature Selector - Icon button that opens modal */}
            {session && (
              <button
                onClick={() => setShowFeatureModal(true)}
                className="p-2 rounded-lg transition-colors text-gray-700 hover:text-gray-900 hover:bg-gray-100 relative"
                title="Preferred Feature. Click to change your preferred feature."
                aria-label="Change preferred feature"
              >
                <Sparkles className="w-5 h-5" aria-hidden="true" />
                {preferredFeature && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full border-2 border-white"></span>
                )}
              </button>
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

      {/* Subheader - Navigation Links (role-based, filtered by app settings features) */}
      {session && (
        <div className="border-t border-gray-100 bg-gray-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-1 py-2 overflow-x-auto scrollbar-hide">
              {/* Client Role Subheader */}
              {roleView === 'client' && (
                <>
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

                  {/* Job Board - check 'jobBoard' feature */}
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
                      <span>Job Board</span>
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
                </>
              )}

              {/* Provider Role Subheader */}
              {roleView === 'provider' && (
                <>
                  {/* Bookings */}
                  <Link
                    href="/marketplace/my-bookings"
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      pathname?.startsWith("/marketplace/my-bookings") || pathname?.startsWith("/marketplace/bookings")
                        ? "text-accent bg-accent/10"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                    aria-current={pathname?.startsWith("/marketplace/my-bookings") || pathname?.startsWith("/marketplace/bookings") ? "page" : undefined}
                  >
                    <Calendar className="w-4 h-4" aria-hidden="true" />
                    <span>Bookings</span>
                  </Link>

                  {/* Earnings */}
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
                      <span>Earnings</span>
                    </Link>
                  )}

                  {/* Analytics */}
                  {isFeatureEnabled('analytics') && (
                    <Link
                      href="/analytics"
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                        pathname?.startsWith("/analytics")
                          ? "text-accent bg-accent/10"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                      aria-current={pathname?.startsWith("/analytics") ? "page" : undefined}
                    >
                      <BarChart3 className="w-4 h-4" aria-hidden="true" />
                      <span>Analytics</span>
                    </Link>
                  )}

                  {/* Become Agency - Only show if user is not already an agency owner/admin */}
                  {!userRoles.includes('agency_owner') && !userRoles.includes('agency_admin') && (
                    <Link
                      href="/agencies/create"
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                        pathname?.startsWith("/agencies/create")
                          ? "text-accent bg-accent/10"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                      aria-current={pathname?.startsWith("/agencies/create") ? "page" : undefined}
                    >
                      <Building className="w-4 h-4" aria-hidden="true" />
                      <span>Become Agency</span>
                    </Link>
                  )}
                </>
              )}

              {/* Supplier Role Subheader */}
              {roleView === 'supplier' && (
                <>
                  {/* Orders */}
                  <Link
                    href="/supplies/my-orders"
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      pathname?.startsWith("/supplies/my-orders") || pathname?.startsWith("/supplies/orders")
                        ? "text-accent bg-accent/10"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                    aria-current={pathname?.startsWith("/supplies/my-orders") || pathname?.startsWith("/supplies/orders") ? "page" : undefined}
                  >
                    <ShoppingCart className="w-4 h-4" aria-hidden="true" />
                    <span>Orders</span>
                  </Link>

                  {/* Revenue */}
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
                      <span>Revenue</span>
                    </Link>
                  )}

                  {/* Analytics */}
                  {isFeatureEnabled('analytics') && (
                    <Link
                      href="/analytics"
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                        pathname?.startsWith("/analytics")
                          ? "text-accent bg-accent/10"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                      aria-current={pathname?.startsWith("/analytics") ? "page" : undefined}
                    >
                      <BarChart3 className="w-4 h-4" aria-hidden="true" />
                      <span>Analytics</span>
                    </Link>
                  )}
                </>
              )}

              {/* Instructor Role Subheader */}
              {roleView === 'instructor' && (
                <>
                  {/* Students */}
                  <Link
                    href="/academy/students"
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      pathname?.startsWith("/academy/students") || pathname?.startsWith("/students")
                        ? "text-accent bg-accent/10"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                    aria-current={pathname?.startsWith("/academy/students") || pathname?.startsWith("/students") ? "page" : undefined}
                  >
                    <Users className="w-4 h-4" aria-hidden="true" />
                    <span>Students</span>
                  </Link>

                  {/* Analytics */}
                  {isFeatureEnabled('analytics') && (
                    <Link
                      href="/analytics"
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                        pathname?.startsWith("/analytics")
                          ? "text-accent bg-accent/10"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                      aria-current={pathname?.startsWith("/analytics") ? "page" : undefined}
                    >
                      <BarChart3 className="w-4 h-4" aria-hidden="true" />
                      <span>Analytics</span>
                    </Link>
                  )}

                  {/* Earnings */}
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
                      <span>Earnings</span>
                    </Link>
                  )}
                </>
              )}

              {/* Agency Owner/Admin Role Subheader */}
              {(roleView === 'agency_owner' || roleView === 'agency_admin') && (
                <>
                  {/* Team Management */}
                  <Link
                    href="/agencies"
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      pathname?.startsWith("/agencies")
                        ? "text-accent bg-accent/10"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                    aria-current={pathname?.startsWith("/agencies") ? "page" : undefined}
                  >
                    <Users className="w-4 h-4" aria-hidden="true" />
                    <span>Team Management</span>
                  </Link>

                  {/* Agency Analytics */}
                  {isFeatureEnabled('analytics') && (
                    <Link
                      href="/analytics"
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                        pathname?.startsWith("/analytics")
                          ? "text-accent bg-accent/10"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                      aria-current={pathname?.startsWith("/analytics") ? "page" : undefined}
                    >
                      <BarChart3 className="w-4 h-4" aria-hidden="true" />
                      <span>Agency Analytics</span>
                    </Link>
                  )}

                  {/* Financials */}
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
                      <span>Financials</span>
                    </Link>
                  )}

                  {/* Agency Settings */}
                  <Link
                    href="/settings"
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      pathname?.startsWith("/settings")
                        ? "text-accent bg-accent/10"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                    aria-current={pathname?.startsWith("/settings") ? "page" : undefined}
                  >
                    <Settings className="w-4 h-4" aria-hidden="true" />
                    <span>Agency Settings</span>
                  </Link>
                </>
              )}

              {/* Admin Role Subheader */}
              {roleView === 'admin' && (
                <>
                  {/* Admin Dashboard */}
                  <Link
                    href="/admin"
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      pathname === "/admin" || pathname?.startsWith("/admin/dashboard")
                        ? "text-accent bg-accent/10"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                    aria-current={pathname === "/admin" || pathname?.startsWith("/admin/dashboard") ? "page" : undefined}
                  >
                    <Shield className="w-4 h-4" aria-hidden="true" />
                    <span>Admin Dashboard</span>
                  </Link>

                  {/* User Management */}
                  <Link
                    href="/admin/users"
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      pathname?.startsWith("/admin/users")
                        ? "text-accent bg-accent/10"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                    aria-current={pathname?.startsWith("/admin/users") ? "page" : undefined}
                  >
                    <Users className="w-4 h-4" aria-hidden="true" />
                    <span>User Management</span>
                  </Link>

                  {/* Platform Analytics */}
                  <Link
                    href="/admin/analytics"
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      pathname?.startsWith("/admin/analytics")
                        ? "text-accent bg-accent/10"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                    aria-current={pathname?.startsWith("/admin/analytics") ? "page" : undefined}
                  >
                    <BarChart3 className="w-4 h-4" aria-hidden="true" />
                    <span>Platform Analytics</span>
                  </Link>

                  {/* System Settings */}
                  <Link
                    href="/admin/settings"
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      pathname?.startsWith("/admin/settings")
                        ? "text-accent bg-accent/10"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                    aria-current={pathname?.startsWith("/admin/settings") ? "page" : undefined}
                  >
                    <Settings className="w-4 h-4" aria-hidden="true" />
                    <span>System Settings</span>
                  </Link>

                  {/* Audit Logs */}
                  <Link
                    href="/admin/logs"
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      pathname?.startsWith("/admin/logs")
                        ? "text-accent bg-accent/10"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                    aria-current={pathname?.startsWith("/admin/logs") ? "page" : undefined}
                  >
                    <FileText className="w-4 h-4" aria-hidden="true" />
                    <span>Audit Logs</span>
                  </Link>

                  {/* Error Monitoring */}
                  <Link
                    href="/admin/monitoring"
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      pathname?.startsWith("/admin/monitoring") || pathname?.startsWith("/admin/errors")
                        ? "text-accent bg-accent/10"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                    aria-current={pathname?.startsWith("/admin/monitoring") || pathname?.startsWith("/admin/errors") ? "page" : undefined}
                  >
                    <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                    <span>Error Monitoring</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Role Selection Modal */}
      <Modal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        title="Switch Role View"
        size="sm"
      >
        <div className="space-y-2">
          <p className="text-sm text-gray-600 mb-4">
            Select a role to switch your view. This changes what features and navigation items you see.
          </p>
          {userRoles.map((role) => {
            const RoleIcon = getRoleIcon(role);
            const isActive = roleView === role;
            
            return (
              <button
                key={role}
                onClick={() => {
                  setRoleView(role as "client" | "provider" | "supplier" | "instructor" | "agency_owner" | "agency_admin" | "admin");
                  setShowRoleModal(false);
                  // The useRoleView hook will automatically sync to backend
                  // Refresh page if on dashboard to update view
                  if (pathname?.startsWith('/dashboard')) {
                    router.refresh();
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-accent/10 text-accent border-2 border-accent'
                    : 'bg-gray-50 text-gray-700 border-2 border-transparent hover:bg-gray-100 hover:border-gray-200'
                }`}
                aria-label={`Switch to ${getRoleLabel(role)} view`}
                aria-pressed={isActive}
              >
                <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                  isActive
                    ? 'bg-accent text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  <RoleIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">{getRoleLabel(role)}</div>
                  {isActive && (
                    <div className="text-xs text-accent mt-0.5">Current view</div>
                  )}
                </div>
                {isActive && (
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-accent rounded-full"></div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Modal>

      {/* Feature Selection Modal */}
      <Modal
        isOpen={showFeatureModal}
        onClose={() => setShowFeatureModal(false)}
        title="Select Preferred Feature"
        size="md"
      >
        <div>
          {/* Current Preferred Feature Section */}
          {preferredFeature && (() => {
            const currentFeature = availableFeatures.find(f => f.id === preferredFeature);
            if (!currentFeature) return null;
            const CurrentFeatureIcon = currentFeature.icon;
            
            return (
              <div className="mb-6 p-4 bg-accent/5 border-2 border-accent/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${currentFeature.iconBgColor}`}>
                      <CurrentFeatureIcon className={`w-6 h-6 ${currentFeature.iconTextColor}`} />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-gray-900">Current Preferred Feature</div>
                      <div className="text-sm font-semibold text-accent">{currentFeature.name}</div>
                      <div className="text-xs text-gray-600 mt-0.5">{currentFeature.description}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      clearPreferredFeature();
                      setShowFeatureModal(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                    aria-label="Remove preferred feature"
                  >
                    <X className="w-4 h-4" />
                    Remove
                  </button>
                </div>
              </div>
            );
          })()}

          <p className="text-sm text-gray-600 mb-4">
            {preferredFeature 
              ? "Choose a different feature or keep your current preference."
              : "Choose your preferred feature for quick access. This will be your default landing page."
            }
          </p>
          
          <div className="grid grid-cols-3 gap-3">
            {availableFeatures.map((feature) => {
              const FeatureIcon = feature.icon;
              const isActive = preferredFeature === feature.id;
              
              return (
                <button
                  key={feature.id}
                  onClick={() => {
                    setPreferredFeature(feature.id);
                    setShowFeatureModal(false);
                    // The usePackageSwitcher hook will automatically sync to backend
                    // Navigate to the feature route
                    router.push(feature.route);
                  }}
                  className={`flex flex-col items-center justify-center gap-2 px-3 py-4 rounded-lg transition-all relative ${
                    isActive
                      ? 'bg-accent/10 text-accent border-2 border-accent'
                      : 'bg-gray-50 text-gray-700 border-2 border-transparent hover:bg-gray-100 hover:border-gray-200'
                  }`}
                  aria-label={`Select ${feature.name} as preferred feature`}
                  aria-pressed={isActive}
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-sm ${
                    isActive
                      ? 'bg-accent text-white'
                      : `${feature.iconBgColor} ${feature.iconTextColor}`
                  }`}>
                    <FeatureIcon className="w-7 h-7" />
                  </div>
                  <div className="text-center w-full">
                    <div className="font-medium text-sm">{feature.name}</div>
                    <div className={`text-xs mt-1 ${isActive ? 'text-accent' : 'text-gray-500'}`}>
                      {feature.description}
                    </div>
                    {isActive && (
                      <div className="text-xs text-accent font-medium mt-1">Selected</div>
                    )}
                  </div>
                  {isActive && (
                    <div className="absolute top-2 right-2">
                      <div className="w-2.5 h-2.5 bg-accent rounded-full shadow-sm"></div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </Modal>
    </header>
  );
}

