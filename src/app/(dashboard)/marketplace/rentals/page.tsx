"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Search,
  Plus,
  MapPin,
  Star,
  Eye,
  Edit,
  Heart,
  Share2,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  Filter,
  Wrench,
  Car,
  Home,
  Hammer
} from "lucide-react";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

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
    rating?: number;
    reviewCount?: number;
    verified: boolean;
  };
  availability: {
    startDate: string;
    endDate: string;
    isAvailable: boolean;
  };
  rating?: number;
  reviewCount?: number;
  viewsCount: number;
  isFeatured: boolean;
  isFavorited: boolean;
  createdAt: string;
  updatedAt: string;
}

const categories = [
  "All Categories",
  "Construction Equipment",
  "Vehicles",
  "Tools",
  "Event Equipment",
  "Electronics",
  "Furniture",
  "Sports Equipment"
];

const types = [
  "All Types",
  "equipment",
  "vehicle", 
  "space",
  "tool"
];

const statuses = [
  "All Status",
  "available",
  "rented",
  "maintenance",
  "unavailable"
];

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'equipment':
      return <Wrench className="w-4 h-4" />;
    case 'vehicle':
      return <Car className="w-4 h-4" />;
    case 'space':
      return <Home className="w-4 h-4" />;
    case 'tool':
      return <Hammer className="w-4 h-4" />;
    default:
      return <Wrench className="w-4 h-4" />;
  }
};

const getConditionColor = (condition: string) => {
  switch (condition) {
    case 'excellent':
      return 'text-green-600 bg-green-100';
    case 'good':
      return 'text-blue-600 bg-blue-100';
    case 'fair':
      return 'text-yellow-600 bg-yellow-100';
    case 'poor':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'available':
      return 'text-green-600 bg-green-100';
    case 'rented':
      return 'text-blue-600 bg-blue-100';
    case 'maintenance':
      return 'text-yellow-600 bg-yellow-100';
    case 'unavailable':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

// Rental-specific skeleton components
const RentalCardSkeleton = () => (
  <Card className="overflow-hidden animate-pulse">
    <div className="relative h-48 bg-gray-200" />
    <div className="p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="h-6 bg-gray-200 rounded w-3/4" />
        <div className="h-6 bg-gray-200 rounded w-20" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-4 bg-gray-200 rounded w-16" />
        <div className="h-4 bg-gray-200 rounded w-20" />
        <div className="h-4 bg-gray-200 rounded w-24" />
      </div>
      <div className="flex items-center justify-between">
        <div className="h-5 bg-gray-200 rounded w-24" />
        <div className="h-6 bg-gray-200 rounded w-20" />
      </div>
      <div className="flex gap-2">
        <div className="h-10 bg-gray-200 rounded flex-1" />
        <div className="h-10 bg-gray-200 rounded w-10" />
      </div>
    </div>
  </Card>
);

const RentalListSkeleton = () => (
  <Card className="p-4 animate-pulse">
    <div className="flex">
      <div className="relative w-32 h-24 bg-gray-200 rounded-lg flex-shrink-0" />
      <div className="flex-1 ml-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="h-6 bg-gray-200 rounded w-1/2" />
          <div className="h-6 bg-gray-200 rounded w-20" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-4/5" />
        </div>
        <div className="flex items-center gap-4">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-4 bg-gray-200 rounded w-32" />
          <div className="h-4 bg-gray-200 rounded w-20" />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 rounded w-20" />
            <div className="h-8 bg-gray-200 rounded w-16" />
          </div>
          <div className="h-6 bg-gray-200 rounded w-24" />
        </div>
      </div>
    </div>
  </Card>
);

export default function MarketplaceRentalsPage() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedType, setSelectedType] = useState("All Types");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [location, setLocation] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 15,
    count: 0
  });
  const router = useRouter();

  const fetchRentals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        type: 'rentals',
        page: pagination.current.toString(),
        limit: pagination.limit.toString(),
        ...(selectedCategory !== "All Categories" && { category: selectedCategory }),
        ...(selectedType !== "All Types" && { type: selectedType }),
        ...(selectedStatus !== "All Status" && { status: selectedStatus }),
        ...(searchQuery && { search: searchQuery }),
        ...(location && { location }),
        ...(priceRange.min && { minPrice: priceRange.min }),
        ...(priceRange.max && { maxPrice: priceRange.max }),
        sortBy,
        sortOrder
      });

      const response = await fetch(`/api/rentals?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch rentals: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        const rentalsData = data.data || [];
        
        // Debug: Check for duplicate IDs
        const ids = rentalsData.map((rental: Rental) => rental?.id).filter(Boolean);
        const uniqueIds = new Set(ids);
        if (ids.length !== uniqueIds.size) {
          console.warn('Duplicate rental IDs detected:', ids);
        }
        
        setRentals(rentalsData);
        if (data.pagination) {
          setPagination(prev => ({
            ...prev,
            ...data.pagination
          }));
        }
      } else {
        throw new Error(data.error || 'Failed to fetch rentals');
      }
    } catch (err) {
      console.error('Error fetching rentals:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch rentals');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedType, selectedStatus, searchQuery, location, priceRange, sortBy, sortOrder, pagination]);

  useEffect(() => {
    fetchRentals();
  }, [searchQuery, selectedCategory, selectedType, selectedStatus, sortBy, sortOrder, pagination]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchRentals();
  };

  const handleFilterChange = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchRentals();
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, current: page }));
  };

  const handleCreateRental = () => {
    router.push('/rentals/create');
  };

  const handleViewRental = (rentalId: string) => {
    router.push(`/marketplace/rentals/${rentalId}`);
  };

  const handleEditRental = (rentalId: string) => {
    router.push(`/rentals/${rentalId}/edit`);
  };

  const handleToggleFavorite = async (rentalId: string) => {
    // TODO: Implement favorite toggle
    console.log('Toggle favorite for rental:', rentalId);
  };

  const handleShareRental = (rentalId: string) => {
    // TODO: Implement share functionality
    console.log('Share rental:', rentalId);
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Breadcrumbs
            items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Marketplace", href: "/marketplace" },
              { label: "Rentals", href: "/marketplace/rentals" }
            ]}
          />
          <div className="flex justify-between items-start mt-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Equipment Rentals</h1>
              <p className="text-gray-600 mt-2">Find and rent equipment, vehicles, tools, and spaces</p>
            </div>
            <Button onClick={handleCreateRental} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              List Equipment
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search rentals..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Search
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                </Button>
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <Select
                    value={selectedCategory}
                    onValueChange={(value) => {
                      setSelectedCategory(value);
                      handleFilterChange();
                    }}
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <Select
                    value={selectedType}
                    onValueChange={(value) => {
                      setSelectedType(value);
                      handleFilterChange();
                    }}
                  >
                    {types.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <Select
                    value={selectedStatus}
                    onValueChange={(value) => {
                      setSelectedStatus(value);
                      handleFilterChange();
                    }}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <Input
                    type="text"
                    placeholder="City, State"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Price</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
                  <Input
                    type="number"
                    placeholder="1000"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                  />
                </div>
              </div>
            )}
          </form>
        </Card>

        {/* Results Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            {loading && rentals.length > 0 ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin" />
                <p className="text-gray-600">Loading...</p>
              </div>
            ) : (
              <p className="text-gray-600">
                {pagination.total} rental{pagination.total !== 1 ? 's' : ''} found
              </p>
            )}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value)}
            >
              <option value="createdAt">Newest First</option>
              <option value="price">Price</option>
              <option value="rating">Rating</option>
              <option value="name">Name</option>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="p-6 mb-8">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchRentals} variant="outline">
                Try Again
              </Button>
            </div>
          </Card>
        )}

        {/* Rentals Grid/List */}
        {loading && rentals.length === 0 ? (
          // Initial loading state with skeletons matching view mode
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
            : "space-y-4"
          }>
            {Array.from({ length: 6 }).map((_, i) => (
              viewMode === 'grid' ? (
                <RentalCardSkeleton key={i} />
              ) : (
                <RentalListSkeleton key={i} />
              )
            ))}
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
            : "space-y-4"
          }>
            {rentals.filter(rental => rental && rental.id).length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">No rentals found</p>
              </div>
            ) : (
              rentals.filter(rental => rental && rental.id).map((rental, index) => (
              <Card key={rental.id || `rental-${index}`} className="overflow-hidden hover:shadow-lg transition-shadow">
                {viewMode === 'grid' ? (
                  // Grid View
                  <>
                    <div className="relative h-48 bg-gray-200">
                      {rental.images && rental.images.length > 0 ? (
                        <Image
                          src={rental.images[0]}
                          alt={rental.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          {getTypeIcon(rental.type)}
                        </div>
                      )}
                      {rental.isFeatured && (
                        <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">
                          Featured
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex gap-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 w-8 p-0"
                          onClick={() => handleToggleFavorite(rental.id)}
                        >
                          <Heart className={`w-4 h-4 ${rental.isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 w-8 p-0"
                          onClick={() => handleShareRental(rental.id)}
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
                          {rental.name}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rental.status)}`}>
                          {rental.status}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                        {rental.description}
                      </p>
                      <div className="flex items-center gap-2 mb-2">
                        {getTypeIcon(rental.type)}
                        <span className="text-sm text-gray-600">{rental.category}</span>
                        <span className={`px-2 py-1 rounded text-xs ${getConditionColor(rental.specifications.condition)}`}>
                          {rental.specifications.condition}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {rental.location.city}, {rental.location.state}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium">
                            {typeof rental.rating === 'number' ? rental.rating.toFixed(1) : '0.0'}
                          </span>
                          <span className="text-sm text-gray-500">({rental.reviewCount || 0})</span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-gray-900">
                            ${rental.price}
                          </span>
                          <span className="text-sm text-gray-500">/{rental.priceUnit}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleViewRental(rental.id)}
                          className="flex-1"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleEditRental(rental.id)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  // List View
                  <div className="flex p-4">
                    <div className="relative w-32 h-24 bg-gray-200 rounded-lg flex-shrink-0">
                      {rental.images && rental.images.length > 0 ? (
                        <Image
                          src={rental.images[0]}
                          alt={rental.name}
                          fill
                          className="object-cover rounded-lg"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          {getTypeIcon(rental.type)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 ml-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg text-gray-900">
                          {rental.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rental.status)}`}>
                            {rental.status}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleFavorite(rental.id)}
                          >
                            <Heart className={`w-4 h-4 ${rental.isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
                          </Button>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                        {rental.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1">
                          {getTypeIcon(rental.type)}
                          <span>{rental.category}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{rental.location.city}, {rental.location.state}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span>
                            {typeof rental.rating === 'number' ? rental.rating.toFixed(1) : '0.0'} ({rental.reviewCount || 0})
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleViewRental(rental.id)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditRental(rental.id)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-gray-900">
                            ${rental.price}
                          </span>
                          <span className="text-sm text-gray-500">/{rental.priceUnit}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
              ))
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.current - 1)}
                disabled={pagination.current === 1}
              >
                Previous
              </Button>
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={pagination.current === page ? "default" : "outline"}
                    onClick={() => handlePageChange(page)}
                    className="w-10"
                  >
                    {page}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.current + 1)}
                disabled={pagination.current === pagination.pages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
