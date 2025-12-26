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
  ClipboardList,
  Filter,
  Grid3x3,
  List,
  ArrowUp,
  ArrowDown,
  Tag,
  DollarSign,
  MapPin
} from "lucide-react";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { logger } from "@/lib/logger";
import { formatCurrency } from "@/lib/currency-utils";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useRoleAccess } from "@/components/role-guard";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { Broadcaster } from "@/components/broadcaster";
import { useActiveRoleView } from "@/shared/hooks/useActiveRoleView";

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
  useActiveRoleView();
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedType, setSelectedType] = useState("All Types");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [location, setLocation] = useState("");
  const [useNearby, setUseNearby] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("relevance");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const router = useRouter();
  
  const itemsPerPage = 12;

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
    setSearchInput("");
    setUseNearby(false);
    setCurrentPage(1);
  };

  const sortedSupplies = useMemo(() => {
    const sorted = [...filteredSupplies];
    
    let result: Supply[];
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
      case 'popular':
        result = sorted.sort((a, b) => b.orderCount - a.orderCount);
        break;
      default:
        result = sorted;
    }
    
    // Apply sort order (reverse if descending)
    if (sortOrder === 'desc' && sortBy !== 'relevance') {
      result = result.reverse();
    }
    
    return result;
  }, [filteredSupplies, sortBy, sortOrder]);

  const handleCreateSupply = () => {
    router.push('/supplies/create');
  };

  // Get featured supplies (always show first, not paginated)
  const featuredSupplies = useMemo(() => {
    return sortedSupplies.filter(s => s.isFeatured);
  }, [sortedSupplies]);

  // Regular supplies for pagination (exclude featured)
  const regularSuppliesForPagination = useMemo(() => {
    return sortedSupplies.filter(s => !s.isFeatured);
  }, [sortedSupplies]);
  
  // Pagination calculations (only for regular supplies)
  const totalPages = Math.ceil(regularSuppliesForPagination.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSupplies = regularSuppliesForPagination.slice(startIndex, endIndex);

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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
                Supplies — Tools, Materials & Equipment
              </h1>
              <p className="text-gray-600">
                Verified suppliers, competitive prices, and LocalPro support for every order.
              </p>
            </div>
            {canCreateSupplies && (
              <button
                onClick={handleCreateSupply}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-accent to-accent rounded-lg hover:from-accent hover:to-accent transition-all shadow-lg shadow-green-500/30 hover:shadow-xl hover:scale-105 flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
                List Supply
              </button>
            )}
          </div>

          {/* Quick Links - Following Reference Layout */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 border-b border-gray-200 pb-4">
            <Link 
              href="/supplies/my-orders" 
              className="inline-flex items-center gap-2 text-gray-600 hover:text-accent transition-colors group"
            >
              <ClipboardList className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">My Orders</span>
            </Link>
            <Link 
              href="/supplies/my-supplies" 
              className="inline-flex items-center gap-2 text-gray-600 hover:text-accent transition-colors group"
            >
              <Package className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">My Supplies</span>
            </Link>
            <Link 
              href="/supplies/verified" 
              className="inline-flex items-center gap-2 text-gray-600 hover:text-accent transition-colors group"
            >
              <CheckCircle2 className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Verified Suppliers</span>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Left Sidebar - Filters */}
            <aside className={`lg:w-[280px] flex-shrink-0 ${filterDrawerOpen ? "block" : "hidden lg:block"}`}>
              {/* Mobile Overlay */}
              {filterDrawerOpen && (
                <div
                  className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                  onClick={() => setFilterDrawerOpen(false)}
                />
              )}

              <div
                className={`bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden sticky top-24 ${
                  filterDrawerOpen
                    ? "fixed right-0 top-0 h-full w-80 z-50 overflow-y-auto lg:relative lg:w-auto lg:h-auto lg:z-auto"
                    : ""
                }`}
              >
                {/* Header */}
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
                      onClick={() => setFilterDrawerOpen(false)}
                      className="lg:hidden p-2 rounded-lg hover:bg-white/50 transition-colors"
                      aria-label="Close filters"
                    >
                      <X className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Filter Content */}
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
                      className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all text-gray-700"
                      aria-label="Select type"
                    >
                      {typeOptions.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {/* Category Filter */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-accent" />
                      <label className="text-sm font-semibold text-gray-900">Category</label>
                    </div>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all text-gray-700"
                      aria-label="Select category"
                    >
                      {categoryOptions.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Location Filter */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-accent" />
                      <label className="text-sm font-semibold text-gray-900">Location</label>
                    </div>
                    <div className="space-y-3">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Enter location..."
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="w-full px-4 py-2.5 pr-11 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                          aria-label="Location"
                        />
                        <button
                          type="button"
                          onClick={() => setUseNearby(!useNearby)}
                          disabled={false}
                          className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-9 h-9 rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Use current location"
                          title="Use current location"
                        >
                          <Navigation className="w-4 h-4" />
                        </button>
                      </div>
                      {useNearby && userLocation && (
                        <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                          Using your current location.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-accent" />
                      <label className="text-sm font-semibold text-gray-900">Price Range</label>
                    </div>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Min"
                          value={priceRange.min}
                          onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                          className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                        />
                        <span className="self-center text-gray-500">-</span>
                        <input
                          type="number"
                          placeholder="Max"
                          value={priceRange.max}
                          onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                          className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Clear Filters Button */}
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all border-2 border-transparent hover:border-gray-300 flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Clear All Filters
                    </button>
                  )}
                </div>

                {/* Additional Content Sections */}
                <div className="px-6 pb-6 space-y-6">
                  {/* Want to Sell Supplies - for clients */}
                  {isClient && !isProvider && !isAdmin && (
                    <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg p-4 border border-accent/20">
                      <div className="flex items-start gap-3 mb-3">
                        <Package className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">Want to Sell Supplies?</h3>
                          <p className="text-xs text-gray-600 mt-1">Upgrade to a provider account to list your products.</p>
                        </div>
                      </div>
                      <Link
                        href="/plus?upgrade=provider"
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-all shadow-sm hover:shadow-md font-medium text-sm"
                      >
                        Upgrade Now
                      </Link>
                    </div>
                  )}

                  {/* Popular Categories */}
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Popular Categories</h2>
                    <div className="flex flex-wrap gap-2">
                      {popularCategories.map((category) => (
                        <button
                          key={category}
                          onClick={() => {
                            setSearchInput(category);
                            setSearchQuery(category);
                          }}
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

                  {/* Shopping Tips */}
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Shopping tips</h2>
                    <ul className="space-y-3">
                      {shoppingTips.map((tip, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-accent mt-1">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Need Help Section */}
                  <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg p-4 border border-accent/20">
                    <div className="flex items-start gap-3 mb-3">
                      <HelpCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">Need Help?</h3>
                        <p className="text-xs text-gray-600 mt-1">Our team is here to help you find the right supplies.</p>
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
              </div>
            </aside>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {/* Mobile Filter Button */}
            <div className="lg:hidden mb-4">
              <button
                onClick={() => setFilterDrawerOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
                aria-label="Open filters"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-accent text-white rounded-full text-xs font-semibold">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>

            {/* Search | Sort | Display Mode Bar */}
            <div className="mb-6">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {/* Search */}
                  <div className="relative w-full sm:w-[70%]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Search supplies, tools, equipment, or suppliers..."
                      className="w-full pl-9 pr-9 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all text-gray-700"
                      aria-label="Search supplies"
                    />
                    {searchInput.trim().length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchInput("");
                          setSearchQuery("");
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                        aria-label="Clear search"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Sort Controls */}
                  <div className="flex items-center gap-2 w-full sm:w-[20%]">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="flex-1 min-w-0 px-2.5 py-2 text-xs font-medium border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all text-gray-700 cursor-pointer"
                        aria-label="Sort supplies by"
                      >
                        <option value="relevance">Relevance</option>
                        <option value="newest">Date</option>
                        <option value="price-low">Price</option>
                        <option value="rating">Rating</option>
                        <option value="popular">Popular</option>
                      </select>
                      <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="p-2 border border-gray-300 rounded-lg bg-white hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all text-gray-700 cursor-pointer flex-shrink-0"
                        aria-label={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
                        title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
                      >
                        {sortOrder === 'asc' ? (
                          <ArrowUp className="w-4 h-4" />
                        ) : (
                          <ArrowDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Display Mode Toggle */}
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-full sm:w-[10%] justify-center sm:justify-start">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-md transition-all duration-200 ${
                        viewMode === 'grid'
                          ? 'bg-white text-emerald-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      title="Grid View"
                      aria-label="Switch to grid view"
                    >
                      <Grid3x3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-md transition-all duration-200 ${
                        viewMode === 'list'
                          ? 'bg-white text-emerald-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      title="List View"
                      aria-label="Switch to list view"
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Error State */}
            {/* Note: Add error state handling if needed */}

            {/* Featured Supplies Section */}
            {featuredSupplies.length > 0 && (
              <div className="mb-6 bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  <h2 className="text-lg font-bold text-gray-900">Featured Supplies</h2>
                </div>
                <div className={viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  : "space-y-4"
                }>
                  {featuredSupplies.slice(0, 3).map((supply) => (
                    <SupplyCard key={supply.id} supply={supply} formatPrice={formatPrice} featured viewMode={viewMode} />
                  ))}
                </div>
              </div>
            )}

            {/* Supplies Results */}
            {regularSuppliesForPagination.length === 0 && featuredSupplies.length === 0 ? (
              <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-8">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-accent/20 to-accent/30 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-accent/20">
                    <Package className="w-8 h-8 text-accent" />
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
                        className="px-6 py-3 bg-gradient-to-r from-accent to-accent text-white rounded-lg hover:from-accent hover:to-accent transition-all shadow-lg shadow-green-500/30 hover:shadow-xl hover:scale-105 font-semibold"
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
              <>
                <div className={viewMode === 'grid' 
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                  : "space-y-4"
                }>
                  {paginatedSupplies.map((supply) => (
                    <SupplyCard key={supply.id} supply={supply} formatPrice={formatPrice} viewMode={viewMode} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                    <div className="text-sm text-gray-600">
                      Showing {startIndex + 1} to {Math.min(endIndex, regularSuppliesForPagination.length)} of {regularSuppliesForPagination.length} results
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
                                  ? 'bg-accent text-white'
                                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
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

// Supply Card Component
interface SupplyCardProps {
  supply: Supply;
  formatPrice: (price: number) => string;
  featured?: boolean;
  viewMode?: 'grid' | 'list';
}

function SupplyCard({ supply, formatPrice, featured = false, viewMode = 'grid' }: SupplyCardProps) {
  if (viewMode === 'list') {
    return (
      <Link
        href={`/supplies/${supply.id}`}
        className="group bg-white rounded-xl border-2 border-gray-200 hover:border-accent hover:shadow-xl transition-all duration-300 overflow-hidden flex gap-4"
      >
        <div className="relative w-32 h-32 flex-shrink-0">
          {supply.images.length > 0 ? (
            <Image
              src={supply.images[0]}
              alt={supply.name}
              width={128}
              height={128}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>
        <div className="flex-1 p-4">
          <h3 className="font-bold text-gray-900 mb-1 group-hover:text-accent transition-colors">
            {supply.name}
          </h3>
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{supply.description}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-lg font-bold text-gray-900">{formatPrice(supply.price)}</span>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="text-sm font-semibold text-gray-700">{supply.rating}</span>
                <span className="text-xs text-gray-500">({supply.reviewCount})</span>
              </div>
            </div>
            <button className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-all shadow-sm hover:shadow-md font-medium text-sm">
              Order Now
            </button>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/supplies/${supply.id}`}
      className={`group bg-white rounded-xl border-2 ${featured ? 'border-yellow-300' : 'border-gray-200'} hover:border-accent hover:shadow-xl transition-all duration-300 overflow-hidden`}
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
        <h3 className="font-bold text-gray-900 mb-1.5 line-clamp-1 group-hover:text-accent transition-colors">
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
          <div className="flex items-center gap-1 text-xs text-accent mb-3">
            <CheckCircle2 className="w-3 h-3" />
            Verified Supplier
          </div>
        )}
        <button className="w-full px-4 py-2.5 bg-accent text-white rounded-lg hover:bg-accent/90 transition-all shadow-sm hover:shadow-md font-medium text-sm">
          Order Now
        </button>
      </div>
    </Link>
  );
}
