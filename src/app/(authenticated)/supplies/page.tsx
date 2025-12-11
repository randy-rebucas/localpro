"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Plus,
  Star,
  Package,
  X,
  CheckCircle2,
  Zap,
  Headphones,
  HelpCircle,
  Truck,
  Navigation,
  RefreshCw,
  ClipboardList
} from "lucide-react";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { logger } from "@/lib/logger";
import { formatCurrency } from "@/lib/currency-utils";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useRoleAccess } from "@/components/role-guard";
import { createAuthFetchOptions } from "@/lib/auth-utils";

export interface Supply {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  type: 'cleaning' | 'tools' | 'materials' | 'equipment' | 'subscription';
  status: 'available' | 'out-of-stock' | 'discontinued' | 'pre-order';
  price: number;
  originalPrice?: number;
  currency: string;
  unit: 'piece' | 'pack' | 'box' | 'kg' | 'liter' | 'set';
  stock: number;
  minOrder: number;
  maxOrder?: number;
  sku?: string;
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
    bio?: string;
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
  orderCount: number;
  isFeatured: boolean;
  isFavorited: boolean;
  isSubscriptionEligible: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

const popularCategories = ['Cleaning', 'Tools', 'Materials', 'Equipment', 'Safety Gear'];

const shoppingTips = [
  "Compare prices from multiple suppliers",
  "Check delivery times before ordering",
  "Look for bulk discounts on large orders"
];

const sortOptions = [
  { value: "relevance", label: "Relevance" },
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
  { value: "popular", label: "Most Popular" },
];

// Helper function to validate and normalize supply data from API
const validateSupplyData = (supply: unknown): Supply | null => {
  if (!supply || typeof supply !== 'object') return null;
  
  const supplyObj = supply as Record<string, unknown>;
  
  // Extract pricing data (API uses pricing object with retailPrice/wholesalePrice/currency)
  const pricingData = supplyObj.pricing as Record<string, unknown> || {};
  const retailPrice = typeof pricingData.retailPrice === 'number' ? pricingData.retailPrice : 0;
  const wholesalePrice = typeof pricingData.wholesalePrice === 'number' ? pricingData.wholesalePrice : undefined;
  const currency = (pricingData.currency as string) || 'PHP';
  
  // Extract inventory data (API uses inventory object with quantity, minStock, maxStock, location)
  const inventoryData = supplyObj.inventory as Record<string, unknown> || {};
  const quantity = typeof inventoryData.quantity === 'number' ? inventoryData.quantity : 0;
  const minStock = typeof inventoryData.minStock === 'number' ? inventoryData.minStock : undefined;
  const maxStock = typeof inventoryData.maxStock === 'number' ? inventoryData.maxStock : undefined;
  const warehouseLocation = (inventoryData.location as string) || 'Warehouse';
  
  // Extract specifications (API provides these directly)
  const specs = supplyObj.specifications as Record<string, unknown> || {};
  
  // Extract supplier info (API uses firstName/lastName instead of name, and has profile.bio)
  const supplierData = supplyObj.supplier as Record<string, unknown> || {};
  const supplierFirstName = (supplierData.firstName as string) || '';
  const supplierLastName = (supplierData.lastName as string) || '';
  const supplierName = `${supplierFirstName} ${supplierLastName}`.trim() || 'Unknown Supplier';
  const supplierId = (supplierData._id as string) || (supplierData.id as string) || '';
  const supplierProfile = supplierData.profile as Record<string, unknown> || {};
  const supplierBio = (supplierProfile.bio as string) || '';
  
  // Determine status based on isActive flag and stock level
  let status: 'available' | 'out-of-stock' | 'discontinued' | 'pre-order' = 'available';
  if (supplyObj.isActive === false) {
    status = 'discontinued';
  } else if (quantity === 0) {
    status = 'out-of-stock';
  } else if (quantity < (minStock || 10)) {
    status = 'pre-order';
  }
  
  // Determine type based on category and subcategory
  let type: 'cleaning' | 'tools' | 'materials' | 'equipment' | 'subscription' = 'equipment';
  const category = (supplyObj.category as string) || 'Other';
  const subcategory = (supplyObj.subcategory as string) || '';
  if (category.includes('cleaning') || category.toLowerCase() === 'cleaning_supplies') {
    type = 'cleaning';
  } else if (category.includes('tool')) {
    type = 'tools';
  } else if (category.includes('material')) {
    type = 'materials';
  }
  
  // Check if subscription eligible - set type but also keep the flag
  const isSubscriptionEligible = Boolean(supplyObj.isSubscriptionEligible);
  if (isSubscriptionEligible) {
    type = 'subscription';
  }
  
  // Ensure required fields exist with defaults
  return {
    id: (supplyObj._id as string) || (supplyObj.id as string) || '',
    name: (supplyObj.name as string) || (supplyObj.title as string) || 'Unnamed Supply',
    description: (supplyObj.description as string) || '',
    category: category,
    subcategory: subcategory,
    type: type,
    status: status,
    price: retailPrice,
    originalPrice: wholesalePrice,
    currency: currency,
    unit: 'piece' as const,
    stock: quantity,
    minOrder: minStock || 1,
    maxOrder: maxStock,
    sku: (supplyObj.sku as string) || '',
    location: {
      address: warehouseLocation,
      city: '',
      state: '',
      zipCode: '',
      coordinates: undefined
    },
    images: Array.isArray(supplyObj.images) ? (supplyObj.images as string[]) : [],
    features: [],
    specifications: {
      brand: (specs.brand as string) || (supplyObj.brand as string),
      model: (supplyObj.sku as string),
      weight: (specs.weight as string),
      dimensions: (specs.dimensions as string),
      material: (specs.material as string),
      color: (specs.color as string),
      warranty: (specs.warranty as string)
    },
    supplier: {
      id: supplierId,
      name: supplierName,
      avatar: undefined,
      rating: 0,
      reviewCount: 0,
      verified: true,
      location: warehouseLocation,
      bio: supplierBio
    },
    delivery: {
      available: status !== 'discontinued',
      estimatedDays: 3,
      cost: 0,
      freeShippingThreshold: undefined
    },
    rating: (supplyObj.averageRating as number) || 0,
    reviewCount: Array.isArray(supplyObj.reviews) ? (supplyObj.reviews as unknown[]).length : 0,
    viewsCount: (supplyObj.views as number) || 0,
    orderCount: 0,
    isFeatured: Boolean(supplyObj.isFeatured),
    isFavorited: false,
    isSubscriptionEligible: isSubscriptionEligible,
    tags: Array.isArray(supplyObj.tags) ? (supplyObj.tags as string[]) : [],
    createdAt: (supplyObj.createdAt as string) || new Date().toISOString(),
    updatedAt: (supplyObj.updatedAt as string) || new Date().toISOString()
  };
};

export default function SuppliesPage() {
  const { settings: appSettings } = useAppSettings();
  const { canCreateSupplies, isClient, isProvider, isAdmin } = useRoleAccess();
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedType, setSelectedType] = useState("All Types");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [location, setLocation] = useState("");
  const [useNearby, setUseNearby] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("relevance");
  const router = useRouter();

  // Filter options
  const typeOptions = types.length > 0 ? ['All Types', ...types] : ['All Types', 'cleaning', 'tools', 'materials', 'equipment', 'subscription'];
  const categoryOptions = categories.length > 0 ? ['All Categories', ...categories] : ['All Categories'];

  // Get user location for nearby search
  useEffect(() => {
    if (navigator.geolocation && useNearby) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          logger.warn('Could not get user location', { 
            error: error instanceof Error ? error.message : String(error)
          });
          setUseNearby(false);
        }
      );
    }
  }, [useNearby]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    const fallbackCategories = ['cleaning_supplies', 'tools', 'materials', 'equipment', 'chemicals', 'safety_gear'];
    
    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.suppliesCategories}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));
      
      if (!response.ok) {
        setCategories(fallbackCategories);
        return;
      }

      const data = await response.json();
      const categoriesData = data.categories || data.data || data.items || data.results || [];
      const rawCategories = Array.isArray(categoriesData) ? categoriesData : [];
      
      const normalizedCategories = rawCategories.map((cat: unknown) => {
        if (typeof cat === 'string') return cat;
        if (cat && typeof cat === 'object') {
          const obj = cat as Record<string, unknown>;
          return obj._id || obj.id || obj.name || obj.value || obj.category || '';
        }
        return '';
      }).filter((cat): cat is string => typeof cat === 'string' && cat.length > 0);
      
      setCategories(normalizedCategories.length > 0 ? normalizedCategories : fallbackCategories);
    } catch {
      setCategories(fallbackCategories);
    }
  }, []);

  // Fetch types
  const fetchTypes = useCallback(async () => {
    const fallbackTypes = ['cleaning', 'tools', 'materials', 'equipment', 'subscription'];
    
    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.suppliesTypes}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));

      if (!response.ok) {
        setTypes(fallbackTypes);
        return;
      }

      const data = await response.json();
      const typesData = data.types || data.data || data.items || data.results || [];
      const rawTypes = Array.isArray(typesData) ? typesData : [];
      
      const normalizedTypes = rawTypes.map((type: unknown) => {
        if (typeof type === 'string') return type;
        if (type && typeof type === 'object') {
          const obj = type as Record<string, unknown>;
          return obj._id || obj.id || obj.name || obj.value || obj.type || '';
        }
        return '';
      }).filter((type): type is string => typeof type === 'string' && type.length > 0);
      
      setTypes(normalizedTypes.length > 0 ? normalizedTypes : fallbackTypes);
    } catch {
      setTypes(fallbackTypes);
    }
  }, []);

  // Fetch supplies
  useEffect(() => {
    const fetchSupplies = async () => {
      try {
        setLoading(true);
        
        let url = `${API_BASE_URL}${API_ENDPOINTS.supplies}`;
        
        // If nearby is enabled and we have location, use nearby endpoint
        if (useNearby && userLocation) {
          url = `${API_BASE_URL}${API_ENDPOINTS.suppliesNearby}?lat=${userLocation.lat}&lng=${userLocation.lng}`;
        }

        const fetchWith = async (useAuth: boolean) =>
          fetch(url, useAuth ? createAuthFetchOptions({ method: 'GET' }) : { method: 'GET' });

        let response = await fetchWith(true);
        if (response.status === 401) {
          // Retry without auth in case the endpoint is public
          response = await fetchWith(false);
        }

        if (!response.ok) {
          const errorText = await response.text().catch(() => '');
          throw new Error(`Failed to fetch supplies (status ${response.status})${errorText ? `: ${errorText}` : ''}`);
        }

        const data = await response.json();
        const suppliesData = data.supplies || data.data || data.items || data.results || [];
        const rawSupplies = Array.isArray(suppliesData) ? suppliesData : [];
        const validatedSupplies = rawSupplies.map(validateSupplyData).filter(Boolean) as Supply[];
        
        setSupplies(validatedSupplies);
      } catch (error) {
        logger.error('Error fetching supplies', error instanceof Error ? error : new Error(String(error)));
        // Set empty array to show "No supplies found" state
        setSupplies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSupplies();
  }, [useNearby, userLocation]);

  // Fetch metadata on mount
  useEffect(() => {
    fetchCategories();
    fetchTypes();
  }, [fetchCategories, fetchTypes]);

  const filteredSupplies = useMemo(() => {
    return supplies.filter(supply => {
      const matchesSearch = supply.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           supply.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           supply.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All Categories" || supply.category === selectedCategory;
      const matchesType = selectedType === "All Types" || supply.type === selectedType;
      const matchesLocation = !location || supply.location.city.toLowerCase().includes(location.toLowerCase()) ||
                             supply.location.state.toLowerCase().includes(location.toLowerCase());
      const matchesPrice = (!priceRange.min || supply.price >= parseFloat(priceRange.min)) &&
                       (!priceRange.max || supply.price <= parseFloat(priceRange.max));
      
      return matchesSearch && matchesCategory && matchesType && matchesLocation && matchesPrice;
    });
  }, [supplies, searchQuery, selectedCategory, selectedType, location, priceRange]);

  // Calculate active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== "All Categories") count++;
    if (selectedType !== "All Types") count++;
    if (location) count++;
    if (priceRange.min || priceRange.max) count++;
    if (useNearby) count++;
    return count;
  }, [selectedCategory, selectedType, location, priceRange, useNearby]);

  const formatPrice = (price: number) => {
    return formatCurrency(price, 'PHP', {
      appSettings,
      showSymbol: true,
    });
  };

  const clearFilters = () => {
    setSelectedCategory("All Categories");
    setSelectedType("All Types");
    setLocation("");
    setPriceRange({ min: "", max: "" });
    setSearchQuery("");
    setUseNearby(false);
  };

  const sortedSupplies = useMemo(() => {
    const sorted = [...filteredSupplies];
    
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
      case 'popular':
        return sorted.sort((a, b) => b.orderCount - a.orderCount);
      default:
        return sorted;
    }
  }, [filteredSupplies, sortBy]);

  const handleCreateSupply = () => {
    router.push('/supplies/create');
  };

  // Get featured supplies
  const featuredSupplies = useMemo(() => {
    return sortedSupplies.filter(s => s.isFeatured);
  }, [sortedSupplies]);

  const regularSupplies = useMemo(() => {
    return sortedSupplies.filter(s => !s.isFeatured);
  }, [sortedSupplies]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30 relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-yellow-200/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-orange-100/20 rounded-full blur-3xl animate-float animation-delay-4000"></div>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-yellow-200/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-orange-100/20 rounded-full blur-3xl animate-float animation-delay-4000"></div>
      </div>

      <div className="relative z-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Supplies — Tools, Materials & Equipment
              </h1>
              <p className="text-gray-600">
                Verified suppliers, competitive prices, and LocalPro support for every order.
              </p>
            </div>
            {canCreateSupplies && (
              <button
                onClick={handleCreateSupply}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30 hover:shadow-xl hover:scale-105 flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
                List Supply
              </button>
            )}
          </div>
        </div>

        {/* Subheader - Feature Links */}
        <div className="mb-6 flex items-center gap-6 border-b border-gray-200 pb-4">
          <Link 
            href="/supplies/my-orders" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors group"
          >
            <ClipboardList className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">My Orders</span>
          </Link>
          <Link 
            href="/supplies/my-supplies" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors group"
          >
            <Package className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">My Supplies</span>
          </Link>
          <Link 
            href="/supplies/verified" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors group"
          >
            <CheckCircle2 className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">Verified Suppliers</span>
          </Link>
          <Link 
            href="/support" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors group"
          >
            <Headphones className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">Support</span>
          </Link>
        </div>
          
        {/* Search Bar + Location */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative flex-1">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search supplies, tools, equipment, or suppliers"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-sm hover:shadow-md bg-white"
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
          <button
            onClick={() => setUseNearby(!useNearby)}
            className={`inline-flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all text-sm font-semibold ${
              useNearby
                ? 'border-orange-500 bg-orange-50 text-orange-700'
                : 'border-gray-300 hover:border-orange-500 hover:bg-orange-50 text-gray-700'
            }`}
            title="Use my location"
          >
            <Navigation className={`w-4 h-4 ${useNearby ? 'text-orange-600' : 'text-gray-500'}`} />
            Use my location
          </button>
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
                    <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-medium rounded-full">
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
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-sm hover:shadow-md bg-white font-medium"
                  >
                    {typeOptions.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Category Filter */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-sm hover:shadow-md bg-white font-medium"
                  >
                    {categoryOptions.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Location Filter */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    placeholder="City or area"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-sm hover:shadow-md bg-white"
                  />
                </div>

                {/* Price Range */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Price Range</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-sm hover:shadow-md bg-white"
                    />
                    <span className="self-center text-gray-500">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-sm hover:shadow-md bg-white"
                    />
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

              {/* Want to Sell Supplies - for clients */}
              {isClient && !isProvider && !isAdmin && (
                <div className="pt-6 border-t-2 border-gray-200">
                  <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-4 border border-orange-200">
                    <div className="flex items-start gap-3 mb-3">
                      <Package className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">Want to Sell Supplies?</h3>
                        <p className="text-xs text-gray-600 mt-1">Upgrade to a provider account to list your products.</p>
                      </div>
                    </div>
                    <Link
                      href="/plus?upgrade=provider"
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all shadow-sm hover:shadow-md font-medium text-sm"
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
                          ? "bg-orange-500 text-white border-orange-500"
                          : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shopping Tips */}
              <div className="pt-6 border-t-2 border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Shopping tips</h2>
                <ul className="space-y-3">
                  {shoppingTips.map((tip, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Need Help Section */}
              <div className="pt-6 border-t-2 border-gray-200">
                <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-4 border border-orange-200">
                  <div className="flex items-start gap-3 mb-3">
                    <HelpCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">Need Help?</h3>
                      <p className="text-xs text-gray-600 mt-1">Our team is here to help you find the right supplies.</p>
                    </div>
                  </div>
                  <Link
                    href="/support"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-orange-600 rounded-lg hover:bg-orange-50 transition-all border border-orange-200 font-medium text-sm"
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
                {sortedSupplies.length} suppl{sortedSupplies.length !== 1 ? 'ies' : 'y'} found
              </p>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm bg-white font-medium"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Featured Supplies Section */}
            {featuredSupplies.length > 0 && (
              <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  <h2 className="text-lg font-bold text-gray-900">Featured Supplies</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featuredSupplies.slice(0, 3).map((supply) => (
                    <SupplyCard key={supply.id} supply={supply} formatPrice={formatPrice} featured />
                  ))}
                </div>
              </div>
            )}

            {/* Supplies Grid */}
            {sortedSupplies.length === 0 ? (
              <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-8">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/20">
                    <Package className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No supplies found</h3>
                  <p className="text-gray-600 mb-6">
                    {searchQuery || activeFiltersCount > 0
                      ? "Try adjusting your filters to see more results."
                      : "Get started by listing your first supply item."}
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    {activeFiltersCount > 0 && (
                      <button
                        onClick={clearFilters}
                        className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30 hover:shadow-xl hover:scale-105 font-semibold"
                      >
                        Clear Filters
                      </button>
                    )}
                    {canCreateSupplies && (
                      <button
                        onClick={handleCreateSupply}
                        className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all shadow-sm hover:shadow-md font-medium"
                      >
                        List Your First Supply
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {regularSupplies.map((supply) => (
                  <SupplyCard key={supply.id} supply={supply} formatPrice={formatPrice} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Supply Card Component
interface SupplyCardProps {
  supply: Supply;
  formatPrice: (price: number) => string;
  featured?: boolean;
}

function SupplyCard({ supply, formatPrice, featured = false }: SupplyCardProps) {
  return (
    <Link
      href={`/supplies/${supply.id}`}
      className={`group bg-white rounded-xl border-2 ${featured ? 'border-yellow-300' : 'border-gray-200'} hover:border-orange-300 hover:shadow-xl transition-all duration-300 overflow-hidden`}
    >
      <div className="relative">
        {supply.images.length > 0 ? (
          <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
            <Image
              src={supply.images[0]}
              alt={supply.name}
              width={400}
              height={300}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-400" />
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
        {supply.isSubscriptionEligible && !featured && (
          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-600 text-white rounded text-xs font-bold">
              <RefreshCw className="w-3 h-3" />
              Subscribe
            </span>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span className="px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-lg text-sm font-bold text-gray-900 shadow-md">
            {formatPrice(supply.price)}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900 mb-1.5 line-clamp-1 group-hover:text-orange-600 transition-colors">
          {supply.name}
        </h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-1">
          {supply.supplier.name} • {supply.stock} in stock
        </p>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span className="text-sm font-semibold text-gray-700">{supply.rating}</span>
            <span className="text-xs text-gray-500">({supply.reviewCount})</span>
          </div>
          {supply.delivery.available && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Truck className="w-3 h-3" />
              {supply.delivery.estimatedDays}d delivery
            </span>
          )}
        </div>
        {supply.supplier.verified && (
          <div className="flex items-center gap-1 text-xs text-orange-600 mb-3">
            <CheckCircle2 className="w-3 h-3" />
            Verified Supplier
          </div>
        )}
        <button className="w-full px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all shadow-sm hover:shadow-md font-medium text-sm">
          Order Now
        </button>
      </div>
    </Link>
  );
}
