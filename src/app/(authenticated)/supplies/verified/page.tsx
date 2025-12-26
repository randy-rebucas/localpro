"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Package,
  X,
  CheckCircle2,
  Zap,
  HelpCircle,
  Truck,
  RefreshCw,
  Star,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { logger } from "@/lib/logger";
import { formatCurrency } from "@/lib/currency-utils";
import { useAppSettings } from "@/hooks/useAppSettings";
import { Supply } from "../page";

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
  const supplierVerified = supplierData.isVerified === true || supplierData.verified === true;
  
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
      verified: supplierVerified,
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

export default function VerifiedSuppliersPage() {
  const { settings: appSettings } = useAppSettings();
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [categories, setCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("relevance");

  const categoryOptions = categories.length > 0 ? ['All Categories', ...categories] : ['All Categories'];

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

  // Fetch supplies and filter for verified suppliers
  useEffect(() => {
    const fetchSupplies = async () => {
      try {
        setLoading(true);
        
        const url = `${API_BASE_URL}${API_ENDPOINTS.supplies}`;
        
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
        
        // Filter for verified suppliers only
        const verifiedSupplies = validatedSupplies.filter(supply => supply.supplier.verified);
        
        setSupplies(verifiedSupplies);
      } catch (error) {
        logger.error('Error fetching supplies', error instanceof Error ? error : new Error(String(error)));
        setSupplies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSupplies();
  }, []);

  // Fetch metadata on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const filteredSupplies = useMemo(() => {
    return supplies.filter(supply => {
      const matchesSearch = supply.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           supply.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           supply.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           supply.supplier.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All Categories" || supply.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [supplies, searchQuery, selectedCategory]);

  const formatPrice = (price: number) => {
    return formatCurrency(price, 'PHP', {
      appSettings,
      showSymbol: true,
    });
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

  // Group supplies by supplier
  const supplierGroups = useMemo(() => {
    const groups = new Map<string, { supplier: Supply['supplier']; supplies: Supply[] }>();
    
    sortedSupplies.forEach(supply => {
      const supplierId = supply.supplier.id || supply.supplier.name;
      if (!groups.has(supplierId)) {
        groups.set(supplierId, {
          supplier: supply.supplier,
          supplies: []
        });
      }
      groups.get(supplierId)!.supplies.push(supply);
    });
    
    return Array.from(groups.values());
  }, [sortedSupplies]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30 relative overflow-hidden">
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-yellow-200/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="h-12 bg-gray-200 rounded-lg w-full mb-4"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border-2 border-gray-200 p-6 animate-pulse">
                <div className="space-y-4">
                  <div className="h-48 bg-gray-200 rounded-lg"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-yellow-200/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-orange-100/20 rounded-full blur-3xl animate-float animation-delay-4000"></div>
      </div>

      <div className="relative z-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header (mirrors course detail style) */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/supplies"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to Supplies"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Verified Suppliers</h1>
            <p className="text-sm text-gray-600">
              Shop with confidence from LocalPro-verified suppliers
            </p>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border-2 border-gray-200 p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Identity Verified</p>
              <p className="text-xs text-gray-600">All suppliers are background checked</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border-2 border-gray-200 p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Quality Assured</p>
              <p className="text-xs text-gray-600">Products meet quality standards</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border-2 border-gray-200 p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Reliable Delivery</p>
              <p className="text-xs text-gray-600">Consistent delivery performance</p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search verified suppliers or products..."
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
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white font-medium min-w-[180px]"
          >
            {categoryOptions.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white font-medium min-w-[180px]"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-600 text-sm">
            {supplierGroups.length} verified supplier{supplierGroups.length !== 1 ? 's' : ''} • {sortedSupplies.length} product{sortedSupplies.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Content */}
        {sortedSupplies.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-8">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/20">
                <ShieldCheck className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No verified suppliers found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || selectedCategory !== "All Categories"
                  ? "Try adjusting your search or filters."
                  : "Check back soon for verified suppliers."}
              </p>
              <Link
                href="/supplies"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30 hover:shadow-xl hover:scale-105 font-semibold"
              >
                <ArrowLeft className="w-4 h-4" />
                Browse All Supplies
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {supplierGroups.map((group) => (
              <div key={group.supplier.id || group.supplier.name} className="bg-white rounded-xl border-2 border-gray-200 shadow-lg overflow-hidden">
                {/* Supplier Header */}
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-b-2 border-gray-200 p-4">
                  <div className="flex items-center gap-4">
                    {group.supplier.avatar ? (
                      <Image
                        src={group.supplier.avatar}
                        alt={group.supplier.name}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                        <span className="text-lg font-bold text-white">
                          {group.supplier.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900">{group.supplier.name}</h3>
                        <CheckCircle2 className="w-4 h-4 text-orange-500" />
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          {group.supplier.rating.toFixed(1)} ({group.supplier.reviewCount} reviews)
                        </span>
                        <span>{group.supplier.location}</span>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                      {group.supplies.length} product{group.supplies.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {group.supplier.bio && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{group.supplier.bio}</p>
                  )}
                </div>

                {/* Supplier Products */}
                <div className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {group.supplies.slice(0, 4).map((supply) => (
                      <SupplyCard key={supply.id} supply={supply} formatPrice={formatPrice} />
                    ))}
                  </div>
                  {group.supplies.length > 4 && (
                    <div className="mt-4 text-center">
                      <button className="text-sm text-orange-600 hover:text-orange-700 font-medium">
                        View all {group.supplies.length} products →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Need Help Section */}
        <div className="mt-8 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl border border-orange-200 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-1">Want to Become a Verified Supplier?</h3>
              <p className="text-sm text-gray-600 mb-4">
                Join our network of trusted suppliers and reach more customers. Get verified and enjoy benefits like priority placement and trust badges.
              </p>
              <Link
                href="/support"
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all shadow-sm hover:shadow-md font-medium text-sm"
              >
                <Zap className="w-4 h-4" />
                Learn More
              </Link>
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
}

function SupplyCard({ supply, formatPrice }: SupplyCardProps) {
  return (
    <Link
      href={`/supplies/${supply.id}`}
      className="group bg-gray-50 rounded-lg border border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all duration-300 overflow-hidden"
    >
      <div className="relative">
        {supply.images.length > 0 ? (
          <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
            <Image
              src={supply.images[0]}
              alt={supply.name}
              width={300}
              height={225}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <Package className="w-10 h-10 text-gray-400" />
          </div>
        )}
        {supply.isSubscriptionEligible && (
          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-600 text-white rounded text-xs font-bold">
              <RefreshCw className="w-3 h-3" />
              Subscribe
            </span>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span className="px-2 py-1 bg-white/95 backdrop-blur-sm rounded text-sm font-bold text-gray-900 shadow-sm">
            {formatPrice(supply.price)}
          </span>
        </div>
      </div>
      <div className="p-3">
        <h4 className="font-semibold text-gray-900 mb-1 line-clamp-1 group-hover:text-orange-600 transition-colors text-sm">
          {supply.name}
        </h4>
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-500 fill-current" />
            <span>{supply.rating.toFixed(1)}</span>
          </div>
          {supply.delivery.available && (
            <span className="flex items-center gap-1">
              <Truck className="w-3 h-3" />
              {supply.delivery.estimatedDays}d
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

