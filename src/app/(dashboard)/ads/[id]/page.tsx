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

interface Ad {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'banner' | 'sponsored' | 'featured' | 'promoted';
  status: 'draft' | 'pending' | 'active' | 'paused' | 'expired' | 'rejected';
  budget: number;
  spent: number;
  targetAudience: string[];
  startDate: string;
  endDate: string;
  images: string[];
  clickCount: number;
  impressionCount: number;
  ctr: number;
  cpc: number;
  cpm: number;
  advertiser: {
    id: string;
    name: string;
    avatar?: string;
    verified: boolean;
  };
  createdAt: string;
  updatedAt: string;
  isPromoted: boolean;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  location?: {
    city: string;
    state: string;
    country: string;
  };
}

const getStatusColor = (status: Ad['status']) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'paused': return 'bg-gray-100 text-gray-800';
    case 'expired': return 'bg-red-100 text-red-800';
    case 'rejected': return 'bg-red-100 text-red-800';
    case 'draft': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusIcon = (status: Ad['status']) => {
  switch (status) {
    case 'active': return <CheckCircle className="w-4 h-4" />;
    case 'pending': return <Clock className="w-4 h-4" />;
    case 'paused': return <AlertCircle className="w-4 h-4" />;
    case 'expired': return <X className="w-4 h-4" />;
    case 'rejected': return <X className="w-4 h-4" />;
    case 'draft': return <Edit className="w-4 h-4" />;
    default: return <Clock className="w-4 h-4" />;
  }
};

export default function AdDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [ad, setAd] = useState<Ad | null>(null);
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

        const data = await response.json();
        setAd(data);
      } catch (error) {
        console.error('Error fetching ad:', error);
        setError('Failed to load ad details');
        // Fallback to mock data
        setAd({
          id: params.id as string,
          title: 'Premium Hardware Store - Downtown',
          description: 'Your one-stop shop for all hardware needs. Quality tools, materials, and expert advice. We have been serving the community for over 20 years with the best products and customer service.',
          category: 'Hardware Stores',
          type: 'featured',
          status: 'active',
          budget: 5000,
          spent: 1250,
          targetAudience: ['contractors', 'homeowners', 'professionals'],
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          images: ['https://via.placeholder.com/800x600', 'https://via.placeholder.com/800x600', 'https://via.placeholder.com/800x600'],
          clickCount: 245,
          impressionCount: 12500,
          ctr: 1.96,
          cpc: 2.50,
          cpm: 15.00,
          advertiser: {
            id: '1',
            name: 'Downtown Hardware',
            verified: true
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isPromoted: true,
          priority: 'high',
          tags: ['hardware', 'tools', 'materials', 'construction'],
          location: {
            city: 'New York',
            state: 'NY',
            country: 'USA'
          }
        });
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
        console.error('Error deleting ad:', error);
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
      console.error('Error promoting ad:', error);
    }
  };

  const handleStatusChange = async (newStatus: Ad['status']) => {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.adsById}/${params.id}`, createAuthFetchOptions({
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      }));

      if (response.ok) {
        setAd(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (error) {
      console.error('Error updating ad status:', error);
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
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ad.status)}`}>
                {getStatusIcon(ad.status)}
                <span className="ml-1 capitalize">{ad.status}</span>
              </span>
              {ad.isPromoted && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                  <Star className="w-4 h-4 inline mr-1" />
                  Promoted
                </span>
              )}
            </div>
            <p className="text-gray-600">Created by {ad.advertiser.name}</p>
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
          {ad.status === 'active' && !ad.isPromoted && (
            <Button
              onClick={handlePromote}
              className="flex items-center gap-2"
            >
              <Star className="w-4 h-4" />
              Promote
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
          {ad.images.length > 0 && (
            <Card className="overflow-hidden">
              <div className="relative">
                <Image
                  src={ad.images[selectedImageIndex]}
                  alt={ad.title}
                  width={800}
                  height={256}
                  className="w-full h-64 object-cover"
                />
                {ad.images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {ad.images.map((_, index) => (
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
              {ad.images.length > 1 && (
                <div className="p-4">
                  <div className="flex gap-2 overflow-x-auto">
                    {ad.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden ${
                          index === selectedImageIndex ? 'ring-2 ring-blue-500' : ''
                        }`}
                      >
                        <Image
                          src={image}
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
          )}

          {/* Ad Details */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ad Details</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600">{ad.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Category</h3>
                  <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                    {ad.category}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Type</h3>
                  <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                    {ad.type}
                  </span>
                </div>
              </div>

              {ad.tags.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {ad.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {ad.location && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Location</h3>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{ad.location.city}, {ad.location.state}, {ad.location.country}</span>
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Target Audience</h3>
                <div className="flex flex-wrap gap-2">
                  {ad.targetAudience.map((audience) => (
                    <span
                      key={audience}
                      className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm"
                    >
                      {audience}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Performance Analytics */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Analytics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{ad.impressionCount.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Impressions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{ad.clickCount.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Clicks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{ad.ctr.toFixed(2)}%</div>
                <div className="text-sm text-gray-600">CTR</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">${ad.cpc.toFixed(2)}</div>
                <div className="text-sm text-gray-600">CPC</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Budget & Status */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Status</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Budget</span>
                  <span className="font-medium">${ad.budget.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(ad.spent / ad.budget) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Spent: ${ad.spent.toLocaleString()}</span>
                  <span>{((ad.spent / ad.budget) * 100).toFixed(1)}%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Start Date</div>
                  <div className="font-medium">
                    {new Date(ad.startDate).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">End Date</div>
                  <div className="font-medium">
                    {new Date(ad.endDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

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
                </div>
              </div>
            </div>
          </Card>

          {/* Advertiser Info */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Advertiser</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium">
                  {ad.advertiser.name.charAt(0)}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{ad.advertiser.name}</span>
                  {ad.advertiser.verified && (
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  Created {new Date(ad.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
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
