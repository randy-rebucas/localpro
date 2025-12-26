"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  MapPin,
  Star,
  Eye,
  Heart,
  Share2,
  Clock,
  Wrench,
  Car,
  Home,
  Hammer,
  User,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
  XCircle
} from "lucide-react";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ListSkeleton } from "@/components/ui/loading";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";

export interface Rental {
  id: string;
  name: string;
  description: string;
  category: string;
  type: 'equipment' | 'vehicle' | 'space' | 'tool';
  status: 'available' | 'rented' | 'maintenance' | 'unavailable';
  price: number;
  priceUnit: 'hour' | 'day' | 'week' | 'month';
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
    year?: number;
    condition: 'excellent' | 'good' | 'fair' | 'poor';
    capacity?: string;
    dimensions?: string;
    weight?: string;
  };
  owner: {
    id: string;
    name: string;
    avatar?: string;
    rating?: number;
    reviewCount?: number;
    verified: boolean;
  };
  availability: {
    startDate: string;
    endDate: string;
    isAvailable: boolean;
  };
  rating?: number;
  reviewCount?: number;
  viewsCount: number;
  isFeatured: boolean;
  isFavorited: boolean;
  createdAt: string;
  updatedAt: string;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'equipment':
      return <Wrench className="w-5 h-5" />;
    case 'vehicle':
      return <Car className="w-5 h-5" />;
    case 'space':
      return <Home className="w-5 h-5" />;
    case 'tool':
      return <Hammer className="w-5 h-5" />;
    default:
      return <Wrench className="w-5 h-5" />;
  }
};

const getConditionColor = (condition: string) => {
  switch (condition) {
    case 'excellent':
      return 'text-accent bg-accent/10';
    case 'good':
      return 'text-primary bg-primary/10';
    case 'fair':
      return 'text-yellow-600 bg-yellow-100';
    case 'poor':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'available':
      return 'text-accent bg-accent/10';
    case 'rented':
      return 'text-primary bg-primary/10';
    case 'maintenance':
      return 'text-yellow-600 bg-yellow-100';
    case 'unavailable':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'available':
      return <CheckCircle className="w-4 h-4" />;
    case 'rented':
      return <Clock className="w-4 h-4" />;
    case 'maintenance':
      return <AlertCircle className="w-4 h-4" />;
    case 'unavailable':
      return <XCircle className="w-4 h-4" />;
    default:
      return <AlertCircle className="w-4 h-4" />;
  }
};

export default function RentalDetailPage() {
  const [rental, setRental] = useState<Rental | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const router = useRouter();
  const params = useParams();
  const rentalId = params.id as string;

  useEffect(() => {
    const fetchRental = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.rentalsById}/${rentalId}`, createAuthFetchOptions());
        
        if (!response.ok) {
          throw new Error(`Failed to fetch rental: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
          setRental(data.data);
          setIsFavorited(data.data.isFavorited || false);
        } else {
          throw new Error(data.error || 'Failed to fetch rental');
        }
      } catch (err) {
        logger.error('Error fetching rental', err instanceof Error ? err : new Error(String(err)), { rentalId: params.id });
        setError(err instanceof Error ? err.message : 'Failed to fetch rental');
      } finally {
        setLoading(false);
      }
    };

    if (rentalId) {
      fetchRental();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rentalId]);

  const handleToggleFavorite = async () => {
    // TODO: Implement favorite toggle API call
    setIsFavorited(!isFavorited);
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    if (navigator.share) {
      navigator.share({
        title: rental?.name,
        text: rental?.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleBookRental = () => {
    // TODO: Implement booking functionality
    router.push(`/marketplace/rentals/${rentalId}/book`);
  };

  const handleContactOwner = () => {
    // TODO: Implement contact owner functionality
    logger.debug('Contact owner', { rentalId });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Breadcrumbs
              items={[
                { label: "Marketplace", href: "/marketplace" },
                { label: "Marketplace", href: "/marketplace" },
                { label: "Rentals", href: "/marketplace/rentals" },
                { label: "Loading...", href: "#" }
              ]}
            />
          </div>
          <ListSkeleton count={3} />
        </div>
      </div>
    );
  }

  if (error || !rental) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Breadcrumbs
              items={[
                { label: "Marketplace", href: "/marketplace" },
                { label: "Marketplace", href: "/marketplace" },
                { label: "Rentals", href: "/marketplace/rentals" },
                { label: "Error", href: "#" }
              ]}
            />
          </div>
          <Card className="p-12 text-center">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Rental not found</h3>
            <p className="text-gray-600 mb-6">{error || "The rental you're looking for doesn't exist."}</p>
            <Button onClick={() => router.push('/marketplace/rentals')}>
              Back to Rentals
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Breadcrumbs
            items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Marketplace", href: "/marketplace" },
              { label: "Rentals", href: "/marketplace/rentals" },
              { label: rental.name, href: "#" }
            ]}
          />
          <div className="flex items-center gap-4 mt-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleToggleFavorite}
                className={`flex items-center gap-2 ${isFavorited ? 'text-red-600' : ''}`}
              >
                <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                {isFavorited ? 'Favorited' : 'Add to Favorites'}
              </Button>
              <Button
                variant="outline"
                onClick={handleShare}
                className="flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images */}
            <Card className="overflow-hidden">
              <div className="relative h-96 bg-gray-200">
                {rental.images && rental.images.length > 0 ? (
                  <>
                    <Image
                      src={rental.images[selectedImage]}
                      alt={rental.name}
                      fill
                      className="object-cover"
                    />
                    {rental.isFeatured && (
                      <div className="absolute top-4 left-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Featured
                      </div>
                    )}
                    <div className="absolute top-4 right-4 flex gap-2">
                      <Badge className={`${getStatusColor(rental.status)} flex items-center gap-1`}>
                        {getStatusIcon(rental.status)}
                        {rental.status}
                      </Badge>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    {getTypeIcon(rental.type)}
                  </div>
                )}
              </div>
              
              {/* Image Thumbnails */}
              {rental.images && rental.images.length > 1 && (
                <div className="p-4">
                  <div className="flex gap-2 overflow-x-auto">
                    {rental.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 ${
                          selectedImage === index ? 'ring-2 ring-ring' : ''
                        }`}
                      >
                        <Image
                          src={image}
                          alt={`${rental.name} ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Rental Details */}
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{rental.name}</h1>
                  <div className="flex items-center gap-4 text-gray-600">
                    <div className="flex items-center gap-1">
                      {getTypeIcon(rental.type)}
                      <span>{rental.category}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{rental.location.city}, {rental.location.state}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{rental.viewsCount} views</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">
                    ₱{rental.price}
                    <span className="text-lg text-gray-500">/{rental.priceUnit}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="font-medium">
                      {typeof rental.rating === 'number' ? rental.rating.toFixed(1) : '0.0'}
                    </span>
                    <span className="text-gray-500">({rental.reviewCount || 0} reviews)</span>
                  </div>
                </div>
              </div>

              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">{rental.description}</p>
              </div>
            </Card>

            {/* Features */}
            {rental.features && rental.features.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {rental.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-accent" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Specifications */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rental.specifications.brand && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Brand</span>
                    <p className="text-gray-900">{rental.specifications.brand}</p>
                  </div>
                )}
                {rental.specifications.model && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Model</span>
                    <p className="text-gray-900">{rental.specifications.model}</p>
                  </div>
                )}
                {rental.specifications.year && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Year</span>
                    <p className="text-gray-900">{rental.specifications.year}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium text-gray-500">Condition</span>
                  <Badge className={`${getConditionColor(rental.specifications.condition)} mt-1`}>
                    {rental.specifications.condition}
                  </Badge>
                </div>
                {rental.specifications.capacity && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Capacity</span>
                    <p className="text-gray-900">{rental.specifications.capacity}</p>
                  </div>
                )}
                {rental.specifications.dimensions && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Dimensions</span>
                    <p className="text-gray-900">{rental.specifications.dimensions}</p>
                  </div>
                )}
                {rental.specifications.weight && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Weight</span>
                    <p className="text-gray-900">{rental.specifications.weight}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Card */}
            <Card className="p-6">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  ₱{rental.price}
                  <span className="text-lg text-gray-500">/{rental.priceUnit}</span>
                </div>
                <Badge className={`${getStatusColor(rental.status)} flex items-center gap-1 justify-center`}>
                  {getStatusIcon(rental.status)}
                  {rental.status}
                </Badge>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleBookRental}
                  disabled={rental.status !== 'available'}
                  className="w-full"
                  size="lg"
                >
                  {rental.status === 'available' ? 'Book Now' : 'Not Available'}
                </Button>
                <Button
                  onClick={handleContactOwner}
                  variant="outline"
                  className="w-full"
                >
                  Contact Owner
                </Button>
              </div>

              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Availability</span>
                  <span>{rental.availability.isAvailable ? 'Available' : 'Unavailable'}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>From</span>
                  <span>{new Date(rental.availability.startDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>To</span>
                  <span>{new Date(rental.availability.endDate).toLocaleDateString()}</span>
                </div>
              </div>
            </Card>

            {/* Owner Info */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Owner</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  {rental.owner.avatar ? (
                    <Image
                      src={rental.owner.avatar}
                      alt={rental.owner.name}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  ) : (
                    <User className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">{rental.owner.name}</h4>
                    {rental.owner.verified && (
                      <CheckCircle className="w-4 h-4 text-accent" />
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600">
                      {typeof rental.owner.rating === 'number' ? rental.owner.rating.toFixed(1) : '0.0'} ({rental.owner.reviewCount || 0} reviews)
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Button
                  onClick={handleContactOwner}
                  variant="outline"
                  className="w-full flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Call Owner
                </Button>
                <Button
                  onClick={handleContactOwner}
                  variant="outline"
                  className="w-full flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Send Message
                </Button>
              </div>
            </Card>

            {/* Location */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-gray-900">{rental.location.address}</p>
                    <p className="text-gray-600">
                      {rental.location.city}, {rental.location.state} {rental.location.zipCode}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    // TODO: Open map with rental location
                    logger.debug('Open map for location', { location: rental.location });
                  }}
                >
                  View on Map
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
