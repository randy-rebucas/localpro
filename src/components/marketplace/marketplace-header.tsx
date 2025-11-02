"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "@/hooks/useAuth";
import { Logo } from "@/components/ui/logo";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import {
  Search,
  Bell,
  Heart,
  ShoppingCart,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Loader2,
} from "lucide-react";

export function MarketplaceHeader() {
  const { data: session } = useSession();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<Array<{ label: string; type: string; id: string }>>([]);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message: string; isRead: boolean; createdAt: string }>>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const favoritesRef = useRef<HTMLDivElement>(null);
  const cartRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLFormElement>(null);

  // Load favorites and cart count
  useEffect(() => {
    const updateCounts = () => {
      try {
        // Load favorites from localStorage (no API endpoint available for favorites)
        const favoriteServices = JSON.parse(localStorage.getItem('favoriteServices') || '[]');
        const favoriteProviders = JSON.parse(localStorage.getItem('favoriteProviders') || '[]');
        const favoriteCourses = JSON.parse(localStorage.getItem('favoriteCourses') || '[]');
        const favoriteSupplies = JSON.parse(localStorage.getItem('favoriteSupplies') || '[]');
        const totalFavorites = favoriteServices.length + favoriteProviders.length + favoriteCourses.length + favoriteSupplies.length;
        setFavoritesCount(totalFavorites);

        // Cart is not implemented yet, so we skip it as requested
        // const cart = JSON.parse(localStorage.getItem('cart') || '{"items":[]}');
        // setCartCount(cart.items?.length || 0);
      } catch (error) {
        logger.error('Error loading counts', error instanceof Error ? error : new Error(String(error)));
        setFavoritesCount(0);
        setCartCount(0);
      }
    };

    updateCounts();
    // Update counts when localStorage changes (via storage event)
    const handleStorageChange = () => updateCounts();
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events that might be dispatched when favorites change
    window.addEventListener('favoritesUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('favoritesUpdated', handleStorageChange);
    };
  }, []);

  // Fetch unread notification count on mount and periodically
  useEffect(() => {
    if (!session || !getApiToken()) return;

    const fetchUnreadCount = async () => {
      try {
        const url = `${API_BASE_URL}${API_ENDPOINTS.communicationNotificationCount}?isRead=false`;
        const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));

        if (response.ok) {
          const data = await response.json();
          const count = data?.data?.count || data?.count || 0;
          setUnreadCount(count);
        }
      } catch (error) {
        logger.error('Error fetching notification count', error instanceof Error ? error : new Error(String(error)));
      }
    };

    fetchUnreadCount();
    // Refresh count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [session]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!session || !getApiToken()) return; // Don't fetch if not authenticated
      
      try {
        setLoadingNotifications(true);
        const url = `${API_BASE_URL}${API_ENDPOINTS.communicationNotifications}?limit=5&page=1`;
        const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));

        if (response.ok) {
          const data = await response.json();
          const notificationsData = data?.data?.notifications || data?.notifications || data?.data || [];
          setNotifications(Array.isArray(notificationsData) ? notificationsData.slice(0, 5) : []); // Show latest 5
        } else {
          // If request fails, reset notifications
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
        // Search suggestions is PUBLIC endpoint, so we can use direct fetch
        const queryString = new URLSearchParams({ q: searchQuery }).toString();
        const url = `${API_BASE_URL}${API_ENDPOINTS.searchSuggestions}?${queryString}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          const suggestions = data?.data?.suggestions || data?.suggestions || [];
          setSearchSuggestions(suggestions.slice(0, 5));
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
      if (favoritesRef.current && !favoritesRef.current.contains(event.target as Node)) {
        setShowFavorites(false);
      }
      if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
        setShowCart(false);
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

  const handleNotificationClick = async (notificationId: string) => {
    if (!getApiToken()) return;
    
    try {
      // Replace [id] placeholder with actual notification ID
      const endpoint = API_ENDPOINTS.communicationNotificationsRead.replace('[id]', notificationId);
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'PUT' }));
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      router.push('/dashboard/notifications');
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

  return (
    <header className="bg-white border-b-2 border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <div className="flex items-center space-x-4">
            <Logo href="/" withText={false} size={32} />
            <span className="hidden sm:block text-xl font-bold text-gray-900">LocalPro</span>
          </div>

          {/* Center: Search Bar - Hidden on mobile */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <form onSubmit={handleSearch} className="relative w-full" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
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
                placeholder="Search services, products, courses..."
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition"
              />
              
              {/* Search Suggestions */}
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
                        className="w-full text-left px-4 py-2 hover:bg-green-50 transition-colors border-t border-gray-200 text-green-600 font-medium"
                      >
                        View all results for &quot;{searchQuery}&quot;
                      </button>
                    </>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-3">
            {/* Mobile Search Icon */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle search"
            >
              <Search className="w-5 h-5 text-gray-600" />
            </button>

            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border-2 border-gray-200 z-50">
                  <div className="p-3 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800 text-sm">Notifications</h3>
                    <Link
                      href="/dashboard/notifications"
                      className="text-xs text-green-600 hover:text-green-700 font-medium"
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
                          onClick={() => handleNotificationClick(notification.id)}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                            !notification.isRead ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <div className={`flex-1 ${!notification.isRead ? 'font-semibold' : ''}`}>
                              <p className="text-sm text-gray-900">{notification.title}</p>
                              <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                            </div>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
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

            {/* Favorites */}
            <div className="relative hidden sm:block" ref={favoritesRef}>
              <Link
                href="/dashboard/favorites"
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                onMouseEnter={() => setShowFavorites(true)}
                onMouseLeave={() => setShowFavorites(false)}
              >
                <Heart className="w-5 h-5 text-gray-600" />
                {favoritesCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                    {favoritesCount > 9 ? '9+' : favoritesCount}
                  </span>
                )}
              </Link>
              {showFavorites && favoritesCount > 0 && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border-2 border-gray-200 z-50 p-2">
                  <p className="text-xs text-gray-600">You have {favoritesCount} favorite{favoritesCount !== 1 ? 's' : ''}</p>
                </div>
              )}
            </div>

            {/* Cart */}
            <div className="relative hidden sm:block" ref={cartRef}>
              <Link
                href="/dashboard/cart"
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                onMouseEnter={() => setShowCart(true)}
                onMouseLeave={() => setShowCart(false)}
              >
                <ShoppingCart className="w-5 h-5 text-gray-600" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-600 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>
              {showCart && cartCount > 0 && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border-2 border-gray-200 z-50 p-2">
                  <p className="text-xs text-gray-600">{cartCount} item{cartCount !== 1 ? 's' : ''} in cart</p>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="hidden lg:block text-sm font-medium text-gray-700">
                  {getUserDisplayName()}
                </span>
                <ChevronDown className="hidden lg:block w-4 h-4 text-gray-500" />
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border-2 border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-900">{getUserDisplayName()}</p>
                    <p className="text-xs text-gray-500">{session?.user?.email || session?.user?.phone}</p>
                  </div>
                  <Link
                    href="/profile"
                    className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User className="w-4 h-4" />
                    <span>My Profile</span>
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <form onSubmit={handleSearch} className="relative" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
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
                placeholder="Search services, products, courses..."
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition"
              />
              
              {/* Mobile Search Suggestions */}
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
                        className="w-full text-left px-4 py-2 hover:bg-green-50 transition-colors border-t border-gray-200 text-green-600 font-medium"
                      >
                        View all results for &quot;{searchQuery}&quot;
                      </button>
                    </>
                  )}
                </div>
              )}
            </form>
            {/* Mobile Menu Items */}
            <div className="mt-4 space-y-2">
              <Link 
                href="/dashboard" 
                className="block py-2 text-gray-700 hover:text-green-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link 
                href="/marketplace" 
                className="block py-2 text-gray-700 hover:text-green-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Marketplace
              </Link>
              <Link 
                href="/academy" 
                className="block py-2 text-gray-700 hover:text-green-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Academy
              </Link>
              {session && (
                <>
                  <Link 
                    href="/dashboard/favorites" 
                    className="block py-2 text-gray-700 hover:text-green-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Favorites {favoritesCount > 0 && `(${favoritesCount})`}
                  </Link>
                  <Link 
                    href="/dashboard/notifications" 
                    className="block py-2 text-gray-700 hover:text-green-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Notifications {unreadCount > 0 && `(${unreadCount})`}
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

