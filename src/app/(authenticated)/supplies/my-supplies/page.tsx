"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Filter,
  Plus,
  Star,
  Package,
  Clock,
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
  Zap,
  ArrowLeft,
  ChevronDown,
  TrendingUp,
  BarChart3
} from "lucide-react";
import { ListSkeleton } from "@/components/ui/loading";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { formatCurrency } from "@/lib/currency-utils";
import { useAppSettings } from "@/hooks/useAppSettings";

const normalizeCategory = (category?: string) => {
  if (!category) return "Other";
  const lower = category.toLowerCase();
  if (lower.includes("clean")) return "Cleaning Supplies";
  if (lower.includes("tool")) return "Tools & Equipment";
  if (lower.includes("material")) return "Building Materials";
  if (lower.includes("safety")) return "Safety Equipment";
  if (lower.includes("office")) return "Office Supplies";
  if (lower.includes("kit")) return "Maintenance Kits";
  return category;
};

const normalizeType = (category?: string): Supply['type'] => {
  const lower = (category || "").toLowerCase();
  if (lower.includes("clean")) return "cleaning";
  if (lower.includes("tool")) return "tools";
  if (lower.includes("equipment")) return "equipment";
  if (lower.includes("material")) return "materials";
  if (lower.includes("subscription")) return "subscription";
  return "materials";
};

const normalizeStatus = (isActive?: boolean, stock?: number): Supply['status'] => {
  if (isActive === false) return "discontinued";
  if (stock !== undefined && stock <= 0) return "out-of-stock";
  return "available";
};

const normalizeSupply = (item: Record<string, unknown>): Supply => {
  const pricing = (item.pricing || {}) as Record<string, unknown>;
  const inventory = (item.inventory || {}) as Record<string, unknown>;
  const specifications = (item.specifications || {}) as Record<string, unknown>;
  const supplierRaw = (item.supplier || {}) as Record<string, unknown>;
  const orders = Array.isArray(item.orders) ? item.orders : [];
  const reviews = Array.isArray(item.reviews) ? item.reviews : [];
  const imagesRaw = Array.isArray(item.images) ? item.images : [];

  const stock = inventory.quantity ?? 0;
  const revenue = orders.reduce((sum, order) => sum + (order.totalCost || order.totalAmount || 0), 0);
  const lastOrderDate = orders.reduce<string | undefined>((latest, order) => {
    const created = order.createdAt ? new Date(order.createdAt).toISOString() : undefined;
    if (!created) return latest;
    if (!latest) return created;
    return new Date(created) > new Date(latest) ? created : latest;
  }, undefined);

  const images = imagesRaw
    .map((img: unknown) => {
      if (typeof img === "string") return img;
      if (img && typeof img === "object") {
        const record = img as { url?: string; publicId?: string };
        return record.url || record.publicId;
      }
      return undefined;
    })
    .filter((val): val is string => Boolean(val));

  const category = normalizeCategory(item.category);
  const type = normalizeType(item.category);

  return {
    id: item.id || item._id || "",
    name: item.name || item.title || "Untitled Supply",
    description: item.description || "",
    category,
    type,
    status: normalizeStatus(item.isActive, stock),
    price: pricing.retailPrice ?? item.price ?? 0,
    originalPrice: pricing.wholesalePrice,
    unit: item.unit || "unit",
    stock,
    minOrder: inventory.minStock ?? 1,
    maxOrder: inventory.maxStock,
    location: {
      address: item.location?.address || "",
      city: item.location?.city || "",
      state: item.location?.state || "",
      zipCode: item.location?.zipCode || "",
      coordinates: item.location?.coordinates
    },
    images,
    features: item.features || [],
    specifications: {
      brand: item.brand || specifications.brand,
      model: specifications.model,
      weight: specifications.weight,
      dimensions: specifications.dimensions,
      material: specifications.material,
      color: specifications.color,
      warranty: specifications.warranty,
    },
    supplier: {
      id: typeof supplierRaw === "string" ? supplierRaw : supplierRaw.id || supplierRaw._id || "",
      name: typeof supplierRaw === "string"
        ? "Supplier"
        : supplierRaw.name || [supplierRaw.firstName, supplierRaw.lastName].filter(Boolean).join(" ") || "Supplier",
      avatar: supplierRaw.avatar,
      rating: supplierRaw.rating ?? item.averageRating ?? 0,
      reviewCount: supplierRaw.reviewCount ?? reviews.length ?? 0,
      verified: Boolean(supplierRaw.verified),
      location: supplierRaw.location || supplierRaw.city || "",
    },
    delivery: {
      available: true,
      estimatedDays: item.delivery?.estimatedDays ?? 0,
      cost: item.delivery?.cost ?? 0,
      freeShippingThreshold: item.delivery?.freeShippingThreshold
    },
    rating: item.averageRating ?? 0,
    reviewCount: reviews.length ?? 0,
    viewsCount: item.views ?? 0,
    isFeatured: item.isFeatured ?? false,
    isFavorited: false,
    tags: item.tags || [],
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || item.createdAt || new Date().toISOString(),
    ordersCount: orders.length ?? 0,
    revenue,
    lastOrderDate,
  };
};

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
    case 'available': return 'bg-gradient-to-r from-emerald-500 to-green-500 text-white';
    case 'out-of-stock': return 'bg-gradient-to-r from-red-500 to-rose-500 text-white';
    case 'discontinued': return 'bg-gradient-to-r from-gray-500 to-slate-500 text-white';
    case 'pre-order': return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getTypeIcon = (type: Supply['type']) => {
  switch (type) {
    case 'cleaning': return <Shield className="w-3.5 h-3.5" />;
    case 'tools': return <Zap className="w-3.5 h-3.5" />;
    case 'materials': return <Package className="w-3.5 h-3.5" />;
    case 'equipment': return <Truck className="w-3.5 h-3.5" />;
    case 'subscription': return <Clock className="w-3.5 h-3.5" />;
    default: return <Package className="w-3.5 h-3.5" />;
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
  const { settings: appSettings } = useAppSettings();

  useEffect(() => {
    const fetchMySupplies = async () => {
      try {
        setLoading(true);
        if (!getApiToken()) {
          setSupplies([]);
          return;
        }
        
        const url = `${API_BASE_URL}${API_ENDPOINTS.suppliesMySupplies}`;
        const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));

        if (!response.ok) {
          logger.debug('My supplies API returned error', { status: response.status });
          setSupplies([]);
          return;
        }

        const data = await response.json();
        const suppliesData = data.supplies || data.data || data.results || data || [];
        
        if (Array.isArray(suppliesData)) {
          const normalized = suppliesData
            .filter((item): item is Record<string, unknown> => Boolean(item))
            .map(normalizeSupply);
          setSupplies(normalized);
        } else {
          setSupplies([]);
        }
      } catch (error) {
        logger.debug('Could not fetch my supplies', { error: error instanceof Error ? error.message : String(error) });
        setSupplies([]);
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
    const matchesCategory = selectedCategory === "All Categories" || supply.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesType = selectedType === "All Types" || supply.type === selectedType.toLowerCase();
    const matchesStatus = selectedStatus === "All Status" || supply.status === selectedStatus.toLowerCase().replace(' ', '-');
    
    return matchesSearch && matchesCategory && matchesType && matchesStatus;
  });

  const sortedSupplies = [...filteredSupplies].sort((a, b) => {
    let aValue: string | number, bValue: string | number;
    
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

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All Categories");
    setSelectedType("All Types");
    setSelectedStatus("All Status");
  };

  const hasActiveFilters = searchQuery || selectedCategory !== "All Categories" || selectedType !== "All Types" || selectedStatus !== "All Status";

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-8">
            <Link
              href="/supplies"
              className="p-2.5 hover:bg-white rounded-lg transition-all border-2 border-transparent hover:border-gray-200 hover:shadow-sm"
              title="Back to Supplies"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Package className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">My Supplies</h1>
              <p className="text-sm text-gray-600">Loading your supplies...</p>
            </div>
          </div>
          <ListSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-green-200/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-4 sm:p-5 mb-8 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Link
              href="/supplies"
              className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-200 transition-all"
              title="Back to Supplies"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-semibold">Back</span>
            </Link>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 truncate">My Supplies</h1>
              <p className="text-sm text-gray-600">
                {supplies.length} listing{supplies.length !== 1 ? "s" : ""} • {formatCurrency(totalRevenue, 'PHP', { appSettings })} total revenue
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCreateSupply}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg font-semibold shadow-lg shadow-emerald-500/20 hover:from-emerald-700 hover:to-emerald-800 hover:shadow-xl transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Supply</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-5 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Listings</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{supplies.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-5 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Orders</p>
                <p className="text-3xl font-bold text-emerald-600 mt-1">{totalOrders}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center shadow-md">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-5 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {formatCurrency(totalRevenue, 'PHP', { appSettings })}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center shadow-md">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-5 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Avg Rating</p>
                <p className="text-3xl font-bold text-amber-600 mt-1">{averageRating.toFixed(1)}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl flex items-center justify-center shadow-md">
                <Star className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Filters */}
          <div className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-5 sticky top-4">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-gray-900">Filters</h3>
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>
              </div>
              
              <div className={`space-y-5 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                {/* Search */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search supplies..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm appearance-none bg-white cursor-pointer"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Type */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Type</label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm appearance-none bg-white cursor-pointer"
                  >
                    {types.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm appearance-none bg-white cursor-pointer"
                  >
                    {statuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="w-full py-2.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Sort and Display Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Sort:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white cursor-pointer"
                  >
                    <option value="createdAt">Date Created</option>
                    <option value="name">Name</option>
                    <option value="price">Price</option>
                    <option value="rating">Rating</option>
                    <option value="stock">Stock</option>
                    <option value="orders">Orders</option>
                    <option value="revenue">Revenue</option>
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="p-2 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                  >
                    {sortOrder === 'asc' ? <SortAsc className="w-4 h-4 text-gray-600" /> : <SortDesc className="w-4 h-4 text-gray-600" />}
                  </button>
                  <button
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    className="p-2 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    title={`Switch to ${viewMode === 'grid' ? 'List' : 'Grid'} view`}
                  >
                    {viewMode === 'grid' ? <List className="w-4 h-4 text-gray-600" /> : <Grid3X3 className="w-4 h-4 text-gray-600" />}
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-500 font-medium">
                Showing {sortedSupplies.length} of {supplies.length} supplies
              </p>
            </div>

            {/* Supplies List */}
            {sortedSupplies.length === 0 ? (
              <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Package className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No supplies found</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {hasActiveFilters
                    ? "Try adjusting your filters to see more results."
                    : "Get started by listing your first supply item."}
                </p>
                <button
                  onClick={handleCreateSupply}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-semibold shadow-lg hover:from-emerald-700 hover:to-emerald-800 hover:shadow-xl transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add Your First Supply
                </button>
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5" 
                : "space-y-4"
              }>
                {sortedSupplies.map((supply) => (
                  <div 
                    key={supply.id} 
                    className="bg-white rounded-xl border-2 border-gray-200 shadow-lg overflow-hidden hover:shadow-xl hover:border-emerald-300 transition-all group"
                  >
                    {/* Image */}
                    <div className="relative aspect-video bg-gray-100">
                      {supply.images.length > 0 ? (
                        <Image
                          src={supply.images[0]}
                          alt={supply.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12 text-gray-300" />
                        </div>
                      )}
                      
                      {/* Status & Featured Badges */}
                      <div className="absolute top-3 right-3 flex flex-wrap gap-1.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(supply.status)}`}>
                          {supply.status.replace('-', ' ')}
                        </span>
                        {supply.isFeatured && (
                          <span className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-full text-xs font-semibold flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" />
                            Featured
                          </span>
                        )}
                      </div>
                      
                      {/* Quick Actions */}
                      <div className="absolute top-3 left-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleViewSupply(supply.id)}
                          className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white shadow-md transition-all"
                          title="View"
                        >
                          <Eye className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                          onClick={() => handleEditSupply(supply.id)}
                          className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white shadow-md transition-all"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                          onClick={() => handleDeleteSupply(supply.id)}
                          className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-red-50 shadow-md transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-1.5 line-clamp-1">{supply.name}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{supply.description}</p>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium">
                          {getTypeIcon(supply.type)}
                          <span className="capitalize">{supply.type}</span>
                        </span>
                        <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-medium">
                          {supply.category}
                        </span>
                        <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${
                          supply.stock > 20 ? 'bg-emerald-50 text-emerald-700' : 
                          supply.stock > 5 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                        }`}>
                          Stock: {supply.stock}
                        </span>
                      </div>
                      
                      {/* Price & Rating */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5">
                          <Star className="w-4 h-4 text-amber-400 fill-current" />
                          <span className="text-sm font-semibold">{supply.rating}</span>
                          <span className="text-sm text-gray-500">({supply.reviewCount})</span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">
                            {formatCurrency(supply.price, 'PHP', { appSettings })}
                            {supply.originalPrice && (
                              <span className="text-sm text-gray-400 line-through ml-1.5">
                                {formatCurrency(supply.originalPrice, 'PHP', { appSettings })}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">per {supply.unit}</div>
                        </div>
                      </div>
                      
                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <ShoppingCart className="w-4 h-4 text-emerald-500" />
                          <span>{supply.ordersCount} orders</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Eye className="w-4 h-4 text-blue-500" />
                          <span>{supply.viewsCount} views</span>
                        </div>
                      </div>

                      {/* Revenue */}
                      <div className="flex items-center justify-between py-3 px-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg mb-4">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-emerald-600" />
                          <span className="text-sm font-semibold text-emerald-700">
                            {formatCurrency(supply.revenue, 'PHP', { appSettings })} revenue
                          </span>
                        </div>
                        {supply.lastOrderDate && (
                          <span className="text-xs text-gray-500">
                            Last: {new Date(supply.lastOrderDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewSupply(supply.id)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button
                          onClick={() => handleEditSupply(supply.id)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 rounded-lg transition-all shadow-md"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
