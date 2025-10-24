"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Megaphone,
  Search,
  Plus,
  Eye,
  TrendingUp,
  Star,
  MapPin,
  DollarSign,
  Edit,
  Clock,
  CheckCircle,
  AlertCircle,
  X
} from "lucide-react";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import { ListSkeleton } from "@/components/ui/loading";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export interface Ad {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'featured-listing' | 'sponsored-product' | 'training-school';
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

const categories = [
  "All Categories",
  "Hardware Stores",
  "Suppliers",
  "Training Schools",
  "Equipment Rental",
  "Cleaning Services",
  "Plumbing",
  "Electrical",
  "Moving Services",
  "Other"
];

const adTypes = [
  "All Types",
  "Featured Listing (Provider)",
  "Sponsored Product (Supplier)",
  "Training School Ads"
];

const statuses = [
  "All Status",
  "Draft",
  "Pending",
  "Active",
  "Paused",
  "Expired",
  "Rejected"
];

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

export default function AdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedType, setSelectedType] = useState("All Types");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const router = useRouter();

  useEffect(() => {
    const fetchAds = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/ads');

        if (!response.ok) {
          throw new Error('Failed to fetch ads');
        }

        const data = await response.json();
        setAds(data.ads || []);
      } catch (error) {
        console.error('Error fetching ads:', error);
        // Fallback to mock data
        setAds([
          {
            id: '1',
            title: 'Premium Hardware Store - Downtown',
            description: 'Your one-stop shop for all hardware needs. Quality tools, materials, and expert advice.',
            category: 'Hardware Stores',
            type: 'featured-listing',
            status: 'active',
            budget: 5000,
            spent: 1250,
            targetAudience: ['contractors', 'homeowners', 'professionals'],
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            images: ['/api/placeholder/400/300'],
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
            tags: ['hardware', 'tools', 'materials'],
            location: {
              city: 'New York',
              state: 'NY',
              country: 'USA'
            }
          },
          {
            id: '2',
            title: 'Professional Cleaning Services',
            description: 'Reliable and thorough cleaning services for offices and homes.',
            category: 'Cleaning Services',
            type: 'sponsored-product',
            status: 'active',
            budget: 3000,
            spent: 850,
            targetAudience: ['businesses', 'homeowners'],
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            images: ['/api/placeholder/400/300'],
            clickCount: 180,
            impressionCount: 8500,
            ctr: 2.12,
            cpc: 1.80,
            cpm: 12.00,
            advertiser: {
              id: '2',
              name: 'CleanPro Services',
              verified: true
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isPromoted: false,
            priority: 'medium',
            tags: ['cleaning', 'professional', 'reliable'],
            location: {
              city: 'Los Angeles',
              state: 'CA',
              country: 'USA'
            }
          },
          {
            id: '3',
            title: 'Electrical Training Academy',
            description: 'Certified electrical training programs for professionals.',
            category: 'Training Schools',
            type: 'training-school',
            status: 'pending',
            budget: 2000,
            spent: 0,
            targetAudience: ['electricians', 'students', 'professionals'],
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
            images: ['/api/placeholder/400/300'],
            clickCount: 0,
            impressionCount: 0,
            ctr: 0,
            cpc: 0,
            cpm: 0,
            advertiser: {
              id: '3',
              name: 'ElectroTech Academy',
              verified: false
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isPromoted: false,
            priority: 'low',
            tags: ['training', 'electrical', 'certification'],
            location: {
              city: 'Chicago',
              state: 'IL',
              country: 'USA'
            }
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, []);

  const filteredAds = ads.filter(ad => {
    const matchesSearch = ad.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ad.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ad.advertiser.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All Categories" || ad.category === selectedCategory;
    const matchesType = selectedType === "All Types" || ad.type === selectedType;
    const matchesStatus = selectedStatus === "All Status" || ad.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesType && matchesStatus;
  });

  const sortedAds = [...filteredAds].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'title':
        aValue = a.title;
        bValue = b.title;
        break;
      case 'budget':
        aValue = a.budget;
        bValue = b.budget;
        break;
      case 'spent':
        aValue = a.spent;
        bValue = b.spent;
        break;
      case 'ctr':
        aValue = a.ctr;
        bValue = b.ctr;
        break;
      case 'createdAt':
      default:
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleCreateAd = () => {
    router.push('/ads/create');
  };

  const handleViewAd = (adId: string) => {
    router.push(`/ads/${adId}`);
  };

  const handleEditAd = (adId: string) => {
    router.push(`/ads/${adId}/edit`);
  };

  const handlePromoteAd = async (adId: string) => {
    try {
      const response = await fetch(`/api/ads/${adId}/promote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Refresh ads list
        window.location.reload();
      }
    } catch (error) {
      console.error('Error promoting ad:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ads</h1>
            <p className="text-gray-600">Manage your advertising campaigns</p>
          </div>
        </div>
        <ListSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Ads', href: '/ads' }
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ads</h1>
          <p className="text-gray-600">Manage your advertising campaigns and reach your target audience</p>
        </div>
        <Button onClick={handleCreateAd} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Ad
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Ads</p>
              <p className="text-2xl font-bold text-gray-900">{ads.length}</p>
            </div>
            <Megaphone className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Ads</p>
              <p className="text-2xl font-bold text-green-600">
                {ads.filter(ad => ad.status === 'active').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Budget</p>
              <p className="text-2xl font-bold text-gray-900">
                ${ads.reduce((sum, ad) => sum + ad.budget, 0).toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">
                ${ads.reduce((sum, ad) => sum + ad.spent, 0).toLocaleString()}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search ads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              options={categories.map(cat => ({ value: cat, label: cat }))}
            />
            <Select
              value={selectedType}
              onValueChange={setSelectedType}
              options={adTypes.map(t => ({ value: t, label: t }))}
            />
            <Select
              value={selectedStatus}
              onValueChange={setSelectedStatus}
              options={statuses.map(status => ({ value: status, label: status }))}
            />
            <Select
              value={sortBy}
              onValueChange={setSortBy}
              options={[
                { value: 'createdAt', label: 'Date Created' },
                { value: 'title', label: 'Title' },
                { value: 'budget', label: 'Budget' },
                { value: 'spent', label: 'Spent' },
                { value: 'ctr', label: 'CTR' }
              ]}
            />
            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Ads List */}
      {sortedAds.length === 0 ? (
        <Card className="p-8 text-center">
          <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No ads found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || selectedCategory !== "All Categories" || selectedType !== "All Types" || selectedStatus !== "All Status"
              ? "Try adjusting your filters to see more results."
              : "Get started by creating your first ad campaign."}
          </p>
          <Button onClick={handleCreateAd}>
            Create Your First Ad
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedAds.map((ad) => (
            <Card key={ad.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                {ad.images.length > 0 && (
                  <div className="aspect-video bg-gray-100">
                    <Image
                      src={ad.images[0]}
                      alt={ad.title}
                      width={400}
                      height={225}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ad.status)}`}>
                    {getStatusIcon(ad.status)}
                    <span className="ml-1 capitalize">{ad.status}</span>
                  </span>
                  {ad.isPromoted && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                      <Star className="w-3 h-3 inline mr-1" />
                      Promoted
                    </span>
                  )}
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 line-clamp-1">{ad.title}</h3>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleViewAd(ad.id)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditAd(ad.id)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{ad.description}</p>
                
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    {ad.category}
                  </span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {ad.type}
                  </span>
                  {ad.location && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {ad.location.city}
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Budget</p>
                    <p className="font-medium">${ad.budget.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Spent</p>
                    <p className="font-medium">${ad.spent.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Clicks</p>
                    <p className="font-medium">{ad.clickCount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">CTR</p>
                    <p className="font-medium">{ad.ctr.toFixed(2)}%</p>
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium">
                          {ad.advertiser.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{ad.advertiser.name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(ad.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {ad.status === 'active' && !ad.isPromoted && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePromoteAd(ad.id)}
                      >
                        <Star className="w-4 h-4 mr-1" />
                        Promote
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
