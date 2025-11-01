"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { 
  Star, 
  MapPin, 
  Clock, 
  Share2,
  Heart,
  Shield,
  CheckCircle,
  AlertCircle,
  User,
  Briefcase,
  Award,
  Phone,
  Mail,
  Globe
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { makeClientAuthenticatedRequestWithPathSafe, makeClientAuthenticatedRequestWithEndpointSafe } from "@/lib/client-api-utils";
import { API_ENDPOINTS } from "@/lib/api";

// Provider Interface
interface Provider {
  _id?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  status?: 'pending' | 'active' | 'suspended' | 'inactive' | 'rejected';
  providerType?: 'individual' | 'business' | 'agency';
  businessInfo?: {
    businessName?: string;
    businessType?: string;
    businessDescription?: string;
    businessAddress?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
    website?: string;
    yearEstablished?: number;
    numberOfEmployees?: number;
  };
  professionalInfo?: {
    specialties?: Array<{
      category?: string;
      subcategories?: string[];
      experience?: number;
      certifications?: Array<{
        name?: string;
        issuer?: string;
        dateIssued?: string;
        expiryDate?: string;
      }>;
      skills?: string[];
      hourlyRate?: number;
      serviceAreas?: Array<{
        city?: string;
        state?: string;
        radius?: number;
      }>;
    }>;
    languages?: string[];
    emergencyServices?: boolean;
    travelDistance?: number;
    minimumJobValue?: number;
    maximumJobValue?: number;
  };
  verification?: {
    identityVerified?: boolean;
    businessVerified?: boolean;
    backgroundCheck?: {
      status?: 'pending' | 'passed' | 'failed' | 'not_required';
      dateCompleted?: string;
    };
    insurance?: {
      hasInsurance?: boolean;
      insuranceProvider?: string;
      coverageAmount?: number;
    };
    licenses?: Array<{
      type?: string;
      number?: string;
      issuingAuthority?: string;
      expiryDate?: string;
    }>;
  };
  performance?: {
    rating?: number;
    totalReviews?: number;
    totalJobs?: number;
    completedJobs?: number;
    cancelledJobs?: number;
    responseTime?: number;
    completionRate?: number;
    repeatCustomerRate?: number;
    earnings?: {
      total?: number;
      thisMonth?: number;
      lastMonth?: number;
      pending?: number;
    };
    badges?: Array<{
      name?: string;
      description?: string;
      earnedDate?: string;
    }>;
  };
  profile?: {
    avatar?: {
      url?: string;
      publicId?: string;
      thumbnail?: string;
    };
    bio?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
  };
  createdAt?: string;
  updatedAt?: string;
}

// Service Interface (for displaying provider's services)
interface ProviderService {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  category?: string;
  subcategory?: string;
  pricing?: {
    type?: 'hourly' | 'fixed' | 'per_sqft' | 'per_item';
    basePrice?: number;
    currency?: string;
  };
  images?: Array<{
    url?: string;
    thumbnail?: string;
  }> | string[];
  rating?: {
    average?: number;
    count?: number;
  };
  isActive?: boolean;
}

interface Review {
  id?: string;
  _id?: string;
  user?: {
    name?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  rating?: number;
  comment?: string;
  createdAt?: string;
  helpful?: number;
}

export default function ProviderDetailPage() {
  const params = useParams();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [services, setServices] = useState<ProviderService[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingServices, setLoadingServices] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const normalizeProvider = useCallback((providerData: Partial<Provider> & Record<string, unknown>): Provider => {
    return {
      ...providerData,
      _id: providerData._id || providerData.id || '',
      id: providerData.id || providerData._id || '',
      firstName: (providerData.firstName as string) || '',
      lastName: (providerData.lastName as string) || '',
      email: (providerData.email as string) || '',
      phoneNumber: (providerData.phoneNumber as string) || '',
      status: (providerData.status as Provider['status']) || 'pending',
      providerType: (providerData.providerType as Provider['providerType']) || 'individual',
      businessInfo: providerData.businessInfo as Provider['businessInfo'],
      professionalInfo: providerData.professionalInfo as Provider['professionalInfo'],
      verification: providerData.verification as Provider['verification'],
      performance: providerData.performance as Provider['performance'],
      profile: providerData.profile as Provider['profile'],
    };
  }, []);

  const fetchProvider = useCallback(async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      
      const response = await makeClientAuthenticatedRequestWithPathSafe(
        'marketplaceProvidersById' as keyof typeof API_ENDPOINTS,
        [String(params.id)]
      );
      
      // Handle different HTTP status codes
      if (response.status === 404) {
        setError("Provider not found");
        setProvider(null);
        return;
      }
      
      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = "Failed to load provider details";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        setError(errorMessage);
        setProvider(null);
        return;
      }

      const data = await response.json();
      
      // Handle API response structure: {success: true, data: {...}}
      const providerData = data.success && data.data ? data.data : data;
      
      // Check if provider data exists
      if (!providerData || (!providerData._id && !providerData.id)) {
        setError("Provider not found");
        setProvider(null);
        return;
      }
      
      const normalizedProvider = normalizeProvider(providerData);
      setProvider(normalizedProvider);
      setError(null); // Clear any errors on success
      
      // Load favorite status from localStorage
      const providerId = normalizedProvider._id || normalizedProvider.id;
      if (providerId) {
        const favorites = JSON.parse(localStorage.getItem('favoriteProviders') || '[]');
        setIsFavorited(favorites.includes(providerId));
      }
    } catch (error) {
      // Only log unexpected errors (network errors, etc.)
      console.error("Error fetching provider:", error);
      setError(error instanceof Error ? error.message : "Failed to load provider details");
      setProvider(null);
    } finally {
      setLoading(false);
    }
  }, [params.id, normalizeProvider]);

  const fetchServices = useCallback(async () => {
    if (!params.id) return;
    
    try {
      setLoadingServices(true);
      const response = await makeClientAuthenticatedRequestWithEndpointSafe(
        'marketplaceListings' as keyof typeof API_ENDPOINTS,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          query: {
            provider: String(params.id),
            limit: '20'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const servicesList = Array.isArray(data) 
          ? data 
          : (data.data || data.services || []);
        setServices(servicesList);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoadingServices(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id) {
      fetchProvider();
      fetchServices();
    }
  }, [params.id, fetchProvider, fetchServices]);

  const handleToggleFavorite = useCallback(() => {
    if (!provider) return;
    
    const providerId = provider._id || provider.id;
    if (!providerId) return;
    
    try {
      const favorites = JSON.parse(localStorage.getItem('favoriteProviders') || '[]');
      const newFavorited = !isFavorited;
      
      if (newFavorited) {
        if (!favorites.includes(providerId)) {
          favorites.push(providerId);
        }
      } else {
        const index = favorites.indexOf(providerId);
        if (index > -1) {
          favorites.splice(index, 1);
        }
      }
      
      localStorage.setItem('favoriteProviders', JSON.stringify(favorites));
      setIsFavorited(newFavorited);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }, [provider, isFavorited]);

  const handleShare = useCallback(async () => {
    if (!provider) return;
    
    const providerName = provider.businessInfo?.businessName || 
                         `${provider.firstName} ${provider.lastName}`.trim() ||
                         'Provider';
    
    const shareData = {
      title: providerName,
      text: provider.profile?.bio || provider.businessInfo?.businessDescription || '',
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
        console.error('Error sharing:', error);
        try {
          await navigator.clipboard.writeText(shareData.url);
          setShareFeedback('Link copied to clipboard!');
          setTimeout(() => setShareFeedback(null), 2000);
        } catch (clipboardError) {
          console.error('Error copying to clipboard:', clipboardError);
        }
      }
    }
  }, [provider]);

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

  const getProviderName = () => {
    if (!provider) return '';
    if (provider.businessInfo?.businessName) {
      return provider.businessInfo.businessName;
    }
    return `${provider.firstName || ''} ${provider.lastName || ''}`.trim() || 'Provider';
  };

  const getProviderLocation = () => {
    if (!provider) return 'Location not specified';
    const address = provider.businessInfo?.businessAddress || provider.profile?.address;
    if (!address) return 'Location not specified';
    const parts = [address.city, address.state, address.zipCode].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Location not specified';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading size="lg" text="Loading provider details..." />
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Provider Not Found</h2>
        <p className="text-gray-600 mb-6">{error || "The provider you're looking for doesn't exist."}</p>
        <Link
          href="/marketplace"
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const providerName = getProviderName();
  const providerLocation = getProviderLocation();
  const rating = provider.performance?.rating || 0;
  const totalReviews = provider.performance?.totalReviews || 0;

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-500">
        <Link href="/marketplace" className="hover:text-gray-700">
          Marketplace
        </Link>
        <span>/</span>
        <Link href="/marketplace/providers" className="hover:text-gray-700">
          Providers
        </Link>
        <span>/</span>
        <span className="text-gray-700">{providerName}</span>
      </nav>

      {/* Provider Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4 flex-1">
            {/* Avatar */}
            <div className="relative">
              {provider.profile?.avatar?.url || provider.profile?.avatar?.thumbnail ? (
                <Image
                  src={provider.profile.avatar.url || provider.profile.avatar.thumbnail || ''}
                  alt={providerName}
                  width={120}
                  height={120}
                  className="w-24 h-24 rounded-full object-cover border-4 border-green-500"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-green-500">
                  {providerName.charAt(0).toUpperCase()}
                </div>
              )}
              {provider.verification?.identityVerified && (
                <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-1">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-gray-700">{providerName}</h1>
                {provider.verification?.identityVerified && (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                )}
                {provider.verification?.businessVerified && (
                  <Shield className="w-6 h-6 text-blue-500" />
                )}
              </div>
              
              {provider.providerType && (
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full mb-2">
                  {provider.providerType === 'business' ? 'Business' : 
                   provider.providerType === 'agency' ? 'Agency' : 'Individual'}
                </span>
              )}

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{providerLocation}</span>
                </div>
                {provider.performance?.responseTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>Responds in {provider.performance.responseTime} min</span>
                  </div>
                )}
                {rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span>{rating.toFixed(1)} ({totalReviews} reviews)</span>
                  </div>
                )}
              </div>

              {provider.performance?.totalJobs && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{provider.performance.completedJobs || 0}</span> completed jobs
                  {provider.performance.completionRate && (
                    <span className="ml-2">
                      • {Math.round(provider.performance.completionRate * 100)}% completion rate
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleShare}
              className="relative p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors group"
              title="Share provider"
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

        {/* Contact Information */}
        {(provider.email || provider.phoneNumber || provider.businessInfo?.website) && (
          <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-200">
            {provider.phoneNumber && (
              <a 
                href={`tel:${provider.phoneNumber}`}
                className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>{provider.phoneNumber}</span>
              </a>
            )}
            {provider.email && (
              <a 
                href={`mailto:${provider.email}`}
                className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span>{provider.email}</span>
              </a>
            )}
            {provider.businessInfo?.website && (
              <a 
                href={provider.businessInfo.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span>Website</span>
              </a>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bio/Description */}
          {(provider.profile?.bio || provider.businessInfo?.businessDescription) && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">About</h2>
              <p className="text-gray-600 leading-relaxed">
                {provider.profile?.bio || provider.businessInfo?.businessDescription}
              </p>
            </div>
          )}

          {/* Specialties */}
          {provider.professionalInfo?.specialties && provider.professionalInfo.specialties.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Specialties</h2>
              <div className="space-y-4">
                {provider.professionalInfo.specialties.map((specialty, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-700">
                        {specialty.category ? specialty.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Specialty'}
                      </h3>
                      {specialty.experience && (
                        <span className="text-sm text-gray-600">
                          {specialty.experience} years experience
                        </span>
                      )}
                    </div>
                    {specialty.subcategories && specialty.subcategories.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {specialty.subcategories.map((subcat, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {subcat}
                          </span>
                        ))}
                      </div>
                    )}
                    {specialty.skills && specialty.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {specialty.skills.map((skill, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications & Licenses */}
          {(provider.professionalInfo?.specialties?.some(s => s.certifications && s.certifications.length > 0) || 
            provider.verification?.licenses && provider.verification.licenses.length > 0) && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Certifications & Licenses</h2>
              <div className="space-y-3">
                {provider.professionalInfo?.specialties?.map((specialty, sIdx) => 
                  specialty.certifications?.map((cert, cIdx) => (
                    <div key={`cert-${sIdx}-${cIdx}`} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg">
                      <Award className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-700">{cert.name}</div>
                        <div className="text-sm text-gray-600">{cert.issuer}</div>
                        {cert.expiryDate && (
                          <div className="text-xs text-gray-500">
                            Expires: {new Date(cert.expiryDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {provider.verification?.licenses?.map((license, idx) => (
                  <div key={`license-${idx}`} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg">
                    <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-700">{license.type}</div>
                      <div className="text-sm text-gray-600">License #{license.number}</div>
                      <div className="text-xs text-gray-500">{license.issuingAuthority}</div>
                      {license.expiryDate && (
                        <div className="text-xs text-gray-500">
                          Expires: {new Date(license.expiryDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Service Areas */}
          {provider.professionalInfo?.specialties?.some(s => s.serviceAreas && s.serviceAreas.length > 0) && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Service Areas</h2>
              <div className="flex flex-wrap gap-2">
                {provider.professionalInfo.specialties.flatMap(specialty => 
                  specialty.serviceAreas?.map((area, idx) => (
                    <div key={idx} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      <MapPin className="w-3 h-3 inline mr-1" />
                      {area.city}{area.state ? `, ${area.state}` : ''}
                      {area.radius && ` (${area.radius} mi radius)`}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Services Offered */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Services Offered</h2>
            {loadingServices ? (
              <div className="flex justify-center py-8">
                <Loading size="md" text="Loading services..." />
              </div>
            ) : services.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service) => {
                  const serviceId = service._id || service.id;
                  const imageUrl = Array.isArray(service.images) && service.images.length > 0
                    ? (typeof service.images[0] === 'string' ? service.images[0] : service.images[0]?.url || service.images[0]?.thumbnail)
                    : null;
                  
                  return (
                    <Link
                      key={serviceId}
                      href={`/marketplace/services/${serviceId}`}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow group"
                    >
                      {imageUrl && (
                        <div className="relative w-full h-32 mb-3 rounded-lg overflow-hidden">
                          <Image
                            src={imageUrl}
                            alt={service.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      )}
                      <h3 className="font-semibold text-gray-700 mb-1 group-hover:text-green-600 transition-colors">
                        {service.title}
                      </h3>
                      {service.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {service.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        {service.pricing?.basePrice && (
                          <span className="text-lg font-bold text-green-600">
                            ${service.pricing.basePrice.toFixed(2)}
                            {service.pricing.type === 'hourly' && '/hr'}
                          </span>
                        )}
                        {service.rating?.average && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm text-gray-600">
                              {service.rating.average.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No services listed yet.</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Verification Badges */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Verification</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {provider.verification?.identityVerified ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-gray-400" />
                )}
                <span className="text-gray-600">Identity Verified</span>
              </div>
              <div className="flex items-center gap-3">
                {provider.verification?.businessVerified ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-gray-400" />
                )}
                <span className="text-gray-600">Business Verified</span>
              </div>
              <div className="flex items-center gap-3">
                {provider.verification?.insurance?.hasInsurance ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-gray-400" />
                )}
                <span className="text-gray-600">
                  Insured
                  {provider.verification?.insurance?.coverageAmount && (
                    <span className="text-xs text-gray-500 ml-1">
                      (${provider.verification?.insurance?.coverageAmount.toLocaleString()})
                    </span>
                  )}
                </span>
              </div>
              {provider.verification?.backgroundCheck && (
                <div className="flex items-center gap-3">
                  {provider.verification.backgroundCheck.status === 'passed' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-gray-400" />
                  )}
                  <span className="text-gray-600">
                    Background Check: {provider.verification.backgroundCheck.status}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Performance Stats */}
          {provider.performance && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Performance</h2>
              <div className="space-y-3">
                {provider.performance.totalJobs !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Jobs</span>
                    <span className="font-semibold text-gray-700">{provider.performance.totalJobs}</span>
                  </div>
                )}
                {provider.performance.completionRate !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completion Rate</span>
                    <span className="font-semibold text-gray-700">
                      {Math.round(provider.performance.completionRate * 100)}%
                    </span>
                  </div>
                )}
                {provider.performance.responseTime !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg. Response</span>
                    <span className="font-semibold text-gray-700">
                      {provider.performance.responseTime} min
                    </span>
                  </div>
                )}
                {provider.performance.repeatCustomerRate !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Repeat Customers</span>
                    <span className="font-semibold text-gray-700">
                      {Math.round(provider.performance.repeatCustomerRate * 100)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Business Info */}
          {provider.businessInfo && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Business Info</h2>
              <div className="space-y-2 text-sm">
                {provider.businessInfo.yearEstablished && (
                  <div>
                    <span className="text-gray-600">Established: </span>
                    <span className="font-medium text-gray-700">
                      {new Date().getFullYear() - provider.businessInfo.yearEstablished} years ago
                    </span>
                  </div>
                )}
                {provider.businessInfo.numberOfEmployees && (
                  <div>
                    <span className="text-gray-600">Employees: </span>
                    <span className="font-medium text-gray-700">
                      {provider.businessInfo.numberOfEmployees}
                    </span>
                  </div>
                )}
                {provider.businessInfo.businessType && (
                  <div>
                    <span className="text-gray-600">Type: </span>
                    <span className="font-medium text-gray-700">
                      {provider.businessInfo.businessType}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Badges */}
          {provider.performance?.badges && provider.performance.badges.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Badges</h2>
              <div className="flex flex-wrap gap-2">
                {provider.performance.badges.map((badge, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm"
                  >
                    <Award className="w-4 h-4" />
                    <span>{badge.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

