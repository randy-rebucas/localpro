"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Star,
  MapPin,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Share2,
  Download
} from "lucide-react";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/loading";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";

// AdCampaign Image Interface
interface AdCampaignImage {
  url: string;
  publicId?: string;
  thumbnail?: string;
  alt?: string;
}

// AdCampaign Entity Interface matching data-entities.md
interface AdCampaign {
  _id?: string;
  id?: string;
  advertiser: {
    _id?: string;
    id?: string;
    businessName?: string;
    name?: string;
    avatar?: string;
    verified?: boolean;
  } | string;
  title: string;
  description: string;
  type: 'banner' | 'sponsored_listing' | 'video' | 'text' | 'interactive';
  category: 'hardware_stores' | 'suppliers' | 'training_schools' | 'services' | 'products';
  targetAudience?: {
    demographics?: {
      ageRange?: number[];
      gender?: string[];
      location?: string[];
      interests?: string[];
    };
    behavior?: {
      userTypes?: string[];
      activityLevel?: 'active' | 'moderate' | 'new';
    };
  };
  location?: {
    city?: string;
    state?: string;
    country?: string;
    coordinates?: {
      latitude?: number;
      longitude?: number;
    };
  };
  images?: AdCampaignImage[] | string[];
  content?: {
    headline?: string;
    body?: string;
    images?: AdCampaignImage[] | string[];
    video?: {
      url?: string;
      publicId?: string;
      thumbnail?: string;
    };
    callToAction?: {
      text?: string;
      url?: string;
    };
    logo?: {
      url?: string;
      publicId?: string;
      thumbnail?: string;
    };
  };
  budget: {
    total: number;
    daily?: number;
    currency?: string;
  };
  bidding?: {
    strategy?: 'cpc' | 'cpm' | 'cpa' | 'fixed';
    bidAmount?: number;
    maxBid?: number;
  };
  schedule: {
    startDate: string | Date;
    endDate: string | Date;
    timeSlots?: Array<{
      day: string;
      startTime: string;
      endTime: string;
    }>;
  };
  performance?: {
    impressions?: number;
    clicks?: number;
    conversions?: number;
    spend?: number;
    ctr?: number;
    cpc?: number;
    cpm?: number;
  };
  status: 'draft' | 'pending' | 'approved' | 'active' | 'paused' | 'completed' | 'rejected';
  approval?: {
    reviewedBy?: string | {
      _id?: string;
      id?: string;
      name?: string;
    };
    reviewedAt?: string | Date;
    notes?: string;
    rejectionReason?: string;
  };
  isActive?: boolean;
  isFeatured?: boolean;
  views?: number;
  clicks?: number;
  impressions?: number;
  promotion?: {
    type?: 'featured' | 'sponsored' | 'boosted';
    duration?: number;
    budget?: number;
    startDate?: string | Date;
    endDate?: string | Date;
    status?: 'active' | 'expired' | 'cancelled';
  };
  createdAt?: string;
  updatedAt?: string;
}

const getStatusColor = (status: AdCampaign['status']) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800';
    case 'approved': return 'bg-blue-100 text-blue-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'paused': return 'bg-gray-100 text-gray-800';
    case 'completed': return 'bg-purple-100 text-purple-800';
    case 'rejected': return 'bg-red-100 text-red-800';
    case 'draft': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusIcon = (status: AdCampaign['status']) => {
  switch (status) {
    case 'active': return <CheckCircle className="w-4 h-4" />;
    case 'approved': return <CheckCircle className="w-4 h-4" />;
    case 'pending': return <Clock className="w-4 h-4" />;
    case 'paused': return <AlertCircle className="w-4 h-4" />;
    case 'completed': return <CheckCircle className="w-4 h-4" />;
    case 'rejected': return <X className="w-4 h-4" />;
    case 'draft': return <Edit className="w-4 h-4" />;
    default: return <Clock className="w-4 h-4" />;
  }
};

const getCategoryLabel = (category: AdCampaign['category']) => {
  const labels: Record<string, string> = {
    hardware_stores: 'Hardware Stores',
    suppliers: 'Suppliers',
    training_schools: 'Training Schools',
    services: 'Services',
    products: 'Products'
  };
  return labels[category] || category;
};

const getTypeLabel = (type: AdCampaign['type']) => {
  const labels: Record<string, string> = {
    banner: 'Banner Ad',
    sponsored_listing: 'Sponsored Listing',
    video: 'Video Ad',
    text: 'Text Ad',
    interactive: 'Interactive Ad'
  };
  return labels[type] || type;
};

// Normalize AdCampaign data from API response
const normalizeAdCampaign = (data: Partial<AdCampaign> & Record<string, unknown>): AdCampaign => {
  return {
    _id: (data._id as string) || (data.id as string) || '',
    id: (data.id as string) || (data._id as string) || '',
    advertiser: typeof data.advertiser === 'string'
      ? data.advertiser
      : {
          _id: (data.advertiser as Record<string, unknown>)?._id as string | undefined,
          id: (data.advertiser as Record<string, unknown>)?.id as string | undefined,
          businessName: (data.advertiser as Record<string, unknown>)?.businessName as string | undefined,
          name: (data.advertiser as Record<string, unknown>)?.name as string | undefined,
          avatar: (data.advertiser as Record<string, unknown>)?.avatar as string | undefined,
          verified: (data.advertiser as Record<string, unknown>)?.verified as boolean | undefined
        },
    title: (data.title as string) || '',
    description: (data.description as string) || '',
    type: (data.type as AdCampaign['type']) || 'banner',
    category: (data.category as AdCampaign['category']) || 'services',
    targetAudience: data.targetAudience as AdCampaign['targetAudience'],
    location: data.location as AdCampaign['location'],
    images: Array.isArray(data.images)
      ? (data.images as Array<string | AdCampaignImage | Record<string, unknown>>).map((img) =>
          typeof img === 'string'
            ? img
            : {
                url: (img as AdCampaignImage).url || (img as AdCampaignImage).publicId || '',
                publicId: (img as AdCampaignImage).publicId,
                thumbnail: (img as AdCampaignImage).thumbnail,
                alt: (img as AdCampaignImage).alt
              }
        ) as string[] | AdCampaignImage[]
      : [],
    content: data.content as AdCampaign['content'],
    budget: data.budget && typeof data.budget === 'object' && 'total' in data.budget
      ? {
          total: ((data.budget as AdCampaign['budget']).total || 0) as number,
          daily: (data.budget as AdCampaign['budget']).daily,
          currency: (data.budget as AdCampaign['budget']).currency || 'USD'
        }
      : {
          total: (typeof data.budget === 'number' ? data.budget : 0) as number,
          currency: 'USD'
        },
    bidding: data.bidding as AdCampaign['bidding'],
    schedule: data.schedule
      ? {
          startDate: (data.schedule as AdCampaign['schedule']).startDate,
          endDate: (data.schedule as AdCampaign['schedule']).endDate,
          timeSlots: (data.schedule as AdCampaign['schedule']).timeSlots
        }
      : {
          startDate: (data.startDate as string) || new Date().toISOString(),
          endDate: (data.endDate as string) || new Date().toISOString()
        },
    performance: data.performance
      ? {
          impressions: (data.performance as AdCampaign['performance'])?.impressions || 0,
          clicks: (data.performance as AdCampaign['performance'])?.clicks || 0,
          conversions: (data.performance as AdCampaign['performance'])?.conversions || 0,
          spend: (data.performance as AdCampaign['performance'])?.spend || 0,
          ctr: (data.performance as AdCampaign['performance'])?.ctr || 0,
          cpc: (data.performance as AdCampaign['performance'])?.cpc || 0,
          cpm: (data.performance as AdCampaign['performance'])?.cpm || 0
        }
      : {
          impressions: (data.impressions as number) || (data.impressionCount as number) || 0,
          clicks: (data.clicks as number) || (data.clickCount as number) || 0,
          conversions: 0,
          spend: (data.spent as number) || 0,
          ctr: (data.ctr as number) || 0,
          cpc: (data.cpc as number) || 0,
          cpm: (data.cpm as number) || 0
        },
    status: (data.status as AdCampaign['status']) || 'draft',
    approval: data.approval as AdCampaign['approval'],
    isActive: data.isActive !== undefined ? data.isActive : true,
    isFeatured: data.isFeatured || false,
    views: (data.views as number) || 0,
    clicks: (data.clicks as number) || (data.clickCount as number) || 0,
    impressions: (data.impressions as number) || (data.impressionCount as number) || 0,
    promotion: data.promotion as AdCampaign['promotion'],
    createdAt: (data.createdAt as string) || undefined,
    updatedAt: (data.updatedAt as string) || undefined
  };
};

const getImageUrl = (img: string | AdCampaignImage): string => {
  return typeof img === 'string' ? img : (img.url || img.thumbnail || '');
};

export default function AdDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [ad, setAd] = useState<AdCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.adsById}/${params.id}`, createAuthFetchOptions());
        
        if (!response.ok) {
          throw new Error('Ad not found');
        }

        const responseData = await response.json();
        const adData = responseData.success && responseData.data ? responseData.data : responseData;
        const normalizedAd = normalizeAdCampaign(adData);
        setAd(normalizedAd);
      } catch (error) {
        logger.error('Error fetching ad', error instanceof Error ? error : new Error(String(error)), { adId: params.id });
        setError('Failed to load ad details');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchAd();
    }
  }, [params.id]);

  const handleEdit = () => {
    router.push(`/ads/${params.id}/edit`);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this ad?')) {
      try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.adsById}/${params.id}`, createAuthFetchOptions({
          method: 'DELETE',
        }));

        if (response.ok) {
          router.push('/ads');
        }
      } catch (error) {
        logger.error('Error deleting ad', error instanceof Error ? error : new Error(String(error)), { adId: params.id });
      }
    }
  };

  const handlePromote = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.adsPromote}/${params.id}`, createAuthFetchOptions({
        method: 'POST',
      }));

      if (response.ok) {
        // Refresh ad data
        window.location.reload();
      }
    } catch (error) {
      logger.error('Error promoting ad', error instanceof Error ? error : new Error(String(error)), { adId: params.id });
    }
  };

  const handleStatusChange = async (newStatus: AdCampaign['status']) => {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.adsById}/${params.id}`, createAuthFetchOptions({
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      }));

      if (response.ok) {
        setAd(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (error) {
      logger.error('Error updating ad status', error instanceof Error ? error : new Error(String(error)), { adId: params.id, newStatus });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !ad) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Ad not found</h3>
        <p className="text-gray-600 mb-4">The ad you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        <Button onClick={() => router.push('/ads')}>
          Back to Ads
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Ads', href: '/ads' },
          { label: ad.title, href: `/ads/${ad.id}` }
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
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{ad.title}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(ad.status)}`}>
                {getStatusIcon(ad.status)}
                <span className="capitalize">{ad.status}</span>
              </span>
              {ad.isFeatured && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                  <Star className="w-4 h-4 inline mr-1" />
                  Featured
                </span>
              )}
              {ad.promotion?.type && ad.promotion.status === 'active' && (
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                  <Star className="w-4 h-4 inline mr-1" />
                  {ad.promotion.type.charAt(0).toUpperCase() + ad.promotion.type.slice(1)}
                </span>
              )}
            </div>
            <p className="text-gray-600">
              Created by {typeof ad.advertiser === 'string' ? 'Advertiser' : (ad.advertiser.businessName || ad.advertiser.name || 'Unknown')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleEdit}
            className="flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Button>
          {ad.status === 'active' && !ad.isFeatured && (
            <Button
              onClick={handlePromote}
              className="flex items-center gap-2"
            >
              <Star className="w-4 h-4" />
              Feature
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleDelete}
            className="flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ad Images */}
          {(() => {
            const images = (ad.content?.images && ad.content.images.length > 0) 
              ? ad.content.images 
              : (ad.images && ad.images.length > 0 ? ad.images : []);
            
            if (images.length === 0) return null;
            
            return (
              <Card className="overflow-hidden">
                <div className="relative">
                  <Image
                    src={getImageUrl(images[selectedImageIndex] as string | AdCampaignImage)}
                    alt={ad.title}
                    width={800}
                    height={256}
                    className="w-full h-64 object-cover"
                  />
                  {images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                      {images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`w-3 h-3 rounded-full ${
                            index === selectedImageIndex ? 'bg-white' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="p-4">
                    <div className="flex gap-2 overflow-x-auto">
                      {images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden ${
                            index === selectedImageIndex ? 'ring-2 ring-blue-500' : ''
                          }`}
                        >
                          <Image
                            src={getImageUrl(image as string | AdCampaignImage)}
                            alt={`${ad.title} ${index + 1}`}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })()}

          {/* Ad Details */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ad Details</h2>
            <div className="space-y-4">
              {ad.content?.headline && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Headline</h3>
                  <p className="text-gray-700 text-lg">{ad.content.headline}</p>
                </div>
              )}
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 whitespace-pre-line">{ad.description}</p>
              </div>

              {ad.content?.body && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Body Text</h3>
                  <p className="text-gray-600 whitespace-pre-line">{ad.content.body}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Category</h3>
                  <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                    {getCategoryLabel(ad.category)}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Type</h3>
                  <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                    {getTypeLabel(ad.type)}
                  </span>
                </div>
              </div>

              {ad.content?.callToAction && (ad.content.callToAction.text || ad.content.callToAction.url) && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Call to Action</h3>
                  <div className="flex items-center gap-2">
                    {ad.content.callToAction.text && (
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm font-medium">
                        {ad.content.callToAction.text}
                      </span>
                    )}
                    {ad.content.callToAction.url && (
                      <a
                        href={ad.content.callToAction.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-sm underline"
                      >
                        {ad.content.callToAction.url}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {ad.location && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Location</h3>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {[ad.location.city, ad.location.state, ad.location.country]
                        .filter(Boolean)
                        .join(', ') || 'Not specified'}
                      {ad.location.coordinates && (
                        <span className="ml-2 text-xs text-gray-500">
                          ({ad.location.coordinates.latitude?.toFixed(4)}, {ad.location.coordinates.longitude?.toFixed(4)})
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              )}

              {ad.targetAudience && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Target Audience</h3>
                  <div className="space-y-3">
                    {ad.targetAudience.behavior?.userTypes && ad.targetAudience.behavior.userTypes.length > 0 && (
                      <div>
                        <span className="text-sm text-gray-600">User Types: </span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {ad.targetAudience.behavior.userTypes.map((type) => (
                            <span
                              key={type}
                              className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm capitalize"
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {ad.targetAudience.behavior?.activityLevel && (
                      <div>
                        <span className="text-sm text-gray-600">Activity Level: </span>
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm capitalize">
                          {ad.targetAudience.behavior.activityLevel}
                        </span>
                      </div>
                    )}
                    {ad.targetAudience.demographics?.interests && ad.targetAudience.demographics.interests.length > 0 && (
                      <div>
                        <span className="text-sm text-gray-600">Interests: </span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {ad.targetAudience.demographics.interests.map((interest) => (
                            <span
                              key={interest}
                              className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm"
                            >
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {ad.targetAudience.demographics?.location && ad.targetAudience.demographics.location.length > 0 && (
                      <div>
                        <span className="text-sm text-gray-600">Target Locations: </span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {ad.targetAudience.demographics.location.map((loc) => (
                            <span
                              key={loc}
                              className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                            >
                              {loc}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {ad.schedule.timeSlots && ad.schedule.timeSlots.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Schedule Time Slots</h3>
                  <div className="space-y-2">
                    {ad.schedule.timeSlots.map((slot, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span className="capitalize">{slot.day}</span>
                        <span>{slot.startTime} - {slot.endTime}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Performance Analytics */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Performance Analytics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {(ad.performance?.impressions || ad.impressions || 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Impressions</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {(ad.performance?.clicks || ad.clicks || 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Clicks</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {(ad.performance?.ctr || 0).toFixed(2)}%
                </div>
                <div className="text-sm text-gray-600">CTR</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {ad.budget.currency || 'USD'} {(ad.performance?.cpc || 0).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">CPC</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {(ad.performance?.conversions || 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Conversions</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {ad.budget.currency || 'USD'} {(ad.performance?.cpm || 0).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">CPM</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {ad.budget.currency || 'USD'} {(ad.performance?.spend || 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Spend</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {(ad.views || 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Views</div>
              </div>
            </div>
          </Card>

          {/* Approval Information */}
          {ad.approval && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Approval Information</h2>
              <div className="space-y-3">
                {ad.approval.reviewedAt && (
                  <div>
                    <span className="text-sm text-gray-600">Reviewed At: </span>
                    <span className="font-medium">
                      {new Date(ad.approval.reviewedAt).toLocaleString()}
                    </span>
                  </div>
                )}
                {ad.approval.notes && (
                  <div>
                    <span className="text-sm text-gray-600">Notes: </span>
                    <p className="text-gray-700 mt-1">{ad.approval.notes}</p>
                  </div>
                )}
                {ad.approval.rejectionReason && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded">
                    <span className="text-sm font-medium text-red-700">Rejection Reason: </span>
                    <p className="text-red-700 mt-1">{ad.approval.rejectionReason}</p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Budget & Status */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Status</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Total Budget</span>
                  <span className="font-medium">
                    {ad.budget.currency || 'USD'} {ad.budget.total.toLocaleString()}
                  </span>
                </div>
                {ad.budget.daily && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Daily Budget</span>
                    <span className="font-medium">
                      {ad.budget.currency || 'USD'} {ad.budget.daily.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${ad.budget.total > 0 ? ((ad.performance?.spend || 0) / ad.budget.total) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>
                    Spent: {ad.budget.currency || 'USD'} {(ad.performance?.spend || 0).toLocaleString()}
                  </span>
                  <span>
                    {ad.budget.total > 0 ? (((ad.performance?.spend || 0) / ad.budget.total) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>

              {ad.bidding && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Bidding</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Strategy:</span>
                      <span className="font-medium capitalize">{ad.bidding.strategy || 'N/A'}</span>
                    </div>
                    {ad.bidding.bidAmount && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bid Amount:</span>
                        <span className="font-medium">
                          {ad.budget.currency || 'USD'} {ad.bidding.bidAmount.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {ad.bidding.maxBid && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Max Bid:</span>
                        <span className="font-medium">
                          {ad.budget.currency || 'USD'} {ad.bidding.maxBid.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t">
                <div>
                  <div className="text-gray-600">Start Date</div>
                  <div className="font-medium">
                    {new Date(ad.schedule.startDate).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">End Date</div>
                  <div className="font-medium">
                    {new Date(ad.schedule.endDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {ad.promotion && ad.promotion.type && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Promotion</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium capitalize">{ad.promotion.type}</span>
                    </div>
                    {ad.promotion.status && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-medium capitalize">{ad.promotion.status}</span>
                      </div>
                    )}
                    {ad.promotion.budget && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Budget:</span>
                        <span className="font-medium">
                          {ad.budget.currency || 'USD'} {ad.promotion.budget.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="text-sm text-gray-600 mb-2">Status Actions</div>
                <div className="flex flex-col gap-2">
                  {ad.status === 'active' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange('paused')}
                    >
                      Pause Campaign
                    </Button>
                  )}
                  {ad.status === 'paused' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange('active')}
                    >
                      Resume Campaign
                    </Button>
                  )}
                  {ad.status === 'draft' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange('pending')}
                    >
                      Submit for Review
                    </Button>
                  )}
                  {ad.status === 'approved' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange('active')}
                    >
                      Activate Campaign
                    </Button>
                  )}
                  {ad.status === 'active' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange('completed')}
                    >
                      Mark as Completed
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Advertiser Info */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Advertiser</h3>
            {typeof ad.advertiser === 'string' ? (
              <div className="text-gray-600">Advertiser ID: {ad.advertiser}</div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {(ad.advertiser.businessName || ad.advertiser.name || 'A').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {ad.advertiser.businessName || ad.advertiser.name || 'Unknown Advertiser'}
                    </span>
                    {ad.advertiser.verified && (
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  {ad.createdAt && (
                    <div className="text-sm text-gray-600">
                      Created {new Date(ad.createdAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => router.push(`/ads/${ad.id}/analytics`)}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => navigator.clipboard.writeText(window.location.href)}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share Ad
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
