"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Star,
  Heart,
  Share2,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
  X,
  Download,
  MessageCircle,
  BookOpen,
  Calendar,
  Package
} from "lucide-react";
import { Skeleton } from "@/components/ui/loading";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { formatCurrency } from "@/lib/currency-utils";
import { useAppSettings } from "@/hooks/useAppSettings";

interface RentalImage {
  url: string;
  publicId?: string;
  thumbnail?: string;
  alt?: string;
}

interface Rental {
  _id?: string;
  id?: string;
  name: string;
  title?: string;
  description: string;
  category: string;
  subcategory?: string;
  pricing: {
    hourly?: number;
    daily?: number;
    weekly?: number;
    monthly?: number;
    currency: string;
  };
  location: {
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    coordinates?: {
      lat: number;
      lng: number;
    };
    pickupRequired?: boolean;
    deliveryAvailable?: boolean;
    deliveryFee?: number;
  };
  images?: RentalImage[];
  specifications?: {
    brand?: string;
    model?: string;
    year?: number;
    condition: 'excellent' | 'good' | 'fair' | 'poor';
    features?: string[];
    dimensions?: {
      length?: number;
      width?: number;
      height?: number;
      unit: string;
    };
    weight?: {
      value: number;
      unit: string;
    };
  };
  owner: {
    _id?: string;
    id?: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    profile?: {
      avatar?: string;
      bio?: string;
      rating?: number;
    };
    rating?: number;
    reviewCount?: number;
    verified?: boolean;
    phone?: string;
    email?: string;
  };
  availability: {
    isAvailable: boolean;
    schedule?: Array<{
      startDate: string;
      endDate: string;
      reason: 'rented' | 'maintenance' | 'unavailable';
    }>;
  };
  requirements?: {
    minAge?: number;
    licenseRequired?: boolean;
    licenseType?: string;
    deposit?: number;
    insuranceRequired?: boolean;
  };
  documents?: Array<{
    type: string;
    url: string;
    publicId?: string;
    name: string;
  }>;
  maintenance?: {
    lastService?: string;
    nextService?: string;
    serviceHistory?: Array<{
      date: string;
      type: string;
      description: string;
      cost?: number;
    }>;
  };
  rating?: {
    average: number;
    count: number;
  };
  averageRating?: number;
  views?: number;
  viewsCount?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  isFavorited?: boolean;
  tags?: string[];
  bookings?: Array<{
    user?: string | {
      _id?: string;
      id?: string;
      firstName?: string;
      lastName?: string;
    };
    startDate?: string | Date;
    endDate?: string | Date;
    quantity?: number;
    totalCost?: number;
    specialRequests?: string;
    contactInfo?: {
      phone?: string;
      email?: string;
    };
    status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    createdAt?: string | Date;
    updatedAt?: string | Date;
  }>;
  reviews?: Array<{
    _id?: string;
    user: {
      _id?: string;
      firstName?: string;
      lastName?: string;
      profile?: {
        avatar?: string;
      };
    };
    rating: number;
    comment?: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'available': return 'bg-gradient-to-r from-green-100 to-green-200 text-green-700 border-2 border-green-300';
    case 'rented': return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 border-2 border-blue-300';
    case 'maintenance': return 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-700 border-2 border-yellow-300';
    case 'unavailable': return 'bg-gradient-to-r from-red-100 to-red-200 text-red-700 border-2 border-red-300';
    default: return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-2 border-gray-300';
  }
};

const getConditionColor = (condition: 'excellent' | 'good' | 'fair' | 'poor' | undefined) => {
  if (!condition) return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-2 border-gray-300';
  switch (condition) {
    case 'excellent': return 'bg-gradient-to-r from-green-100 to-green-200 text-green-700 border-2 border-green-300';
    case 'good': return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 border-2 border-blue-300';
    case 'fair': return 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-700 border-2 border-yellow-300';
    case 'poor': return 'bg-gradient-to-r from-red-100 to-red-200 text-red-700 border-2 border-red-300';
    default: return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-2 border-gray-300';
  }
};

export default function RentalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { settings: appSettings } = useAppSettings();
  const [rental, setRental] = useState<Rental | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    startDate: "",
    endDate: "",
    notes: "",
    contactPhone: "",
    contactEmail: ""
  });

  // Helper to get image URL (handles both string and object formats)
  const getImageUrl = (image: string | RentalImage | undefined): string | null => {
    if (!image) return null;
    if (typeof image === 'string') {
      return image.trim() !== '' ? image : null;
    }
    const url = image.url || image.thumbnail || '';
    return url.trim() !== '' ? url : null;
  };

  // Helper to get all image URLs (filters out empty strings)
  const getImageUrls = (): string[] => {
    if (!rental?.images || rental.images.length === 0) return [];
    return rental.images
      .map(img => getImageUrl(img))
      .filter((url): url is string => url !== null && url.trim() !== '');
  };

  // Get rental ID (handles both _id and id)
  // Note: rentalId variable removed (unused) but params.id available where needed

  // Get status from availability
  const rentalStatus = rental?.availability?.isAvailable ? 'available' : 'unavailable';

  // Get rating info
  const rating = rental?.rating?.average || rental?.averageRating || 0;
  const reviewCount = rental?.rating?.count || rental?.reviews?.length || 0;
  const viewsCount = rental?.views || rental?.viewsCount || 0;

  // Get owner avatar URL (similar to user-profile.tsx)
  const ownerAvatarUrl = useMemo(() => {
    if (!rental?.owner?.profile?.avatar) return null;

    const avatar = rental.owner.profile.avatar;

    // Handle object with url/thumbnail properties
    if (typeof avatar === 'object' && avatar !== null && !Array.isArray(avatar)) {
      const avatarObj = avatar as { url?: string; thumbnail?: string };
      return avatarObj.url || avatarObj.thumbnail || null;
    }

    // Handle string
    if (typeof avatar === 'string') {
      return avatar.trim() !== '' ? avatar : null;
    }

    return null;
  }, [rental?.owner?.profile?.avatar]);

  useEffect(() => {
    const fetchRental = async () => {
      // Check if params.id exists and is valid
      if (!params.id || params.id === 'undefined' || params.id === 'null') {
        setError('Invalid rental ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.rentalsById}/${params.id}`, createAuthFetchOptions());

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Rental not found');
          }
          throw new Error(`Failed to fetch rental: ${response.status}`);
        }

        const responseData = await response.json();
        // Handle different response structures
        const rentalData = responseData.data || responseData;

        // Normalize _id to id for consistency
        if (rentalData._id && !rentalData.id) {
          rentalData.id = rentalData._id;
        }

        // Normalize owner _id to id
        if (rentalData.owner?._id && !rentalData.owner?.id) {
          rentalData.owner.id = rentalData.owner._id;
        }

        // Build owner name from firstName/lastName if name doesn't exist
        if (rentalData.owner && !rentalData.owner.name) {
          const firstName = rentalData.owner.firstName || '';
          const lastName = rentalData.owner.lastName || '';
          rentalData.owner.name = `${firstName} ${lastName}`.trim() || 'Unknown Owner';
        }

        setRental(rentalData);
      } catch (error) {
        logger.error('Error fetching rental', error instanceof Error ? error : new Error(String(error)), { rentalId: params.id });
        setError('Failed to load rental details');
        // Fallback to mock data
        setRental({
          id: params.id as string,
          name: 'Professional Excavator - CAT 320',
          description: 'Heavy-duty excavator perfect for construction projects. Well-maintained and ready for immediate use. This machine has been professionally serviced and is in excellent working condition.',
          category: 'equipment',
          subcategory: 'construction equipment',
          pricing: {
            hourly: 25,
            daily: 150,
            weekly: 800,
            monthly: 3000,
            currency: 'PHP'
          },
          location: {
            address: {
              street: '123 Construction Way',
              city: 'Manila',
              state: 'Metro Manila',
              zipCode: '1000',
              country: 'Philippines'
            },
            coordinates: {
              lat: 14.5995,
              lng: 120.9842
            },
            pickupRequired: true,
            deliveryAvailable: true,
            deliveryFee: 15
          },
          images: [
            { url: 'https://via.placeholder.com/800x600', alt: 'Excavator Front View' },
            { url: 'https://via.placeholder.com/800x600', alt: 'Excavator Side View' },
            { url: 'https://via.placeholder.com/800x600', alt: 'Excavator Back View' }
          ],
          specifications: {
            brand: 'Caterpillar',
            model: '320',
            year: 2020,
            condition: 'excellent',
            features: ['Air Conditioning', 'GPS Tracking', 'Safety Equipment', 'Fuel Efficient', '4WD', 'Bluetooth'],
            dimensions: {
              length: 25,
              width: 8,
              height: 10,
              unit: 'ft'
            },
            weight: {
              value: 20000,
              unit: 'lbs'
            }
          },
          owner: {
            id: '1',
            name: 'Heavy Equipment Rentals',
            profile: {
              avatar: 'https://via.placeholder.com/100',
              bio: 'Professional equipment rental provider',
              rating: 4.8
            },
            rating: 4.8,
            reviewCount: 124,
            verified: true,
            phone: '+1 (555) 123-4567',
            email: 'contact@heavyequipment.com'
          },
          availability: {
            isAvailable: true,
            schedule: []
          },
          rating: {
            average: 4.8,
            count: 24
          },
          averageRating: 4.8,
          views: 156,
          viewsCount: 156,
          isFeatured: true,
          isFavorited: false,
          tags: ['excavator', 'construction', 'equipment', 'heavy-duty'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchRental();
    }
  }, [params.id]);

  const handleEdit = () => {
    router.push(`/rentals/${params.id}/edit`);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this rental?')) {
      try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.rentalsById}/${params.id}`, createAuthFetchOptions({
          method: 'DELETE',
        }));

        if (response.ok) {
          router.push('/rentals');
        }
      } catch (error) {
        logger.error('Error deleting rental', error instanceof Error ? error : new Error(String(error)), { rentalId: params.id });
      }
    }
  };

  const handleToggleFavorite = async () => {
    try {
      // Implement favorite toggle
      logger.debug('Toggle favorite for rental', { rentalId: params.id });
    } catch (error) {
      logger.error('Error toggling favorite', error instanceof Error ? error : new Error(String(error)), { rentalId: params.id });
    }
  };

  const handleBookRental = async () => {
    if (!bookingForm.startDate || !bookingForm.endDate) {
      alert('Please select start and end dates');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.rentalsBook}/${params.id}/book`, createAuthFetchOptions({
        method: 'POST',
        body: JSON.stringify(bookingForm),
      }));

      if (response.ok) {
        alert('Booking request submitted successfully!');
        setShowBookingForm(false);
      } else {
        alert('Failed to submit booking request');
      }
    } catch (error) {
      logger.error('Error booking rental', error instanceof Error ? error : new Error(String(error)), { rentalId: params.id, bookingForm });
      alert('Failed to submit booking request');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-green-200/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
        </div>
        <div className="relative z-10 p-6 space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-8 w-64" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !rental) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="bg-gradient-to-br from-white to-red-50/30 rounded-xl border-2 border-red-200 shadow-lg p-8 backdrop-blur-sm text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/20">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent mb-2">Rental not found</h3>
            <p className="text-gray-600 mb-6">The rental you&apos;re looking for doesn&apos;t exist or has been removed.</p>
            <button
              onClick={() => router.push('/rentals')}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105 font-semibold"
            >
              Back to Rentals
            </button>
          </div>
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

      <div className="relative z-10 max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/rentals"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to rentals"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Package className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{rental.name}</h1>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm ${getStatusColor(rentalStatus)}`}>
                {rentalStatus}
              </span>
              {rental.isFeatured && (
                <span className="px-2.5 py-1 bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-700 rounded-full text-xs font-semibold border-2 border-yellow-300 shadow-sm">
                  <Star className="w-3 h-3 inline mr-1" />
                  Featured
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">Listed by {rental.owner.name}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleToggleFavorite}
              className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-300 text-gray-700 rounded-lg hover:from-gray-50 hover:to-gray-100 transition-all shadow-sm hover:shadow-md font-medium ${rental.isFavorited ? 'text-red-500 border-red-300' : ''
                }`}
            >
              <Heart className={`w-4 h-4 ${rental.isFavorited ? 'fill-current' : ''}`} />
              {rental.isFavorited ? 'Favorited' : 'Favorite'}
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(window.location.href)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-300 text-gray-700 rounded-lg hover:from-gray-50 hover:to-gray-100 transition-all shadow-sm hover:shadow-md font-medium"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-300 text-gray-700 rounded-lg hover:from-gray-50 hover:to-gray-100 transition-all shadow-sm hover:shadow-md font-medium"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-white to-red-50 border-2 border-red-300 text-red-600 rounded-lg hover:from-red-50 hover:to-red-100 transition-all shadow-sm hover:shadow-md font-medium"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Rental Images */}
            {rental.images && rental.images.length > 0 && (() => {
              const imageUrls = getImageUrls();
              if (imageUrls.length === 0) return null;

              const mainImageUrl = imageUrls[selectedImageIndex] || imageUrls[0];
              if (!mainImageUrl || mainImageUrl.trim() === '') return null;

              return (
                <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg overflow-hidden backdrop-blur-sm">
                  <div className="relative">
                    <Image
                      src={mainImageUrl}
                      alt={rental.images[selectedImageIndex]?.alt || rental.name}
                      width={800}
                      height={400}
                      className="w-full h-96 object-cover"
                    />
                    {imageUrls.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                        {imageUrls.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedImageIndex(index)}
                            className={`w-3 h-3 rounded-full transition-all ${index === selectedImageIndex ? 'bg-white shadow-lg scale-125' : 'bg-white/50 hover:bg-white/75'
                              }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  {imageUrls.length > 1 && (
                    <div className="p-4 bg-gradient-to-br from-gray-50 to-white">
                      <div className="flex gap-2 overflow-x-auto">
                        {rental.images.map((image, index) => {
                          const imgUrl = getImageUrl(image);
                          if (!imgUrl) return null;
                          return (
                            <button
                              key={index}
                              onClick={() => setSelectedImageIndex(index)}
                              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all shadow-md hover:shadow-lg ${index === selectedImageIndex ? 'ring-2 ring-emerald-500 border-emerald-300 scale-105' : 'border-gray-200 hover:border-emerald-300'
                                }`}
                            >
                              <Image
                                src={imgUrl}
                                alt={typeof image === 'object' ? (image.alt || `${rental.name} ${index + 1}`) : `${rental.name} ${index + 1}`}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Rental Details */}
            <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg p-6 backdrop-blur-sm">
              <h2 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">Rental Details</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600">{rental.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Category</h3>
                    <span className="inline-block bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium border-2 border-gray-300 shadow-sm capitalize">
                      {rental.category}
                    </span>
                  </div>
                  {rental.subcategory && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Subcategory</h3>
                      <span className="inline-block bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium border-2 border-blue-300 shadow-sm">
                        {rental.subcategory}
                      </span>
                    </div>
                  )}
                </div>

                {rental.specifications?.features && rental.specifications.features.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Features</h3>
                    <div className="flex flex-wrap gap-2">
                      {rental.specifications.features.map((feature, index) => (
                        <span
                          key={index}
                          className="bg-gradient-to-r from-green-100 to-green-200 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border-2 border-green-300 shadow-sm"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {rental.tags && rental.tags.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {rental.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-3 py-1.5 rounded-full text-sm font-medium border-2 border-purple-300 shadow-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Location</h3>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {rental.location.address.street}, {rental.location.address.city}, {rental.location.address.state} {rental.location.address.zipCode}
                      {rental.location.address.country && `, ${rental.location.address.country}`}
                    </span>
                  </div>
                  {rental.location.pickupRequired && (
                    <p className="text-sm text-gray-500 mt-1">Pickup required</p>
                  )}
                  {rental.location.deliveryAvailable && (
                    <p className="text-sm text-gray-500 mt-1">
                      Delivery available{rental.location.deliveryFee ? ` (Fee: ${formatCurrency(rental.location.deliveryFee, rental.pricing.currency || 'PHP', { appSettings })})` : ''}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Specifications */}
            {rental.specifications && (
              <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg p-6 backdrop-blur-sm">
                <h2 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">Specifications</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rental.specifications.brand && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">Brand</h3>
                      <p className="text-gray-600">{rental.specifications.brand}</p>
                    </div>
                  )}
                  {rental.specifications.model && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">Model</h3>
                      <p className="text-gray-600">{rental.specifications.model}</p>
                    </div>
                  )}
                  {rental.specifications.year && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">Year</h3>
                      <p className="text-gray-600">{rental.specifications.year}</p>
                    </div>
                  )}
                  {rental.specifications.condition && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">Condition</h3>
                      <span className={`px-2 py-1 rounded-full text-sm ${getConditionColor(rental.specifications.condition)}`}>
                        {rental.specifications.condition}
                      </span>
                    </div>
                  )}
                  {rental.specifications.dimensions && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">Dimensions</h3>
                      <p className="text-gray-600">
                        {rental.specifications.dimensions.length && `${rental.specifications.dimensions.length} × `}
                        {rental.specifications.dimensions.width && `${rental.specifications.dimensions.width} × `}
                        {rental.specifications.dimensions.height || ''}
                        {rental.specifications.dimensions.unit && ` ${rental.specifications.dimensions.unit}`}
                      </p>
                    </div>
                  )}
                  {rental.specifications.weight && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">Weight</h3>
                      <p className="text-gray-600">
                        {rental.specifications.weight.value} {rental.specifications.weight.unit}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Requirements */}
            {rental.requirements && (
              <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg p-6 backdrop-blur-sm">
                <h2 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">Requirements</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rental.requirements.minAge && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">Minimum Age</h3>
                      <p className="text-gray-600">{rental.requirements.minAge} years</p>
                    </div>
                  )}
                  {rental.requirements.licenseRequired && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">License Required</h3>
                      <p className="text-gray-600">Yes{rental.requirements.licenseType ? ` (${rental.requirements.licenseType})` : ''}</p>
                    </div>
                  )}
                  {rental.requirements.deposit && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">Deposit</h3>
                      <p className="text-gray-600">{formatCurrency(rental.requirements.deposit, rental.pricing.currency || 'PHP', { appSettings })}</p>
                    </div>
                  )}
                  {rental.requirements.insuranceRequired && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">Insurance Required</h3>
                      <p className="text-gray-600">Yes</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg p-6 backdrop-blur-sm">
              <h2 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">Reviews</h2>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="text-2xl font-bold">{rating.toFixed(1)}</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}</p>
                  <p className="text-sm text-gray-500">Based on {viewsCount} {viewsCount === 1 ? 'view' : 'views'}</p>
                </div>
              </div>
              {rental.reviews && rental.reviews.length > 0 ? (
                <div className="space-y-4">
                  {rental.reviews.map((review, index) => (
                    <div key={review._id || index} className="border-t pt-4">
                      <div className="flex items-center gap-3 mb-2">
                        {review.user?.profile?.avatar && typeof review.user.profile.avatar === 'string' && review.user.profile.avatar.trim() !== '' && (
                          <Image
                            src={review.user.profile.avatar}
                            alt={`${review.user.firstName || ''} ${review.user.lastName || ''}`.trim() || 'User'}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">
                            {review.user?.firstName || ''} {review.user?.lastName || ''} {!review.user?.firstName && !review.user?.lastName && 'Anonymous'}
                          </p>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-gray-600 mt-2">{review.comment}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No reviews yet. Be the first to review this rental!</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing & Booking */}
            <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg p-6 backdrop-blur-sm">
              <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">Pricing & Booking</h3>
              <div className="space-y-4">
                <div className="text-center">
                {rental.pricing.hourly && (
                  <div className="mb-3 p-3 bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg border-2 border-emerald-200">
                    <div className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                      {formatCurrency(rental.pricing.hourly, rental.pricing.currency || 'PHP', { appSettings })}
                      <span className="text-lg text-gray-500">/hour</span>
                    </div>
                  </div>
                )}
                {rental.pricing.daily && (
                  <div className="mb-3 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
                    <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {formatCurrency(rental.pricing.daily, rental.pricing.currency || 'PHP', { appSettings })}
                      <span className="text-lg text-gray-500">/day</span>
                    </div>
                  </div>
                )}
                {rental.pricing.weekly && (
                  <div className="mb-3 p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
                    <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {formatCurrency(rental.pricing.weekly, rental.pricing.currency || 'PHP', { appSettings })}
                      <span className="text-lg text-gray-500">/week</span>
                    </div>
                  </div>
                )}
                {rental.pricing.monthly && (
                  <div className="mb-3 p-3 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border-2 border-yellow-200">
                    <div className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                      {formatCurrency(rental.pricing.monthly, rental.pricing.currency || 'PHP', { appSettings })}
                      <span className="text-lg text-gray-500">/month</span>
                    </div>
                  </div>
                )}
                {!rental.pricing.hourly && !rental.pricing.daily && !rental.pricing.weekly && !rental.pricing.monthly && (
                  <p className="text-gray-500">Pricing not available</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Availability</span>
                  <span className={`font-medium ${rental.availability.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                    {rental.availability.isAvailable ? 'Available' : 'Not Available'}
                  </span>
                </div>
                {rental.availability.schedule && rental.availability.schedule.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Scheduled periods:</p>
                    {rental.availability.schedule.map((schedule, index) => (
                      <div key={index} className="text-xs text-gray-600 mb-1">
                        {new Date(schedule.startDate).toLocaleDateString()} - {new Date(schedule.endDate).toLocaleDateString()} ({schedule.reason})
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {rentalStatus === 'available' ? (
                <button
                  onClick={() => setShowBookingForm(true)}
                  className="w-full px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Book Now
                </button>
              ) : (
                <button
                  disabled
                  className="w-full px-4 py-3 text-sm font-semibold text-gray-500 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border-2 border-gray-300 cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Not Available
                </button>
              )}
            </div>
          </div>

          {/* Owner Info */}
          <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg p-6 backdrop-blur-sm">
            <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">Owner</h3>
            <div className="flex items-center gap-3 mb-4">
              {ownerAvatarUrl ? (
                <Image
                  src={ownerAvatarUrl}
                  alt="Profile"
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">
                    {rental.owner.name?.charAt(0) || rental.owner.firstName?.charAt(0) || rental.owner.lastName?.charAt(0) || "U"}
                  </span>
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{rental.owner.name || 'Unknown Owner'}</span>
                  {rental.owner.verified && (
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                  )}
                </div>
                {(rental.owner.profile?.rating || rental.owner.rating) && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium">{rental.owner.profile?.rating || rental.owner.rating}</span>
                    {rental.owner.reviewCount && (
                      <span className="text-sm text-gray-500">({rental.owner.reviewCount} reviews)</span>
                    )}
                  </div>
                )}
                {rental.owner.profile?.bio && (
                  <p className="text-xs text-gray-500 mt-1">{rental.owner.profile.bio}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {rental.owner.phone && (
                <button
                  onClick={() => window.open(`tel:${rental.owner.phone}`)}
                  className="w-full px-4 py-2.5 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-300 text-gray-700 rounded-lg hover:from-gray-50 hover:to-gray-100 transition-all shadow-sm hover:shadow-md font-medium flex items-center justify-start gap-2"
                >
                  <Phone className="w-4 h-4" />
                  {rental.owner.phone}
                </button>
              )}
              {rental.owner.email && (
                <button
                  onClick={() => window.open(`mailto:${rental.owner.email}`)}
                  className="w-full px-4 py-2.5 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-300 text-gray-700 rounded-lg hover:from-gray-50 hover:to-gray-100 transition-all shadow-sm hover:shadow-md font-medium flex items-center justify-start gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Send Email
                </button>
              )}
              <button
                className="w-full px-4 py-2.5 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-300 text-gray-700 rounded-lg hover:from-gray-50 hover:to-gray-100 transition-all shadow-sm hover:shadow-md font-medium flex items-center justify-start gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Send Message
              </button>
            </div>
          </div>

          {/* Documents */}
          {rental.documents && rental.documents.length > 0 && (
            <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg p-6 backdrop-blur-sm">
              <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">Documents</h3>
              <div className="space-y-2">
                {rental.documents.map((doc, index) => (
                  <button
                    key={index}
                    onClick={() => window.open(doc.url, '_blank')}
                    className="w-full px-4 py-2.5 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-300 text-gray-700 rounded-lg hover:from-gray-50 hover:to-gray-100 transition-all shadow-sm hover:shadow-md font-medium flex items-center justify-start gap-2"
                  >
                    <Download className="w-4 h-4" />
                    {doc.name || doc.type}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Maintenance */}
          {rental.maintenance && (
            <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg p-6 backdrop-blur-sm">
              <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">Maintenance</h3>
              <div className="space-y-3">
                {rental.maintenance.lastService && (
                  <div>
                    <p className="text-sm text-gray-600">Last Service</p>
                    <p className="text-sm font-medium">
                      {new Date(rental.maintenance.lastService).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {rental.maintenance.nextService && (
                  <div>
                    <p className="text-sm text-gray-600">Next Service</p>
                    <p className="text-sm font-medium">
                      {new Date(rental.maintenance.nextService).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {rental.maintenance.serviceHistory && rental.maintenance.serviceHistory.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-900 mb-2">Service History</p>
                    <div className="space-y-2">
                      {rental.maintenance.serviceHistory.map((service, index) => (
                        <div key={index} className="text-xs border-l-2 border-gray-200 pl-2">
                          <p className="font-medium">{new Date(service.date).toLocaleDateString()}</p>
                          <p className="text-gray-600">{service.type}</p>
                          {service.description && (
                            <p className="text-gray-500">{service.description}</p>
                          )}
                          {service.cost && (
                            <p className="text-gray-600">
                              Cost: {formatCurrency(service.cost, rental.pricing.currency || 'PHP', { appSettings })}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg p-6 backdrop-blur-sm">
            <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button
                className="w-full px-4 py-2.5 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-300 text-gray-700 rounded-lg hover:from-gray-50 hover:to-gray-100 transition-all shadow-sm hover:shadow-md font-medium flex items-center justify-start gap-2"
              >
                <Download className="w-4 h-4" />
                Download Details
              </button>
              <button
                className="w-full px-4 py-2.5 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-300 text-gray-700 rounded-lg hover:from-gray-50 hover:to-gray-100 transition-all shadow-sm hover:shadow-md font-medium flex items-center justify-start gap-2"
              >
                <BookOpen className="w-4 h-4" />
                View Similar
              </button>
            </div>
          </div>
          </div>
        </div>
      </div>

      {showBookingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-full max-w-md mx-4 bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-xl backdrop-blur-sm">
            <div className="p-6">
              <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">Book This Rental</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={bookingForm.startDate}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={bookingForm.endDate}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={bookingForm.contactPhone}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                    placeholder="Your phone number"
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={bookingForm.contactEmail}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                    placeholder="Your email address"
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Special Notes
                  </label>
                  <textarea
                    value={bookingForm.notes}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any special requirements or notes"
                    rows={3}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setShowBookingForm(false)}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-300 text-gray-700 rounded-lg hover:from-gray-50 hover:to-gray-100 transition-all shadow-sm hover:shadow-md font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBookRental}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105"
                >
                  Submit Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

  );
}
