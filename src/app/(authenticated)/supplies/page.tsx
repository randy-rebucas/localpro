"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Search,
  Filter,
  Plus,
  MapPin,
  Star,
  Package,
  Clock,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  Truck,
  Shield,
  Zap,
  Heart,
  Share2,
  Eye,
  Edit,
  ShoppingCart
} from "lucide-react";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import { ListSkeleton } from "@/components/ui/loading";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useRoleAccess } from "@/components/role-guard";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
// Removed unused imports: createAuthFetchOptions, getApiToken
import { logger } from "@/lib/logger";
import { formatCurrency } from "@/lib/currency-utils";
import { useAppSettings } from "@/hooks/useAppSettings";

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
}

// Categories will be fetched from API

// Types and statuses will be fetched from API

// const units = [
//   "All Units",
//   "Piece",
//   "Pack",
//   "Box",
//   "Kg",
//   "Liter",
//   "Set"
// ];

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

// Helper function to get placeholder image URL
const getPlaceholderImage = (width: number = 400, height: number = 300, text?: string) => {
  const baseUrl = 'https://placehold.co';
  const size = `${width}x${height}`;
  const textParam = text ? `?text=${encodeURIComponent(text)}` : '';
  return `${baseUrl}/${size}${textParam}`;
};

// Helper function to validate and normalize supply data from API
const validateSupplyData = (supply: unknown): Supply | null => {
  if (!supply || typeof supply !== 'object') return null;
  
  const supplyObj = supply as Record<string, unknown>;
  
  // Extract pricing data (API uses pricing object with retailPrice/wholesalePrice)
  const pricingData = supplyObj.pricing as Record<string, unknown> || {};
  const retailPrice = typeof pricingData.retailPrice === 'number' ? pricingData.retailPrice : 0;
  const wholesalePrice = typeof pricingData.wholesalePrice === 'number' ? pricingData.wholesalePrice : undefined;
  
  // Extract inventory data (API uses inventory object with quantity, minStock, maxStock, location)
  const inventoryData = supplyObj.inventory as Record<string, unknown> || {};
  const quantity = typeof inventoryData.quantity === 'number' ? inventoryData.quantity : 0;
  const minStock = typeof inventoryData.minStock === 'number' ? inventoryData.minStock : undefined;
  const maxStock = typeof inventoryData.maxStock === 'number' ? inventoryData.maxStock : undefined;
  const warehouseLocation = (inventoryData.location as string) || 'Warehouse';
  
  // Extract specifications (API provides these directly)
  const specs = supplyObj.specifications as Record<string, unknown> || {};
  
  // Extract supplier info (API uses firstName/lastName instead of name)
  const supplierData = supplyObj.supplier as Record<string, unknown> || {};
  const supplierFirstName = (supplierData.firstName as string) || '';
  const supplierLastName = (supplierData.lastName as string) || '';
  const supplierName = `${supplierFirstName} ${supplierLastName}`.trim() || 'Unknown Supplier';
  const supplierId = (supplierData._id as string) || (supplierData.id as string) || '';
  
  // Determine status based on isActive flag and stock level
  let status: 'available' | 'out-of-stock' | 'discontinued' | 'pre-order' = 'available';
  if (!supplyObj.isActive) {
    status = 'discontinued';
  } else if (quantity === 0) {
    status = 'out-of-stock';
  } else if (quantity < (minStock || 10)) {
    status = 'pre-order';
  }
  
  // Determine type based on category and subcategory
  let type: 'cleaning' | 'tools' | 'materials' | 'equipment' | 'subscription' = 'equipment';
  const category = (supplyObj.category as string) || 'Other';
  if (category.includes('cleaning') || category.toLowerCase() === 'cleaning_supplies') {
    type = 'cleaning';
  } else if (category.includes('tool')) {
    type = 'tools';
  } else if (category.includes('material')) {
    type = 'materials';
  }
  
  // Check if subscription eligible
  if (supplyObj.isSubscriptionEligible) {
    type = 'subscription';
  }
  
  // Ensure required fields exist with defaults
  return {
    id: (supplyObj._id as string) || (supplyObj.id as string) || '',
    name: (supplyObj.name as string) || (supplyObj.title as string) || 'Unnamed Supply',
    description: (supplyObj.description as string) || '',
    category: category,
    type: type,
    status: status,
    price: retailPrice,
    originalPrice: wholesalePrice,
    unit: 'piece' as const,
    stock: quantity,
    minOrder: minStock || 1,
    maxOrder: maxStock,
    location: {
      address: '',
      city: '',
      state: '',
      zipCode: '',
      coordinates: undefined
    },
    images: Array.isArray(supplyObj.images) ? (supplyObj.images as string[]) : [],
    features: [],
    specifications: {
      brand: (specs.brand as string) || (supplyObj.brand as string),
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
      verified: false,
      location: warehouseLocation
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
    isFeatured: Boolean(supplyObj.isFeatured),
    isFavorited: false,
    tags: Array.isArray(supplyObj.tags) ? (supplyObj.tags as string[]) : [],
    createdAt: (supplyObj.createdAt as string) || new Date().toISOString(),
    updatedAt: (supplyObj.updatedAt as string) || new Date().toISOString()
  };
};

export default function SuppliesPage() {
  const { settings: appSettings } = useAppSettings();
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [featuredSupplies, setFeaturedSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedType, setSelectedType] = useState("All Types");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [location, setLocation] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'featured' | 'nearby'>('all');
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    count: 0
  });
  const router = useRouter();
  const { canCreateSupplies } = useRoleAccess();

  // Get user location for nearby search
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          logger.warn('Could not get user location', { 
            error: error instanceof Error ? error.message : String(error),
            code: (error as GeolocationPositionError)?.code,
            message: (error as GeolocationPositionError)?.message
          });
        }
      );
    }
  }, []);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      // Supplies categories is PUBLIC endpoint
      const url = `${API_BASE_URL}${API_ENDPOINTS.suppliesCategories}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const data = await response.json();
      
      // Handle different API response structures
      const categoriesData = data.categories || data.data || data.items || data.results || [];
      
      // Ensure categories is an array
      const categories = Array.isArray(categoriesData) ? categoriesData : [];
      
      setCategories(categories);
    } catch (error) {
      logger.error('Error fetching categories', error instanceof Error ? error : new Error(String(error)));
      setError('Failed to fetch categories');
      setCategories([]);
    }
  }, []);

  // Fetch types
  const fetchTypes = useCallback(async () => {
    try {
      // Supplies types is PUBLIC endpoint
      const url = `${API_BASE_URL}${API_ENDPOINTS.suppliesTypes}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        // Try to extract a safe error message from the response body
        const bodyText = await response.text();
        let parsed: unknown = null;
        try {
          parsed = JSON.parse(bodyText);
        } catch {
          // not JSON
        }

        const apiMessage = ((): string => {
          if (parsed && typeof parsed === 'object') {
            try {
              const p = parsed as Record<string, unknown>;
              const m = p.message ?? p.error;
              if (typeof m === 'string') return m;
            } catch {}
          }
          return typeof bodyText === 'string' && bodyText.length > 0 ? bodyText : 'Unknown error';
        })();

        // Handle known backend misrouting where 'types' is being interpreted as an ID
        if (typeof apiMessage === 'string' && apiMessage.toLowerCase().includes('invalid supply id')) {
          // Backend appears to be interpreting the 'types' path as a supply id (server routing issue).
          // Fall back to a reasonable client-side default and warn instead of throwing.
          logger.warn('Supplies types endpoint returned invalid id error; using local fallback types', { url, status: response.status, apiMessage });
          setTypes(['cleaning', 'tools', 'materials', 'equipment', 'subscription']);
          return;
        }

        throw new Error(`Failed to fetch types: ${response.status} ${apiMessage}`);
      }

      const data = await response.json();
      
      // Handle different API response structures
      const typesData = data.types || data.data || data.items || data.results || [];
      
      // Ensure types is an array
      const types = Array.isArray(typesData) ? typesData : [];
      
      setTypes(types);
    } catch (error) {
      // Log a safe, structured error and provide minimal context
      const context = { url: `${API_BASE_URL}${API_ENDPOINTS.suppliesTypes}` };
      if (error instanceof Error) {
        logger.error('Error fetching types', error, context);
      } else {
        logger.error('Error fetching types', new Error(String(error)), context);
      }

      setError('Failed to fetch types');
      setTypes([]);
    }
  }, []);

  // Fetch statuses
  const fetchStatuses = useCallback(async () => {
    try {
      // Supplies statuses is PUBLIC endpoint
      const url = `${API_BASE_URL}${API_ENDPOINTS.suppliesStatuses}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch statuses');
      }

      const data = await response.json();
      
      // Handle different API response structures
      const statusesData = data.statuses || data.data || data.items || data.results || [];
      
      // Ensure statuses is an array
      const statuses = Array.isArray(statusesData) ? statusesData : [];
      
      setStatuses(statuses);
    } catch (error) {
      logger.error('Error fetching statuses', error instanceof Error ? error : new Error(String(error)));
      setError('Failed to fetch statuses');
      setStatuses([]);
    }
  }, []);

  // Fetch featured supplies
  const fetchFeaturedSupplies = useCallback(async () => {
    try {
      // Featured supplies is PUBLIC endpoint
      const url = `${API_BASE_URL}${API_ENDPOINTS.suppliesFeatured}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch featured supplies');
      }

      const data = await response.json();
      
      // Handle different API response structures
      const featuredData = data.supplies || data.data || data.items || data.results || [];
      
      // Ensure featured supplies is an array and validate each item
      const rawFeaturedSupplies = Array.isArray(featuredData) ? featuredData : [];
      const featuredSupplies = rawFeaturedSupplies.map(validateSupplyData).filter(Boolean) as Supply[];
      
      logger.debug('Processed featured supplies', { processed: featuredSupplies.length, raw: rawFeaturedSupplies.length });
      
      setFeaturedSupplies(featuredSupplies);
    } catch (error) {
      logger.error('Error fetching featured supplies', error instanceof Error ? error : new Error(String(error)));
      setFeaturedSupplies([]);
    }
  }, []);

  // Fetch nearby supplies
  const fetchNearbySupplies = useCallback(async () => {
    if (!userLocation) {
      setError('Location is required for nearby search');
      return;
    }

    try {
      setLoading(true);

      // Nearby supplies is PUBLIC endpoint
      const url = `${API_BASE_URL}${API_ENDPOINTS.suppliesNearby}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch nearby supplies');
      }

      const data = await response.json();
      
      // Handle different API response structures
      const suppliesData = data.supplies || data.data || data.items || data.results || [];
      const paginationData = data.pagination || data.meta || {};
      
      // Ensure supplies is an array and validate each item
      const rawSupplies = Array.isArray(suppliesData) ? suppliesData : [];
      const supplies = rawSupplies.map(validateSupplyData).filter(Boolean) as Supply[];
      
      logger.debug('Processed nearby supplies', { processed: supplies.length, raw: rawSupplies.length });
      
      setSupplies(supplies);
      setPagination({
        page: paginationData.page || 1,
        pages: paginationData.pages || paginationData.totalPages || 1,
        total: paginationData.total || paginationData.count || supplies.length,
        count: paginationData.count || supplies.length
      });
    } catch (error) {
      logger.error('Error fetching nearby supplies', error instanceof Error ? error : new Error(String(error)));
      setError('Failed to fetch nearby supplies');
    } finally {
      setLoading(false);
    }
  }, [userLocation]);

  // Fetch all supplies with filters
  const fetchSupplies = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12'
      });

      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory !== 'All Categories') params.append('category', selectedCategory);
      if (selectedType !== 'All Types') params.append('type', selectedType);
      if (selectedStatus !== 'All Status') params.append('status', selectedStatus);
      if (priceRange.min) params.append('minPrice', priceRange.min);
      if (priceRange.max) params.append('maxPrice', priceRange.max);
      if (location) params.append('location', location);
      if (sortBy) params.append('sortBy', sortBy);
      if (sortOrder) params.append('sortOrder', sortOrder);

      // Supplies list is PUBLIC endpoint with query params
      const queryString = params.toString();
      const url = `${API_BASE_URL}${API_ENDPOINTS.supplies}${queryString ? `?${queryString}` : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch supplies');
      }

      const data = await response.json();
      
      // Log API response for debugging
      logger.debug('Supplies API Response', { response: data });
      
      // Handle different API response structures
      const suppliesData = data.supplies || data.data || data.items || data.results || [];
      const paginationData = data.pagination || data.meta || {};
      
      // Ensure supplies is an array and validate each item
      const rawSupplies = Array.isArray(suppliesData) ? suppliesData : [];
      const supplies = rawSupplies.map(validateSupplyData).filter(Boolean) as Supply[];
      
      logger.debug('Processed supplies', { processed: supplies.length, raw: rawSupplies.length });
      
      // Check if we have actual data
      if (supplies.length === 0 && !data.error) {
        logger.debug('No supplies found in API response', { data });
      }
      
      setSupplies(supplies);
      setPagination({
        page: paginationData.page || 1,
        pages: paginationData.pages || paginationData.totalPages || 1,
        total: paginationData.total || paginationData.count || supplies.length,
        count: paginationData.count || supplies.length
      });
    } catch (error) {
      logger.error('Error fetching supplies', error instanceof Error ? error : new Error(String(error)), { 
        filters: { 
          category: selectedCategory, 
          type: selectedType, 
          status: selectedStatus, 
          searchQuery 
        } 
      });
      setError('Failed to fetch supplies. Please try again later.');
      setSupplies([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedType, selectedStatus, priceRange, location, sortBy, sortOrder]);

  // Main useEffect to load initial data
  useEffect(() => {
    fetchCategories();
    fetchTypes();
    fetchStatuses();
    fetchFeaturedSupplies();
  }, [fetchCategories, fetchTypes, fetchStatuses, fetchFeaturedSupplies]);

  // Refetch supplies when filters change
  useEffect(() => {
    if (activeTab === 'all') {
      fetchSupplies();
    } else if (activeTab === 'nearby') {
      fetchNearbySupplies();
    }
  }, [activeTab, fetchSupplies, fetchNearbySupplies]);

  // Handle tab changes
  const handleTabChange = (tab: 'all' | 'featured' | 'nearby') => {
    setActiveTab(tab);
    if (tab === 'featured') {
      setSupplies(featuredSupplies);
    } else if (tab === 'nearby') {
      fetchNearbySupplies();
    } else {
      fetchSupplies();
    }
  };

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

  const handleViewSupply = (supplyId: string) => {
    router.push(`/supplies/${supplyId}`);
  };

  const handleEditSupply = (supplyId: string) => {
    router.push(`/supplies/${supplyId}/edit`);
  };

  const handleToggleFavorite = async (supplyId: string) => {
    // Implement favorite toggle
    logger.debug('Toggle favorite for supply', { supplyId });
  };

  const handleAddToCart = async (supplyId: string) => {
    // Implement add to cart
    logger.debug('Add to cart', { supplyId });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Supplies & Materials</h1>
            <p className="text-gray-600">Find tools, materials, and supplies for your projects</p>
          </div>
        </div>
        <ListSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Supplies & Materials</h1>
            <p className="text-gray-600">Find tools, materials, and supplies for your projects</p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading supplies</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => {
                    setError(null);
                    if (activeTab === 'nearby') {
                      fetchNearbySupplies();
                    } else {
                      fetchSupplies();
                    }
                  }}
                  className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Marketplace', href: '/marketplace' },
          { label: 'Supplies & Materials', href: '/supplies' }
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supplies & Materials</h1>
          <p className="text-gray-600">Find tools, materials, and supplies for your projects</p>
        </div>
        {canCreateSupplies && (
          <Button onClick={handleCreateSupply} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            List Supply
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => handleTabChange('all')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'all'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All Supplies
        </button>
        <button
          onClick={() => handleTabChange('featured')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'featured'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Featured
        </button>
        <button
          onClick={() => handleTabChange('nearby')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'nearby'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Nearby
        </button>
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
              <p className="text-sm text-gray-600">Available</p>
              <p className="text-2xl font-bold text-green-600">
                {supplies.filter(supply => supply.status === 'available').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-green-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Featured</p>
              <p className="text-2xl font-bold text-yellow-600">
                {supplies.filter(supply => supply.isFeatured).length}
              </p>
            </div>
            <Star className="w-8 h-8 text-yellow-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Categories</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(supplies.map(supply => supply.category)).size}
              </p>
            </div>
            <Filter className="w-8 h-8 text-purple-600" />
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
                    options={[
                      { value: "All Categories", label: "All Categories" },
                      ...categories.map(cat => ({ value: cat, label: cat }))
                    ]}
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Type</label>
                  <Select
                    value={selectedType}
                    onValueChange={(value) => setSelectedType(value)}
                    options={[
                      { value: "All Types", label: "All Types" },
                      ...types.map(type => ({ value: type, label: type }))
                    ]}
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
                  <Select
                    value={selectedStatus}
                    onValueChange={(value) => setSelectedStatus(value)}
                    options={[
                      { value: "All Status", label: "All Status" },
                      ...statuses.map(status => ({ value: status, label: status }))
                    ]}
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
                    { value: 'stock', label: 'Stock' }
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {error ? 'Failed to load supplies' : 'No supplies found'}
              </h3>
              <p className="text-gray-600 mb-4">
                {error 
                  ? 'There was an error loading supplies. Please try again.' 
                  : searchQuery || selectedCategory !== "All Categories" || selectedType !== "All Types" || selectedStatus !== "All Status"
                    ? "Try adjusting your filters to see more results."
                    : "Get started by listing your first supply item."
                }
              </p>
              <div className="flex gap-2 justify-center">
                {!error && canCreateSupplies && (
                  <Button onClick={handleCreateSupply}>
                    List Your First Supply
                  </Button>
                )}
                {error && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setError(null);
                      if (activeTab === 'nearby') {
                        fetchNearbySupplies();
                      } else {
                        fetchSupplies();
                      }
                    }}
                  >
                    Retry
                  </Button>
                )}
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All Categories");
                    setSelectedType("All Types");
                    setSelectedStatus("All Status");
                    setPriceRange({ min: "", max: "" });
                    setLocation("");
                    setError(null);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </Card>
          ) : (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6" 
              : "space-y-4"
            }>
              {sortedSupplies.map((supply) => (
                <Card key={supply.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <div className="aspect-video bg-gray-100">
                      <Image
                        src={supply.images && supply.images.length > 0 ? supply.images[0] : getPlaceholderImage(400, 225, supply.name)}
                        alt={supply.name}
                        width={400}
                        height={225}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = getPlaceholderImage(400, 225, supply.name);
                        }}
                      />
                    </div>
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
                        onClick={() => handleToggleFavorite(supply.id)}
                        className={`p-1 ${supply.isFavorited ? 'text-red-500' : 'text-gray-400'}`}
                      >
                        <Heart className={`w-4 h-4 ${supply.isFavorited ? 'fill-current' : ''}`} />
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
                      <h3 className="font-semibold text-gray-900 line-clamp-1">{supply.name}</h3>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewSupply(supply.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {canCreateSupplies && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditSupply(supply.id)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
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
                          {formatCurrency(supply.price, 'PHP', { appSettings })}
                          {supply.originalPrice && (
                            <span className="text-sm text-gray-500 line-through ml-1">
                              {formatCurrency(supply.originalPrice || 0, 'PHP', { appSettings })}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">/{supply.unit}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{supply.location.city}, {supply.location.state}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{supply.viewsCount} views</span>
                      </div>
                    </div>

                    {supply.delivery.available && (
                      <div className="text-xs text-green-600 mb-3 flex items-center gap-1">
                        <Truck className="w-3 h-3" />
                        Delivery: {supply.delivery.estimatedDays} days
                        {supply.delivery.cost === 0 ? ' (Free)' : ` ($${supply.delivery.cost})`}
                      </div>
                    )}
                    
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
                            onClick={() => handleAddToCart(supply.id)}
                            className="flex items-center gap-1"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-8 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * 12) + 1} to {Math.min(pagination.page * 12, pagination.total)} of {pagination.total} results
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (activeTab === 'nearby') {
                      fetchNearbySupplies();
                    } else {
                      fetchSupplies(pagination.page - 1);
                    }
                  }}
                  disabled={pagination.page <= 1}
                >
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    let pageNum: number;
                    if (pagination.pages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.pages - 2) {
                      pageNum = pagination.pages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        size="sm"
                        variant={pagination.page === pageNum ? undefined : 'outline'}
                        onClick={() => fetchSupplies(pageNum)}
                        className={`px-3 py-1 rounded text-sm font-medium ${pagination.page === pageNum ? 'bg-purple-600 text-white' : 'text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (activeTab === 'nearby') {
                      fetchNearbySupplies();
                    } else {
                      fetchSupplies(pagination.page + 1);
                    }
                  }}
                  disabled={pagination.page >= pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
