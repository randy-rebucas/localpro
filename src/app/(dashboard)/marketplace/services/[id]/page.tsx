"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { 
  Star, 
  MapPin, 
  Clock, 
  // DollarSign,
  // User,
  // ChevronLeft,
  Share2,
  Heart,
  Shield,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { makeClientAuthenticatedRequestWithPathSafe, makeClientAuthenticatedRequestWithEndpointSafe } from "@/lib/client-api-utils";
import { API_ENDPOINTS } from "@/lib/api";

// Service Image Interface
interface ServiceImage {
  url: string;
  publicId?: string;
  thumbnail?: string;
  alt?: string;
}

// Service Entity Interface (matching data-entities.md)
interface Service {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  category: 'cleaning' | 'plumbing' | 'electrical' | 'moving' | 'landscaping' | 
            'painting' | 'carpentry' | 'flooring' | 'roofing' | 'hvac' | 
            'appliance_repair' | 'locksmith' | 'handyman' | 'home_security' |
            'pool_maintenance' | 'pest_control' | 'carpet_cleaning' | 'window_cleaning' |
            'gutter_cleaning' | 'power_washing' | 'snow_removal' | 'other';
  subcategory: string;
  provider: {
    _id?: string;
    id?: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    profile?: {
      skills?: string[];
      rating?: number;
    };
    rating?: number;
  } | string; // Can be populated object or just ID
  pricing: {
    type: 'hourly' | 'fixed' | 'per_sqft' | 'per_item';
    basePrice: number;
    currency?: string;
  };
  availability?: {
    schedule?: Array<{
      day?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
      startTime?: string;
      endTime?: string;
      isAvailable?: boolean;
    }>;
    timezone?: string;
  };
  serviceArea: string[];
  images?: ServiceImage[] | string[]; // Support both formats
  features?: string[];
  requirements?: string[];
  serviceType?: 'one_time' | 'recurring' | 'emergency' | 'maintenance' | 'installation';
  estimatedDuration?: {
    min?: number;
    max?: number;
  };
  teamSize?: number;
  equipmentProvided?: boolean;
  materialsIncluded?: boolean;
  warranty?: {
    hasWarranty?: boolean;
    duration?: number;
    description?: string;
  };
  insurance?: {
    covered?: boolean;
    coverageAmount?: number;
  };
  emergencyService?: {
    available?: boolean;
    surcharge?: number;
    responseTime?: string;
  };
  servicePackages?: Array<{
    _id?: string;
    id?: string;
    name?: string;
    description?: string;
    price?: number;
    features?: string[];
    duration?: number;
  }>;
  addOns?: Array<{
    _id?: string;
    id?: string;
    name?: string;
    description?: string;
    price?: number;
    category?: string;
  }>;
  isActive?: boolean;
  rating?: {
    average?: number;
    count?: number;
  };
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

interface Review {
  id: string;
  user: {
    name: string;
    avatar?: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
  helpful: number;
}

interface BookingForm {
  bookingDate: string; // Combined date and time (ISO format)
  duration: number; // in hours
  address: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  specialInstructions?: string;
  // Legacy fields for backward compatibility
  date?: string;
  time?: string;
  notes?: string;
  contactPhone?: string;
  contactEmail?: string;
}

interface ProviderWithService {
  _id?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  profile?: {
    skills?: string[];
    rating?: number;
  };
  rating?: number;
  serviceId?: string;
  serviceTitle?: string;
}

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [service, setService] = useState<Service | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    bookingDate: "",
    duration: 0, // in hours
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: ""
    },
    specialInstructions: ""
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [providersWithService, setProvidersWithService] = useState<ProviderWithService[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  // Normalize service data from API response
  const normalizeService = useCallback((serviceData: Partial<Service> & Record<string, unknown>): Service => {
    const availabilityData = serviceData.availability as Service['availability'] | undefined;
    return {
      ...serviceData,
      _id: serviceData._id || serviceData.id || '',
      id: serviceData.id || serviceData._id || '',
      title: (serviceData.title as string) || '',
      description: (serviceData.description as string) || '',
      // Handle images
      images: Array.isArray(serviceData.images)
        ? serviceData.images.map((img: string | ServiceImage | Record<string, unknown>) =>
            typeof img === 'string'
              ? { url: img, alt: (serviceData.title as string) || '' }
              : {
                  url: (img as ServiceImage).url || (img as ServiceImage).publicId || '',
                  publicId: (img as ServiceImage).publicId,
                  thumbnail: (img as ServiceImage).thumbnail,
                  alt: (img as ServiceImage).alt || (serviceData.title as string) || ''
                }
          )
        : [],
      // Handle provider
      provider: typeof serviceData.provider === 'string'
        ? { id: serviceData.provider }
        : {
            _id: serviceData.provider?._id || serviceData.provider?.id,
            id: serviceData.provider?.id || serviceData.provider?._id,
            firstName: serviceData.provider?.firstName,
            lastName: serviceData.provider?.lastName,
            name: serviceData.provider?.name,
            profile: serviceData.provider?.profile,
            rating: serviceData.provider?.rating
          },
      // Handle availability schedule
      availability: availabilityData ? {
        schedule: availabilityData.schedule || [],
        timezone: availabilityData.timezone || 'UTC'
      } : {
        schedule: [],
        timezone: 'UTC'
      },
      // Handle pricing with defaults
      pricing: serviceData.pricing ? {
        type: serviceData.pricing.type || 'fixed',
        basePrice: serviceData.pricing.basePrice ?? 0,
        currency: serviceData.pricing.currency || 'USD'
      } : {
        type: 'fixed' as const,
        basePrice: 0,
        currency: 'USD'
      },
      // Handle rating with defaults
      rating: serviceData.rating || {
        average: 0,
        count: 0
      },
      // Handle estimatedDuration with defaults
      estimatedDuration: serviceData.estimatedDuration || {
        min: 1,
        max: 8
      },
      // Handle warranty (preserve if exists)
      warranty: serviceData.warranty,
      // Handle insurance (preserve if exists)
      insurance: serviceData.insurance,
      // Handle emergencyService (preserve if exists)
      emergencyService: serviceData.emergencyService,
      // Set defaults
      category: (serviceData.category as Service['category']) || 'other',
      subcategory: (serviceData.subcategory as string) || '',
      isActive: serviceData.isActive !== undefined ? serviceData.isActive : true,
      serviceArea: serviceData.serviceArea || [],
      features: serviceData.features || [],
      requirements: serviceData.requirements || [],
      servicePackages: serviceData.servicePackages || [],
      addOns: serviceData.addOns || []
    };
  }, []);

  const fetchService = useCallback(async () => {
    try {
      setLoading(true);
      const response = await makeClientAuthenticatedRequestWithPathSafe(
        'marketplaceServiceById' as keyof typeof API_ENDPOINTS,
        [String(params.id)]
      );
      
      if (!response.ok) {
        throw new Error("Service not found");
      }

      const data = await response.json();
      
      // Handle API response structure: {success: true, data: {...}}
      const serviceData = data.success && data.data ? data.data : data;
      const normalizedService = normalizeService(serviceData);
      setService(normalizedService);
      
      // Load favorite status from localStorage
      const serviceId = normalizedService._id || normalizedService.id;
      if (serviceId) {
        const favorites = JSON.parse(localStorage.getItem('favoriteServices') || '[]');
        setIsFavorited(favorites.includes(serviceId));
      }
      
      setBookingForm(prev => ({
        ...prev,
        duration: normalizedService.estimatedDuration?.min || 2,
        address: {
          ...prev.address,
          // Can be filled from user profile or location
        }
      }));
    } catch (error) {
      console.error("Error fetching service:", error);
      setError("Failed to load service details");
    } finally {
      setLoading(false);
    }
  }, [params.id, normalizeService]);

  const fetchReviews = useCallback(async () => {
    try {
      const response = await makeClientAuthenticatedRequestWithPathSafe(
        'marketplaceBookingReview' as keyof typeof API_ENDPOINTS,
        [String(params.id), 'reviews']
      );
      if (response.ok) {
        const data = await response.json();
        setReviews(Array.isArray(data) ? data : data.reviews || []);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  }, [params.id]);

  const fetchProvidersWithService = useCallback(async (serviceData: Service) => {
    if (!serviceData.category || !serviceData.subcategory) {
      return;
    }

    try {
      setLoadingProviders(true);

      const response = await makeClientAuthenticatedRequestWithEndpointSafe(
        'marketplaceProvidersWithService' as keyof typeof API_ENDPOINTS,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          query: {
            serviceId: String(params.id)
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const services = Array.isArray(data) ? data : (data.data || []);
        
        // Extract unique providers from services
        const providerMap = new Map<string, ProviderWithService>();
        const currentServiceId = serviceData._id || serviceData.id;

        // Get current provider ID to exclude it
        const currentProviderId = typeof serviceData.provider === 'object' && !Array.isArray(serviceData.provider)
          ? (serviceData.provider._id || serviceData.provider.id)
          : typeof serviceData.provider === 'string'
          ? serviceData.provider
          : null;

        services.forEach((svc: Partial<Service> & Record<string, unknown>) => {
          const serviceId = (svc._id || svc.id) as string | undefined;
          // Skip the current service
          if (serviceId === currentServiceId) return;

          if (svc.provider) {
            const provider = typeof svc.provider === 'string' 
              ? { id: svc.provider }
              : svc.provider as ProviderWithService;
            
            const providerId = provider._id || provider.id;
            if (!providerId) return;

            // Skip if this is the current provider
            if (currentProviderId && String(providerId) === String(currentProviderId)) return;

            // Only add if not already in map (to get unique providers)
            if (!providerMap.has(String(providerId))) {
              providerMap.set(String(providerId), {
                _id: provider._id || provider.id,
                id: provider.id || provider._id,
                firstName: provider.firstName,
                lastName: provider.lastName,
                name: provider.name,
                profile: provider.profile,
                rating: provider.profile?.rating || provider.rating || 0,
                serviceId: serviceId,
                serviceTitle: (svc.title || '') as string
              });
            }
          }
        });

        setProvidersWithService(Array.from(providerMap.values()));
      }
    } catch (error) {
      console.error("Error fetching providers with service:", error);
      // Don't set error state, just log it - this is not critical
    } finally {
      setLoadingProviders(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id) {
      fetchService();
      fetchReviews();
    }
  }, [params.id, fetchService, fetchReviews]);

  // Fetch providers with the same service when service is loaded
  useEffect(() => {
    if (service && service.category && service.subcategory) {
      fetchProvidersWithService(service);
    }
  }, [service, fetchProvidersWithService]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service) return;

    try {
      setBookingLoading(true);
      
      // Construct bookingDate from date and time if using legacy format
      let bookingDateValue: string;
      if (bookingForm.bookingDate) {
        bookingDateValue = bookingForm.bookingDate;
      } else if (bookingForm.date && bookingForm.time) {
        // Combine date and time into ISO format
        const dateTime = new Date(`${bookingForm.date}T${bookingForm.time}`);
        bookingDateValue = dateTime.toISOString();
      } else {
        throw new Error("Booking date is required");
      }
      
      const serviceId = service._id || service.id || '';
      const providerId = typeof service.provider === 'string' 
        ? service.provider 
        : (service.provider._id || service.provider.id || '');
      
      const response = await makeClientAuthenticatedRequestWithEndpointSafe(
        'marketplaceBookings' as keyof typeof API_ENDPOINTS,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service: serviceId,
            provider: providerId,
            bookingDate: bookingDateValue,
            duration: bookingForm.duration, // in hours
            address: bookingForm.address,
            specialInstructions: bookingForm.specialInstructions || bookingForm.notes,
            pricing: {
              basePrice: service.pricing.basePrice,
              currency: service.pricing.currency || 'USD',
              type: service.pricing.type,
              totalAmount: service.pricing.type === 'hourly' && bookingForm.duration > 0
                ? service.pricing.basePrice * bookingForm.duration
                : service.pricing.basePrice // Will be calculated with fees on backend
            }
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create booking");
      }

      const booking = await response.json();
      const bookingId = booking._id || booking.id || booking._id || '';
      router.push(`/marketplace/bookings/${bookingId}`);
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("Failed to create booking. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  const handleToggleFavorite = useCallback(() => {
    if (!service) return;
    
    const serviceId = service._id || service.id;
    if (!serviceId) return;
    
    try {
      const favorites = JSON.parse(localStorage.getItem('favoriteServices') || '[]');
      const newFavorited = !isFavorited;
      
      if (newFavorited) {
        // Add to favorites if not already present
        if (!favorites.includes(serviceId)) {
          favorites.push(serviceId);
        }
      } else {
        // Remove from favorites
        const index = favorites.indexOf(serviceId);
        if (index > -1) {
          favorites.splice(index, 1);
        }
      }
      
      localStorage.setItem('favoriteServices', JSON.stringify(favorites));
      setIsFavorited(newFavorited);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }, [service, isFavorited]);

  const handleShare = useCallback(async () => {
    if (!service) return;
    
    const shareData = {
      title: service.title,
      text: service.description,
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
        setShareFeedback('Link copied to clipboard!');
      }
      
      // Clear feedback after 2 seconds
      setTimeout(() => setShareFeedback(null), 2000);
    } catch (error) {
      // User cancelled share or error occurred
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error sharing:', error);
        // Try clipboard as fallback
        try {
          await navigator.clipboard.writeText(shareData.url);
          setShareFeedback('Link copied to clipboard!');
          setTimeout(() => setShareFeedback(null), 2000);
        } catch (clipboardError) {
          console.error('Error copying to clipboard:', clipboardError);
          setShareFeedback('Failed to share. Please try again.');
          setTimeout(() => setShareFeedback(null), 2000);
        }
      }
    }
  }, [service]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating)
            ? "text-yellow-400 fill-current"
            : "text-gray-300"
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading size="lg" text="Loading service details..." />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Service Not Found</h2>
        <p className="text-gray-600 mb-6">{error || "The service you're looking for doesn't exist."}</p>
        <Link
          href="/marketplace"
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Back to Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-500">
        <Link href="/marketplace" className="hover:text-gray-700">
          Marketplace
        </Link>
        <span>/</span>
        <span className="text-gray-700">{service.title}</span>
      </nav>

      {/* Service Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold text-gray-700">{service.title}</h1>
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{service.serviceArea?.join(', ') || 'Service area not specified'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{service.estimatedDuration?.min || 0}-{service.estimatedDuration?.max || 0} hours</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4" />
                <span>{service.rating?.average?.toFixed(1) || '0.0'} ({service.rating?.count || 0} reviews)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {service.category || 'Service'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleShare}
              className="relative p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors group"
              title="Share service"
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

      {/* Service Images */}
      {service.images && service.images.length > 0 && (() => {
        // Get image URL (handle both formats)
        const getImageUrl = (img: ServiceImage | string) => {
          return typeof img === 'string' ? img : (img.url || img.thumbnail || '');
        };
        const getImageAlt = (img: ServiceImage | string, index: number) => {
          return typeof img === 'string' 
            ? `${service.title} ${index + 1}`
            : (img.alt || `${service.title} ${index + 1}`);
        };
        
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="md:col-span-2">
              <div className="relative group overflow-hidden rounded-lg">
                <Image
                  src={getImageUrl(service.images[selectedImageIndex])}
                  alt={getImageAlt(service.images[selectedImageIndex], selectedImageIndex)}
                  width={400}
                  height={256}
                  className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300"></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {service.images.slice(0, 4).map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`h-20 rounded-lg overflow-hidden transition-all duration-200 ${
                    selectedImageIndex === index 
                      ? 'ring-2 ring-green-500 shadow-lg scale-105' 
                      : 'hover:shadow-md hover:scale-102'
                  }`}
                >
                  <Image
                    src={getImageUrl(image)}
                    alt={getImageAlt(image, index)}
                    width={100}
                    height={100}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        );
      })()}

        {/* Price and Booking */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold text-green-600">
              {formatPrice(service.pricing?.basePrice || 0, service.pricing?.currency || 'USD')}
            </div>
            <div className="text-sm text-gray-500">
              {service.pricing?.type === 'hourly' 
                ? 'per hour' 
                : service.pricing?.type === 'fixed'
                ? 'fixed price'
                : service.pricing?.type === 'per_sqft'
                ? 'per square foot'
                : service.pricing?.type === 'per_item'
                ? 'per item'
                : 'per service'}
            </div>
          </div>
          <button
            onClick={() => setShowBookingForm(true)}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            Book Now
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Description</h2>
            <p className="text-gray-600 leading-relaxed">{service.description}</p>
          </div>

          {/* Features */}
          {service.features && service.features.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">What&apos;s Included</h2>
              <ul className="space-y-2">
                {service.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Requirements */}
          {service.requirements && service.requirements.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Requirements</h2>
              <ul className="space-y-2">
                {service.requirements.map((requirement, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                    <span className="text-gray-600">{requirement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Service Packages */}
          {service.servicePackages && service.servicePackages.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Service Packages</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {service.servicePackages.map((pkg, idx) => (
                  <div key={pkg._id || pkg.id || `package-${idx}`} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-gray-700 mb-2">{pkg.name || 'Package'}</h3>
                    <p className="text-sm text-gray-600 mb-3">{pkg.description || 'No description available'}</p>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-lg font-bold text-green-600">
                        {formatPrice(pkg.price || 0, service.pricing?.currency || 'USD')}
                      </span>
                      <span className="text-sm text-gray-500">{pkg.duration || 0} hours</span>
                    </div>
                    <ul className="space-y-1">
                      {pkg.features?.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      )) || []}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add-ons */}
          {service.addOns && service.addOns.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Available Add-ons</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {service.addOns.map((addon, idx) => (
                  <div key={addon._id || addon.id || `addon-${idx}`} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-700">{addon.name || 'Add-on'}</h3>
                      <span className="text-lg font-bold text-green-600">
                        {formatPrice(addon.price || 0, service.pricing?.currency || 'USD')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{addon.description || 'No description available'}</p>
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {addon.category || 'General'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Service Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Service Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Service Type</h3>
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">
                    {service.serviceType?.replace('_', ' ').toUpperCase() || 'NOT SPECIFIED'}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Team Size</h3>
                  <span className="text-gray-600">{service.teamSize || 1} {service.teamSize === 1 ? 'person' : 'people'}</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Equipment & Materials</h3>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-600">
                        Equipment {service.equipmentProvided ? 'provided' : 'not provided'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-600">
                        Materials {service.materialsIncluded ? 'included' : 'not included'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Service Areas</h3>
                  <div className="flex flex-wrap gap-1">
                    {service.serviceArea?.map((area, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {area}
                      </span>
                    )) || <span className="text-sm text-gray-500">No service areas specified</span>}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Availability</h3>
                  <div className="space-y-2">
                    <span className="text-sm text-gray-600">
                      Timezone: {service.availability?.timezone || 'UTC'}
                    </span>
                    {service.availability?.schedule && service.availability.schedule.length > 0 && (
                      <div className="text-sm text-gray-600 mt-2">
                        <div className="font-medium mb-1">Schedule:</div>
                        <div className="space-y-1">
                          {service.availability.schedule
                            .filter((slot) => slot && slot.isAvailable !== false)
                            .map((slot, index) => {
                              if (!slot) return null;
                              const dayName = slot.day ? (slot.day.charAt(0).toUpperCase() + slot.day.slice(1)) : 'Unknown';
                              return (
                                <div key={index} className="text-xs">
                                  {dayName}: {slot.startTime || 'N/A'} - {slot.endTime || 'N/A'}
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Warranty & Protection */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Warranty & Protection</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <Shield className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <h3 className="font-medium text-gray-700 mb-1">Warranty</h3>
                <p className="text-sm text-gray-600">
                  {service.warranty?.hasWarranty 
                    ? `${service.warranty.duration || 0}-day ${service.warranty.description || 'warranty'}`
                    : 'No warranty'
                  }
                </p>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <Shield className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <h3 className="font-medium text-gray-700 mb-1">Insurance</h3>
                <p className="text-sm text-gray-600">
                  {service.insurance?.covered 
                    ? `Covered up to ${formatPrice(service.insurance.coverageAmount || 0, service.pricing?.currency || 'USD')}`
                    : 'Not covered'
                  }
                </p>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <AlertCircle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                <h3 className="font-medium text-gray-700 mb-1">Emergency Service</h3>
                <p className="text-sm text-gray-600">
                  {service.emergencyService?.available 
                    ? `${service.emergencyService.responseTime || 'Not specified'} (+${formatPrice(service.emergencyService.surcharge || 0, service.pricing?.currency || 'USD')})`
                    : 'Not available'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Reviews</h2>
            {reviews.length === 0 ? (
              <p className="text-gray-500">No reviews yet</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        {review.user.avatar ? (
                          <Image
                            src={review.user.avatar}
                            alt={review.user.name}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-600">
                            {review.user.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-700">{review.user.name}</span>
                          <div className="flex items-center gap-1">
                            {renderStars(review.rating)}
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{review.comment}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                          <button className="hover:text-gray-700">
                            Helpful ({review.helpful})
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Provider Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Provider</h3>
            {(() => {
              const provider = typeof service.provider === 'object' && !Array.isArray(service.provider)
                ? service.provider
                : null;
              
              if (!provider) {
                return <p className="text-gray-600">Provider information not available</p>;
              }
              
              const providerName = provider.name || 
                (provider.firstName && provider.lastName 
                  ? `${provider.firstName} ${provider.lastName}` 
                  : provider.firstName || provider.lastName || 'Provider Name');
              
              const initials = provider.firstName?.charAt(0) || provider.lastName?.charAt(0) || provider.name?.charAt(0) || 'P';
              const secondInitial = provider.lastName?.charAt(0) || (provider.firstName ? '' : 'P');
              
              const providerRating = provider.profile?.rating || provider.rating || 0;
              const providerSkills = provider.profile?.skills || [];
              const providerId = provider._id || provider.id;
              
              return (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-lg font-medium text-gray-600">
                        {initials}{secondInitial}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        {providerId ? (
                          <Link
                            href={`/marketplace/providers/${providerId}`}
                            className="font-medium text-gray-700 hover:text-green-600 transition-colors cursor-pointer"
                          >
                            {providerName}
                          </Link>
                        ) : (
                          <h4 className="font-medium text-gray-700">
                            {providerName}
                          </h4>
                        )}
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                      <div className="flex items-center gap-1">
                        {renderStars(providerRating)}
                        <span className="text-sm text-gray-500">
                          ({providerRating.toFixed(1)} rating)
                        </span>
                      </div>
                    </div>
                  </div>
                  {providerSkills.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Skills</h4>
                      <div className="flex flex-wrap gap-1">
                        {providerSkills.map((skill: string, index: number) => (
                          <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}

            {/* Other Providers with This Service */}
            {providersWithService.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Other Providers with This Service ({providersWithService.length})
                </h4>
                {loadingProviders ? (
                  <div className="text-sm text-gray-500">Loading providers...</div>
                ) : (
                  <div className="space-y-3">
                    {providersWithService.slice(0, 5).map((otherProvider) => {
                      const otherProviderName = otherProvider.name || 
                        (otherProvider.firstName && otherProvider.lastName 
                          ? `${otherProvider.firstName} ${otherProvider.lastName}` 
                          : otherProvider.firstName || otherProvider.lastName || 'Provider Name');
                      
                      const otherProviderInitials = otherProvider.firstName?.charAt(0) || otherProvider.lastName?.charAt(0) || otherProvider.name?.charAt(0) || 'P';
                      const otherProviderSecondInitial = otherProvider.lastName?.charAt(0) || (otherProvider.firstName ? '' : 'P');
                      const otherProviderRating = otherProvider.profile?.rating || otherProvider.rating || 0;
                      const otherProviderId = otherProvider._id || otherProvider.id;
                      
                      return (
                        <Link
                          key={otherProviderId}
                          href={otherProvider.serviceId ? `/marketplace/services/${otherProvider.serviceId}` : '#'}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
                        >
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-gray-600">
                              {otherProviderInitials}{otherProviderSecondInitial}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {otherProviderId ? (
                                <Link
                                  href={`/marketplace/providers/${otherProviderId}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-sm font-medium text-gray-700 truncate hover:text-green-600 transition-colors cursor-pointer"
                                >
                                  {otherProviderName}
                                </Link>
                              ) : (
                                <h5 className="text-sm font-medium text-gray-700 truncate">
                                  {otherProviderName}
                                </h5>
                              )}
                              <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="flex items-center gap-0.5">
                                {renderStars(otherProviderRating)}
                              </div>
                              <span className="text-xs text-gray-500">
                                {otherProviderRating.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                    {providersWithService.length > 5 && (
                      <div className="text-xs text-gray-500 text-center pt-2">
                        +{providersWithService.length - 5} more providers
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Safety Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Safety & Trust</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">Background verified</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">Identity verified</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">Highly rated</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-700">Book Service</h2>
                <button
                  onClick={() => setShowBookingForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={bookingForm.bookingDate || (bookingForm.date && bookingForm.time ? `${bookingForm.date}T${bookingForm.time}` : '')}
                    onChange={(e) => {
                      const value = e.target.value;
                      setBookingForm(prev => ({ ...prev, bookingDate: value }));
                      // Also update legacy fields for compatibility
                      if (value) {
                        const dt = new Date(value);
                        setBookingForm(prev => ({
                          ...prev,
                          date: dt.toISOString().split('T')[0],
                          time: dt.toTimeString().slice(0, 5)
                        }));
                      }
                    }}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (hours)
                  </label>
                  <input
                    type="number"
                    required
                    value={bookingForm.duration}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, duration: Number(e.target.value) }))}
                    min={service?.estimatedDuration?.min || 1}
                    max={service?.estimatedDuration?.max || 24}
                    step={0.5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  {service?.estimatedDuration && (
                    <p className="text-xs text-gray-500 mt-1">
                      Estimated: {service.estimatedDuration.min || 0}-{service.estimatedDuration.max || 0} hours
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={bookingForm.address.street || ''}
                    onChange={(e) => setBookingForm(prev => ({
                      ...prev,
                      address: { ...prev.address, street: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="123 Main St"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={bookingForm.address.city || ''}
                      onChange={(e) => setBookingForm(prev => ({
                        ...prev,
                        address: { ...prev.address, city: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={bookingForm.address.state || ''}
                      onChange={(e) => setBookingForm(prev => ({
                        ...prev,
                        address: { ...prev.address, state: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      value={bookingForm.address.zipCode || ''}
                      onChange={(e) => setBookingForm(prev => ({
                        ...prev,
                        address: { ...prev.address, zipCode: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      value={bookingForm.address.country || ''}
                      onChange={(e) => setBookingForm(prev => ({
                        ...prev,
                        address: { ...prev.address, country: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Special Instructions (Optional)
                  </label>
                  <textarea
                    value={bookingForm.specialInstructions || bookingForm.notes || ''}
                    onChange={(e) => setBookingForm(prev => ({ 
                      ...prev, 
                      specialInstructions: e.target.value,
                      notes: e.target.value // Keep legacy field in sync
                    }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Any special requirements or notes..."
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">Estimated Total</span>
                      <span className="text-xl font-bold text-green-600">
                        {service.pricing?.type === 'hourly' && bookingForm.duration > 0
                          ? formatPrice((service.pricing.basePrice || 0) * bookingForm.duration, service.pricing?.currency || 'USD')
                          : formatPrice(service.pricing?.basePrice || 0, service.pricing?.currency || 'USD')}
                      </span>
                    </div>
                    {service.pricing?.type === 'hourly' && bookingForm.duration > 0 && (
                      <div className="text-sm text-gray-500 text-right">
                        {formatPrice(service.pricing.basePrice || 0, service.pricing?.currency || 'USD')} per hour × {bookingForm.duration} hour{bookingForm.duration !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowBookingForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {bookingLoading ? "Booking..." : "Confirm Booking"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
