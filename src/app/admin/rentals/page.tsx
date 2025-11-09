"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { 
  Home, 
  Search, 
  Edit, 
  Trash2, 
  Plus,
  RefreshCw,
  Image as ImageIcon,
  TrendingUp,
  Eye,
  X,
  Package,
  DollarSign
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { Modal } from "@/components/ui/modal";
import { FileUpload } from "@/components/ui/file-upload";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import toast from "react-hot-toast";
import {
  RentalItem,
  Image as RentalImage,
  Document,
  RentalCategory
} from "@/types/rentals";

// Extended Rental interface for admin page (includes owner/provider populated)
interface Rental extends Omit<RentalItem, 'owner' | 'name' | 'createdAt' | 'updatedAt'> {
  name?: string;
  type?: string;
  price?: {
    daily?: number;
    weekly?: number;
    monthly?: number;
    currency?: string;
  };
  owner?: string | {
    _id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  provider?: string | {
    _id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  images?: (RentalImage & { _id?: string })[];
  documents?: Document[];
  createdAt?: string;
  updatedAt?: string;
}

interface RentalStatistics {
  totalRentals: number;
  activeRentals: number;
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  rentalsByCategory: Array<{ category: string; count: number }>;
  rentalsByType: Array<{ type: string; count: number }>;
  recentRentals: number;
}

export default function RentalsPage() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [stats, setStats] = useState<RentalStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [currentPage] = useState(1);
  const itemsPerPage = 20;

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [imagesModalOpen, setImagesModalOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [rentalFormData, setRentalFormData] = useState({
    name: "",
    title: "",
    description: "",
    category: "",
    subcategory: "",
    type: "",
    // Pricing
    hourlyPrice: 0,
    dailyPrice: 0,
    weeklyPrice: 0,
    monthlyPrice: 0,
    currency: "USD",
    // Location
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    lat: "",
    lng: "",
    pickupRequired: true,
    deliveryAvailable: false,
    deliveryFee: 0,
    // Specifications
    brand: "",
    model: "",
    year: "",
    condition: "good" as "excellent" | "good" | "fair" | "poor",
    features: [] as string[],
    length: "",
    width: "",
    height: "",
    dimensionUnit: "inches",
    weight: "",
    weightUnit: "lbs",
    // Requirements
    minAge: "",
    licenseRequired: false,
    licenseType: "",
    deposit: 0,
    insuranceRequired: false,
    // Status
    isAvailable: true,
    isActive: true,
    isFeatured: false,
    // Owner/Provider
    owner: "",
    provider: "",
    // Tags
    tags: "" as string | string[]
  });

  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!getApiToken()) {
        logger.warn('No API token found, cannot fetch rentals');
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }

      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.set('page', currentPage.toString());
      queryParams.set('limit', itemsPerPage.toString());
      if (searchTerm) queryParams.set('search', searchTerm);
      if (categoryFilter !== 'all') queryParams.set('category', categoryFilter);
      if (typeFilter !== 'all') queryParams.set('type', typeFilter);

      const rentalsUrl = `${API_BASE_URL}${API_ENDPOINTS.rentals}?${queryParams.toString()}`;
      const statsUrl = `${API_BASE_URL}${API_ENDPOINTS.rentalsStatistics}`;

      const [rentalsResponse, statsResponse] = await Promise.all([
        fetch(rentalsUrl, createAuthFetchOptions({ method: 'GET' })),
        fetch(statsUrl, createAuthFetchOptions({ method: 'GET' }))
      ]);

      if (!rentalsResponse.ok) {
        const errorData = await rentalsResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${rentalsResponse.status}: Failed to fetch rentals`);
      }

      const rentalsResult = await rentalsResponse.json();
      
      // Handle stats response
      let statsData = null;
      if (statsResponse.ok) {
        try {
          const statsResult = await statsResponse.json();
          statsData = statsResult.data || statsResult;
        } catch (err) {
          logger.warn('Failed to parse stats response', { 
            error: err instanceof Error ? err.message : String(err)
          });
        }
      }

      // Transform rentals data
      let rentalsData: Rental[] = [];
      if (rentalsResult.success && rentalsResult.data) {
        if (Array.isArray(rentalsResult.data)) {
          rentalsData = rentalsResult.data;
        } else if (rentalsResult.data.rentals && Array.isArray(rentalsResult.data.rentals)) {
          rentalsData = rentalsResult.data.rentals;
        }
      } else if (Array.isArray(rentalsResult)) {
        rentalsData = rentalsResult;
      }

      setRentals(rentalsData);
      setStats(statsData);
      setLastUpdated(new Date());
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Error fetching rentals data', error);
      setError(error.message);
      toast.error(`Failed to load rentals: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, categoryFilter, typeFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleCreateRental = async () => {
    try {
      setSubmitting(true);

      if (!getApiToken()) {
        throw new Error('Authentication required');
      }

      // Build pricing object
      const pricing: Rental['pricing'] = {
        currency: rentalFormData.currency
      };
      if (rentalFormData.hourlyPrice > 0) pricing.hourly = rentalFormData.hourlyPrice;
      if (rentalFormData.dailyPrice > 0) pricing.daily = rentalFormData.dailyPrice;
      if (rentalFormData.weeklyPrice > 0) pricing.weekly = rentalFormData.weeklyPrice;
      if (rentalFormData.monthlyPrice > 0) pricing.monthly = rentalFormData.monthlyPrice;

      // Build location object
      const location: Rental['location'] = {
        address: {},
        pickupRequired: rentalFormData.pickupRequired,
        deliveryAvailable: rentalFormData.deliveryAvailable
      };
      if (rentalFormData.street) location.address!.street = rentalFormData.street;
      if (rentalFormData.city) location.address!.city = rentalFormData.city;
      if (rentalFormData.state) location.address!.state = rentalFormData.state;
      if (rentalFormData.zipCode) location.address!.zipCode = rentalFormData.zipCode;
      if (rentalFormData.country) location.address!.country = rentalFormData.country;
      if (rentalFormData.lat && rentalFormData.lng) {
        location.coordinates = {
          lat: parseFloat(rentalFormData.lat),
          lng: parseFloat(rentalFormData.lng)
        };
      }
      if (rentalFormData.deliveryAvailable && rentalFormData.deliveryFee > 0) {
        location.deliveryFee = rentalFormData.deliveryFee;
      }

      // Build specifications object
      const specifications: Partial<Rental['specifications']> = {};
      if (rentalFormData.brand) specifications.brand = rentalFormData.brand;
      if (rentalFormData.model) specifications.model = rentalFormData.model;
      if (rentalFormData.year) specifications.year = parseInt(rentalFormData.year);
      if (rentalFormData.condition) specifications.condition = rentalFormData.condition;
      if (rentalFormData.features.length > 0) specifications.features = rentalFormData.features;
      if (rentalFormData.length || rentalFormData.width || rentalFormData.height) {
        specifications.dimensions = {};
        if (rentalFormData.length) specifications.dimensions!.length = parseFloat(rentalFormData.length);
        if (rentalFormData.width) specifications.dimensions!.width = parseFloat(rentalFormData.width);
        if (rentalFormData.height) specifications.dimensions!.height = parseFloat(rentalFormData.height);
        if (rentalFormData.dimensionUnit) specifications.dimensions!.unit = rentalFormData.dimensionUnit;
      }
      if (rentalFormData.weight) {
        specifications.weight = {
          value: parseFloat(rentalFormData.weight),
          unit: rentalFormData.weightUnit || 'lbs'
        };
      }

      // Build requirements object
      const requirements: Partial<Rental['requirements']> = {};
      if (rentalFormData.minAge) requirements.minAge = parseInt(rentalFormData.minAge);
      if (rentalFormData.licenseRequired) {
        requirements.licenseRequired = true;
        if (rentalFormData.licenseType) requirements.licenseType = rentalFormData.licenseType;
      }
      if (rentalFormData.deposit > 0) requirements.deposit = rentalFormData.deposit;
      if (rentalFormData.insuranceRequired) requirements.insuranceRequired = true;

      // Build tags array
      const tags = typeof rentalFormData.tags === 'string' 
        ? rentalFormData.tags.split(',').map(t => t.trim()).filter(t => t)
        : rentalFormData.tags;

      const rentalData: Partial<Rental> = {
        name: rentalFormData.name || rentalFormData.title,
        title: rentalFormData.title,
        description: rentalFormData.description,
        category: rentalFormData.category as RentalCategory,
        subcategory: rentalFormData.subcategory || undefined,
        pricing,
        location,
        availability: {
          isAvailable: rentalFormData.isAvailable
        },
        isActive: rentalFormData.isActive,
        isFeatured: rentalFormData.isFeatured
      };

      if (Object.keys(specifications).length > 0) rentalData.specifications = specifications;
      if (Object.keys(requirements).length > 0) rentalData.requirements = requirements;
      if (tags && tags.length > 0) rentalData.tags = tags;
      if (rentalFormData.owner) rentalData.owner = rentalFormData.owner;
      if (rentalFormData.provider) rentalData.owner = rentalFormData.provider; // Use provider as owner if provided

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.rentalsCreate}`,
        createAuthFetchOptions({
          method: 'POST',
          body: JSON.stringify(rentalData)
        })
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Failed to create rental');
      }

      const result = await response.json();
      
      if (result.success || result.data) {
        toast.success('Rental created successfully');
        setCreateModalOpen(false);
        resetForm();
        await refreshData();
      } else {
        throw new Error(result.error || result.message || 'Failed to create rental');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Error creating rental', error);
      toast.error(`Failed to create rental: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRental = async () => {
    if (!selectedRental?._id) return;

    try {
      setSubmitting(true);

      if (!getApiToken()) {
        throw new Error('Authentication required');
      }

      // Build pricing object (same as create)
      const pricing: Rental['pricing'] = {
        currency: rentalFormData.currency
      };
      if (rentalFormData.hourlyPrice > 0) pricing.hourly = rentalFormData.hourlyPrice;
      if (rentalFormData.dailyPrice > 0) pricing.daily = rentalFormData.dailyPrice;
      if (rentalFormData.weeklyPrice > 0) pricing.weekly = rentalFormData.weeklyPrice;
      if (rentalFormData.monthlyPrice > 0) pricing.monthly = rentalFormData.monthlyPrice;

      // Build location object
      const location: Rental['location'] = {
        address: {},
        pickupRequired: rentalFormData.pickupRequired,
        deliveryAvailable: rentalFormData.deliveryAvailable
      };
      if (rentalFormData.street) location.address!.street = rentalFormData.street;
      if (rentalFormData.city) location.address!.city = rentalFormData.city;
      if (rentalFormData.state) location.address!.state = rentalFormData.state;
      if (rentalFormData.zipCode) location.address!.zipCode = rentalFormData.zipCode;
      if (rentalFormData.country) location.address!.country = rentalFormData.country;
      if (rentalFormData.lat && rentalFormData.lng) {
        location.coordinates = {
          lat: parseFloat(rentalFormData.lat),
          lng: parseFloat(rentalFormData.lng)
        };
      }
      if (rentalFormData.deliveryAvailable && rentalFormData.deliveryFee > 0) {
        location.deliveryFee = rentalFormData.deliveryFee;
      }

      // Build specifications object
      const specifications: Partial<Rental['specifications']> = {};
      if (rentalFormData.brand) specifications.brand = rentalFormData.brand;
      if (rentalFormData.model) specifications.model = rentalFormData.model;
      if (rentalFormData.year) specifications.year = parseInt(rentalFormData.year);
      if (rentalFormData.condition) specifications.condition = rentalFormData.condition;
      if (rentalFormData.features.length > 0) specifications.features = rentalFormData.features;
      if (rentalFormData.length || rentalFormData.width || rentalFormData.height) {
        specifications.dimensions = {};
        if (rentalFormData.length) specifications.dimensions!.length = parseFloat(rentalFormData.length);
        if (rentalFormData.width) specifications.dimensions!.width = parseFloat(rentalFormData.width);
        if (rentalFormData.height) specifications.dimensions!.height = parseFloat(rentalFormData.height);
        if (rentalFormData.dimensionUnit) specifications.dimensions!.unit = rentalFormData.dimensionUnit;
      }
      if (rentalFormData.weight) {
        specifications.weight = {
          value: parseFloat(rentalFormData.weight),
          unit: rentalFormData.weightUnit || 'lbs'
        };
      }

      // Build requirements object
      const requirements: Partial<Rental['requirements']> = {};
      if (rentalFormData.minAge) requirements.minAge = parseInt(rentalFormData.minAge);
      if (rentalFormData.licenseRequired) {
        requirements.licenseRequired = true;
        if (rentalFormData.licenseType) requirements.licenseType = rentalFormData.licenseType;
      }
      if (rentalFormData.deposit > 0) requirements.deposit = rentalFormData.deposit;
      if (rentalFormData.insuranceRequired) requirements.insuranceRequired = true;

      // Build tags array
      const tags = typeof rentalFormData.tags === 'string' 
        ? rentalFormData.tags.split(',').map(t => t.trim()).filter(t => t)
        : rentalFormData.tags;

      const rentalData: Partial<Rental> = {
        name: rentalFormData.name || rentalFormData.title,
        title: rentalFormData.title,
        description: rentalFormData.description,
        category: rentalFormData.category as RentalCategory,
        subcategory: rentalFormData.subcategory || undefined,
        pricing,
        location,
        availability: {
          isAvailable: rentalFormData.isAvailable
        },
        isActive: rentalFormData.isActive,
        isFeatured: rentalFormData.isFeatured
      };

      if (Object.keys(specifications).length > 0) rentalData.specifications = specifications;
      if (Object.keys(requirements).length > 0) rentalData.requirements = requirements;
      if (tags && tags.length > 0) rentalData.tags = tags;
      if (rentalFormData.owner) rentalData.owner = rentalFormData.owner;
      if (rentalFormData.provider) rentalData.owner = rentalFormData.provider;

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.rentalsUpdate}/${selectedRental._id}`,
        createAuthFetchOptions({
          method: 'PUT',
          body: JSON.stringify(rentalData)
        })
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Failed to update rental');
      }

      const result = await response.json();
      
      if (result.success || result.data) {
        toast.success('Rental updated successfully');
        setEditModalOpen(false);
        resetForm();
        await refreshData();
      } else {
        throw new Error(result.error || result.message || 'Failed to update rental');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Error updating rental', error);
      toast.error(`Failed to update rental: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRental = async (rentalId: string) => {
    if (!confirm('Are you sure you want to delete this rental?')) return;

    try {
      if (!getApiToken()) {
        throw new Error('Authentication required');
      }

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.rentalsDelete}/${rentalId}`,
        createAuthFetchOptions({
          method: 'DELETE'
        })
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete rental');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success('Rental deleted successfully');
        await refreshData();
      } else {
        throw new Error(result.error || 'Failed to delete rental');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Error deleting rental', error);
      toast.error(`Failed to delete rental: ${error.message}`);
    }
  };

  const handleUploadImages = async () => {
    if (!selectedRental?._id || imageFiles.length === 0) return;

    try {
      setSubmitting(true);

      if (!getApiToken()) {
        throw new Error('Authentication required');
      }

      // Upload images one by one
      const uploadPromises = imageFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(
          `${API_BASE_URL}${API_ENDPOINTS.rentalsImages}/${selectedRental._id}/images`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${getApiToken()}`
            },
            body: formData
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to upload image');
        }

        return response.json();
      });

      await Promise.all(uploadPromises);
      
      toast.success('Images uploaded successfully');
      setImagesModalOpen(false);
      setImageFiles([]);
      await refreshData();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Error uploading images', error);
      toast.error(`Failed to upload images: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteImage = async (rentalId: string, imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      if (!getApiToken()) {
        throw new Error('Authentication required');
      }

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.rentalsImageDelete}/${rentalId}/images/${imageId}`,
        createAuthFetchOptions({
          method: 'DELETE'
        })
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete image');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success('Image deleted successfully');
        await refreshData();
      } else {
        throw new Error(result.error || 'Failed to delete image');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Error deleting image', error);
      toast.error(`Failed to delete image: ${error.message}`);
    }
  };

  const resetForm = () => {
    setRentalFormData({
      name: "",
      title: "",
      description: "",
      category: "",
      subcategory: "",
      type: "",
      hourlyPrice: 0,
      dailyPrice: 0,
      weeklyPrice: 0,
      monthlyPrice: 0,
      currency: "USD",
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
      lat: "",
      lng: "",
      pickupRequired: true,
      deliveryAvailable: false,
      deliveryFee: 0,
      brand: "",
      model: "",
      year: "",
      condition: "good",
      features: [],
      length: "",
      width: "",
      height: "",
      dimensionUnit: "inches",
      weight: "",
      weightUnit: "lbs",
      minAge: "",
      licenseRequired: false,
      licenseType: "",
      deposit: 0,
      insuranceRequired: false,
      isAvailable: true,
      isActive: true,
      isFeatured: false,
      owner: "",
      provider: "",
      tags: ""
    });
    setSelectedRental(null);
  };

  const openEditModal = (rental: Rental) => {
    setSelectedRental(rental);
    const pricing = rental.pricing || rental.price;
    const location = rental.location;
    const address = location?.address;
    const specs = rental.specifications || {};
    const reqs = rental.requirements || {};
    
    setRentalFormData({
      name: rental.name || rental.title,
      title: rental.title,
      description: rental.description,
      category: rental.category || "",
      subcategory: rental.subcategory || "",
      type: rental.type || "",
      hourlyPrice: (rental.pricing && 'hourly' in rental.pricing && typeof rental.pricing.hourly === 'number') ? rental.pricing.hourly : 0,
      dailyPrice: pricing?.daily || 0,
      weeklyPrice: pricing?.weekly || 0,
      monthlyPrice: pricing?.monthly || 0,
      currency: pricing?.currency || "USD",
      street: address?.street || "",
      city: address?.city || "",
      state: address?.state || "",
      zipCode: address?.zipCode || "",
      country: address?.country || "",
      lat: location?.coordinates?.lat?.toString() || "",
      lng: location?.coordinates?.lng?.toString() || "",
      pickupRequired: location?.pickupRequired ?? true,
      deliveryAvailable: location?.deliveryAvailable ?? false,
      deliveryFee: location?.deliveryFee || 0,
      brand: specs.brand || "",
      model: specs.model || "",
      year: specs.year?.toString() || "",
      condition: specs.condition || "good",
      features: specs.features || [],
      length: specs.dimensions?.length?.toString() || "",
      width: specs.dimensions?.width?.toString() || "",
      height: specs.dimensions?.height?.toString() || "",
      dimensionUnit: specs.dimensions?.unit || "inches",
      weight: specs.weight?.value?.toString() || "",
      weightUnit: specs.weight?.unit || "lbs",
      minAge: reqs.minAge?.toString() || "",
      licenseRequired: reqs.licenseRequired || false,
      licenseType: reqs.licenseType || "",
      deposit: reqs.deposit || 0,
      insuranceRequired: reqs.insuranceRequired || false,
      isAvailable: rental.availability?.isAvailable ?? true,
      isActive: rental.isActive ?? true,
      isFeatured: rental.isFeatured ?? false,
      owner: typeof rental.owner === 'string' ? rental.owner : rental.owner?._id || "",
      provider: typeof rental.provider === 'string' ? rental.provider : rental.provider?._id || "",
      tags: Array.isArray(rental.tags) ? rental.tags.join(', ') : rental.tags || ""
    });
    setEditModalOpen(true);
  };

  if (loading && !refreshing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="xl" text="Loading rentals..." />
      </div>
    );
  }

  if (error && !rentals.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Common categories and types - these should match your API
  const categories = ['tools', 'vehicles', 'equipment', 'machinery'];
  const types = ['hourly', 'daily', 'weekly', 'monthly'];

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rentals Management</h1>
          <p className="text-gray-600 text-sm">Manage rental items and bookings</p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center space-x-2">
          {lastUpdated && (
            <p className="text-xs text-gray-500">
              Updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => {
              resetForm();
              setCreateModalOpen(true);
            }}
            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Rental
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded shadow p-3 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Total Rentals</p>
                <p className="text-lg font-bold text-gray-900">{stats.totalRentals || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0 ml-4">
                <Home className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded shadow p-3 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Active Rentals</p>
                <p className="text-lg font-bold text-gray-900">{stats.activeRentals || 0}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg flex-shrink-0 ml-4">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded shadow p-3 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Total Bookings</p>
                <p className="text-lg font-bold text-gray-900">{stats.totalBookings || 0}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg flex-shrink-0 ml-4">
                <Package className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded shadow p-3 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Total Revenue</p>
                <p className="text-lg font-bold text-gray-900">
                  ${stats.totalRevenue ? stats.totalRevenue.toLocaleString() : '0'}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg flex-shrink-0 ml-4">
                <DollarSign className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded shadow">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Filters & Search</h3>
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                <input
                  type="text"
                  placeholder="Search rentals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                {types.map(type => (
                  <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Rentals Table */}
      <div className="bg-white rounded shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Rentals</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rental</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rentals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-2 text-center text-xs text-gray-500">
                    No rentals found
                  </td>
                </tr>
              ) : (
                rentals.map((rental) => (
                  <tr key={rental._id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        {rental.images && rental.images.length > 0 && rental.images[0]?.url ? (
                          <Image
                            src={rental.images[0].url}
                            alt={rental.title}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded object-cover mr-2"
                            unoptimized
                          />
                        ) : (
                          <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center mr-2">
                            <Home className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="text-xs font-semibold text-gray-900">{rental.title}</div>
                          <div className="text-xs text-gray-600 truncate max-w-xs">{rental.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {rental.category || 'N/A'}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {rental.type || 'N/A'}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      {(() => {
                        const pricing = rental.pricing || rental.price;
                        if (!pricing) return 'N/A';
                        const prices: string[] = [];
                        if ('hourly' in pricing && pricing.hourly) prices.push(`Hourly: $${pricing.hourly}`);
                        if (pricing.daily) prices.push(`Daily: $${pricing.daily}`);
                        if (pricing.weekly) prices.push(`Weekly: $${pricing.weekly}`);
                        if (pricing.monthly) prices.push(`Monthly: $${pricing.monthly}`);
                        return prices.length > 0 ? prices.map((p, i) => <div key={i} className="text-xs">{p}</div>) : 'N/A';
                      })()}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">
                      {(() => {
                        const location = rental.location;
                        const address = location?.address;
                        if (address?.city && address?.state) {
                          return `${address.city}, ${address.state}`;
                        }
                        if (address?.street) return address.street;
                        return 'N/A';
                      })()}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                        rental.isActive && rental.availability?.isAvailable
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {rental.isActive && rental.availability?.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedRental(rental);
                            setViewModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="View rental details"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => openEditModal(rental)}
                          className="text-green-600 hover:text-green-900"
                          title="Edit rental"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRental(rental);
                            setImagesModalOpen(true);
                          }}
                          className="text-purple-600 hover:text-purple-900"
                          title="Manage Images"
                        >
                          <ImageIcon className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => rental._id && handleDeleteRental(rental._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Rental Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          resetForm();
        }}
        title="Create New Rental"
        size="lg"
      >
        <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
          {/* Basic Information */}
          <div className="space-y-4 border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={rentalFormData.title}
              onChange={(e) => setRentalFormData({ ...rentalFormData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              value={rentalFormData.description}
              onChange={(e) => setRentalFormData({ ...rentalFormData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                value={rentalFormData.category}
                onChange={(e) => setRentalFormData({ ...rentalFormData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select
                value={rentalFormData.type}
                onChange={(e) => setRentalFormData({ ...rentalFormData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Type</option>
                {types.map(type => (
                  <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Provider ID</label>
            <input
              type="text"
              value={rentalFormData.provider}
              onChange={(e) => setRentalFormData({ ...rentalFormData, provider: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="User ID of provider"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Daily Price</label>
              <input
                type="number"
                value={rentalFormData.dailyPrice}
                onChange={(e) => setRentalFormData({ ...rentalFormData, dailyPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weekly Price</label>
              <input
                type="number"
                value={rentalFormData.weeklyPrice}
                onChange={(e) => setRentalFormData({ ...rentalFormData, weeklyPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Price</label>
              <input
                type="number"
                value={rentalFormData.monthlyPrice}
                onChange={(e) => setRentalFormData({ ...rentalFormData, monthlyPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <input
              type="text"
              value={rentalFormData.currency}
              onChange={(e) => setRentalFormData({ ...rentalFormData, currency: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="USD"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={rentalFormData.street}
                onChange={(e) => setRentalFormData({ ...rentalFormData, street: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Street address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={rentalFormData.city}
                onChange={(e) => setRentalFormData({ ...rentalFormData, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="City"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                value={rentalFormData.state}
                onChange={(e) => setRentalFormData({ ...rentalFormData, state: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="State"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
              <input
                type="text"
                value={rentalFormData.zipCode}
                onChange={(e) => setRentalFormData({ ...rentalFormData, zipCode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Zip Code"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={rentalFormData.isAvailable}
                onChange={(e) => setRentalFormData({ ...rentalFormData, isAvailable: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">Available</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={rentalFormData.isActive}
                onChange={(e) => setRentalFormData({ ...rentalFormData, isActive: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">Active</label>
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-2 pt-4">
            <button
              onClick={() => {
                setCreateModalOpen(false);
                resetForm();
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateRental}
              disabled={submitting || !rentalFormData.title || !rentalFormData.description || !rentalFormData.category || !rentalFormData.type}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Rental'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Rental Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          resetForm();
        }}
        title="Edit Rental"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={rentalFormData.title}
              onChange={(e) => setRentalFormData({ ...rentalFormData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              value={rentalFormData.description}
              onChange={(e) => setRentalFormData({ ...rentalFormData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                value={rentalFormData.category}
                onChange={(e) => setRentalFormData({ ...rentalFormData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select
                value={rentalFormData.type}
                onChange={(e) => setRentalFormData({ ...rentalFormData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Type</option>
                {types.map(type => (
                  <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Provider ID</label>
            <input
              type="text"
              value={rentalFormData.provider}
              onChange={(e) => setRentalFormData({ ...rentalFormData, provider: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="User ID of provider"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Daily Price</label>
              <input
                type="number"
                value={rentalFormData.dailyPrice}
                onChange={(e) => setRentalFormData({ ...rentalFormData, dailyPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weekly Price</label>
              <input
                type="number"
                value={rentalFormData.weeklyPrice}
                onChange={(e) => setRentalFormData({ ...rentalFormData, weeklyPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Price</label>
              <input
                type="number"
                value={rentalFormData.monthlyPrice}
                onChange={(e) => setRentalFormData({ ...rentalFormData, monthlyPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <input
              type="text"
              value={rentalFormData.currency}
              onChange={(e) => setRentalFormData({ ...rentalFormData, currency: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="USD"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={rentalFormData.street}
                onChange={(e) => setRentalFormData({ ...rentalFormData, street: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Street address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={rentalFormData.city}
                onChange={(e) => setRentalFormData({ ...rentalFormData, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="City"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                value={rentalFormData.state}
                onChange={(e) => setRentalFormData({ ...rentalFormData, state: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="State"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
              <input
                type="text"
                value={rentalFormData.zipCode}
                onChange={(e) => setRentalFormData({ ...rentalFormData, zipCode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Zip Code"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={rentalFormData.isAvailable}
                onChange={(e) => setRentalFormData({ ...rentalFormData, isAvailable: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">Available</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={rentalFormData.isActive}
                onChange={(e) => setRentalFormData({ ...rentalFormData, isActive: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">Active</label>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <button
              onClick={() => {
                setEditModalOpen(false);
                resetForm();
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateRental}
              disabled={submitting || !rentalFormData.title || !rentalFormData.description || !rentalFormData.category || !rentalFormData.type}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Update Rental'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Upload Images Modal */}
      <Modal
        isOpen={imagesModalOpen}
        onClose={() => {
          setImagesModalOpen(false);
          setImageFiles([]);
        }}
        title={`Manage Images - ${selectedRental?.title || ''}`}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload New Images</label>
            <FileUpload
              accept="image/*"
              multiple
              files={imageFiles}
              onFilesSelected={(files) => setImageFiles(files)}
              onRemove={(index) => setImageFiles(imageFiles.filter((_, i) => i !== index))}
              maxSize={10}
            />
            {imageFiles.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {imageFiles.map((file, idx) => (
                  <div key={idx} className="relative">
                    <Image 
                      src={URL.createObjectURL(file)} 
                      alt={`Preview ${idx + 1}`}
                      width={200}
                      height={80}
                      className="w-full h-20 object-cover rounded"
                      unoptimized
                    />
                    <button
                      onClick={() => setImageFiles(imageFiles.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Existing Images */}
          {selectedRental?.images && selectedRental.images.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Existing Images</label>
              <div className="grid grid-cols-3 gap-2">
                {selectedRental.images.map((image, idx) => (
                  (image.url || image.thumbnail) && (
                    <div key={idx} className="relative">
                      <Image 
                        src={image.url || image.thumbnail || ''} 
                        alt={`Image ${idx + 1}`}
                        width={200}
                        height={80}
                        className="w-full h-20 object-cover rounded"
                        unoptimized
                      />
                    <button
                      onClick={() => selectedRental._id && image._id && handleDeleteImage(selectedRental._id, image._id)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  )
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <button
              onClick={() => {
                setImagesModalOpen(false);
                setImageFiles([]);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUploadImages}
              disabled={submitting || imageFiles.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Uploading...' : 'Upload Images'}
            </button>
          </div>
        </div>
      </Modal>

      {/* View Rental Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedRental(null);
        }}
        title={selectedRental?.title || 'Rental Details'}
        size="lg"
      >
        {selectedRental && (
          <div className="space-y-4">
            {selectedRental.images && selectedRental.images.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {selectedRental.images.slice(0, 4).map((image, idx) => 
                  (image.url || image.thumbnail) ? (
                    <Image
                      key={idx}
                      src={image.url || image.thumbnail || ''}
                      alt={`${selectedRental.title} ${idx + 1}`}
                      width={300}
                      height={128}
                      className="w-full h-32 object-cover rounded"
                      unoptimized
                    />
                  ) : null
                )}
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-gray-500">Description</h3>
              <p className="mt-1 text-sm text-gray-900">{selectedRental.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Category</h3>
                <p className="mt-1 text-sm text-gray-900">{selectedRental.category || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Type</h3>
                <p className="mt-1 text-sm text-gray-900">{selectedRental.type || 'N/A'}</p>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Pricing</h3>
              <div className="mt-1 text-sm text-gray-900">
                {selectedRental.price ? (
                  <>
                    {selectedRental.price.daily && <div>Daily: ${selectedRental.price.daily}</div>}
                    {selectedRental.price.weekly && <div>Weekly: ${selectedRental.price.weekly}</div>}
                    {selectedRental.price.monthly && <div>Monthly: ${selectedRental.price.monthly}</div>}
                    {selectedRental.price.currency && <div className="text-xs text-gray-500">Currency: {selectedRental.price.currency}</div>}
                  </>
                ) : (
                  'N/A'
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Location</h3>
              <div className="mt-1 text-sm text-gray-900">
                {selectedRental.location ? (
                  <>
                    {(() => {
                      const address = selectedRental.location?.address;
                      if (address?.street) {
                        return <div>{address.street}</div>;
                      }
                      if (address?.city && address?.state) {
                        return <div>{address.city}, {address.state}</div>;
                      }
                      return 'N/A';
                    })()}
                    {selectedRental.location.address?.city && selectedRental.location.address?.state && (
                      <div>{selectedRental.location.address.city}, {selectedRental.location.address.state}</div>
                    )}
                    {selectedRental.location.address?.zipCode && <div>{selectedRental.location.address.zipCode}</div>}
                    {selectedRental.location.address?.country && (
                      <div>{selectedRental.location.address.country}</div>
                    )}
                  </>
                ) : (
                  'N/A'
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <p className="mt-1 text-sm text-gray-900">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  selectedRental.isActive && selectedRental.availability?.isAvailable
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {selectedRental.isActive && selectedRental.availability?.isAvailable ? 'Available' : 'Unavailable'}
                </span>
              </p>
            </div>
            {selectedRental.rating && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Rating</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedRental.rating.average ? selectedRental.rating.average.toFixed(1) : '0.0'} 
                  {selectedRental.rating.count && ` (${selectedRental.rating.count} reviews)`}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

