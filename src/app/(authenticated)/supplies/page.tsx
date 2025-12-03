"use client";

import { useState, useEffect, useCallback } from "react";
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
  RefreshCw
} from "lucide-react";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { logger } from "@/lib/logger";
import { formatCurrency } from "@/lib/currency-utils";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useRoleAccess } from "@/components/role-guard";

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


// Helper function to validate and normalize supply data from API
const validateSupplyData = (supply: unknown): Supply | null => {
  if (!supply || typeof supply !== 'object') return null;
  
  const supplyObj = supply as Record<string, unknown>;
  
  // Extract pricing data (API uses pricing object with retailPrice/wholesalePrice/currency)
  const pricingData = supplyObj.pricing as Record<string, unknown> || {};
  const retailPrice = typeof pricingData.retailPrice === 'number' ? pricingData.retailPrice : 0;
  const wholesalePrice = typeof pricingData.wholesalePrice === 'number' ? pricingData.wholesalePrice : undefined;
  const currency = (pricingData.currency as string) || 'USD';
  
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
  const { canCreateSupplies } = useRoleAccess();
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedType, setSelectedType] = useState("All Types");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [location, setLocation] = useState("");
  const [useNearby, setUseNearby] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [sortBy] = useState<'name' | 'price' | 'rating' | 'createdAt'>('createdAt');
  const [sortOrder] = useState<'asc' | 'desc'>('desc');
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
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
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
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

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
        
        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch supplies');
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

  const filteredSupplies = supplies.filter(supply => {
    const matchesSearch = supply.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         supply.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         supply.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All Categories" || supply.category === selectedCategory;
    const matchesType = selectedType === "All Types" || supply.type === selectedType;
    const matchesStatus = selectedStatus === "All Status" || supply.status === selectedStatus;
    const matchesLocation = !location || supply.location.city.toLowerCase().includes(location.toLowerCase()) ||
                           supply.location.state.toLowerCase().includes(location.toLowerCase());
    const matchesPrice = (!priceRange.min || supply.price >= parseFloat(priceRange.min)) &&
                     (!priceRange.max || supply.price <= parseFloat(priceRange.max));
    
    return matchesSearch && matchesCategory && matchesType && matchesStatus && matchesLocation && matchesPrice;
  });

  const formatPrice = (price: number) => {
    return formatCurrency(price, 'PHP', {
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
    setUseNearby(false);
  };

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

  const handleCreateSupply = () => {
    router.push('/supplies/create');
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

          {/* Supplies Grid Skeleton */}
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

  // Get featured supply
  const featuredSupply = sortedSupplies.length > 0 
    ? (sortedSupplies.find(s => s.isFeatured) || sortedSupplies[0])
    : null;
  const regularSupplies = featuredSupply 
    ? sortedSupplies.filter(s => s.id !== featuredSupply.id)
    : sortedSupplies;

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
            Find quality supplies — tools, materials, equipment & more
          </h1>
          <p className="text-gray-600 mb-6">
            Verified suppliers, competitive prices, and LocalPro support for every order.
          </p>
          
          {/* Search Bar */}
          <div className="relative mb-4">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search supplies, tools, equipment, or supplier"
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
              <span className="text-sm font-medium text-gray-700">Verified Suppliers</span>
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-all shadow-sm hover:shadow-md">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-gray-700">Fast Delivery</span>
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-all shadow-sm hover:shadow-md">
              <Headphones className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-gray-700">Local Support</span>
            </button>
            {canCreateSupplies && (
              <button
                onClick={handleCreateSupply}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105 ml-auto"
              >
                <Plus className="w-4 h-4" />
                List Supply
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
                
                {/* Nearby Toggle */}
                <div className="mb-4">
                  <button
                    onClick={() => setUseNearby(!useNearby)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                      useNearby 
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                        : 'border-gray-300 hover:border-emerald-500 hover:bg-emerald-50'
                    }`}
                  >
                    <Navigation className={`w-4 h-4 ${useNearby ? 'text-emerald-600' : 'text-gray-500'}`} />
                    <span className="text-sm font-medium">Use my location</span>
                  </button>
                </div>

                {/* Type Filter */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                  <select
                    value={selectedType}
                    onChange={(e) => handleFilterChange("type", e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white font-medium"
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
                    onChange={(e) => handleFilterChange("category", e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white font-medium"
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
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                  />
                </div>

                {/* Price Range */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Price Range</label>
                  <div className="space-y-2">
                    <input
                      type="number"
                      placeholder="Min price"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                    />
                    <input
                      type="number"
                      placeholder="Max price"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                    />
                  </div>
                </div>

                {/* Clear Filters */}
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
                >
                  Clear all filters
                </button>
              </div>

              {/* Need Help Section */}
              <div className="pt-6 border-t-2 border-gray-200">
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-4 border border-emerald-200">
                  <div className="flex items-start gap-3 mb-3">
                    <HelpCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">
                      Contact LocalPro support for ordering assistance.
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

            {/* Supplies Content */}
            {sortedSupplies.length === 0 ? (
              <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg p-8 backdrop-blur-sm">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/20">
                    <Package className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent mb-2">No supplies found</h3>
                  <p className="text-gray-600 mb-6">
                    {searchQuery || selectedCategory !== "All Categories" || selectedType !== "All Types" || selectedStatus !== "All Status"
                      ? "Try adjusting your filters to see more results."
                      : "Get started by listing your first supply item."}
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
                    {canCreateSupplies && (
                      <button
                        onClick={handleCreateSupply}
                        className="px-6 py-3 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-300 text-gray-700 rounded-lg hover:from-gray-50 hover:to-gray-100 transition-all shadow-sm hover:shadow-md font-medium"
                      >
                        List Your First Supply
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Featured Supply - Hero Card */}
                {featuredSupply && (
                  <Link
                    href={`/supplies/${featuredSupply.id}`}
                    className="block bg-white rounded-xl border-2 border-emerald-300 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300"
                  >
                    <div className="flex flex-col md:flex-row">
                      {/* Featured Image */}
                      <div className="md:w-2/5 relative">
                        <div className="absolute top-4 left-4 z-10">
                          <span className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-lg">
                            Featured
                          </span>
                        </div>
                        {featuredSupply.images.length > 0 ? (
                          <div className="h-48 md:h-full md:min-h-[280px] bg-gray-100 overflow-hidden">
                            <Image
                              src={featuredSupply.images[0]}
                              alt={featuredSupply.name}
                              width={500}
                              height={300}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-48 md:h-full md:min-h-[280px] bg-gradient-to-br from-orange-200 via-yellow-200 to-orange-300 flex items-center justify-center">
                            <Package className="w-20 h-20 text-orange-600" />
                          </div>
                        )}
                      </div>
                      {/* Featured Content */}
                      <div className="md:w-3/5 p-6 flex flex-col justify-center">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          {featuredSupply.name}
                        </h3>
                        <p className="text-gray-600 mb-4 line-clamp-2">
                          {featuredSupply.description || `Quality ${featuredSupply.category} from ${featuredSupply.supplier.name}`}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 mb-4">
                          <span className="text-2xl font-bold text-emerald-600">
                            {formatPrice(featuredSupply.price)}
                            <span className="text-sm font-normal text-gray-500"> / {featuredSupply.unit}</span>
                          </span>
                          <div className="flex items-center gap-1">
                            <Star className="w-5 h-5 text-yellow-500 fill-current" />
                            <span className="font-semibold text-gray-700">{featuredSupply.rating}</span>
                            <span className="text-gray-500">({featuredSupply.reviewCount} reviews)</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                            {featuredSupply.stock} in stock
                          </span>
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                            {featuredSupply.category}
                            {featuredSupply.subcategory && ` • ${featuredSupply.subcategory}`}
                          </span>
                          {featuredSupply.isSubscriptionEligible && (
                            <span className="flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                              <RefreshCw className="w-3.5 h-3.5" />
                              Subscribe & Save
                            </span>
                          )}
                          {featuredSupply.delivery.available && (
                            <span className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                              <Truck className="w-4 h-4" />
                              {featuredSupply.delivery.estimatedDays} day delivery
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg font-semibold shadow-lg">
                            Order Now
                          </span>
                          <span className="text-sm text-gray-500">
                            by {featuredSupply.supplier.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )}

                {/* Section Header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">
                    {featuredSupply ? 'All Supplies' : 'Available Supplies'}
                  </h2>
                  <span className="text-sm text-gray-500">
                    {sortedSupplies.length} item{sortedSupplies.length !== 1 ? 's' : ''} found
                  </span>
                </div>

                {/* All Supplies Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(featuredSupply ? regularSupplies : sortedSupplies).map((supply) => (
                    <Link
                      key={supply.id}
                      href={`/supplies/${supply.id}`}
                      className="group bg-white rounded-xl border-2 border-gray-200 hover:border-emerald-300 hover:shadow-xl transition-all duration-300 overflow-hidden"
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
                        <div className="absolute top-3 right-3">
                          <span className="px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-lg text-sm font-bold text-gray-900 shadow-md">
                            {formatPrice(supply.price)}
                          </span>
                        </div>
                        <div className="absolute top-3 left-3 flex flex-col gap-1">
                          {supply.isFeatured && (
                            <span className="px-2 py-1 bg-emerald-600 text-white rounded text-xs font-bold">
                              Featured
                            </span>
                          )}
                          {supply.isSubscriptionEligible && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-600 text-white rounded text-xs font-bold">
                              <RefreshCw className="w-3 h-3" />
                              Subscribe
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 mb-1.5 line-clamp-1 group-hover:text-emerald-600 transition-colors">
                          {supply.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-1">
                          {supply.supplier.name} • {supply.stock} in stock
                        </p>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-semibold text-gray-700">{supply.rating}</span>
                          </div>
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                            {supply.category}
                            {supply.subcategory && ` • ${supply.subcategory}`}
                          </span>
                        </div>
                        <button className="w-full px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-sm hover:shadow-md font-medium text-sm">
                          Order
                        </button>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
