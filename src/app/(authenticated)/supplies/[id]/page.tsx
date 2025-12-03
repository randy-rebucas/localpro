"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Edit,
  Share2,
  Heart,
  ShoppingCart,
  Truck,
  Star,
  MapPin,
  Package,
  DollarSign,
  Eye,
  CheckCircle,
  AlertCircle,
  Plus,
  Minus
} from "lucide-react";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/loading";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
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

const getStatusColor = (status: Supply['status']) => {
  switch (status) {
    case 'available': return 'bg-green-100 text-green-800';
    case 'out-of-stock': return 'bg-red-100 text-red-800';
    case 'discontinued': return 'bg-gray-100 text-gray-800';
    case 'pre-order': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// const getTypeIcon = (type: Supply['type']) => {
//   switch (type) {
//     case 'cleaning': return <Shield className="w-4 h-4" />;
//     case 'tools': return <Zap className="w-4 h-4" />;
//     case 'materials': return <Package className="w-4 h-4" />;
//     case 'equipment': return <Truck className="w-4 h-4" />;
//     case 'subscription': return <Clock className="w-4 h-4" />;
//     default: return <Package className="w-4 h-4" />;
//   }
// };

export default function SupplyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { settings: appSettings } = useAppSettings();
  const [supply, setSupply] = useState<Supply | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    const fetchSupply = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.suppliesById}/${params.id}`, createAuthFetchOptions());
        
        if (!response.ok) {
          throw new Error('Supply not found');
        }

        const data = await response.json();
        setSupply(data);
        setIsFavorited(data.isFavorited || false);
      } catch (error) {
        logger.error('Error fetching supply', error instanceof Error ? error : new Error(String(error)), { supplyId: params.id });
        // Fallback to mock data
        setSupply({
          id: params.id as string,
          name: 'Professional Cleaning Kit - Complete Set',
          description: 'Complete cleaning kit with all essential tools and supplies for professional cleaning services. Includes premium quality products that are eco-friendly and long-lasting. Perfect for both residential and commercial cleaning operations.',
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
          images: ['https://via.placeholder.com/800x600', 'https://via.placeholder.com/800x600', 'https://via.placeholder.com/800x600'],
          features: ['Professional Grade', 'Eco-Friendly', 'Long Lasting', 'Easy to Use', 'Versatile', 'Cost Effective'],
          specifications: {
            brand: 'CleanPro',
            model: 'CP-2024',
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
          updatedAt: new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchSupply();
    }
  }, [params.id]);

  const handleToggleFavorite = async () => {
    setIsFavorited(!isFavorited);
    // Implement favorite toggle API call
    logger.debug('Toggle favorite for supply', { supplyId: params.id, isFavorited: !isFavorited });
  };

  const handleAddToCart = async () => {
    // Implement add to cart API call
    logger.debug('Add to cart', { supplyId: params.id, quantity });
  };

  const handleOrderNow = async () => {
    // Implement order now functionality
    logger.debug('Order now', { supplyId: params.id, quantity });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!supply) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Supply not found</h3>
        <p className="text-gray-600 mb-4">The supply you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        <Button onClick={() => router.push('/supplies')}>
          Browse Supplies
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Marketplace', href: '/marketplace' },
          { label: 'Supplies & Materials', href: '/supplies' },
          { label: supply.name, href: `/supplies/${supply.id}` }
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{supply.name}</h1>
            <p className="text-gray-600">{supply.category} • {supply.supplier.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleToggleFavorite}
            className={`flex items-center gap-2 ${isFavorited ? 'text-red-500' : ''}`}
          >
            <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
            {isFavorited ? 'Favorited' : 'Favorite'}
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/supplies/${supply.id}/edit`)}
            className="flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Images */}
        <div className="space-y-4">
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            {supply.images.length > 0 ? (
              <Image
                src={supply.images[selectedImage]}
                alt={supply.name}
                width={800}
                height={400}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-16 h-16 text-gray-400" />
              </div>
            )}
          </div>
          {supply.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {supply.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 ${
                    selectedImage === index ? 'border-blue-500' : 'border-gray-200'
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${supply.name} ${index + 1}`}
                    width={100}
                    height={100}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          {/* Price and Status */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-3xl font-bold text-gray-900">{formatCurrency(supply.price, 'PHP', { appSettings })}</span>
                  {supply.originalPrice && (
                    <span className="text-lg text-gray-500 line-through">{formatCurrency(supply.originalPrice, 'PHP', { appSettings })}</span>
                  )}
                  <span className="text-sm text-gray-500">/{supply.unit}</span>
                </div>
                {supply.originalPrice && (
                  <div className="text-sm text-green-600 font-medium">
                    Save {formatCurrency(supply.originalPrice - supply.price, 'PHP', { appSettings })} ({Math.round(((supply.originalPrice - supply.price) / supply.originalPrice) * 100)}% off)
                  </div>
                )}
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(supply.status)}`}>
                {supply.status}
              </span>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="font-medium">{supply.rating}</span>
                <span className="text-gray-500">({supply.reviewCount} reviews)</span>
              </div>
              <div className="flex items-center gap-1 text-gray-500">
                <Eye className="w-4 h-4" />
                <span>{supply.viewsCount} views</span>
              </div>
            </div>

            {/* Quantity and Actions */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">Quantity:</label>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= supply.minOrder}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setQuantity(Math.min(supply.maxOrder || 999, quantity + 1))}
                    disabled={quantity >= (supply.maxOrder || 999)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <span className="text-sm text-gray-500">
                  Min: {supply.minOrder} {supply.maxOrder && `• Max: ${supply.maxOrder}`}
                </span>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleAddToCart}
                  variant="outline"
                  className="flex-1 flex items-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add to Cart
                </Button>
                <Button
                  onClick={handleOrderNow}
                  className="flex-1 flex items-center gap-2"
                  disabled={supply.status !== 'available'}
                >
                  <CheckCircle className="w-4 h-4" />
                  Order Now
                </Button>
              </div>

              {supply.status !== 'available' && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">This item is currently {supply.status}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Supplier Info */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Supplier</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-lg font-medium">
                  {supply.supplier.name.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900">{supply.supplier.name}</h4>
                  {supply.supplier.verified && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span>{supply.supplier.rating}</span>
                  <span>({supply.supplier.reviewCount} reviews)</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <MapPin className="w-4 h-4" />
                  <span>{supply.supplier.location}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Delivery Info */}
          {supply.delivery.available && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">
                    Estimated delivery: {supply.delivery.estimatedDays} days
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">
                    Delivery cost: {supply.delivery.cost === 0 ? 'Free' : `$${supply.delivery.cost}`}
                  </span>
                </div>
                {supply.delivery.freeShippingThreshold && (
                  <div className="text-sm text-gray-500">
                    Free shipping on orders over ${supply.delivery.freeShippingThreshold}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Description and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
            <p className="text-gray-600 leading-relaxed">{supply.description}</p>
          </Card>

          {/* Features */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Features</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {supply.features.map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Specifications */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Specifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(supply.specifications).map(([key, value]) => (
                value && (
                  <div key={key} className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </span>
                    <span className="text-sm text-gray-600">{value}</span>
                  </div>
                )
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Stock Info */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Available Stock:</span>
                <span className="text-sm font-medium">{supply.stock} {supply.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Minimum Order:</span>
                <span className="text-sm font-medium">{supply.minOrder} {supply.unit}</span>
              </div>
              {supply.maxOrder && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Maximum Order:</span>
                  <span className="text-sm font-medium">{supply.maxOrder} {supply.unit}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Tags */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {supply.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </Card>

          {/* Location */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-600 mt-0.5" />
              <div className="text-sm text-gray-600">
                <p>{supply.location.address}</p>
                <p>{supply.location.city}, {supply.location.state} {supply.location.zipCode}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
