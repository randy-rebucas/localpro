"use client";

import { useState, useEffect, useMemo } from "react";
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
  Heart
} from "lucide-react";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { logger } from "@/lib/logger";
import { formatCurrency } from "@/lib/currency-utils";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useRoleAccess } from "@/components/role-guard";

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

const sortOptions = [
  { value: "relevance", label: "Relevance" },
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
];

export default function RentalsPage() {
  const { settings: appSettings } = useAppSettings();
  const { isProvider, isAdmin, isClient } = useRoleAccess();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All Types");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [location, setLocation] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("relevance");
  const router = useRouter();

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
      const matchesSearch = rental.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           rental.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           rental.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === "All Types" || rental.type === selectedType;
      const matchesLocation = !location || rental.location.city.toLowerCase().includes(location.toLowerCase()) ||
                             rental.location.state.toLowerCase().includes(location.toLowerCase());
      const matchesPrice = (!priceRange.min || rental.price >= parseFloat(priceRange.min)) &&
                       (!priceRange.max || rental.price <= parseFloat(priceRange.max));
      
      return matchesSearch && matchesType && matchesLocation && matchesPrice;
    });
  }, [rentals, searchQuery, selectedType, location, priceRange]);

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
  };

  const sortedRentals = useMemo(() => {
    const sorted = [...filteredRentals];
    
    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'price-low':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price-high':
        return sorted.sort((a, b) => b.price - a.price);
      case 'rating':
        return sorted.sort((a, b) => b.rating - a.rating);
      default:
        return sorted;
    }
  }, [filteredRentals, sortBy]);

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

  const regularRentals = useMemo(() => {
    return sortedRentals.filter(r => !r.isFeatured);
  }, [sortedRentals]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-emerald-100/20 rounded-full blur-3xl animate-float animation-delay-4000"></div>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-emerald-100/20 rounded-full blur-3xl animate-float animation-delay-4000"></div>
      </div>

      <div className="relative z-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-2">
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
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105 flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
                List Rental
              </button>
            )}
          </div>
        </div>

        {/* Subheader - Feature Links */}
        <div className="mb-6 flex items-center gap-6 border-b border-gray-200 pb-4">
          <Link 
            href="/rentals/my-rentals" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors group"
          >
            <ClipboardList className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">My Rentals</span>
          </Link>
          <Link 
            href="/rentals/favorites" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors group"
          >
            <Heart className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">Favorites</span>
          </Link>
          <Link 
            href="/rentals/verified" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors group"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">Verified Providers</span>
          </Link>
          <Link 
            href="/support" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors group"
          >
            <Headphones className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">Support</span>
          </Link>
        </div>
          
        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search equipment, tools, spaces, or providers"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Main Content Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar - Filters */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6 space-y-6 sticky top-24">
              {/* Filters Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                  {activeFiltersCount > 0 && (
                    <span className="px-2 py-0.5 bg-emerald-600 text-white text-xs font-medium rounded-full">
                      {activeFiltersCount}
                    </span>
                  )}
                </div>
                
                {/* Type Filter */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white font-medium"
                  >
                    {types.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                {/* Location Filter */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City or state"
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                  />
                </div>

                {/* Price Range */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Price Range</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                      placeholder="Min"
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                    />
                    <span className="self-center text-gray-500">-</span>
                    <input
                      type="number"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                      placeholder="Max"
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                    />
                  </div>
                </div>

                {/* Dates Filter */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Dates</label>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">From</label>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">To</label>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Clear Filters */}
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              {/* Want to List Rentals - for clients */}
              {isClient && !isProvider && !isAdmin && (
                <div className="pt-6 border-t-2 border-gray-200">
                  <div className="bg-gradient-to-br from-emerald-50 to-accent/10 rounded-lg p-4 border border-emerald-200">
                    <div className="flex items-start gap-3 mb-3">
                      <Building2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">Want to List Rentals?</h3>
                        <p className="text-xs text-gray-600 mt-1">Upgrade to a provider account to list your equipment.</p>
                      </div>
                    </div>
                    <Link
                      href="/plus?upgrade=provider"
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-sm hover:shadow-md font-medium text-sm"
                    >
                      Upgrade Now
                    </Link>
                  </div>
                </div>
              )}

              {/* Popular Categories */}
              <div className="pt-6 border-t-2 border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Popular Categories</h2>
                <div className="flex flex-wrap gap-2">
                  {popularCategories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSearchQuery(category)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                        searchQuery === category
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rental Tips */}
              <div className="pt-6 border-t-2 border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Rental tips</h2>
                <ul className="space-y-3">
                  {rentalTips.map((tip, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-emerald-600 mt-1">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Need Help Section */}
              <div className="pt-6 border-t-2 border-gray-200">
                <div className="bg-gradient-to-br from-emerald-50 to-accent/10 rounded-lg p-4 border border-emerald-200">
                  <div className="flex items-start gap-3 mb-3">
                    <HelpCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">Need Help?</h3>
                      <p className="text-xs text-gray-600 mt-1">Our team is here to help you find the right rental.</p>
                    </div>
                  </div>
                  <Link
                    href="/support"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-emerald-600 rounded-lg hover:bg-emerald-50 transition-all border border-emerald-200 font-medium text-sm"
                  >
                    <Zap className="w-4 h-4" />
                    Contact Support
                  </Link>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Sort and Results Count */}
            <div className="flex items-center justify-between">
              <p className="text-gray-600 text-sm">
                {sortedRentals.length} rental{sortedRentals.length !== 1 ? 's' : ''} found
              </p>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-white font-medium"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Featured Rentals Section */}
            {featuredRentals.length > 0 && (
              <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  <h2 className="text-lg font-bold text-gray-900">Featured Rentals</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featuredRentals.slice(0, 3).map((rental) => (
                    <RentalCard key={rental.id} rental={rental} formatPrice={formatPrice} featured />
                  ))}
                </div>
              </div>
            )}

            {/* Rentals Grid */}
            {sortedRentals.length === 0 ? (
              <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-8">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
                    <Calendar className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No rentals found</h3>
                  <p className="text-gray-600 mb-6">
                    {searchQuery || activeFiltersCount > 0
                      ? "Try adjusting your filters to see more results."
                      : "Get started by listing your first rental item."}
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    {activeFiltersCount > 0 && (
                      <button
                        onClick={clearFilters}
                        className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105 font-semibold"
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {regularRentals.map((rental) => (
                  <RentalCard key={rental.id} rental={rental} formatPrice={formatPrice} />
                ))}
              </div>
            )}

            {/* Map Placeholder */}
            {sortedRentals.length > 0 && (
              <div className="bg-gray-200 rounded-xl border-2 border-gray-300 h-64 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 font-medium">Map View Coming Soon</p>
                </div>
              </div>
            )}
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
}

function RentalCard({ rental, formatPrice, featured = false }: RentalCardProps) {
  return (
    <Link
      href={`/rentals/${rental.id}`}
      className={`group bg-white rounded-xl border-2 ${featured ? 'border-yellow-300' : 'border-gray-200'} hover:border-emerald-300 hover:shadow-xl transition-all duration-300 overflow-hidden`}
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
        <h3 className="font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-emerald-600 transition-colors">
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
            <span className="flex items-center gap-1 text-xs text-emerald-600">
              <CheckCircle2 className="w-3 h-3" />
              Verified
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
