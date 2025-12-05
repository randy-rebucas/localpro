"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { 
  Star, 
  MapPin, 
  Package,
  Share2,
  Heart,
  ShoppingCart,
  Truck,
  CheckCircle,
  AlertCircle,
  Plus,
  Minus,
  Shield,
  User
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { useSession } from "@/hooks/useAuth";
import { logger } from "@/lib/logger";

// Product Image Interface
interface ProductImage {
  url: string;
  publicId?: string;
  thumbnail?: string;
  alt?: string;
}

// Product Entity Interface
interface Product {
  _id?: string;
  id?: string;
  name: string;
  title?: string;
  description: string;
  category: 'cleaning_supplies' | 'tools' | 'materials' | 'equipment';
  subcategory?: string;
  brand?: string;
  sku?: string;
  pricing: {
    retailPrice: number;
    wholesalePrice?: number;
    currency: string;
  };
  inventory: {
    quantity: number;
    minStock?: number;
    maxStock?: number;
    location?: string;
  };
  specifications?: {
    weight?: string;
    dimensions?: string;
    material?: string;
    color?: string;
    warranty?: string;
  };
  location?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  images?: ProductImage[] | string[];
  tags?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
  views?: number;
  isSubscriptionEligible?: boolean;
  supplier: {
    _id?: string;
    id?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    businessName?: string;
  } | string;
  orders?: Array<{
    _id?: string;
    id?: string;
    user: string | {
      _id?: string;
      id?: string;
      name?: string;
      firstName?: string;
      lastName?: string;
    };
    quantity: number;
    totalCost: number;
    deliveryAddress?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
    specialInstructions?: string;
    contactInfo?: {
      phone?: string;
      email?: string;
    };
    status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    createdAt?: string;
    updatedAt?: string;
  }>;
  reviews?: Array<{
    _id?: string;
    id?: string;
    user: string | {
      _id?: string;
      id?: string;
      name?: string;
      firstName?: string;
      lastName?: string;
    };
    rating: number;
    comment?: string;
    createdAt?: string;
  }>;
  averageRating?: number;
  createdAt?: string;
  updatedAt?: string;
}

export default function SupplyDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isFavorited, setIsFavorited] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartFeedback, setCartFeedback] = useState<string | null>(null);
  const [orderForm, setOrderForm] = useState({
    deliveryAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA'
    },
    specialInstructions: '',
    contactInfo: {
      phone: '',
      email: ''
    }
  });

  const normalizeProduct = useCallback((productData: Partial<Product> & Record<string, unknown>): Product => {
    return {
      ...productData,
      _id: productData._id || productData.id || '',
      id: productData.id || productData._id || '',
      name: (productData.name || productData.title || '') as string,
      title: (productData.title || productData.name || '') as string,
      description: (productData.description as string) || '',
      category: (productData.category as Product['category']) || 'cleaning_supplies',
      subcategory: (productData.subcategory as string) || '',
      brand: (productData.brand as string) || '',
      sku: (productData.sku as string) || '',
      pricing: productData.pricing ? {
        retailPrice: (productData.pricing as Product['pricing']).retailPrice || 0,
        wholesalePrice: (productData.pricing as Product['pricing']).wholesalePrice,
        currency: (productData.pricing as Product['pricing']).currency || 'PHP'
      } : {
        retailPrice: (productData.price as number) || 0,
        currency: 'PHP'
      },
      inventory: productData.inventory ? {
        quantity: (productData.inventory as Product['inventory']).quantity || 0,
        minStock: (productData.inventory as Product['inventory']).minStock,
        maxStock: (productData.inventory as Product['inventory']).maxStock,
        location: (productData.inventory as Product['inventory']).location
      } : {
        quantity: (productData.stock as number) || 0
      },
      specifications: productData.specifications as Product['specifications'],
      location: productData.location as Product['location'],
      images: Array.isArray(productData.images)
        ? productData.images.map((img: string | ProductImage | Record<string, unknown>) =>
            typeof img === 'string'
              ? { url: img, alt: (productData.name || productData.title || '') as string }
              : {
                  url: (img as ProductImage).url || (img as ProductImage).publicId || '',
                  publicId: (img as ProductImage).publicId,
                  thumbnail: (img as ProductImage).thumbnail,
                  alt: (img as ProductImage).alt || (productData.name || productData.title || '') as string
                }
          )
        : [],
      tags: (productData.tags as string[]) || [],
      isActive: productData.isActive !== undefined ? productData.isActive : true,
      isFeatured: productData.isFeatured || false,
      views: (productData.views as number) || 0,
      isSubscriptionEligible: productData.isSubscriptionEligible || false,
      supplier: typeof productData.supplier === 'string'
        ? { id: productData.supplier }
        : {
            _id: productData.supplier?._id || productData.supplier?.id,
            id: productData.supplier?.id || productData.supplier?._id,
            name: productData.supplier?.name,
            firstName: productData.supplier?.firstName,
            lastName: productData.supplier?.lastName
          },
      orders: Array.isArray(productData.orders)
        ? productData.orders.map((order: Record<string, unknown>) => {
            const orderUser = order.user as string | Record<string, unknown> | undefined;
            return {
              _id: (order._id as string) || (order.id as string) || '',
              id: (order.id as string) || (order._id as string) || '',
              user: typeof orderUser === 'string'
                ? orderUser
                : {
                    _id: (orderUser as Record<string, unknown>)?._id as string | undefined || (orderUser as Record<string, unknown>)?.id as string | undefined,
                    id: (orderUser as Record<string, unknown>)?.id as string | undefined || (orderUser as Record<string, unknown>)?._id as string | undefined,
                    name: (orderUser as Record<string, unknown>)?.name as string | undefined,
                    firstName: (orderUser as Record<string, unknown>)?.firstName as string | undefined,
                    lastName: (orderUser as Record<string, unknown>)?.lastName as string | undefined
                  },
              quantity: (order.quantity as number) || 1,
              totalCost: (order.totalCost as number) || 0,
              deliveryAddress: order.deliveryAddress as {
                street?: string;
                city?: string;
                state?: string;
                zipCode?: string;
                country?: string;
              },
              specialInstructions: (order.specialInstructions as string) || undefined,
              contactInfo: order.contactInfo as {
                phone?: string;
                email?: string;
              },
              status: (order.status as 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled') || 'pending',
              createdAt: (order.createdAt as string) || undefined,
              updatedAt: (order.updatedAt as string) || undefined
            };
          })
        : [],
      reviews: Array.isArray(productData.reviews)
        ? productData.reviews.map((review: Record<string, unknown>) => {
            const reviewUser = review.user as string | Record<string, unknown> | undefined;
            return {
              _id: (review._id as string) || (review.id as string) || '',
              id: (review.id as string) || (review._id as string) || '',
              user: typeof reviewUser === 'string'
                ? reviewUser
                : {
                    _id: (reviewUser as Record<string, unknown>)?._id as string | undefined || (reviewUser as Record<string, unknown>)?.id as string | undefined,
                    id: (reviewUser as Record<string, unknown>)?.id as string | undefined || (reviewUser as Record<string, unknown>)?._id as string | undefined,
                    name: (reviewUser as Record<string, unknown>)?.name as string | undefined,
                    firstName: (reviewUser as Record<string, unknown>)?.firstName as string | undefined,
                    lastName: (reviewUser as Record<string, unknown>)?.lastName as string | undefined
                  },
              rating: (review.rating as number) || 0,
              comment: (review.comment as string) || undefined,
              createdAt: (review.createdAt as string) || undefined
            };
          })
        : [],
      averageRating: (productData.averageRating as number) || 0
    };
  }, []);

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.supplies}/${params.id}`, createAuthFetchOptions());
        
      // Handle different HTTP status codes
      if (response.status === 404) {
        setError("Supply not found");
        setProduct(null);
        return;
      }
      
      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = "Failed to load supply details";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        setError(errorMessage);
        setProduct(null);
        return;
      }

      const data = await response.json();
      
      // Handle API response structure: {success: true, data: {...}}
      const productData = data.success && data.data ? data.data : data;
      
      // Check if product data exists
      if (!productData || (!productData._id && !productData.id)) {
        setError("Supply not found");
        setProduct(null);
        return;
      }
      
      const normalizedProduct = normalizeProduct(productData);
      setProduct(normalizedProduct);
      setError(null);
      
      // Load favorite status from localStorage
      const productId = normalizedProduct._id || normalizedProduct.id;
      if (productId) {
        const favorites = JSON.parse(localStorage.getItem('favoriteSupplies') || '[]');
        setIsFavorited(favorites.includes(productId));
      }
    } catch (error) {
      // Only log unexpected errors (network errors, etc.)
      logger.error("Error fetching supply", error instanceof Error ? error : new Error(String(error)), { supplyId: params.id });
      setError(error instanceof Error ? error.message : "Failed to load supply details");
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [params.id, normalizeProduct]);

  useEffect(() => {
    if (params.id) {
      fetchProduct();
    }
  }, [params.id, fetchProduct]);

  const handleToggleFavorite = useCallback(() => {
    if (!product) return;
    
    const productId = product._id || product.id;
    if (!productId) return;
    
    try {
      const favorites = JSON.parse(localStorage.getItem('favoriteSupplies') || '[]');
      const newFavorited = !isFavorited;
      
      if (newFavorited) {
        if (!favorites.includes(productId)) {
          favorites.push(productId);
        }
      } else {
        const index = favorites.indexOf(productId);
        if (index > -1) {
          favorites.splice(index, 1);
        }
      }
      
      localStorage.setItem('favoriteSupplies', JSON.stringify(favorites));
      setIsFavorited(newFavorited);
    } catch (error) {
      logger.error('Error toggling favorite', error instanceof Error ? error : new Error(String(error)), { productId });
    }
  }, [product, isFavorited]);

  const handleShare = useCallback(async () => {
    if (!product) return;
    
    const shareData = {
      title: product.name || product.title || 'Supply',
      text: product.description || '',
      url: typeof window !== 'undefined' ? window.location.href : ''
    };
    
    try {
      if (navigator.share && typeof navigator.share === 'function') {
        await navigator.share(shareData);
        setShareFeedback('Shared successfully!');
      } else {
        await navigator.clipboard.writeText(shareData.url);
        setShareFeedback('Link copied to clipboard!');
      }
      setTimeout(() => setShareFeedback(null), 2000);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        logger.error('Error sharing', error instanceof Error ? error : new Error(String(error)));
        try {
          await navigator.clipboard.writeText(shareData.url);
          setShareFeedback('Link copied to clipboard!');
          setTimeout(() => setShareFeedback(null), 2000);
        } catch (clipboardError) {
          logger.error('Error copying to clipboard', clipboardError instanceof Error ? clipboardError : new Error(String(clipboardError)));
        }
      }
    }
  }, [product]);

  // Handle add to cart
  const handleAddToCart = useCallback(() => {
    if (!product || isAddingToCart) return;
    
    // Get supplier ID to check if it's own supply
    const productSupplierId = typeof product.supplier === 'string' 
      ? product.supplier 
      : (product.supplier?.id || product.supplier?._id);
    const userId = session?.user?.id || session?.user?._id || session?.user?.userId;
    
    if (userId && productSupplierId && userId === productSupplierId) {
      setCartFeedback('You cannot add your own supply to cart');
      setTimeout(() => setCartFeedback(null), 2000);
      return;
    }
    
    setIsAddingToCart(true);
    try {
      // Save to localStorage for cart functionality
      const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
      const productId = product.id || product._id;
      const existingIndex = cartItems.findIndex((item: { itemId: string; itemType: string }) => 
        item.itemId === productId && item.itemType === 'supply'
      );
      
      if (existingIndex >= 0) {
        // Update quantity if item already in cart
        cartItems[existingIndex].quantity += quantity;
      } else {
        // Add new item to cart
        const primaryImage = product.images?.[0];
        cartItems.push({
          id: `supply-${productId}-${Date.now()}`,
          itemType: 'supply',
          itemId: productId,
          name: product.name || product.title,
          image: typeof primaryImage === 'string' ? primaryImage : primaryImage?.url,
          price: product.pricing?.retailPrice || 0,
          quantity: quantity,
          maxQuantity: product.inventory?.quantity || 99,
          sellerId: typeof product.supplier === 'string' ? product.supplier : product.supplier?.id || product.supplier?._id,
          sellerName: typeof product.supplier === 'string' ? undefined : (product.supplier?.businessName || product.supplier?.name),
        });
      }
      
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
      // Dispatch event to update header cart count
      window.dispatchEvent(new CustomEvent('cartUpdated'));

      setCartFeedback(`Added ${quantity} item(s) to cart!`);
      setTimeout(() => setCartFeedback(null), 2000);
    } catch (error) {
      logger.error('Failed to add to cart', error instanceof Error ? error : new Error(String(error)));
      setCartFeedback('Failed to add to cart');
      setTimeout(() => setCartFeedback(null), 2000);
    } finally {
      setIsAddingToCart(false);
    }
  }, [product, quantity, isAddingToCart, session]);

  const formatPrice = (price: number, currency: string = 'PHP') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  const getImageUrl = (img: ProductImage | string) => {
    return typeof img === 'string' ? img : (img.url || img.thumbnail || '');
  };

  const getImageAlt = (img: ProductImage | string, index: number) => {
    return typeof img === 'string' 
      ? `${product?.name || 'Product'} ${index + 1}`
      : (img.alt || `${product?.name || 'Product'} ${index + 1}`);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating)
            ? "text-amber-400 fill-current"
            : "text-slate-600"
        }`}
      />
    ));
  };

  const getSupplierName = () => {
    if (!product) return '';
    if (typeof product.supplier === 'string') return 'Supplier';
    return product.supplier?.name || 
           `${product.supplier?.firstName || ''} ${product.supplier?.lastName || ''}`.trim() || 
           'Supplier';
  };

  const getLocationString = () => {
    if (!product?.location) return 'Location not specified';
    const parts = [
      product.location.city,
      product.location.state,
      product.location.zipCode
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Location not specified';
  };

  const handleQuantityChange = (delta: number) => {
    if (!product) return;
    const minOrder = product.inventory?.minStock || 1;
    const maxOrder = product.inventory?.maxStock || product.inventory.quantity;
    const newQuantity = Math.max(minOrder, Math.min(maxOrder || 999, quantity + delta));
    setQuantity(newQuantity);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading size="lg" text="Loading supply details..." />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 text-slate-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Supply Not Found</h2>
        <p className="text-slate-400 mb-6">{error || "The supply you're looking for doesn't exist."}</p>
        <Link
          href="/marketplace/supplies"
          className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors inline-block"
        >
          Back to Supplies
        </Link>
      </div>
    );
  }

  const isInStock = product.inventory.quantity > 0;
  const images = product.images || [];
  const hasImages = images.length > 0;
  
  // Check if the current user is the owner of this supply
  const currentUserId = session?.user?.id || session?.user?._id || session?.user?.userId;
  const supplierId = typeof product.supplier === 'string' 
    ? product.supplier 
    : (product.supplier?.id || product.supplier?._id);
  const isOwnSupply = Boolean(currentUserId && supplierId && currentUserId === supplierId);

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-slate-400">
        <Link href="/marketplace" className="hover:text-white">
          Marketplace
        </Link>
        <span>/</span>
        <Link href="/marketplace/supplies" className="hover:text-white">
          Supplies
        </Link>
        <span>/</span>
        <span className="text-white">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Images */}
        <div className="space-y-4">
          {hasImages ? (
            <>
              {/* Main Image */}
              <div className="relative aspect-square bg-slate-800 rounded-lg overflow-hidden group">
                <Image
                  src={getImageUrl(images[selectedImageIndex])}
                  alt={getImageAlt(images[selectedImageIndex], selectedImageIndex)}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              
              {/* Thumbnail Images */}
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {images.slice(0, 4).map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImageIndex === index
                          ? 'border-green-500 ring-2 ring-green-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Image
                        src={getImageUrl(image)}
                        alt={getImageAlt(image, index)}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
              <Package className="w-24 h-24 text-gray-400" />
            </div>
          )}
        </div>

        {/* Right Column - Product Info */}
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                {product.brand && (
                  <p className="text-lg text-gray-600 mb-2">by {product.brand}</p>
                )}
                {product.sku && (
                  <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleShare}
                  className="relative p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors group"
                  title="Share supply"
                >
                  <Share2 className="w-4 h-4" />
                  {shareFeedback && (
                    <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {shareFeedback}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                    </div>
                  )}
                </button>
                <button 
                  onClick={handleToggleFavorite}
                  className={`p-2 border rounded-lg transition-colors ${
                    isFavorited 
                      ? 'border-red-300 bg-red-50 text-red-600 hover:bg-red-100' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                  title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>

            {/* Rating and Reviews */}
            {(product.averageRating || product.reviews) && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1">
                  {renderStars(product.averageRating || 0)}
                  <span className="text-sm font-medium text-gray-700 ml-1">
                    {product.averageRating?.toFixed(1) || '0.0'}
                  </span>
                </div>
                {product.reviews && product.reviews.length > 0 && (
                  <span className="text-sm text-gray-500">
                    ({product.reviews.length} reviews)
                  </span>
                )}
              </div>
            )}

            {/* Price */}
            <div className="mb-4">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-green-600">
                  {formatPrice(product.pricing.retailPrice, product.pricing.currency)}
                </span>
                {product.pricing.wholesalePrice && (
                  <span className="text-xl text-gray-500 line-through">
                    {formatPrice(product.pricing.wholesalePrice, product.pricing.currency)}
                  </span>
                )}
              </div>
              {product.isSubscriptionEligible && (
                <p className="text-sm text-green-600 mt-1">Subscription eligible</p>
              )}
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2 mb-4">
              {isInStock ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-green-600 font-medium">In Stock</span>
                  <span className="text-gray-600">({product.inventory.quantity} available)</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-600 font-medium">Out of Stock</span>
                </>
              )}
            </div>
          </div>

          {/* Quantity Selector */}
          {isInStock && (
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Quantity:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= (product.inventory?.minStock || 1)}
                  className="p-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    const minOrder = product.inventory?.minStock || 1;
                    const maxOrder = product.inventory?.maxStock || product.inventory.quantity;
                    const clampedVal = Math.max(minOrder, Math.min(maxOrder || 999, val));
                    setQuantity(clampedVal);
                  }}
                  min={product.inventory?.minStock || 1}
                  max={product.inventory?.maxStock || product.inventory.quantity}
                  className="w-16 text-center border border-gray-300 rounded px-2 py-1"
                />
                <button
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= (product.inventory?.maxStock || product.inventory.quantity)}
                  className="p-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span className="text-sm text-gray-600">
                Min: {product.inventory?.minStock || 1}, 
                Max: {product.inventory?.maxStock || product.inventory.quantity}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              className={`relative flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                isInStock && !isAddingToCart && !isOwnSupply
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={!isInStock || isAddingToCart || isOwnSupply}
            >
              <ShoppingCart className="w-5 h-5" />
              {isAddingToCart ? 'Adding...' : 'Add to Cart'}
              {cartFeedback && (
                <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap z-10">
                  {cartFeedback}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowOrderModal(true)}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                isInStock && !isOwnSupply
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={!isInStock || isOwnSupply}
            >
              <Truck className="w-5 h-5" />
              Order Now
            </button>
          </div>
          
          {/* Own Supply Warning */}
          {isOwnSupply && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">This is your own listing. You cannot order or add your own supplies to cart.</span>
            </div>
          )}

          {/* Quick Info */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">{getLocationString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {product.inventory.location || 'Warehouse'}
              </span>
            </div>
          </div>

          {/* Supplier */}
          {product.supplier && typeof product.supplier !== 'string' && (product.supplier.id || product.supplier._id) && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Supplier:</p>
              <Link
                href={`/marketplace/providers/${product.supplier.id || product.supplier._id}`}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                {getSupplierName()}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Description and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Description</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>

          {/* Specifications */}
          {((product.specifications && Object.keys(product.specifications).length > 0) || product.brand) && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Specifications</h2>
              <div className="grid grid-cols-2 gap-4">
                {product.brand && (
                  <div>
                    <span className="text-sm text-gray-600">Brand:</span>
                    <p className="font-medium text-gray-700">{product.brand}</p>
                  </div>
                )}
                {product.specifications?.weight && (
                  <div>
                    <span className="text-sm text-gray-600">Weight:</span>
                    <p className="font-medium text-gray-700">{product.specifications.weight}</p>
                  </div>
                )}
                {product.specifications?.dimensions && (
                  <div>
                    <span className="text-sm text-gray-600">Dimensions:</span>
                    <p className="font-medium text-gray-700">{product.specifications.dimensions}</p>
                  </div>
                )}
                {product.specifications?.material && (
                  <div>
                    <span className="text-sm text-gray-600">Material:</span>
                    <p className="font-medium text-gray-700">{product.specifications.material}</p>
                  </div>
                )}
                {product.specifications?.color && (
                  <div>
                    <span className="text-sm text-gray-600">Color:</span>
                    <p className="font-medium text-gray-700">{product.specifications.color}</p>
                  </div>
                )}
                {product.specifications?.warranty && (
                  <div>
                    <span className="text-sm text-gray-600">Warranty:</span>
                    <p className="font-medium text-gray-700">{product.specifications.warranty}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Reviews Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Reviews ({product.reviews?.length || 0})
            </h2>
            {product.reviews && product.reviews.length > 0 ? (
              <div className="space-y-4">
                {product.reviews.map((review, index) => (
                  <div key={review._id || review.id || index} className="border-b border-gray-200 pb-4 last:border-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-700">
                            {typeof review.user === 'string' 
                              ? 'Customer' 
                              : (review.user.name || 
                                 `${review.user.firstName || ''} ${review.user.lastName || ''}`.trim() || 
                                 'Customer')}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            {renderStars(review.rating)}
                          </div>
                        </div>
                      </div>
                      {review.createdAt && (
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {review.comment && (
                      <p className="text-gray-600 mt-2">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No reviews yet. Be the first to review this product!</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Product Stats */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Product Information</h3>
            <div className="space-y-3 text-sm">
              {product.sku && (
                <div className="flex justify-between">
                  <span className="text-gray-600">SKU:</span>
                  <span className="font-medium text-gray-700">{product.sku}</span>
                </div>
              )}
              {product.category && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className="font-medium text-gray-700 capitalize">
                    {product.category.replace(/_/g, ' ')}
                  </span>
                </div>
              )}
              {product.subcategory && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Subcategory:</span>
                  <span className="font-medium text-gray-700">{product.subcategory}</span>
                </div>
              )}
              {product.views !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Views:</span>
                  <span className="font-medium text-gray-700">{product.views}</span>
                </div>
              )}
              {product.orders && product.orders.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Orders:</span>
                  <span className="font-medium text-gray-700">{product.orders.length}</span>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Shipping Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Standard shipping available</span>
              </div>
              {product.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">{getLocationString()}</span>
                </div>
              )}
              {product.inventory.location && (
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">{product.inventory.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Guarantee */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-700 mb-1">Quality Guaranteed</h3>
                <p className="text-sm text-gray-600">
                  {product.specifications?.warranty || '30-day money-back guarantee'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Place Order</h2>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              {orderError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
                  {orderError}
                </div>
              )}

              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700">{product.name}</span>
                  <span className="font-bold text-green-600">
                    {formatPrice(product.pricing.retailPrice * quantity, product.pricing.currency)}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  Quantity: {quantity} × {formatPrice(product.pricing.retailPrice, product.pricing.currency)}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Address
                  </label>
                  <input
                    type="text"
                    placeholder="Street Address"
                    value={orderForm.deliveryAddress.street}
                    onChange={(e) => setOrderForm({
                      ...orderForm,
                      deliveryAddress: { ...orderForm.deliveryAddress, street: e.target.value }
                    })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="City"
                      value={orderForm.deliveryAddress.city}
                      onChange={(e) => setOrderForm({
                        ...orderForm,
                        deliveryAddress: { ...orderForm.deliveryAddress, city: e.target.value }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={orderForm.deliveryAddress.state}
                      onChange={(e) => setOrderForm({
                        ...orderForm,
                        deliveryAddress: { ...orderForm.deliveryAddress, state: e.target.value }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="ZIP Code"
                      value={orderForm.deliveryAddress.zipCode}
                      onChange={(e) => setOrderForm({
                        ...orderForm,
                        deliveryAddress: { ...orderForm.deliveryAddress, zipCode: e.target.value }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                    <input
                      type="text"
                      placeholder="Country"
                      value={orderForm.deliveryAddress.country}
                      onChange={(e) => setOrderForm({
                        ...orderForm,
                        deliveryAddress: { ...orderForm.deliveryAddress, country: e.target.value }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Information
                  </label>
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={orderForm.contactInfo.phone}
                    onChange={(e) => setOrderForm({
                      ...orderForm,
                      contactInfo: { ...orderForm.contactInfo, phone: e.target.value }
                    })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={orderForm.contactInfo.email}
                    onChange={(e) => setOrderForm({
                      ...orderForm,
                      contactInfo: { ...orderForm.contactInfo, email: e.target.value }
                    })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Special Instructions (Optional)
                  </label>
                  <textarea
                    placeholder="Any special delivery instructions..."
                    value={orderForm.specialInstructions}
                    onChange={(e) => setOrderForm({
                      ...orderForm,
                      specialInstructions: e.target.value
                    })}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!product) return;
                    
                    // Check if it's own supply
                    const productSupplierId = typeof product.supplier === 'string' 
                      ? product.supplier 
                      : (product.supplier?.id || product.supplier?._id);
                    const userId = session?.user?.id || session?.user?._id || session?.user?.userId;
                    
                    if (userId && productSupplierId && userId === productSupplierId) {
                      setOrderError('You cannot order your own supply');
                      return;
                    }
                    
                    setOrderLoading(true);
                    setOrderError(null);
                    
                    try {
                      const productId = product._id || product.id;
                      if (!productId) {
                        throw new Error('Product ID is missing');
                      }

                      // Construct the order endpoint URL: /api/supplies/:id/order
                      const orderUrl = `/api/supplies/${productId}/order`;
                      const response = await fetch(orderUrl, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          ...(document.cookie.includes('api-token=') ? {
                            'Authorization': `Bearer ${document.cookie.split(';').find(c => c.trim().startsWith('api-token='))?.split('=')[1]}`
                          } : {})
                        },
                        credentials: 'include',
                        body: JSON.stringify({
                          quantity,
                          deliveryAddress: orderForm.deliveryAddress,
                          specialInstructions: orderForm.specialInstructions || undefined,
                          contactInfo: orderForm.contactInfo
                        })
                      });

                      if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.message || 'Failed to place order');
                      }

                      await response.json();
                      setShowOrderModal(false);
                      // Refresh product data to show new order
                      fetchProduct();
                      alert('Order placed successfully!');
                    } catch (error) {
                      logger.error('Error placing order', error instanceof Error ? error : new Error(String(error)), { productId: params.id });
                      setOrderError(error instanceof Error ? error.message : 'Failed to place order');
                    } finally {
                      setOrderLoading(false);
                    }
                  }}
                  disabled={orderLoading || !isInStock || isOwnSupply}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {orderLoading ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

