"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Search,
  Filter,
  Plus,
  Star,
  Package,
  Clock,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  ShoppingCart,
  Truck,
  Shield,
  Zap
} from "lucide-react";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import { ListSkeleton } from "@/components/ui/loading";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";

export interface Supply {
  id: string;
  name: string;
  description: string;
  category: string;
  type: 'cleaning' | 'tools' | 'materials' | 'equipment' | 'subscription';
  status: 'available' | 'out-of-stock' | 'discontinued' | 'pre-order';
  price: number;
  originalPrice?: number;
  unit: 'piece' | 'pack' | 'box' | 'kg' | 'liter' | 'set';
  stock: number;
  minOrder: number;
  maxOrder?: number;
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
    weight?: string;
    dimensions?: string;
    material?: string;
    color?: string;
    warranty?: string;
  };
  supplier: {
    id: string;
    name: string;
    avatar?: string;
    rating: number;
    reviewCount: number;
    verified: boolean;
    location: string;
  };
  delivery: {
    available: boolean;
    estimatedDays: number;
    cost: number;
    freeShippingThreshold?: number;
  };
  rating: number;
  reviewCount: number;
  viewsCount: number;
  isFeatured: boolean;
  isFavorited: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  // Additional fields for my supplies
  ordersCount: number;
  revenue: number;
  lastOrderDate?: string;
}

const categories = [
  "All Categories",
  "Cleaning Supplies",
  "Tools & Equipment",
  "Building Materials",
  "Safety Equipment",
  "Office Supplies",
  "Maintenance Kits",
  "Other"
];

const types = [
  "All Types",
  "Cleaning",
  "Tools",
  "Materials",
  "Equipment",
  "Subscription"
];

const statuses = [
  "All Status",
  "Available",
  "Out of Stock",
  "Discontinued",
  "Pre-order"
];

const getStatusColor = (status: Supply['status']) => {
  switch (status) {
    case 'available': return 'bg-green-100 text-green-800';
    case 'out-of-stock': return 'bg-red-100 text-red-800';
    case 'discontinued': return 'bg-gray-100 text-gray-800';
    case 'pre-order': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getTypeIcon = (type: Supply['type']) => {
  switch (type) {
    case 'cleaning': return <Shield className="w-4 h-4" />;
    case 'tools': return <Zap className="w-4 h-4" />;
    case 'materials': return <Package className="w-4 h-4" />;
    case 'equipment': return <Truck className="w-4 h-4" />;
    case 'subscription': return <Clock className="w-4 h-4" />;
    default: return <Package className="w-4 h-4" />;
  }
};

export default function MySuppliesPage() {
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedType, setSelectedType] = useState("All Types");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchMySupplies = async () => {
      try {
        setLoading(true);
        if (!getApiToken()) return;
        
        const url = `${API_BASE_URL}${API_ENDPOINTS.suppliesMySupplies}`;
        const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));

        if (!response.ok) {
          throw new Error('Failed to fetch my supplies');
        }

        const data = await response.json();
        setSupplies(data.supplies || []);
      } catch (error) {
        logger.error('Error fetching my supplies', error instanceof Error ? error : new Error(String(error)));
        // Fallback to mock data
        setSupplies([
          {
            id: '1',
            name: 'Professional Cleaning Kit - Complete Set',
            description: 'Complete cleaning kit with all essential tools and supplies for professional cleaning services. Includes premium quality products.',
            category: 'Cleaning Supplies',
            type: 'cleaning',
            status: 'available',
            price: 89.99,
            originalPrice: 119.99,
            unit: 'set',
            stock: 45,
            minOrder: 1,
            maxOrder: 10,
            location: {
              address: '123 Supply Street',
              city: 'New York',
              state: 'NY',
              zipCode: '10001'
            },
            images: ['https://via.placeholder.com/400x300', 'https://via.placeholder.com/400x300'],
            features: ['Professional Grade', 'Eco-Friendly', 'Long Lasting', 'Easy to Use'],
            specifications: {
              brand: 'CleanPro',
              weight: '5.2 kg',
              dimensions: '40cm x 30cm x 15cm',
              material: 'Premium Plastic',
              color: 'Blue',
              warranty: '1 year'
            },
            supplier: {
              id: '1',
              name: 'Professional Supply Co.',
              rating: 4.8,
              reviewCount: 156,
              verified: true,
              location: 'New York, NY'
            },
            delivery: {
              available: true,
              estimatedDays: 2,
              cost: 9.99,
              freeShippingThreshold: 100
            },
            rating: 4.8,
            reviewCount: 24,
            viewsCount: 342,
            isFeatured: true,
            isFavorited: false,
            tags: ['cleaning', 'professional', 'kit', 'eco-friendly'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ordersCount: 12,
            revenue: 1079.88,
            lastOrderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '2',
            name: 'Heavy Duty Drill Set - 20 Piece',
            description: 'Professional grade drill set with various bits and accessories. Perfect for construction and maintenance work.',
            category: 'Tools & Equipment',
            type: 'tools',
            status: 'available',
            price: 149.99,
            unit: 'set',
            stock: 12,
            minOrder: 1,
            maxOrder: 5,
            location: {
              address: '456 Tool Avenue',
              city: 'Los Angeles',
              state: 'CA',
              zipCode: '90210'
            },
            images: ['https://via.placeholder.com/400x300'],
            features: ['Heavy Duty', 'Professional Grade', 'Durable', 'Versatile'],
            specifications: {
              brand: 'ToolMaster',
              model: 'HD-20',
              weight: '3.5 kg',
              dimensions: '35cm x 25cm x 10cm',
              material: 'Steel',
              color: 'Black',
              warranty: '2 years'
            },
            supplier: {
              id: '2',
              name: 'Tool Supply Depot',
              rating: 4.6,
              reviewCount: 89,
              verified: true,
              location: 'Los Angeles, CA'
            },
            delivery: {
              available: true,
              estimatedDays: 3,
              cost: 15.99,
              freeShippingThreshold: 200
            },
            rating: 4.6,
            reviewCount: 18,
            viewsCount: 198,
            isFeatured: false,
            isFavorited: true,
            tags: ['tools', 'drill', 'construction', 'professional'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ordersCount: 8,
            revenue: 1199.92,
            lastOrderDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '3',
            name: 'Monthly Cleaning Subscription Box',
            description: 'Monthly subscription box with curated cleaning supplies delivered to your door. Perfect for regular maintenance.',
            category: 'Maintenance Kits',
            type: 'subscription',
            status: 'available',
            price: 29.99,
            unit: 'box',
            stock: 999,
            minOrder: 1,
            maxOrder: 12,
            location: {
              address: '789 Subscription Lane',
              city: 'Chicago',
              state: 'IL',
              zipCode: '60601'
            },
            images: ['https://via.placeholder.com/400x300', 'https://via.placeholder.com/400x300', 'https://via.placeholder.com/400x300'],
            features: ['Monthly Delivery', 'Curated Selection', 'Eco-Friendly', 'Flexible'],
            specifications: {
              brand: 'CleanBox',
              weight: '2.1 kg',
              dimensions: '30cm x 20cm x 15cm',
              material: 'Mixed',
              color: 'Various',
              warranty: 'Monthly'
            },
            supplier: {
              id: '3',
              name: 'Subscription Supply Co.',
              rating: 4.9,
              reviewCount: 234,
              verified: true,
              location: 'Chicago, IL'
            },
            delivery: {
              available: true,
              estimatedDays: 1,
              cost: 0,
              freeShippingThreshold: 0
            },
            rating: 4.9,
            reviewCount: 45,
            viewsCount: 567,
            isFeatured: true,
            isFavorited: false,
            tags: ['subscription', 'monthly', 'cleaning', 'convenient'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ordersCount: 25,
            revenue: 749.75,
            lastOrderDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchMySupplies();
  }, []);

  const filteredSupplies = supplies.filter(supply => {
    const matchesSearch = supply.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         supply.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         supply.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All Categories" || supply.category === selectedCategory;
    const matchesType = selectedType === "All Types" || supply.type === selectedType;
    const matchesStatus = selectedStatus === "All Status" || supply.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesType && matchesStatus;
  });

  const sortedSupplies = [...filteredSupplies].sort((a, b) => {
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
      case 'stock':
        aValue = a.stock;
        bValue = b.stock;
        break;
      case 'orders':
        aValue = a.ordersCount;
        bValue = b.ordersCount;
        break;
      case 'revenue':
        aValue = a.revenue;
        bValue = b.revenue;
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

  const totalRevenue = supplies.reduce((sum, supply) => sum + supply.revenue, 0);
  const totalOrders = supplies.reduce((sum, supply) => sum + supply.ordersCount, 0);
  const averageRating = supplies.length > 0 ? supplies.reduce((sum, supply) => sum + supply.rating, 0) / supplies.length : 0;

  const handleCreateSupply = () => {
    router.push('/supplies/create');
  };

  const handleViewSupply = (supplyId: string) => {
    router.push(`/supplies/${supplyId}`);
  };

  const handleEditSupply = (supplyId: string) => {
    router.push(`/supplies/${supplyId}/edit`);
  };

  const handleDeleteSupply = async (supplyId: string) => {
    if (confirm('Are you sure you want to delete this supply?')) {
      try {
        if (!getApiToken()) return;
        
        const endpoint = API_ENDPOINTS.suppliesById.replace('[id]', supplyId);
        const url = `${API_BASE_URL}${endpoint}`;
        const response = await fetch(url, createAuthFetchOptions({ method: 'DELETE' }));

        if (response.ok) {
          setSupplies(prev => prev.filter(supply => supply.id !== supplyId));
        } else {
          logger.error('Error deleting supply', new Error('Supply deletion failed'), { supplyId, status: response.status });
        }
      } catch (error) {
        logger.error('Error deleting supply', error instanceof Error ? error : new Error(String(error)), { supplyId });
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Supplies</h1>
            <p className="text-gray-600">Manage your supply listings</p>
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
          { label: 'Supplies & Materials', href: '/supplies' },
          { label: 'My Supplies', href: '/supplies/my-supplies' }
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Supplies</h1>
          <p className="text-gray-600">Manage your supply listings and track performance</p>
        </div>
        <Button onClick={handleCreateSupply} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add New Supply
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Supplies</p>
              <p className="text-2xl font-bold text-gray-900">{supplies.length}</p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-green-600">{totalOrders}</p>
            </div>
            <ShoppingCart className="w-8 h-8 text-green-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-yellow-600">${totalRevenue.toFixed(2)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-yellow-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Rating</p>
              <p className="text-2xl font-bold text-purple-600">{averageRating.toFixed(1)}</p>
            </div>
            <Star className="w-8 h-8 text-purple-600" />
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
                      placeholder="Search supplies..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
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
                    { value: 'rating', label: 'Rating' },
                    { value: 'stock', label: 'Stock' },
                    { value: 'orders', label: 'Orders' },
                    { value: 'revenue', label: 'Revenue' }
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
              {sortedSupplies.length} suppl{sortedSupplies.length !== 1 ? 'ies' : 'y'} found
            </div>
          </div>

          {/* Supplies List */}
          {sortedSupplies.length === 0 ? (
            <Card className="p-8 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No supplies found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || selectedCategory !== "All Categories" || selectedType !== "All Types" || selectedStatus !== "All Status"
                  ? "Try adjusting your filters to see more results."
                  : "Get started by listing your first supply item."}
              </p>
              <Button onClick={handleCreateSupply}>
                Add Your First Supply
              </Button>
            </Card>
          ) : (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6" 
              : "space-y-4"
            }>
              {sortedSupplies.map((supply) => (
                <Card key={supply.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    {supply.images.length > 0 && (
                      <div className="aspect-video bg-gray-100">
                        <Image
                          src={supply.images[0]}
                          alt={supply.name}
                          width={400}
                          height={225}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(supply.status)}`}>
                        {supply.status}
                      </span>
                      {supply.isFeatured && (
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
                        onClick={() => handleViewSupply(supply.id)}
                        className="p-1 text-gray-400"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditSupply(supply.id)}
                        className="p-1 text-gray-400"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteSupply(supply.id)}
                        className="p-1 text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">{supply.name}</h3>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{supply.description}</p>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded flex items-center gap-1">
                        {getTypeIcon(supply.type)}
                        {supply.type}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {supply.category}
                      </span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        Stock: {supply.stock}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium">{supply.rating}</span>
                        <span className="text-sm text-gray-500">({supply.reviewCount})</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          ${supply.price}
                          {supply.originalPrice && (
                            <span className="text-sm text-gray-500 line-through ml-1">
                              ${supply.originalPrice}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">/{supply.unit}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                      <div className="flex items-center gap-1 text-gray-500">
                        <ShoppingCart className="w-4 h-4" />
                        <span>{supply.ordersCount} orders</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <Eye className="w-4 h-4" />
                        <span>{supply.viewsCount} views</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-green-600">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-medium">${supply.revenue.toFixed(2)} revenue</span>
                      </div>
                      {supply.lastOrderDate && (
                        <div className="text-xs text-gray-500">
                          Last order: {new Date(supply.lastOrderDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium">
                              {supply.supplier.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">{supply.supplier.name}</p>
                            <p className="text-xs text-gray-500">
                              {supply.supplier.rating} ⭐ ({supply.supplier.reviewCount} reviews)
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewSupply(supply.id)}
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleEditSupply(supply.id)}
                          >
                            Edit
                          </Button>
                        </div>
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
