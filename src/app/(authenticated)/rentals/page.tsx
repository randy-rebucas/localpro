"use client";

import { useState, useEffect } from "react";
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
  HelpCircle
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


export default function RentalsPage() {
  const { settings: appSettings } = useAppSettings();
  const { isProvider, isAdmin } = useRoleAccess();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedType, setSelectedType] = useState("All Types");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [location, setLocation] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [guests, setGuests] = useState(1);
  const [sortBy] = useState<'name' | 'price' | 'rating' | 'createdAt'>('createdAt');
  const [sortOrder] = useState<'asc' | 'desc'>('desc');
  const router = useRouter();

  // Filter options
  const types = ['All Types', 'equipment', 'vehicle', 'space', 'tool'];

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

  const filteredRentals = rentals.filter(rental => {
    const matchesSearch = rental.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         rental.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         rental.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All Categories" || rental.category === selectedCategory;
    const matchesType = selectedType === "All Types" || rental.type === selectedType;
    const matchesStatus = selectedStatus === "All Status" || rental.status === selectedStatus;
    const matchesLocation = !location || rental.location.city.toLowerCase().includes(location.toLowerCase()) ||
                           rental.location.state.toLowerCase().includes(location.toLowerCase());
    const matchesPrice = (!priceRange.min || rental.price >= parseFloat(priceRange.min)) &&
                     (!priceRange.max || rental.price <= parseFloat(priceRange.max));
    
    return matchesSearch && matchesCategory && matchesType && matchesStatus && matchesLocation && matchesPrice;
  });

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

  const handleFilterChange = (key: string, value: string) => {
    if (key === 'category') setSelectedCategory(value);
    else if (key === 'type') setSelectedType(value);
    else if (key === 'status') setSelectedStatus(value);
    else if (key === 'location') setLocation(value);
  };

  const clearFilters = () => {
    setSelectedCategory("All Categories");
    setSelectedType("All Types");
    setSelectedStatus("All Status");
    setLocation("");
    setPriceRange({ min: "", max: "" });
    setSearchQuery("");
  };

  const sortedRentals = [...filteredRentals].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name;
        bValue = b.name;
        break;
      case 'price':
        aValue = a.price;
        bValue = b.price;
        break;
      case 'rating':
        aValue = a.rating;
        bValue = b.rating;
        break;
      case 'createdAt':
      default:
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-green-200/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
        </div>
        <div className="relative z-10 p-6 space-y-6">
          {/* Header Skeleton */}
          <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg p-6 backdrop-blur-sm animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>

          {/* Search and Filters Skeleton */}
          <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg p-4 backdrop-blur-sm">
            <div className="flex gap-4">
              <div className="flex-1 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="w-24 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="w-20 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>

          {/* Rentals Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg p-6 backdrop-blur-sm animate-pulse">
                <div className="space-y-4">
                  <div className="h-48 bg-gray-200 rounded-lg"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                    <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Get featured rental
  const featuredRental = sortedRentals.length > 0 
    ? (sortedRentals.find(r => r.isFeatured) || sortedRentals[0])
    : null;
  const regularRentals = featuredRental 
    ? sortedRentals.filter(r => r.id !== featuredRental.id)
    : sortedRentals;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-green-200/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Find trusted rentals — equipment, tools, spaces & more
          </h1>
          <p className="text-gray-600 mb-6">
            Verified providers, flexible durations, and LocalPro support for every rental.
          </p>
          
          {/* Search Bar */}
          <div className="relative mb-4">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search equipment, tools, spaces, provider, or feature"
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

          {/* Feature Buttons */}
          <div className="flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-all shadow-sm hover:shadow-md">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-gray-700">Verified Providers</span>
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-all shadow-sm hover:shadow-md">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-gray-700">Instant Booking</span>
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-all shadow-sm hover:shadow-md">
              <Headphones className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-gray-700">Local Support</span>
            </button>
            {/* Only show "List Rental" button for providers and admins */}
            {(isAdmin || isProvider) && (
              <button
                onClick={handleCreateRental}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105 ml-auto"
              >
                <Plus className="w-4 h-4" />
                List Rental
              </button>
            )}
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar - Filters */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6 space-y-6 sticky top-24">
              {/* Filters Section */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Filters</h2>
                
                {/* Type Filter */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                  <select
                    value={selectedType}
                    onChange={(e) => handleFilterChange("type", e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white font-medium"
                  >
                    {types.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
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

                {/* Guests Filter */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Guests</label>
                  <input
                    type="number"
                    min="1"
                    value={guests}
                    onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                  />
                </div>
              </div>

              {/* Need Help Section */}
              <div className="pt-6 border-t-2 border-gray-200">
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-4 border border-emerald-200">
                  <div className="flex items-start gap-3 mb-3">
                    <HelpCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">
                      Contact LocalPro support for rental assistance.
                    </p>
                  </div>
                  <button className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-sm hover:shadow-md font-medium text-sm">
                    Help center
                  </button>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">

            {/* Featured Listing and Regular Listings */}
            {sortedRentals.length === 0 ? (
              <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg p-8 backdrop-blur-sm">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/20">
                    <Calendar className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent mb-2">No rentals found</h3>
                  <p className="text-gray-600 mb-6">
                    {searchQuery || selectedCategory !== "All Categories" || selectedType !== "All Types" || selectedStatus !== "All Status"
                      ? "Try adjusting your filters to see more results."
                      : "Get started by listing your first rental item."}
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    {searchQuery || selectedCategory !== "All Categories" || selectedType !== "All Types" || selectedStatus !== "All Status" ? (
                      <button
                        onClick={clearFilters}
                        className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105 font-semibold"
                      >
                        Clear Filters
                      </button>
                    ) : null}
                    {(isAdmin || isProvider) && (
                      <button
                        onClick={handleCreateRental}
                        className="px-6 py-3 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-300 text-gray-700 rounded-lg hover:from-gray-50 hover:to-gray-100 transition-all shadow-sm hover:shadow-md font-medium"
                      >
                        List Your First Rental
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Featured Listing */}
                {featuredRental ? (
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Regular Listings - Left Side */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {regularRentals.slice(0, 3).map((rental) => (
                        <Link
                          key={rental.id}
                          href={`/rentals/${rental.id}`}
                          className="group bg-white rounded-xl border-2 border-gray-200 hover:border-emerald-300 hover:shadow-xl transition-all duration-300 overflow-hidden"
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
                            <div className="absolute top-2 right-2">
                              <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-sm font-bold text-gray-900 shadow-md">
                                {formatPrice(rental.price)}
                              </span>
                            </div>
                          </div>
                          <div className="p-4">
                            <h3 className="font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-emerald-600 transition-colors">
                              {rental.name}
                            </h3>
                            <p className="text-xs text-gray-600 mb-2 line-clamp-1">
                              {rental.owner.name} • {rental.specifications.capacity || 'N/A'} • {rental.features.slice(0, 2).join(' • ')}
                            </p>
                            <div className="flex items-center gap-1 mb-3">
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              <span className="text-sm font-semibold text-gray-700">{rental.rating}</span>
                            </div>
                            <button className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-sm hover:shadow-md font-medium text-sm">
                              Book
                            </button>
                          </div>
                        </Link>
                      ))}
                    </div>

                    {/* Featured Listing - Right Side */}
                    <div className="lg:w-96 flex-shrink-0">
                      <div className="bg-white rounded-xl border-2 border-emerald-300 shadow-xl overflow-hidden relative">
                        <div className="absolute top-4 left-4 z-10">
                          <span className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-lg">
                            Featured
                          </span>
                        </div>
                        <div className="relative">
                          {featuredRental.images.length > 0 ? (
                            <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                              <Image
                                src={featuredRental.images[0]}
                                alt={featuredRental.name}
                                width={400}
                                height={300}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="aspect-[4/3] bg-gradient-to-br from-orange-200 via-yellow-200 to-orange-300 flex items-center justify-center">
                              <Building2 className="w-16 h-16 text-orange-600" />
                            </div>
                          )}
                        </div>
                        <div className="p-6">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {featuredRental.name}
                          </h3>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-lg font-bold text-emerald-600">
                              {formatPrice(featuredRental.price)} / {featuredRental.priceUnit}
                            </span>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              <span className="text-sm font-semibold text-gray-700">{featuredRental.rating}</span>
                            </div>
                          </div>
                          <button className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg hover:from-orange-600 hover:to-yellow-600 transition-all shadow-lg hover:shadow-xl font-semibold">
                            Book Now
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* All Listings Grid when no featured */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedRentals.map((rental) => (
                      <Link
                        key={rental.id}
                        href={`/rentals/${rental.id}`}
                        className="group bg-white rounded-xl border-2 border-gray-200 hover:border-emerald-300 hover:shadow-xl transition-all duration-300 overflow-hidden"
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
                          <div className="absolute top-2 right-2">
                            <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-sm font-bold text-gray-900 shadow-md">
                              {formatPrice(rental.price)}
                            </span>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-emerald-600 transition-colors">
                            {rental.name}
                          </h3>
                          <p className="text-xs text-gray-600 mb-2 line-clamp-1">
                            {rental.owner.name} • {rental.specifications.capacity || 'N/A'} • {rental.features.slice(0, 2).join(' • ')}
                          </p>
                          <div className="flex items-center gap-1 mb-3">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-semibold text-gray-700">{rental.rating}</span>
                          </div>
                          <button className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-sm hover:shadow-md font-medium text-sm">
                            Book
                          </button>
                        </div>
                        </Link>
                      ))}
                  </div>
                )}

                {/* Additional Listings (only show if featured exists) */}
                {featuredRental && regularRentals.length > 3 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {regularRentals.slice(3).map((rental) => (
                      <Link
                        key={rental.id}
                        href={`/rentals/${rental.id}`}
                        className="group bg-white rounded-xl border-2 border-gray-200 hover:border-emerald-300 hover:shadow-xl transition-all duration-300 overflow-hidden"
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
                          <div className="absolute top-2 right-2">
                            <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-sm font-bold text-gray-900 shadow-md">
                              {formatPrice(rental.price)}
                            </span>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-emerald-600 transition-colors">
                            {rental.name}
                          </h3>
                          <p className="text-xs text-gray-600 mb-2 line-clamp-1">
                            {rental.owner.name} • {rental.specifications.capacity || 'N/A'} • {rental.features.slice(0, 2).join(' • ')}
                          </p>
                          <div className="flex items-center gap-1 mb-3">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-semibold text-gray-700">{rental.rating}</span>
                          </div>
                          <button className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-sm hover:shadow-md font-medium text-sm">
                            Book
                          </button>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Map Placeholder */}
                <div className="bg-gray-200 rounded-xl border-2 border-gray-300 h-96 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 font-medium">Map (placeholder)</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}