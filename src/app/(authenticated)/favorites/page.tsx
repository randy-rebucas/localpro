"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Heart,
  Star,
  MapPin,
  Clock,
  Wrench,
  GraduationCap,
  Package,
  Building2,
  Trash2,
  Eye,
  RefreshCw,
  Grid,
  List,
  CheckCircle
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ListSkeleton } from "@/components/ui/loading";
import { apiRequest, API_ENDPOINTS } from "@/lib/api";
import { logger } from "@/lib/logger";

// Types
type FavoriteType = 'services' | 'providers' | 'courses' | 'supplies';

interface FavoriteItem {
  id: string;
  type: FavoriteType;
  data: Record<string, unknown>;
}

interface Service {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  category?: string;
  provider?: {
    _id?: string;
    id?: string;
    firstName?: string;
    lastName?: string;
    name?: string;
  } | string;
  pricing?: {
    type?: string;
    basePrice?: number;
    currency?: string;
  };
  images?: Array<{ url?: string; thumbnail?: string }> | string[];
  serviceArea?: string[];
}

interface Provider {
  _id?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  businessName?: string;
  profile?: {
    skills?: string[];
    rating?: number;
  };
  rating?: number;
  verification?: {
    isVerified?: boolean;
  };
  avatar?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
}

interface Course {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  category?: string;
  instructor?: {
    _id?: string;
    id?: string;
    name?: string;
  } | string;
  price?: number;
  thumbnail?: string;
  rating?: number;
  studentsCount?: number;
}

interface Supply {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  category?: string;
  supplier?: {
    _id?: string;
    id?: string;
    businessName?: string;
  } | string;
  pricing?: {
    price?: number;
    currency?: string;
  };
  images?: Array<{ url?: string; thumbnail?: string }> | string[];
  location?: {
    city?: string;
    state?: string;
  };
}

export default function FavoritesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FavoriteType>('services');
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [favoriteIds, setFavoriteIds] = useState<{
    services: string[];
    providers: string[];
    courses: string[];
    supplies: string[];
  }>({
    services: [],
    providers: [],
    courses: [],
    supplies: []
  });

  // Load favorite IDs from localStorage
  const loadFavoriteIds = useCallback(() => {
    try {
      const favoriteServices = JSON.parse(localStorage.getItem('favoriteServices') || '[]');
      const favoriteProviders = JSON.parse(localStorage.getItem('favoriteProviders') || '[]');
      const favoriteCourses = JSON.parse(localStorage.getItem('favoriteCourses') || '[]');
      const favoriteSupplies = JSON.parse(localStorage.getItem('favoriteSupplies') || '[]');
      
      setFavoriteIds({
        services: favoriteServices,
        providers: favoriteProviders,
        courses: favoriteCourses,
        supplies: favoriteSupplies
      });
      
      return {
        services: favoriteServices,
        providers: favoriteProviders,
        courses: favoriteCourses,
        supplies: favoriteSupplies
      };
    } catch (error) {
      logger.error('Error loading favorites', error instanceof Error ? error : new Error(String(error)));
      return {
        services: [],
        providers: [],
        courses: [],
        supplies: []
      };
    }
  }, []);

  // Fetch favorites data
  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const ids = loadFavoriteIds();
    const allFavorites: FavoriteItem[] = [];
    
    try {

      // Fetch services
      if (ids.services.length > 0) {
        try {
          const servicesData = await Promise.all(
            ids.services.map((id: string) => 
              apiRequest<Service>(`${API_ENDPOINTS.marketplaceServiceById}/${id}`).catch(() => null)
            )
          );
          
          servicesData.forEach((service, index) => {
            if (service) {
              allFavorites.push({
                id: ids.services[index],
                type: 'services',
                data: service
              });
            }
          });
        } catch (err) {
          logger.error('Error fetching services', err instanceof Error ? err : new Error(String(err)));
        }
      }

      // Fetch providers
      if (ids.providers.length > 0) {
        try {
          const providersData = await Promise.all(
            ids.providers.map((id: string) => 
              apiRequest<Provider>(`${API_ENDPOINTS.providersById}/${id}`).catch(() => null)
            )
          );
          
          providersData.forEach((provider, index) => {
            if (provider) {
              allFavorites.push({
                id: ids.providers[index],
                type: 'providers',
                data: provider
              });
            }
          });
        } catch (err) {
          logger.error('Error fetching providers', err instanceof Error ? err : new Error(String(err)), { providerIds: ids.providers });
        }
      }

      // Fetch courses
      if (ids.courses.length > 0) {
        try {
          const coursesData = await Promise.all(
            ids.courses.map((id: string) => 
              apiRequest<Course>(`${API_ENDPOINTS.academyCourseById}/${id}`).catch(() => null)
            )
          );
          
          coursesData.forEach((course, index) => {
            if (course) {
              allFavorites.push({
                id: ids.courses[index],
                type: 'courses',
                data: course
              });
            }
          });
        } catch (err) {
          logger.error('Error fetching courses', err instanceof Error ? err : new Error(String(err)), { courseIds: ids.courses });
        }
      }

      // Fetch supplies
      if (ids.supplies.length > 0) {
        try {
          const suppliesData = await Promise.all(
            ids.supplies.map((id: string) => 
              apiRequest<Supply>(`${API_ENDPOINTS.suppliesById}/${id}`).catch(() => null)
            )
          );
          
          suppliesData.forEach((supply, index) => {
            if (supply) {
              allFavorites.push({
                id: ids.supplies[index],
                type: 'supplies',
                data: supply
              });
            }
          });
        } catch (err) {
          logger.error('Error fetching supplies', err instanceof Error ? err : new Error(String(err)), { supplyIds: ids.supplies });
        }
      }

      setFavorites(allFavorites);
    } catch (error) {
      logger.error('Error fetching favorites', error instanceof Error ? error : new Error(String(error)), { favoriteIds: ids });
      setError(error instanceof Error ? error.message : 'Failed to load favorites');
    } finally {
      setLoading(false);
    }
  }, [loadFavoriteIds]);

  // Remove from favorites
  const removeFavorite = useCallback((id: string, type: FavoriteType) => {
    try {
      const storageKey = `favorite${type.charAt(0).toUpperCase() + type.slice(1)}` as 
        'favoriteServices' | 'favoriteProviders' | 'favoriteCourses' | 'favoriteSupplies';
      
      const currentFavorites = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const updatedFavorites = currentFavorites.filter((favId: string) => favId !== id);
      localStorage.setItem(storageKey, JSON.stringify(updatedFavorites));
      
      // Update state
      setFavorites(prev => prev.filter(fav => !(fav.id === id && fav.type === type)));
      setFavoriteIds(prev => ({
        ...prev,
        [type]: prev[type].filter(favId => favId !== id)
      }));
      
      // Dispatch custom event for header to update
      window.dispatchEvent(new Event('favoritesUpdated'));
    } catch (error) {
      logger.error('Error removing favorite', error instanceof Error ? error : new Error(String(error)), { favoriteId: id, favoriteType: type });
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Filter favorites by active tab
  const filteredFavorites = favorites.filter(fav => fav.type === activeTab);

  // Get icon for type
  const getTypeIcon = (type: FavoriteType) => {
    switch (type) {
      case 'services':
        return Wrench;
      case 'providers':
        return Building2;
      case 'courses':
        return GraduationCap;
      case 'supplies':
        return Package;
    }
  };

  // Get count for tab
  const getTabCount = (type: FavoriteType) => {
    return favoriteIds[type].length;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 text-white flex items-center justify-center shadow-lg shadow-red-500/20">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Favorites</h1>
            <p className="text-sm text-gray-600">Your saved items and services</p>
          </div>
        </div>
        <ListSkeleton />
      </div>
    );
  }

  const totalFavorites = favoriteIds.services.length + 
                        favoriteIds.providers.length + 
                        favoriteIds.courses.length + 
                        favoriteIds.supplies.length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 text-white flex items-center justify-center shadow-lg shadow-red-500/20">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Favorites</h1>
            <p className="text-sm text-gray-600">
              {totalFavorites > 0 ? (
                <span className="font-medium text-gray-700">{totalFavorites} saved item{totalFavorites !== 1 ? 's' : ''}</span>
              ) : (
                <span>Your saved items and services</span>
              )}
            </p>
          </div>
        </div>
        {filteredFavorites.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className={`p-2.5 rounded-lg transition-all border ${
                viewMode === "grid"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
              title={viewMode === "grid" ? "Switch to list view" : "Switch to grid view"}
            >
              {viewMode === "grid" ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex flex-wrap gap-1 p-2">
          {(['services', 'providers', 'courses', 'supplies'] as FavoriteType[]).map((type) => {
            const Icon = getTypeIcon(type);
            const count = getTabCount(type);
            const isActive = activeTab === type;
            
            return (
              <button
                key={type}
                onClick={() => setActiveTab(type)}
                className={`px-4 py-2.5 flex items-center gap-2 rounded-lg transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="capitalize font-medium">{type}</span>
                {count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {error ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <EmptyState
            icon={Heart}
            iconColor="text-red-600"
            iconBgColor="bg-red-100"
            title="Unable to Load Favorites"
            description={error}
            actions={[
              {
                type: "button",
                onClick: fetchFavorites,
                label: "Try Again",
                icon: RefreshCw,
                variant: "primary"
              }
            ]}
          />
        </div>
      ) : filteredFavorites.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <EmptyState
            icon={Heart}
            iconColor="text-gray-600"
            iconBgColor="bg-gray-100"
            title={`No Favorite ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
            description={`You haven't saved any ${activeTab} to your favorites yet. Start exploring to find items you love!`}
            actions={[
              {
                type: "link",
                href: activeTab === 'services' ? '/marketplace' : 
                      activeTab === 'providers' ? '/marketplace/providers' :
                      activeTab === 'courses' ? '/marketplace/courses' :
                      '/marketplace/supplies',
                label: `Browse ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`,
                variant: "primary"
              }
            ]}
          />
        </div>
      ) : (
        <div className={`grid gap-4 ${
          viewMode === "grid" 
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
            : "grid-cols-1"
        }`}>
          {filteredFavorites.map((favorite) => (
            <FavoriteCard
              key={`${favorite.type}-${favorite.id}`}
              favorite={favorite}
              viewMode={viewMode}
              onRemove={removeFavorite}
              onView={(id, type) => {
                const routes: Record<FavoriteType, string> = {
                  services: `/marketplace/services/${id}`,
                  providers: `/marketplace/providers/${id}`,
                  courses: `/marketplace/courses/${id}`,
                  supplies: `/marketplace/supplies/${id}`
                };
                router.push(routes[type]);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FavoriteCardProps {
  favorite: FavoriteItem;
  viewMode: "grid" | "list";
  onRemove: (id: string, type: FavoriteType) => void;
  onView: (id: string, type: FavoriteType) => void;
}

const FavoriteCard = React.memo(function FavoriteCard({
  favorite,
  viewMode,
  onRemove,
  onView
}: FavoriteCardProps) {
  const { id, type, data } = favorite;

  const renderContent = () => {
    switch (type) {
      case 'services':
        return <ServiceCard service={data as unknown as Service} viewMode={viewMode} />;
      case 'providers':
        return <ProviderCard provider={data as unknown as Provider} viewMode={viewMode} />;
      case 'courses':
        return <CourseCard course={data as unknown as Course} viewMode={viewMode} />;
      case 'supplies':
        return <SupplyCard supply={data as unknown as Supply} viewMode={viewMode} />;
    }
  };

  return (
    <Card className={`${viewMode === "list" ? "flex gap-4 p-5" : "relative"} group hover:shadow-xl transition-all duration-200 border border-gray-200 rounded-xl overflow-hidden`}>
      <div className={viewMode === "list" ? "flex-1 relative" : "relative"}>
        {renderContent()}
        <div className={`${viewMode === "list" ? "absolute top-4 right-4" : "absolute top-3 right-3"} flex gap-2 z-10`}>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onView(id, type)}
            className="opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-md border border-gray-200 hover:bg-gray-50"
            title="View details"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRemove(id, type)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50 bg-white shadow-md border border-red-200"
            title="Remove from favorites"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
});

function ServiceCard({ service, viewMode }: { service: Service; viewMode: "grid" | "list" }) {
  const imageUrl = Array.isArray(service.images) && service.images.length > 0
    ? (typeof service.images[0] === 'string' ? service.images[0] : service.images[0].url || service.images[0].thumbnail)
    : null;
  
  const providerName = typeof service.provider === 'object' && service.provider
    ? (service.provider.name || `${service.provider.firstName || ''} ${service.provider.lastName || ''}`.trim())
    : 'Unknown Provider';

  const price = service.pricing?.basePrice 
    ? `$${service.pricing.basePrice.toLocaleString()}${service.pricing.type === 'hourly' ? '/hr' : ''}`
    : 'Price on request';

  return (
    <div className={`${viewMode === "list" ? "flex gap-4" : ""}`}>
      {imageUrl && (
        <div className={`${viewMode === "list" ? "w-48 h-32 flex-shrink-0" : "w-full h-48"} bg-gray-200 rounded-xl overflow-hidden ${viewMode === "list" ? "" : "mb-4"} shadow-sm`}>
          <Image
            src={imageUrl}
            alt={service.title}
            width={viewMode === "list" ? 192 : 400}
            height={viewMode === "list" ? 128 : 192}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className={viewMode === "list" ? "flex-1" : "p-5"}>
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
          {service.title}
        </h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
          {service.description}
        </p>
        <div className="flex items-center justify-between text-sm mb-3">
          <span className="text-gray-600 font-medium">{providerName}</span>
          <span className="font-semibold text-emerald-600">{price}</span>
        </div>
        {service.serviceArea && service.serviceArea.length > 0 && (
          <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-lg inline-flex">
            <MapPin className="w-3.5 h-3.5" />
            <span>{service.serviceArea[0]}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ProviderCard({ provider, viewMode }: { provider: Provider; viewMode: "grid" | "list" }) {
  const name = provider.name || 
               provider.businessName || 
               `${provider.firstName || ''} ${provider.lastName || ''}`.trim() || 
               'Unknown Provider';

  const location = provider.location
    ? `${provider.location.city || ''}${provider.location.city && provider.location.state ? ', ' : ''}${provider.location.state || ''}`
    : '';

  return (
    <div className={viewMode === "list" ? "flex-1" : "p-5"}>
      <div className="flex items-start gap-4">
        <div className={`${viewMode === "list" ? "w-12 h-12" : "w-16 h-16"} bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center text-white ${viewMode === "list" ? "text-lg" : "text-xl"} font-bold flex-shrink-0 shadow-md`}>
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className={`${viewMode === "list" ? "text-base" : "text-lg"} font-bold text-gray-900`}>{name}</h3>
            {provider.verification?.isVerified && (
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            )}
          </div>
          {location && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-3 bg-gray-50 px-2.5 py-1.5 rounded-lg inline-flex">
              <MapPin className="w-3.5 h-3.5" />
              <span>{location}</span>
            </div>
          )}
          {provider.rating && (
            <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1.5 rounded-lg inline-flex">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="text-sm font-semibold text-gray-900">{provider.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CourseCard({ course, viewMode }: { course: Course; viewMode: "grid" | "list" }) {
  const imageUrl = course.thumbnail;

  const instructorName = typeof course.instructor === 'object' && course.instructor
    ? course.instructor.name
    : 'Unknown Instructor';

  return (
    <div className={`${viewMode === "list" ? "flex gap-4" : ""}`}>
      {imageUrl && (
        <div className={`${viewMode === "list" ? "w-48 h-32 flex-shrink-0" : "w-full h-48"} bg-gray-200 rounded-xl overflow-hidden ${viewMode === "list" ? "" : "mb-4"} shadow-sm`}>
          <Image
            src={imageUrl}
            alt={course.title}
            width={viewMode === "list" ? 192 : 400}
            height={viewMode === "list" ? 128 : 192}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className={viewMode === "list" ? "flex-1" : "p-5"}>
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
          {course.title}
        </h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
          {course.description}
        </p>
        <div className="flex items-center justify-between text-sm mb-3">
          <span className="text-gray-600 font-medium">{instructorName}</span>
          {course.price !== undefined && (
            <span className="font-semibold text-emerald-600">
              ${course.price.toLocaleString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-3">
          {course.rating && (
            <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1.5 rounded-lg">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-xs font-semibold text-gray-900">{course.rating.toFixed(1)}</span>
            </div>
          )}
          {course.studentsCount !== undefined && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-2.5 py-1.5 rounded-lg">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-medium">{course.studentsCount} students</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SupplyCard({ supply, viewMode }: { supply: Supply; viewMode: "grid" | "list" }) {
  const imageUrl = Array.isArray(supply.images) && supply.images.length > 0
    ? (typeof supply.images[0] === 'string' ? supply.images[0] : supply.images[0].url || supply.images[0].thumbnail)
    : null;

  const supplierName = typeof supply.supplier === 'object' && supply.supplier
    ? supply.supplier.businessName
    : 'Unknown Supplier';

  const price = supply.pricing?.price
    ? `$${supply.pricing.price.toLocaleString()}`
    : 'Price on request';

  return (
    <div className={`${viewMode === "list" ? "flex gap-4" : ""}`}>
      {imageUrl && (
        <div className={`${viewMode === "list" ? "w-48 h-32 flex-shrink-0" : "w-full h-48"} bg-gray-200 rounded-xl overflow-hidden ${viewMode === "list" ? "" : "mb-4"} shadow-sm`}>
          <Image
            src={imageUrl}
            alt={supply.name}
            width={viewMode === "list" ? 192 : 400}
            height={viewMode === "list" ? 128 : 192}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className={viewMode === "list" ? "flex-1" : "p-5"}>
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
          {supply.name}
        </h3>
        {supply.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
            {supply.description}
          </p>
        )}
        <div className="flex items-center justify-between text-sm mb-3">
          <span className="text-gray-600 font-medium">{supplierName}</span>
          <span className="font-semibold text-emerald-600">{price}</span>
        </div>
        {supply.location && (
          <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-lg inline-flex">
            <MapPin className="w-3.5 h-3.5" />
            <span>{supply.location.city}{supply.location.state ? `, ${supply.location.state}` : ''}</span>
          </div>
        )}
      </div>
    </div>
  );
}
