"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Plus,
  MapPin,
  Star,
  Calendar,
  X,
  Building2,
  CheckCircle2,
  Zap,
  Headphones,
  HelpCircle,
  ClipboardList,
  Heart,
  Filter,
  Grid3x3,
  List,
  ArrowUp,
  ArrowDown,
  Tag,
  DollarSign,
  Clock
} from "lucide-react";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { logger } from "@/lib/logger";
import { formatCurrency } from "@/lib/currency-utils";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useRoleAccess } from "@/components/role-guard";
import { Broadcaster } from "@/components/broadcaster";

export interface Rental {
  id: string;
  name: string;
  description: string;
  category: string;
  type: 'equipment' | 'vehicle' | 'space' | 'tool';
  status: 'available' | 'rented' | 'maintenance' | 'unavailable';
  price: number;
  priceUnit: 'hour' | 'day' | 'week' | 'month';
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  images: string[];
  features: string[];
  specifications: {
    brand?: string;
    model?: string;
    year?: number;
    condition: 'excellent' | 'good' | 'fair' | 'poor';
    capacity?: string;
    dimensions?: string;
    weight?: string;
  };
  owner: {
    id: string;
    name: string;
    avatar?: string;
    rating: number;
    reviewCount: number;
    verified: boolean;
  };
  availability: {
    startDate: string;
    endDate: string;
    isAvailable: boolean;
  };
  rating: number;
  reviewCount: number;
  viewsCount: number;
  isFeatured: boolean;
  isFavorited: boolean;
  createdAt: string;
  updatedAt: string;
}

const types = [
  { value: 'All Types', label: 'All Types' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'space', label: 'Space' },
  { value: 'tool', label: 'Tool' }
];

const popularCategories = ['Construction', 'Vehicles', 'Office Space', 'Power Tools', 'Events'];

const rentalTips = [
  "Check availability before booking",
  "Read reviews from previous renters",
  "Verify the condition upon pickup"
];

export default function RentalsPage() {
  const { settings: appSettings } = useAppSettings();
  const { isProvider, isAdmin, isClient } = useRoleAccess();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedType, setSelectedType] = useState("All Types");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [location, setLocation] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("relevance");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const itemsPerPage = 12;
  const router = useRouter();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const fetchRentals = async () => {
      try {
        setLoading(true);
        // Rentals is PUBLIC endpoint
        const url = `${API_BASE_URL}${API_ENDPOINTS.rentals}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch rentals');
        }

        const data = await response.json();
        setRentals(data.rentals || []);
      } catch (error) {
        logger.error('Error fetching rentals', error instanceof Error ? error : new Error(String(error)));
        // Fallback to mock data
        setRentals([
          {
            id: '1',
            name: 'Professional Excavator - CAT 320',
            description: 'Heavy-duty excavator perfect for construction projects. Well-maintained and ready for immediate use.',
            category: 'Construction Equipment',
            type: 'equipment',
            status: 'available',
            price: 150,
            priceUnit: 'day',
            location: {
              address: '123 Construction Way',
              city: 'New York',
              state: 'NY',
              zipCode: '10001'
            },
            images: ['https://via.placeholder.com/400x300', 'https://via.placeholder.com/400x300'],
            features: ['Air Conditioning', 'GPS Tracking', 'Safety Equipment', 'Fuel Efficient'],
            specifications: {
              brand: 'Caterpillar',
              model: '320',
              year: 2020,
              condition: 'excellent',
              capacity: '20 tons',
              dimensions: '25ft x 8ft x 10ft',
              weight: '20,000 lbs'
            },
            owner: {
              id: '1',
              name: 'Heavy Equipment Rentals',
              rating: 4.8,
              reviewCount: 124,
              verified: true
            },
            availability: {
              startDate: new Date().toISOString(),
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              isAvailable: true
            },
            rating: 4.8,
            reviewCount: 24,
            viewsCount: 156,
            isFeatured: true,
            isFavorited: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '2',
            name: 'Pickup Truck - Ford F-150',
            description: 'Reliable pickup truck for transportation and light hauling. Perfect for small businesses.',
            category: 'Vehicles',
            type: 'vehicle',
            status: 'available',
            price: 75,
            priceUnit: 'day',
            location: {
              address: '456 Main Street',
              city: 'Los Angeles',
              state: 'CA',
              zipCode: '90210'
            },
            images: ['https://via.placeholder.com/400x300'],
            features: ['4WD', 'Air Conditioning', 'Bluetooth', 'Backup Camera'],
            specifications: {
              brand: 'Ford',
              model: 'F-150',
              year: 2021,
              condition: 'good',
              capacity: '5 passengers',
              dimensions: '19ft x 6ft x 6ft',
              weight: '4,500 lbs'
            },
            owner: {
              id: '2',
              name: 'City Vehicle Rentals',
              rating: 4.5,
              reviewCount: 89,
              verified: true
            },
            availability: {
              startDate: new Date().toISOString(),
              endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              isAvailable: true
            },
            rating: 4.5,
            reviewCount: 18,
            viewsCount: 98,
            isFeatured: false,
            isFavorited: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '3',
            name: 'Office Space - Downtown',
            description: 'Modern office space in downtown area. Perfect for meetings, events, or temporary workspace.',
            category: 'Office Space',
            type: 'space',
            status: 'available',
            price: 200,
            priceUnit: 'day',
            location: {
              address: '789 Business Plaza',
              city: 'Chicago',
              state: 'IL',
              zipCode: '60601'
            },
            images: ['https://via.placeholder.com/400x300', 'https://via.placeholder.com/400x300', 'https://via.placeholder.com/400x300'],
            features: ['WiFi', 'Parking', 'Kitchen', 'Meeting Rooms', 'Air Conditioning'],
            specifications: {
              condition: 'excellent',
              capacity: '20 people',
              dimensions: '1000 sq ft',
              weight: 'N/A'
            },
            owner: {
              id: '3',
              name: 'Downtown Spaces',
              rating: 4.9,
              reviewCount: 67,
              verified: true
            },
            availability: {
              startDate: new Date().toISOString(),
              endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              isAvailable: true
            },
            rating: 4.9,
            reviewCount: 12,
            viewsCount: 45,
            isFeatured: false,
            isFavorited: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchRentals();
  }, []);

  const filteredRentals = useMemo(() => {
    return rentals.filter(rental => {
      const matchesSearch = !debouncedSearch || 
                           rental.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                           rental.description.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                           rental.category.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesType = selectedType === "All Types" || rental.type === selectedType;
      const matchesLocation = !location || rental.location.city.toLowerCase().includes(location.toLowerCase()) ||
                             rental.location.state.toLowerCase().includes(location.toLowerCase());
      const matchesPrice = (!priceRange.min || rental.price >= parseFloat(priceRange.min)) &&
                       (!priceRange.max || rental.price <= parseFloat(priceRange.max));
      
      return matchesSearch && matchesType && matchesLocation && matchesPrice;
    });
  }, [rentals, debouncedSearch, selectedType, location, priceRange]);

  // Calculate active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedType !== "All Types") count++;
    if (location) count++;
    if (priceRange.min || priceRange.max) count++;
    if (dateFrom || dateTo) count++;
    return count;
  }, [selectedType, location, priceRange, dateFrom, dateTo]);

  // Normalize currency to PHP only
  const normalizeCurrencyCode = (_currency: string | undefined | null): string => {
    // Always return PHP as the only supported currency
    void _currency;
    return 'PHP';
  };

  const formatPrice = (price: number, currency: string = 'PHP') => {
    const currencyCode = normalizeCurrencyCode(currency);
    return formatCurrency(price, currencyCode, {
      appSettings,
      showSymbol: true,
    });
  };

  const clearFilters = () => {
    setSelectedType("All Types");
    setLocation("");
    setPriceRange({ min: "", max: "" });
    setDateFrom("");
    setDateTo("");
    setSearchQuery("");
    setDebouncedSearch("");
    setCurrentPage(1);
  };

  const sortedRentals = useMemo(() => {
    const sorted = [...filteredRentals];
    
    let result: Rental[];
    switch (sortBy) {
      case 'newest':
        result = sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        result = sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'price-low':
        result = sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result = sorted.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result = sorted.sort((a, b) => b.rating - a.rating);
        break;
      default:
        result = sorted;
    }
    
    // Apply sort order
    if (sortOrder === "asc" && sortBy !== "relevance") {
      result = result.reverse();
    }
    
    return result;
  }, [filteredRentals, sortBy, sortOrder]);

  // Pagination logic
  const paginatedRentals = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedRentals.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedRentals, currentPage]);

  const totalPages = Math.ceil(sortedRentals.length / itemsPerPage);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleCreateRental = () => {
    router.push('/rentals/create');
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleViewRental = (rentalId: string) => {
    router.push(`/rentals/${rentalId}`);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleEditRental = (rentalId: string) => {
    router.push(`/rentals/${rentalId}/edit`);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleToggleFavorite = async (rentalId: string) => {
    // Implement favorite toggle
    logger.debug('Toggle favorite for rental', { rentalId });
  };

  // Get featured rentals
  const featuredRentals = useMemo(() => {
    return sortedRentals.filter(r => r.isFeatured);
  }, [sortedRentals]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-accent/10/30 relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float animation-delay-4000"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Header Skeleton */}
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="h-12 bg-gray-200 rounded-lg w-full mb-4"></div>
            <div className="flex gap-3">
              <div className="h-10 bg-gray-200 rounded-lg w-32"></div>
              <div className="h-10 bg-gray-200 rounded-lg w-32"></div>
              <div className="h-10 bg-gray-200 rounded-lg w-32"></div>
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-64 flex-shrink-0">
              <div className="bg-white rounded-xl border-2 border-gray-200 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-10 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border-2 border-gray-200 p-6 animate-pulse">
                    <div className="space-y-4">
                      <div className="h-48 bg-gray-200 rounded-lg"></div>
                      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-accent/10/30 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float animation-delay-4000"></div>
      </div>

      <div className="relative z-0">
        {/* Broadcaster - Only shown for clients */}
        <Broadcaster />

        {/* Header Section - Following Reference Layout */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Rentals — Equipment, Spaces & More
              </h1>
              <p className="text-gray-600">
                Verified providers, flexible durations, and LocalPro support for every rental.
              </p>
            </div>
            {(isAdmin || isProvider) && (
              <button
                onClick={handleCreateRental}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-accent to-accent/90 rounded-lg hover:from-accent/90 hover:to-accent transition-all shadow-lg shadow-accent/30 hover:shadow-xl hover:scale-105 flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
                List Rental
              </button>
            )}
          </div>
        </div>

        {/* Quick Links Row */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 border-b border-gray-200 pb-4">
            <Link 
              href="/rentals/my-rentals" 
              className="inline-flex items-center gap-2 text-gray-600 hover:text-accent transition-colors group"
            >
              <ClipboardList className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">My Rentals</span>
            </Link>
            <Link 
              href="/rentals/favorites" 
              className="inline-flex items-center gap-2 text-gray-600 hover:text-accent transition-colors group"
            >
              <Heart className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Favorites</span>
            </Link>
            <Link 
              href="/rentals/verified" 
              className="inline-flex items-center gap-2 text-gray-600 hover:text-accent transition-colors group"
            >
              <CheckCircle2 className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Verified Providers</span>
            </Link>
            <Link 
              href="/support" 
              className="inline-flex items-center gap-2 text-gray-600 hover:text-accent transition-colors group"
            >
              <Headphones className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Support</span>
            </Link>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Left Sidebar - Filters */}
            <>
              {/* Mobile Filter Drawer Overlay */}
              {isFilterDrawerOpen && (
                <div
                  className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                  onClick={() => setIsFilterDrawerOpen(false)}
                />
              )}

              {/* Filter Sidebar */}
              <aside
                className={`bg-white rounded-2xl shadow-lg border border-gray-100 lg:w-[280px] flex-shrink-0 lg:sticky lg:top-24 ${
                  isFilterDrawerOpen
                    ? "fixed right-0 top-0 h-full w-80 z-50 lg:relative lg:w-[280px] lg:h-auto"
                    : "hidden lg:block"
                }`}
              >
                {/* Header Section */}
                <div className="bg-gradient-to-r from-accent/10 to-emerald-50 px-6 py-4 border-b border-accent/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-md">
                        <Filter className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                        <p className="text-xs text-gray-600">Refine your search</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsFilterDrawerOpen(false)}
                      className="lg:hidden text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Filter Content Area */}
                <div className="p-6 space-y-8">
                  {/* Type Filter */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-accent" />
                      <label className="text-sm font-semibold text-gray-900">Type</label>
                    </div>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    >
                      {types.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Location Filter */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-accent" />
                      <label className="text-sm font-semibold text-gray-900">Location</label>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Enter location..."
                        className="w-full px-4 py-2.5 pr-11 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                      />
                      <button
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-accent text-white hover:bg-accent/90 flex items-center justify-center transition-colors"
                        title="Detect location"
                      >
                        <MapPin className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Price Range */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-accent" />
                      <label className="text-sm font-semibold text-gray-900">Price Range</label>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={priceRange.min}
                        onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                        placeholder="Min"
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                      />
                      <span className="self-center text-gray-500">-</span>
                      <input
                        type="number"
                        value={priceRange.max}
                        onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                        placeholder="Max"
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* Dates Filter */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-accent" />
                      <label className="text-sm font-semibold text-gray-900">Dates</label>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">From</label>
                        <input
                          type="date"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">To</label>
                        <input
                          type="date"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Clear Filters */}
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 border-2 border-transparent hover:border-gray-300 transition-all flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Clear Filters
                    </button>
                  )}
                </div>

                {/* Want to List Rentals - for clients */}
                {isClient && !isProvider && !isAdmin && (
                  <div className="px-6 pb-6">
                    <div className="bg-gradient-to-br from-accent/10 to-emerald-50 rounded-lg p-4 border border-accent/20">
                      <div className="flex items-start gap-3 mb-3">
                        <Building2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">Want to List Rentals?</h3>
                          <p className="text-xs text-gray-600 mt-1">Upgrade to a provider account to list your equipment.</p>
                        </div>
                      </div>
                      <Link
                        href="/plus?upgrade=provider"
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-all shadow-sm hover:shadow-md font-medium text-sm"
                      >
                        Upgrade Now
                      </Link>
                    </div>
                  </div>
                )}

                {/* Popular Categories */}
                <div className="px-6 pb-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Popular Categories</h2>
                  <div className="flex flex-wrap gap-2">
                    {popularCategories.map((category) => (
                      <button
                        key={category}
                        onClick={() => setSearchQuery(category)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                          searchQuery === category
                            ? "bg-accent text-white border-accent"
                            : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rental Tips */}
                <div className="px-6 pb-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Rental tips</h2>
                  <ul className="space-y-3">
                    {rentalTips.map((tip, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-accent mt-1">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Need Help Section */}
                <div className="px-6 pb-6">
                  <div className="bg-gradient-to-br from-accent/10 to-emerald-50 rounded-lg p-4 border border-accent/20">
                    <div className="flex items-start gap-3 mb-3">
                      <HelpCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">Need Help?</h3>
                        <p className="text-xs text-gray-600 mt-1">Our team is here to help you find the right rental.</p>
                      </div>
                    </div>
                    <Link
                      href="/support"
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-accent rounded-lg hover:bg-accent/10 transition-all border border-accent/20 font-medium text-sm"
                    >
                      <Zap className="w-4 h-4" />
                      Contact Support
                    </Link>
                  </div>
                </div>
              </aside>
            </>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0 space-y-6">
              {/* Mobile Filters Button */}
              <button
                onClick={() => setIsFilterDrawerOpen(true)}
                className="lg:hidden w-full px-4 py-3 bg-white rounded-lg border border-gray-200 shadow-sm flex items-center justify-center gap-2 text-gray-700 font-medium hover:bg-gray-50"
              >
                <Filter className="w-4 h-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="px-2 py-0.5 bg-accent text-white text-xs font-medium rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* Unified Controls Bar */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {/* Search - 70% */}
                  <div className="w-full sm:w-[70%] relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <Search className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search equipment, tools, spaces, or providers"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-9 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Sort - 20% */}
                  <div className="w-full sm:w-[20%] flex items-center gap-1.5">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="flex-1 px-3 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-white"
                    >
                      <option value="relevance">Relevance</option>
                      <option value="newest">Date</option>
                      <option value="price-low">Price</option>
                      <option value="rating">Rating</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                      className="flex-shrink-0 w-10 h-10 flex items-center justify-center border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      title={sortOrder === "asc" ? "Ascending" : "Descending"}
                    >
                      {sortOrder === "asc" ? (
                        <ArrowUp className="w-4 h-4 text-gray-600" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  </div>

                  {/* Display Mode - 10% */}
                  <div className="w-full sm:w-[10%] flex items-center justify-end">
                    <div className="bg-gray-100 rounded-lg p-1 flex items-center gap-1">
                      <button
                        onClick={() => setViewMode("grid")}
                        className={`p-1.5 rounded transition-all ${
                          viewMode === "grid"
                            ? "bg-white text-accent shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                        title="Grid view"
                      >
                        <Grid3x3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode("list")}
                        className={`p-1.5 rounded transition-all ${
                          viewMode === "list"
                            ? "bg-white text-accent shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                        title="List view"
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Results Count */}
              <div className="text-sm text-gray-600">
                {sortedRentals.length > 0 ? (
                  <>
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedRentals.length)} of {sortedRentals.length} results
                  </>
                ) : (
                  <>No results found</>
                )}
              </div>

              {/* Featured Rentals Section */}
              {featuredRentals.length > 0 && (
                <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="w-5 h-5 text-yellow-500 fill-current" />
                    <h2 className="text-lg font-bold text-gray-900">Featured Rentals</h2>
                  </div>
                  <div className={viewMode === "grid" 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    : "space-y-4"
                  }>
                    {featuredRentals.slice(0, 3).map((rental) => (
                      <RentalCard 
                        key={rental.id} 
                        rental={rental} 
                        formatPrice={formatPrice} 
                        featured 
                        viewMode={viewMode}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Rentals Results */}
              {sortedRentals.length === 0 ? (
                <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-8">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-accent/20 to-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-accent/20">
                      <Calendar className="w-8 h-8 text-accent" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No rentals found</h3>
                    <p className="text-gray-600 mb-6">
                      {debouncedSearch || activeFiltersCount > 0
                        ? "Try adjusting your filters to see more results."
                        : "Get started by listing your first rental item."}
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      {activeFiltersCount > 0 && (
                        <button
                          onClick={clearFilters}
                          className="px-6 py-3 bg-gradient-to-r from-accent to-accent/90 text-white rounded-lg hover:from-accent/90 hover:to-accent transition-all shadow-lg shadow-accent/30 hover:shadow-xl hover:scale-105 font-semibold"
                        >
                          Clear Filters
                        </button>
                      )}
                      {(isAdmin || isProvider) && (
                        <button
                          onClick={handleCreateRental}
                          className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all shadow-sm hover:shadow-md font-medium"
                        >
                          List Your First Rental
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className={viewMode === "grid" 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    : "space-y-4"
                  }>
                    {paginatedRentals.map((rental) => (
                      <RentalCard 
                        key={rental.id} 
                        rental={rental} 
                        formatPrice={formatPrice} 
                        viewMode={viewMode}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-gray-600">
                          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedRentals.length)} of {sortedRentals.length} results
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Previous
                          </button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNum: number;
                              if (totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                              } else {
                                pageNum = currentPage - 2 + i;
                              }
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => handlePageChange(pageNum)}
                                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                    currentPage === pageNum
                                      ? "bg-accent text-white"
                                      : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                          </div>
                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Rental Card Component
interface RentalCardProps {
  rental: Rental;
  formatPrice: (price: number, currency?: string) => string;
  featured?: boolean;
  viewMode?: 'grid' | 'list';
}

const RentalCard = React.memo(function RentalCard({ rental, formatPrice, featured = false, viewMode = 'grid' }: RentalCardProps) {
  const rentalId = rental.id;
  
  if (viewMode === 'list') {
    return (
      <Link
        href={`/rentals/${rentalId}`}
        className={`group bg-white rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-lg hover:border-accent/30 transition-all duration-300 overflow-hidden flex flex-row items-stretch ${
          featured ? "ring-2 ring-yellow-400" : ""
        }`}
      >
        {/* Image - Left Side */}
        <div className="relative w-64 flex-shrink-0">
          {rental.images.length > 0 ? (
            <div className="w-full h-full bg-gray-100 overflow-hidden">
              <Image
                src={rental.images[0]}
                alt={rental.name}
                width={256}
                height={200}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <Building2 className="w-12 h-12 text-gray-400" />
            </div>
          )}
          {featured && (
            <div className="absolute top-2 left-2">
              <span className="px-2 py-1 bg-yellow-500 text-white rounded text-xs font-bold flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" />
                Featured
              </span>
            </div>
          )}
        </div>

        {/* Content - Right Side */}
        <div className="flex-1 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-accent transition-colors line-clamp-1">
                {rental.name}
              </h3>
              <span className="px-3 py-1 bg-accent/10 text-accent rounded-lg text-sm font-bold flex-shrink-0 ml-4">
                {formatPrice(rental.price)}/{rental.priceUnit}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {rental.description}
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {rental.location.city}, {rental.location.state}
              </span>
              <span>{rental.owner.name}</span>
              {rental.specifications.capacity && (
                <span>{rental.specifications.capacity}</span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="text-sm font-semibold text-gray-700">{rental.rating}</span>
              <span className="text-xs text-gray-500">({rental.reviewCount})</span>
            </div>
            {rental.owner.verified && (
              <span className="flex items-center gap-1 text-xs text-accent">
                <CheckCircle2 className="w-4 h-4" />
                Verified
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // Grid view
  return (
    <Link
      href={`/rentals/${rentalId}`}
      className={`group bg-white rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-lg hover:border-accent/30 transition-all duration-300 overflow-hidden flex flex-col ${
        featured ? "ring-2 ring-yellow-400" : ""
      }`}
    >
      <div className="relative">
        {rental.images.length > 0 ? (
          <div className="aspect-video bg-gray-100 overflow-hidden">
            <Image
              src={rental.images[0]}
              alt={rental.name}
              width={400}
              height={225}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <Building2 className="w-12 h-12 text-gray-400" />
          </div>
        )}
        {featured && (
          <div className="absolute top-2 left-2">
            <span className="px-2 py-1 bg-yellow-500 text-white rounded text-xs font-bold flex items-center gap-1">
              <Star className="w-3 h-3 fill-current" />
              Featured
            </span>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-sm font-bold text-gray-900 shadow-md">
            {formatPrice(rental.price)}/{rental.priceUnit}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-accent transition-colors">
          {rental.name}
        </h3>
        <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {rental.location.city}, {rental.location.state}
        </p>
        <p className="text-xs text-gray-600 mb-3 line-clamp-1">
          {rental.owner.name} • {rental.specifications.capacity || 'N/A'}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span className="text-sm font-semibold text-gray-700">{rental.rating}</span>
            <span className="text-xs text-gray-500">({rental.reviewCount})</span>
          </div>
          {rental.owner.verified && (
            <span className="flex items-center gap-1 text-xs text-accent">
              <CheckCircle2 className="w-3 h-3" />
              Verified
            </span>
          )}
        </div>
      </div>
    </Link>
  );
});
