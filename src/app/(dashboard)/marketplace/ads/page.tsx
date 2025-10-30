"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  CheckCircle,
  SlidersHorizontal,
  ChevronDown,
  Grid,
  List,
  RefreshCw
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { apiRequest, API_ENDPOINTS } from "@/lib/api";
import { EmptyState } from "@/components/ui/empty-state";
import { ListSkeleton } from "@/components/ui/loading";

type AdsPagination = {
  current: number;
  pages: number;
  total: number;
  limit: number;
  count: number;
};

type AdsResponse = {
  success?: boolean;
  data?: Ad[];
  pagination?: AdsPagination;
};

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


export default function MarketplaceAdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedType, setSelectedType] = useState("All Types");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 12,
    count: 0
  });
  const router = useRouter();

  const fetchAds = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      params.append('type', 'ads');
      params.append('page', pagination.current.toString());
      params.append('limit', pagination.limit.toString());
      
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory !== "All Categories") params.append('category', selectedCategory);
      if (selectedType !== "All Types") params.append('type', selectedType);
      if (selectedStatus !== "All Status") params.append('status', selectedStatus);
      if (sortBy) params.append('sortBy', sortBy);
      if (sortOrder) params.append('sortOrder', sortOrder);

      const data = await apiRequest<AdsResponse>(`${API_ENDPOINTS.ads}?${params.toString()}`);
      
      if (data.success && data.data) {
        setAds(data.data || []);
        if (data.pagination) {
          setPagination(prev => ({
            ...prev,
            ...data.pagination
          }));
        }
      } else {
        // Return empty data - external API integration needed
        setAds([]);
        setPagination(prev => ({
          ...prev,
          total: 0,
          count: 0,
          pages: 1
        }));
      }
    } catch (error) {
      console.error('Error fetching ads:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch ads');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedType, selectedStatus, sortBy, sortOrder, pagination]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

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
      await apiRequest(`${API_ENDPOINTS.ads}/${adId}/promote`, { method: 'POST' });
      fetchAds();
    } catch (error) {
      console.error('Error promoting ad:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Browse Ads</h1>
            <p className="text-gray-600">Discover and explore advertising opportunities</p>
          </div>
        </div>
        <ListSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Card interactive={false}>
          <EmptyState
            icon={Megaphone}
            iconColor="text-red-600"
            iconBgColor="bg-red-100"
            title="Unable to Load Ads"
            description={error}
            actions={[
              {
                type: "button",
                onClick: fetchAds,
                label: "Try Again",
                icon: RefreshCw,
                variant: "primary"
              }
            ]}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <PageHeader
        title="Browse Ads"
        subtitle="Discover advertising opportunities and promoted content"
        actions={[
          {
            type: "button",
            onClick: handleCreateAd,
            label: "Create Ad",
            icon: Plus,
            variant: "primary"
          }
        ]}
      />

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

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="flex-1">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-green-500 transition-colors" />
              <input
                type="text"
                placeholder="Search ads, advertisers, or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Sort and View Controls */}
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="createdAt">Date Created</option>
              <option value="title">Title</option>
              <option value="budget">Budget</option>
              <option value="spent">Spent</option>
              <option value="ctr">CTR</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            <button
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title={viewMode === "grid" ? "Switch to list view" : "Switch to grid view"}
            >
              {viewMode === "grid" ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 animate-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ad Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {adTypes.map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSelectedCategory("All Categories");
                    setSelectedType("All Types");
                    setSelectedStatus("All Status");
                    setSearchQuery("");
                  }}
                  className="w-full px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <p className="text-gray-600">
              {sortedAds.length} ad{sortedAds.length !== 1 ? 's' : ''} found
            </p>
          </div>
        </div>

        {sortedAds.length === 0 ? (
          <Card interactive={false}>
            <EmptyState
              icon={Megaphone}
              iconColor="text-purple-600"
              iconBgColor="bg-purple-100"
              title="No Ads Found"
              description="We couldn't find any ads matching your criteria. Try adjusting your search terms or filters."
              actions={[
                {
                  type: "button",
                  onClick: () => {
                    setSearchQuery("");
                    setSelectedCategory("All Categories");
                    setSelectedType("All Types");
                    setSelectedStatus("All Status");
                  },
                  label: "Clear All Filters",
                  variant: "primary"
                },
                {
                  type: "button",
                  onClick: handleCreateAd,
                  label: "Create Your First Ad",
                  variant: "secondary"
                }
              ]}
            />
          </Card>
        ) : (
          <>
            <div className={`grid gap-4 ${
              viewMode === "grid" 
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
                : "grid-cols-1"
            }`}>
              {sortedAds.map((ad) => (
                <AdCard
                  key={ad.id}
                  ad={ad}
                  viewMode={viewMode}
                  onView={handleViewAd}
                  onEdit={handleEditAd}
                  onPromote={handlePromoteAd}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface AdCardProps {
  ad: Ad;
  viewMode: "grid" | "list";
  onView: (adId: string) => void;
  onEdit: (adId: string) => void;
  onPromote: (adId: string) => void;
}

const AdCard = React.memo(function AdCard({ ad, viewMode, onView, onEdit, onPromote }: AdCardProps) {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group ${
        viewMode === "list" ? "flex" : ""
      }`}
    >
      <div className={viewMode === "list" ? "flex-1 p-4" : "p-4"}>
        <div className={viewMode === "list" ? "flex gap-6" : ""}>
          {/* Ad Image */}
          <div className={`${viewMode === "list" ? "w-48 h-32" : "w-full h-40"} bg-gray-200 rounded-lg mb-3 flex-shrink-0 overflow-hidden group-hover:scale-105 transition-transform duration-300`}>
            {ad.images.length > 0 ? (
              <Image
                src={ad.images[0]}
                alt={ad.title}
                width={viewMode === "list" ? 192 : 400}
                height={viewMode === "list" ? 128 : 192}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-100 to-gray-200">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-300 rounded-lg mx-auto mb-2 flex items-center justify-center">
                    <Megaphone className="w-6 h-6" />
                  </div>
                  <span className="text-sm">No Image</span>
                </div>
              </div>
            )}
          </div>

          {/* Ad Details */}
          <div className={viewMode === "list" ? "flex-1" : ""}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-semibold text-gray-700 line-clamp-1 flex-1">
                {ad.title}
              </h3>
              <div className="flex gap-1 ml-3">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onView(ad.id)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(ad.id)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <p className="text-gray-600 text-sm mb-2 line-clamp-2">
              {ad.description}
            </p>

            {/* Ad Meta */}
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

            {/* Ad Stats */}
            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
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

            {/* Advertiser Info */}
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
                    onClick={() => onPromote(ad.id)}
                  >
                    <Star className="w-4 h-4 mr-1" />
                    Promote
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
