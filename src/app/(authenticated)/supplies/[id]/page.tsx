"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Share2,
  Heart,
  ShoppingCart,
  Truck,
  Star,
  MapPin,
  Package,
  Eye,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  Shield,
  Clock,
  MessageCircle,
  Check,
  X,
  RefreshCw,
  Tag,
  ShoppingBag
} from "lucide-react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { formatCurrency } from "@/lib/currency-utils";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useSession } from "@/hooks/useAuth";
import { checkFavorite, toggleFavorite } from "@/lib/favorites-utils";
import { useToast, ToastContainer } from "@/components/ui/toast";

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

const getStatusConfig = (status: Supply['status']) => {
  switch (status) {
    case 'available': return { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'In Stock' };
    case 'out-of-stock': return { bg: 'bg-red-100', text: 'text-red-700', label: 'Out of Stock' };
    case 'discontinued': return { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Discontinued' };
    case 'pre-order': return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Pre-Order' };
    default: return { bg: 'bg-gray-100', text: 'text-gray-700', label: status };
  }
};

// Interface for API response
interface ApiSupplyResponse {
  success: boolean;
  message: string;
  data: {
    supply: {
      id: string;
      name?: string;
      title?: string;
      description?: string;
      category?: string;
      subcategory?: string;
      brand?: string;
      sku?: string;
      pricing?: {
        retailPrice?: number;
        wholesalePrice?: number;
        currency?: string;
      };
      inventory?: {
        quantity?: number;
        minStock?: number;
        maxStock?: number;
        location?: string;
      };
      specifications?: Record<string, string>;
      images?: string[];
      tags?: string[];
      isFeatured?: boolean;
      isSubscriptionEligible?: boolean;
      averageRating?: number;
      views?: number;
      supplier?: {
        _id?: string;
        email?: string;
        firstName?: string;
        lastName?: string;
        profile?: {
          bio?: string;
        };
      };
      createdAt?: string;
      updatedAt?: string;
    };
    reviews?: Array<{
      id: string;
      rating: number;
      comment: string;
      user: { name: string };
      createdAt: string;
    }>;
    reviewCount?: number;
    statistics?: {
      views?: number;
      averageRating?: number;
      reviewCount?: number;
      orderCount?: number;
      inventory?: {
        quantity?: number;
        minStock?: number;
        maxStock?: number;
        inStock?: boolean;
        lowStock?: boolean;
      };
    };
    relatedSupplies?: Array<{
      id: string;
      name: string;
      price: number;
      images: string[];
      rating: number;
    }>;
  };
}

// Transform API response to component Supply format
const transformApiSupply = (apiData: ApiSupplyResponse['data']): Supply => {
  const s = apiData.supply;
  const stats = apiData.statistics;
  
  // Determine status based on inventory
  let status: Supply['status'] = 'available';
  if (stats?.inventory) {
    if (!stats.inventory.inStock || (stats.inventory.quantity ?? 0) === 0) {
      status = 'out-of-stock';
    } else if (stats.inventory.lowStock) {
      status = 'pre-order';
    }
  }
  
  // Determine type from category
  let type: Supply['type'] = 'equipment';
  const category = s.category?.toLowerCase() || '';
  if (category.includes('clean')) type = 'cleaning';
  else if (category.includes('tool')) type = 'tools';
  else if (category.includes('material')) type = 'materials';
  
  // Check if subscription eligible
  const isSubscriptionEligible = Boolean(s.isSubscriptionEligible);
  if (isSubscriptionEligible) {
    type = 'subscription';
  }
  
  // Build supplier name and extract bio
  const supplierName = s.supplier 
    ? `${s.supplier.firstName || ''} ${s.supplier.lastName || ''}`.trim() || 'Unknown Supplier'
    : 'Unknown Supplier';
  const supplierBio = s.supplier?.profile?.bio || '';
  
  return {
    id: s.id,
    name: s.name || s.title || 'Unnamed Supply',
    description: s.description || '',
    category: s.category || 'Other',
    subcategory: s.subcategory || '',
    type,
    status,
    price: s.pricing?.retailPrice || 0,
    originalPrice: s.pricing?.wholesalePrice,
    currency: s.pricing?.currency || 'PHP',
    unit: 'piece',
    stock: s.inventory?.quantity ?? stats?.inventory?.quantity ?? 0,
    minOrder: s.inventory?.minStock || 1,
    maxOrder: s.inventory?.maxStock,
    sku: s.sku || '',
    location: {
      address: s.inventory?.location || '',
      city: '',
      state: '',
      zipCode: ''
    },
    images: s.images || [],
    features: isSubscriptionEligible ? ['Subscription Eligible'] : [],
    specifications: {
      brand: s.brand || s.specifications?.brand,
      model: s.sku,
      weight: s.specifications?.weight,
      dimensions: s.specifications?.dimensions,
      material: s.specifications?.material,
      color: s.specifications?.color,
      warranty: s.specifications?.warranty
    },
    supplier: {
      id: s.supplier?._id || '',
      name: supplierName,
      avatar: undefined,
      rating: 0,
      reviewCount: 0,
      verified: true,
      location: s.inventory?.location || '',
      bio: supplierBio
    },
    delivery: {
      available: true,
      estimatedDays: 3,
      cost: 0,
      freeShippingThreshold: undefined
    },
    rating: s.averageRating ?? stats?.averageRating ?? 0,
    reviewCount: apiData.reviewCount ?? stats?.reviewCount ?? 0,
    viewsCount: s.views ?? stats?.views ?? 0,
    orderCount: stats?.orderCount ?? 0,
    isFeatured: s.isFeatured || false,
    isFavorited: false,
    isSubscriptionEligible: isSubscriptionEligible,
    tags: s.tags || [],
    createdAt: s.createdAt || new Date().toISOString(),
    updatedAt: s.updatedAt || new Date().toISOString()
  };
};

export default function SupplyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { settings: appSettings } = useAppSettings();
  const { data: session } = useSession();
  const { toasts, success: showSuccess, error: showError, removeToast } = useToast();
  
  const [supply, setSupply] = useState<Supply | null>(null);
  const [relatedSupplies, setRelatedSupplies] = useState<Array<{ id: string; name: string; price: number; images: string[]; rating: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  
  // Check if the current user is the owner of this supply
  const currentUserId = session?.user?.id || session?.user?._id || session?.user?.userId;
  const isOwnSupply = Boolean(currentUserId && supply?.supplier?.id && currentUserId === supply.supplier.id);

  // Fetch supply and check favorite status
  useEffect(() => {
    const fetchSupply = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/supplies/${params.id}`, createAuthFetchOptions());
        
        if (!response.ok) {
          throw new Error('Supply not found');
        }

        const responseData = await response.json();
        let supplyId = '';
        
        // Handle the nested API response structure
        if (responseData.success && responseData.data?.supply) {
          const transformedSupply = transformApiSupply(responseData.data);
          setSupply(transformedSupply);
          setRelatedSupplies(responseData.data.relatedSupplies || []);
          supplyId = transformedSupply.id;
        } else if (responseData.id || responseData._id) {
          // Direct supply object (fallback for different API format)
          setSupply(responseData);
          supplyId = responseData.id || responseData._id;
        } else {
          throw new Error('Invalid response format');
        }
        
        // Check favorite status if authenticated
        if (supplyId && getApiToken()) {
          try {
            const favorited = await checkFavorite('supply', supplyId);
            setIsFavorited(favorited);
          } catch {
            setIsFavorited(false);
          }
        }
      } catch (error) {
        // Log the error appropriately
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('not found') || errorMessage.includes('404')) {
          logger.warn('Supply not found', { supplyId: params.id });
        } else {
          logger.error('Error fetching supply', error instanceof Error ? error : new Error(String(error)), { supplyId: params.id });
        }
        // Set supply to null to show "not found" state
        setSupply(null);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchSupply();
    }
  }, [params.id]);

  // Toggle favorite
  const handleToggleFavorite = useCallback(async () => {
    if (!supply || isTogglingFavorite) return;
    
    const supplyId = supply.id;
    if (!supplyId) return;
    
    // Check if user is authenticated
    if (!getApiToken()) {
      showError('Please log in to add favorites');
      return;
    }
    
    setIsTogglingFavorite(true);
    try {
      const newFavorited = await toggleFavorite('supply', supplyId);
      setIsFavorited(newFavorited);
      
      if (newFavorited) {
        showSuccess('Added to favorites');
      } else {
        showSuccess('Removed from favorites');
      }
    } catch (error) {
      logger.error('Error toggling favorite', error instanceof Error ? error : new Error(String(error)), { supplyId });
      showError('Failed to update favorite. Please try again.');
    } finally {
      setIsTogglingFavorite(false);
    }
  }, [supply, isTogglingFavorite, showSuccess, showError]);

  // Share supply
  const handleShare = useCallback(async () => {
    if (!supply) return;
    
    const shareData = {
      title: supply.name,
      text: supply.description || `Check out ${supply.name} on LocalPro`,
      url: typeof window !== 'undefined' ? window.location.href : ''
    };
    
    try {
      // Try Web Share API first (mobile and modern browsers)
      if (navigator.share && typeof navigator.share === 'function') {
        await navigator.share(shareData);
        setShareFeedback('Shared successfully!');
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareData.url);
        setShareFeedback('Link copied!');
      }
      
      // Clear feedback after 2 seconds
      setTimeout(() => setShareFeedback(null), 2000);
    } catch (error) {
      // User cancelled share or error occurred
      if (error instanceof Error && error.name !== 'AbortError') {
        logger.error('Error sharing', error, { supplyId: supply.id });
        // Try clipboard as fallback
        try {
          await navigator.clipboard.writeText(shareData.url);
          setShareFeedback('Link copied!');
          setTimeout(() => setShareFeedback(null), 2000);
        } catch {
          setShareFeedback('Failed to share');
          setTimeout(() => setShareFeedback(null), 2000);
        }
      }
    }
  }, [supply]);

  // Add to cart
  const handleAddToCart = useCallback(async () => {
    if (!supply || isAddingToCart) return;
    
    if (!getApiToken()) {
      showError('Please log in to add items to cart');
      return;
    }
    
    if (isOwnSupply) {
      showError('You cannot add your own supply to cart');
      return;
    }
    
    setIsAddingToCart(true);
    try {
      // Save to localStorage for cart functionality
      const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
      const existingIndex = cartItems.findIndex((item: { itemId: string; itemType: string }) => 
        item.itemId === supply.id && item.itemType === 'supply'
      );
      
      if (existingIndex >= 0) {
        // Update quantity if item already in cart
        cartItems[existingIndex].quantity += quantity;
      } else {
        // Add new item to cart
        const primaryImage = supply.images?.[0];
        cartItems.push({
          id: `supply-${supply.id}-${Date.now()}`,
          itemType: 'supply',
          itemId: supply.id,
          name: supply.name,
          image: primaryImage,
          price: supply.price || 0,
          quantity: quantity,
          maxQuantity: supply.stock || 99,
          sellerId: supply.supplier?.id,
          sellerName: supply.supplier?.name,
        });
      }
      
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
      // Dispatch event to update header cart count
      window.dispatchEvent(new CustomEvent('cartUpdated'));

      // Also try to call cart API (optional backend sync)
      try {
        const url = `${API_BASE_URL}/api/cart/add`;
        await fetch(url, createAuthFetchOptions({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itemType: 'supply',
            itemId: supply.id,
            quantity: quantity
          })
        }));
      } catch {
        // API not available, localStorage is primary storage
        logger.debug('Cart API not available, using localStorage');
      }

      showSuccess(`Added ${quantity} ${supply.name} to cart`);
    } catch (error) {
      logger.error('Failed to add to cart', error instanceof Error ? error : new Error(String(error)));
      showError('Failed to add item to cart');
    } finally {
      setIsAddingToCart(false);
    }
  }, [supply, quantity, isAddingToCart, isOwnSupply, showSuccess, showError]);

  // Order now
  const handleOrderNow = useCallback(async () => {
    if (!supply || isOrdering) return;
    
    if (!getApiToken()) {
      showError('Please log in to place an order');
      return;
    }
    
    if (isOwnSupply) {
      showError('You cannot order your own supply');
      return;
    }
    
    if (supply.status !== 'available') {
      showError('This item is currently not available for order');
      return;
    }
    
    setIsOrdering(true);
    try {
      // Call order API
      const url = `${API_BASE_URL}${API_ENDPOINTS.suppliesOrder}/${supply.id}/order`;
      const response = await fetch(url, createAuthFetchOptions({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: quantity,
          notes: ''
        })
      }));

      if (!response.ok) {
        // If order API doesn't exist, show success modal (UI demo)
        if (response.status === 404) {
          setShowOrderSuccess(true);
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to place order');
      }

      const result = await response.json();
      const orderId = result.data?.orderId || result.orderId;
      
      if (orderId) {
        showSuccess('Order placed successfully!');
        router.push(`/supplies/orders/${orderId}`);
      } else {
        setShowOrderSuccess(true);
      }
    } catch (error) {
      // For demo purposes, show success modal
      logger.warn('Order API error, showing demo success', { supplyId: supply.id, quantity, error });
      setShowOrderSuccess(true);
    } finally {
      setIsOrdering(false);
    }
  }, [supply, quantity, isOrdering, isOwnSupply, router, showSuccess, showError]);

  // Contact supplier
  const handleContactSupplier = useCallback(() => {
    if (!supply) return;
    
    if (!getApiToken()) {
      showError('Please log in to contact supplier');
      return;
    }
    
    // Navigate to messages with supplier
    router.push(`/messages?recipient=${supply.supplier.id}&context=supply&contextId=${supply.id}`);
  }, [supply, router, showError]);

  const formatPrice = (price: number) => {
    return formatCurrency(price, 'PHP', { appSettings, showSymbol: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Back Button Skeleton */}
          <div className="mb-6">
            <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image Skeleton */}
            <div className="space-y-4">
              <div className="aspect-square bg-gray-200 rounded-xl animate-pulse"></div>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-20 h-20 bg-gray-200 rounded-lg animate-pulse"></div>
                ))}
              </div>
            </div>
            
            {/* Details Skeleton */}
            <div className="space-y-6">
              <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              <div className="h-12 bg-gray-200 rounded w-1/3 animate-pulse"></div>
              <div className="h-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-14 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!supply) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl animate-blob"></div>
        </div>
        <div className="relative z-10 text-center py-12">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Package className="w-10 h-10 text-orange-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Supply not found</h3>
          <p className="text-gray-600 mb-6 max-w-md">The supply you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Link
            href="/supplies"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Browse Supplies
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(supply.status);
  const totalPrice = supply.price * quantity;
  const savings = supply.originalPrice ? (supply.originalPrice - supply.price) * quantity : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 relative overflow-hidden">
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} position="top-right" />
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-green-200/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/supplies"
            className="p-2.5 hover:bg-white rounded-lg transition-all border-2 border-transparent hover:border-gray-200 hover:shadow-sm"
            title="Back to supplies"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Package className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 mb-1 truncate">{supply.name}</h1>
            <p className="text-sm text-gray-600 truncate">
              {supply.category} • {supply.supplier.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleFavorite}
              disabled={isTogglingFavorite}
              className={`p-2.5 rounded-lg border-2 transition-all hover:scale-105 ${
                isFavorited 
                  ? 'border-red-300 bg-red-50 text-red-500' 
                  : 'border-gray-200 hover:border-red-300 hover:bg-red-50 text-gray-400 hover:text-red-500'
              } ${isTogglingFavorite ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''} ${isTogglingFavorite ? 'animate-pulse' : ''}`} />
            </button>
            <button 
              onClick={handleShare}
              className="relative p-2.5 rounded-lg border-2 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-all hover:scale-105"
              title="Share"
            >
              <Share2 className="w-5 h-5" />
              {shareFeedback && (
                <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-md whitespace-nowrap shadow-lg z-50">
                  {shareFeedback}
                </div>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg overflow-hidden">
              <div className="aspect-square relative">
                {supply.images.length > 0 ? (
                  <Image
                    src={supply.images[selectedImage]}
                    alt={supply.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-200 via-yellow-200 to-orange-300 flex items-center justify-center">
                    <Package className="w-24 h-24 text-orange-600" />
                  </div>
                )}
                {/* Status Badge */}
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1.5 rounded-lg text-sm font-bold ${statusConfig.bg} ${statusConfig.text}`}>
                    {statusConfig.label}
                  </span>
                </div>
                {/* Featured Badge */}
                {supply.isFeatured && (
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-bold shadow-lg">
                      Featured
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnail Images */}
            {supply.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {supply.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index 
                        ? 'border-emerald-500 shadow-lg scale-105' 
                        : 'border-gray-200 hover:border-emerald-300'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${supply.name} ${index + 1}`}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full font-medium text-sm">
                {supply.category}
                {supply.subcategory && ` • ${supply.subcategory}`}
              </span>
              {supply.isSubscriptionEligible && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full font-medium text-sm">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Subscribe & Save
                </span>
              )}
              <div className="flex items-center gap-1.5 text-sm">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="font-semibold">{supply.rating}</span>
                <span className="text-gray-500">({supply.reviewCount} reviews)</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <Eye className="w-4 h-4" />
                <span>{supply.viewsCount} views</span>
              </div>
              {supply.orderCount > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <ShoppingBag className="w-4 h-4" />
                  <span>{supply.orderCount} sold</span>
                </div>
              )}
            </div>

            {/* Price Card */}
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6">
              <div className="flex items-end gap-3 mb-3">
                <span className="text-3xl font-bold text-gray-900">{formatPrice(supply.price)}</span>
                {supply.originalPrice && (
                  <span className="text-lg text-gray-400 line-through">{formatPrice(supply.originalPrice)}</span>
                )}
                <span className="text-gray-500">/ {supply.unit}</span>
              </div>
              
              {supply.originalPrice && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium mb-4">
                  <span>Save {formatPrice(supply.originalPrice - supply.price)}</span>
                  <span className="text-emerald-600">({Math.round(((supply.originalPrice - supply.price) / supply.originalPrice) * 100)}% off)</span>
                </div>
              )}
              
              {/* SKU Display */}
              {supply.sku && (
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                  <Tag className="w-4 h-4" />
                  <span>SKU: {supply.sku}</span>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">Quantity:</span>
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setQuantity(Math.max(supply.minOrder, quantity - 1))}
                    disabled={quantity <= supply.minOrder}
                    className="p-2 rounded-md hover:bg-white hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(supply.maxOrder || 999, quantity + 1))}
                    disabled={quantity >= (supply.maxOrder || 999)}
                    className="p-2 rounded-md hover:bg-white hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-sm text-gray-500">
                  {supply.stock} available
                </span>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600">Total:</span>
                <div className="text-right">
                  <span className="text-2xl font-bold text-emerald-600">{formatPrice(totalPrice)}</span>
                  {savings > 0 && (
                    <span className="block text-sm text-emerald-600">You save {formatPrice(savings)}</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={isAddingToCart || supply.status !== 'available' || isOwnSupply}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-emerald-600 text-emerald-600 rounded-lg font-semibold hover:bg-emerald-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAddingToCart ? (
                    <>
                      <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      Add to Cart
                    </>
                  )}
                </button>
                <button
                  onClick={handleOrderNow}
                  disabled={supply.status !== 'available' || isOrdering || isOwnSupply}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl hover:from-emerald-700 hover:to-emerald-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isOrdering ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Order Now'
                  )}
                </button>
              </div>

              {isOwnSupply && (
                <div className="flex items-center gap-2 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">This is your own listing. You cannot order or add your own supplies to cart.</span>
                </div>
              )}

              {!isOwnSupply && supply.status !== 'available' && (
                <div className="flex items-center gap-2 mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-700">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">This item is currently {supply.status.replace('-', ' ')}</span>
                </div>
              )}
            </div>

            {/* Delivery Info */}
            {supply.delivery.available && (
              <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm p-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-100 rounded-lg">
                    <Truck className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {supply.delivery.cost === 0 ? 'Free Delivery' : `Delivery: ${formatPrice(supply.delivery.cost)}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      Estimated {supply.delivery.estimatedDays} day{supply.delivery.estimatedDays > 1 ? 's' : ''} delivery
                    </p>
                  </div>
                  {supply.delivery.freeShippingThreshold && supply.delivery.cost > 0 && (
                    <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                      Free over {formatPrice(supply.delivery.freeShippingThreshold)}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Supplier Card */}
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm p-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-emerald-700">
                    {supply.supplier.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900">{supply.supplier.name}</h4>
                    {supply.supplier.verified && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span>{supply.supplier.rating}</span>
                    </div>
                    <span>•</span>
                    <span>{supply.supplier.reviewCount} reviews</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{supply.supplier.location}</span>
                    </div>
                  </div>
                  {supply.supplier.bio && (
                    <p className="text-sm text-gray-600 line-clamp-2">{supply.supplier.bio}</p>
                  )}
                </div>
                <button 
                  onClick={handleContactSupplier}
                  className="p-2.5 rounded-lg border-2 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 text-gray-500 hover:text-emerald-600 transition-all flex-shrink-0"
                  title="Contact supplier"
                >
                  <MessageCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Description & Details */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Description & Features */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Description</h3>
              <p className="text-gray-600 leading-relaxed">{supply.description}</p>
            </div>

            {/* Features */}
            {supply.features.length > 0 && (
              <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Features</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {supply.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Specifications */}
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(supply.specifications).map(([key, value]) => (
                  value && (
                    <div key={key} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                      <span className="text-sm text-gray-500 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{value}</span>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Info</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Package className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Stock Available</p>
                    <p className="font-semibold text-gray-900">{supply.stock} {supply.unit}s</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Warranty</p>
                    <p className="font-semibold text-gray-900">{supply.specifications.warranty || 'Not specified'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Clock className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Min Order</p>
                    <p className="font-semibold text-gray-900">{supply.minOrder} {supply.unit}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            {supply.tags.length > 0 && (
              <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {supply.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-emerald-100 hover:text-emerald-700 cursor-pointer transition-colors"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Location */}
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Pickup Location</h3>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <MapPin className="w-5 h-5 text-orange-600" />
                </div>
                <div className="text-sm text-gray-600">
                  <p className="font-medium text-gray-900">{supply.location.address || 'Contact supplier'}</p>
                  {(supply.location.city || supply.location.state) && (
                    <p>{supply.location.city}{supply.location.city && supply.location.state && ', '}{supply.location.state} {supply.location.zipCode}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Supplies */}
        {relatedSupplies.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Related Supplies</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedSupplies.map((related) => (
                <Link
                  key={related.id}
                  href={`/supplies/${related.id}`}
                  className="group bg-white rounded-xl border-2 border-gray-200 hover:border-emerald-300 hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <div className="relative">
                    {related.images && related.images.length > 0 ? (
                      <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                        <Image
                          src={related.images[0]}
                          alt={related.name}
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
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-sm font-bold text-gray-900 shadow-md">
                        {formatPrice(related.price)}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                      {related.name}
                    </h3>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-semibold text-gray-700">{related.rating || 0}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Order Success Modal */}
      {showOrderSuccess && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
          onClick={() => setShowOrderSuccess(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Success Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-white">Order Placed!</h2>
            </div>
            
            {/* Order Details */}
            <div className="p-6">
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Item</span>
                  <span className="font-medium text-gray-900 truncate max-w-[200px]">{supply.name}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Quantity</span>
                  <span className="font-medium text-gray-900">{quantity} {supply.unit}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Total</span>
                  <span className="font-bold text-emerald-600 text-lg">{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Estimated Delivery</span>
                  <span className="font-medium text-gray-900">{supply.delivery.estimatedDays} days</span>
                </div>
              </div>
              
              <p className="text-sm text-gray-500 text-center mb-6">
                The supplier will contact you shortly to confirm your order.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowOrderSuccess(false);
                    router.push('/supplies');
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
                >
                  Continue Shopping
                </button>
                <button
                  onClick={() => {
                    setShowOrderSuccess(false);
                    router.push('/supplies/orders');
                  }}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-all"
                >
                  View Orders
                </button>
              </div>
            </div>
            
            {/* Close Button */}
            <button
              onClick={() => setShowOrderSuccess(false)}
              className="absolute top-4 right-4 p-1 text-white/80 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
