"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
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
  AlertCircle,
  ArrowLeft,
  Briefcase
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";

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
  const [service, setService] = useState<Service | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [providersWithService, setProvidersWithService] = useState<ProviderWithService[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [otherProviderServices, setOtherProviderServices] = useState<Service[]>([]);
  const [loadingOtherServices, setLoadingOtherServices] = useState(false);
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
      // Service endpoint is PUBLIC - /api/marketplace/services/:id
      const url = `${API_BASE_URL}${API_ENDPOINTS.marketplaceServiceById}/${params.id}`;
      const response = await fetch(url, getApiToken() 
        ? createAuthFetchOptions({ method: 'GET' })
        : { method: 'GET', headers: { 'Content-Type': 'application/json' } }
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
    } catch (error) {
      logger.error("Error fetching service", error instanceof Error ? error : new Error(String(error)), { serviceId: params.id });
      setError("Failed to load service details");
    } finally {
      setLoading(false);
    }
  }, [params.id, normalizeService]);

  const fetchReviews = useCallback(async () => {
    try {
      // Reviews - likely from bookings endpoint with service ID query or reviews endpoint
      // Try marketplace reviews via service reviews endpoint
      const url = `${API_BASE_URL}${API_ENDPOINTS.marketplaceServiceById}/${params.id}/reviews`;
      const response = await fetch(url, getApiToken()
        ? createAuthFetchOptions({ method: 'GET' })
        : { method: 'GET', headers: { 'Content-Type': 'application/json' } }
      );
      if (response.ok) {
        const data = await response.json();
        setReviews(Array.isArray(data) ? data : data.reviews || []);
      }
    } catch (error) {
      logger.error("Error fetching reviews", error instanceof Error ? error : new Error(String(error)), { serviceId: params.id });
    }
  }, [params.id]);

  const fetchProvidersWithService = useCallback(async (serviceData: Service) => {
    if (!serviceData.category || !serviceData.subcategory) {
      return;
    }

    try {
      setLoadingProviders(true);

      // Providers with service - endpoint has [id] placeholder
      const endpoint = API_ENDPOINTS.marketplaceProvidersWithService.replace('[id]', String(params.id));
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, getApiToken()
        ? createAuthFetchOptions({ method: 'GET' })
        : { method: 'GET', headers: { 'Content-Type': 'application/json' } }
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
      logger.error("Error fetching providers with service", error instanceof Error ? error : new Error(String(error)), { serviceId: params.id });
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

  // Fetch other services from the same provider
  const fetchOtherProviderServices = useCallback(async (serviceData: Service) => {
    // Get provider ID
    const providerId = typeof serviceData.provider === 'string' 
      ? serviceData.provider 
      : (serviceData.provider._id || serviceData.provider.id);
    
    if (!providerId) return;

    try {
      setLoadingOtherServices(true);
      const queryParams = new URLSearchParams({
        provider: String(providerId),
        limit: '6',
        isActive: 'true'
      }).toString();
      
      const url = `${API_BASE_URL}${API_ENDPOINTS.marketplaceServices}?${queryParams}`;
      const response = await fetch(url, getApiToken()
        ? createAuthFetchOptions({ method: 'GET' })
        : { method: 'GET', headers: { 'Content-Type': 'application/json' } }
      );

      if (response.ok) {
        const data = await response.json();
        const servicesList = Array.isArray(data) 
          ? data 
          : (data.data || data.services || []);
        
        // Filter out the current service
        const currentServiceId = serviceData._id || serviceData.id;
        const otherServices = servicesList.filter((svc: Service) => {
          const svcId = svc._id || svc.id;
          return svcId !== currentServiceId;
        });
        
        setOtherProviderServices(otherServices.slice(0, 6)); // Limit to 6 services
      }
    } catch (error) {
      logger.error("Error fetching other provider services", error instanceof Error ? error : new Error(String(error)), { providerId });
    } finally {
      setLoadingOtherServices(false);
    }
  }, []);

  // Fetch other services when service is loaded
  useEffect(() => {
    if (service) {
      fetchOtherProviderServices(service);
    }
  }, [service, fetchOtherProviderServices]);


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
    
    const newFavorited = !isFavorited;
    
    try {
      const favorites = JSON.parse(localStorage.getItem('favoriteServices') || '[]');
      
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
      logger.error('Error toggling favorite', error instanceof Error ? error : new Error(String(error)), { serviceId: params.id, isFavorited: newFavorited });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        logger.error('Error sharing', error, { serviceId: params.id });
        // Try clipboard as fallback
        try {
          await navigator.clipboard.writeText(shareData.url);
          setShareFeedback('Link copied to clipboard!');
          setTimeout(() => setShareFeedback(null), 2000);
        } catch (clipboardError) {
          logger.error('Error copying to clipboard', clipboardError instanceof Error ? clipboardError : new Error(String(clipboardError)), { serviceId: params.id });
          setShareFeedback('Failed to share. Please try again.');
          setTimeout(() => setShareFeedback(null), 2000);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/marketplace"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Back to marketplace"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white flex items-center justify-center shadow-lg shadow-green-500/20">
          <Briefcase className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{service.title}</h1>
          <p className="text-sm text-gray-600">{service.description ? service.description.substring(0, 80) + (service.description.length > 80 ? '...' : '') : 'Professional service'}</p>
        </div>
      </div>

      {/* Service Details */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
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
          <Link
            href={`/marketplace/services/${params.id}/book`}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold inline-block text-center"
          >
            Book Now
          </Link>
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

          {/* Other Services from This Provider */}
          {otherProviderServices.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-700">
                  Other Services
                </h3>
                {typeof service?.provider === 'object' && service.provider && (
                  <Link
                    href={`/marketplace/providers/${service.provider._id || service.provider.id}`}
                    className="text-xs text-green-600 hover:text-green-700 font-medium"
                  >
                    View All →
                  </Link>
                )}
              </div>
              
              {loadingOtherServices ? (
                <div className="flex items-center justify-center py-4">
                  <div className="text-sm text-gray-500">Loading...</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {otherProviderServices.slice(0, 4).map((otherService) => {
                    const serviceId = otherService._id || otherService.id;
                    const imageUrl = otherService.images && Array.isArray(otherService.images) && otherService.images.length > 0
                      ? (typeof otherService.images[0] === 'string' 
                          ? otherService.images[0] 
                          : otherService.images[0].url || otherService.images[0].thumbnail)
                      : undefined;
                    const price = otherService.pricing?.basePrice || 0;
                    const currency = otherService.pricing?.currency || '₱';
                    const rating = typeof otherService.rating === 'number' 
                      ? otherService.rating 
                      : (otherService.rating?.average || 0);
                    
                    return (
                      <Link
                        key={serviceId}
                        href={`/marketplace/services/${serviceId}`}
                        className="flex gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200 group"
                      >
                        {imageUrl && (
                          <div className="relative w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                            <Image
                              src={imageUrl}
                              alt={otherService.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform"
                              sizes="64px"
                              unoptimized={imageUrl.startsWith('http://localhost') || !imageUrl.startsWith('http')}
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 mb-1 line-clamp-1 group-hover:text-green-600 transition-colors text-sm">
                            {otherService.title}
                          </h4>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-bold text-green-600">
                                {currency}{price.toLocaleString()}
                              </span>
                              {otherService.pricing?.type && (
                                <span className="text-xs text-gray-500">
                                  /{otherService.pricing.type === 'hourly' ? 'hr' : 'svc'}
                                </span>
                              )}
                            </div>
                            {rating > 0 && (
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs font-medium text-gray-700">{rating.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                  {otherProviderServices.length > 4 && (
                    <div className="text-xs text-gray-500 text-center pt-2">
                      +{otherProviderServices.length - 4} more services
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

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

    </div>
  );
}
