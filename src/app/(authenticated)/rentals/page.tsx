"use client";

import { useState, useEffect } from "react";
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
  Calendar,
  Clock,
  Filter
} from "lucide-react";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import { ListSkeleton } from "@/components/ui/loading";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
// Removed unused imports: createAuthFetchOptions, getApiToken
import { logger } from "@/lib/logger";

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

const categories = [
  "All Categories",
  "Construction Equipment",
  "Vehicles",
  "Tools",
  "Event Equipment",
  "Office Space",
  "Storage",
  "Other"
];

const types = [
  "All Types",
  "Equipment",
  "Vehicle",
  "Space",
  "Tool"
];

const statuses = [
  "All Status",
  "Available",
  "Rented",
  "Maintenance",
  "Unavailable"
];

// const priceUnits = [
//   "All Units",
//   "Per Hour",
//   "Per Day",
//   "Per Week",
//   "Per Month"
// ];

const getStatusColor = (status: Rental['status']) => {
  switch (status) {
    case 'available': return 'bg-green-100 text-green-800';
    case 'rented': return 'bg-blue-100 text-blue-800';
    case 'maintenance': return 'bg-yellow-100 text-yellow-800';
    case 'unavailable': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getConditionColor = (condition: Rental['specifications']['condition']) => {
  switch (condition) {
    case 'excellent': return 'bg-green-100 text-green-800';
    case 'good': return 'bg-blue-100 text-blue-800';
    case 'fair': return 'bg-yellow-100 text-yellow-800';
    case 'poor': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function RentalsPage() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
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

  const handleViewRental = (rentalId: string) => {
    router.push(`/rentals/${rentalId}`);
  };

  const handleEditRental = (rentalId: string) => {
    router.push(`/rentals/${rentalId}/edit`);
  };

  const handleToggleFavorite = async (rentalId: string) => {
    // Implement favorite toggle
    logger.debug('Toggle favorite for rental', { rentalId });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Rentals</h1>
            <p className="text-gray-600">Find equipment, vehicles, and spaces to rent</p>
          </div>
        </div>
        <ListSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Marketplace', href: '/marketplace' },
          { label: 'Rentals', href: '/rentals' }
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rentals</h1>
          <p className="text-gray-600">Find equipment, vehicles, and spaces to rent</p>
        </div>
        <Button onClick={handleCreateRental} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          List Rental
        </Button>
      </div>

      {/* Compact Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-xs text-gray-600">Total</p>
              <p className="text-lg font-bold text-gray-900">{rentals.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-xs text-gray-600">Available</p>
              <p className="text-lg font-bold text-green-600">
                {rentals.filter(rental => rental.status === 'available').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-3">
            <Star className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-xs text-gray-600">Featured</p>
              <p className="text-lg font-bold text-yellow-600">
                {rentals.filter(rental => rental.isFeatured).length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-xs text-gray-600">Categories</p>
              <p className="text-lg font-bold text-gray-900">
                {new Set(rentals.map(rental => rental.category)).size}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content with Sidebar */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Filters */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <Card className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Filters</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden"
                >
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
              <div className={`space-y-4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                
                {/* Search */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search rentals..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Location</label>
                  <Input
                    placeholder="City, State"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                {/* Price Range */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Price Range</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Min"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                      className="text-sm"
                    />
                    <Input
                      placeholder="Max"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Category</label>
                  <Select
                    value={selectedCategory}
                    onValueChange={(value) => setSelectedCategory(value)}
                    options={categories.map(cat => ({ value: cat, label: cat }))}
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Type</label>
                  <Select
                    value={selectedType}
                    onValueChange={(value) => setSelectedType(value)}
                    options={types.map(type => ({ value: type, label: type }))}
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
                  <Select
                    value={selectedStatus}
                    onValueChange={(value) => setSelectedStatus(value)}
                    options={statuses.map(status => ({ value: status, label: status }))}
                  />
                </div>

              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          {/* Sort and Display Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                <Select
                  value={sortBy}
                  onValueChange={(value) => setSortBy(value)}
                  options={[
                    { value: 'createdAt', label: 'Date Created' },
                    { value: 'name', label: 'Name' },
                    { value: 'price', label: 'Price' },
                    { value: 'rating', label: 'Rating' }
                  ]}
                  className="w-36"
                />
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-2 py-1 h-8"
                  title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                >
                  {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="px-2 py-1 h-8"
                  title={`Switch to ${viewMode === 'grid' ? 'List' : 'Grid'} view`}
                >
                  {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {sortedRentals.length} rental{sortedRentals.length !== 1 ? 's' : ''} found
            </div>
          </div>
          {/* Rentals List */}
          {sortedRentals.length === 0 ? (
            <Card className="p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No rentals found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || selectedCategory !== "All Categories" || selectedType !== "All Types" || selectedStatus !== "All Status"
                  ? "Try adjusting your filters to see more results."
                  : "Get started by listing your first rental item."}
              </p>
              <Button onClick={handleCreateRental}>
                List Your First Rental
              </Button>
            </Card>
          ) : (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6" 
              : "space-y-4"
            }>
              {sortedRentals.map((rental) => (
                <Card key={rental.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    {rental.images.length > 0 && (
                      <div className="aspect-video bg-gray-100">
                        <Image
                          src={rental.images[0]}
                          alt={rental.name}
                          width={400}
                          height={225}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rental.status)}`}>
                        {rental.status}
                      </span>
                      {rental.isFeatured && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                          <Star className="w-3 h-3 inline mr-1" />
                          Featured
                        </span>
                      )}
                    </div>
                    <div className="absolute top-2 left-2 flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleFavorite(rental.id)}
                        className={`p-1 ${rental.isFavorited ? 'text-red-500' : 'text-gray-400'}`}
                      >
                        <Heart className={`w-4 h-4 ${rental.isFavorited ? 'fill-current' : ''}`} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="p-1 text-gray-400"
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">{rental.name}</h3>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewRental(rental.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditRental(rental.id)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{rental.description}</p>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {rental.category}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {rental.type}
                      </span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        {getConditionColor(rental.specifications.condition)}
                        {rental.specifications.condition}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium">{rental.rating}</span>
                        <span className="text-sm text-gray-500">({rental.reviewCount})</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          ${rental.price}
                          <span className="text-sm text-gray-500">/{rental.priceUnit}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{rental.location.city}, {rental.location.state}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{rental.viewsCount} views</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium">
                              {rental.owner.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">{rental.owner.name}</p>
                            <p className="text-xs text-gray-500">
                              {rental.owner.rating} ⭐ ({rental.owner.reviewCount} reviews)
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleViewRental(rental.id)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}