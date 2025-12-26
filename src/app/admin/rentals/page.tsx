"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  Coins,
  Filter
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
  RentalCategory,
  Booking,
  Pricing,
  Payment
} from "@/types/rentals";
import { useAppSettings } from "@/hooks/useAppSettings";
import { formatCurrency } from "@/lib/currency-utils";
import { getDefaultCurrency } from "@/lib/settings-utils";

// Extended Rental interface for admin page (includes owner/provider populated)
interface Rental extends Omit<RentalItem, 'owner' | 'name' | 'createdAt' | 'updatedAt'> {
  name?: string;
  type?: string;
  price?: {
    hourly?: number;
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
  // App settings for currency formatting and other settings
  const { settings: appSettings } = useAppSettings();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<"items" | "transactions">("items");
  
  // Rental Items state
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [stats, setStats] = useState<RentalStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage] = useState(1);
  const itemsPerPage = 20;
  
  // Rental Transactions state
  const [transactions, setTransactions] = useState<Array<Booking & { item?: { _id?: string; title?: string; category?: string; images?: RentalImage[] }; rentalItem?: Rental }>>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);
  const [transactionStatusFilter, setTransactionStatusFilter] = useState<string>("all");

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
    currency: getDefaultCurrency(appSettings),
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

  // Owner autosuggest state
  const [ownerSearchTerm, setOwnerSearchTerm] = useState("");
  const [ownerSuggestions, setOwnerSuggestions] = useState<Array<{ _id: string; firstName: string; lastName: string; email: string }>>([]);
  const [showOwnerSuggestions, setShowOwnerSuggestions] = useState(false);
  const [loadingOwners, setLoadingOwners] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<{ _id: string; firstName: string; lastName: string; email: string } | null>(null);
  const ownerAutosuggestRef = useRef<HTMLDivElement>(null);

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

  // Fetch rental transactions/bookings
  const fetchTransactions = useCallback(async () => {
    try {
      setTransactionsLoading(true);
      setTransactionsError(null);

      if (!getApiToken()) {
        logger.warn('No API token found, cannot fetch transactions');
        setTransactionsError('Authentication required. Please log in again.');
        setTransactionsLoading(false);
        return;
      }

      // For admin, we need to aggregate bookings from all rental items
      // Since there's no dedicated admin endpoint for all bookings,
      // we'll fetch all rental items and extract their bookings
      const rentalsUrl = `${API_BASE_URL}${API_ENDPOINTS.rentals}?limit=1000`;
      
      logger.debug('Fetching rental transactions', { url: rentalsUrl });
      
      const response = await fetch(rentalsUrl, createAuthFetchOptions({ method: 'GET' }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}: Failed to fetch transactions`;
        logger.error('Error fetching rental transactions', new Error(errorMessage), {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      // Extract bookings from all rental items
      const allBookings: Array<Booking & { item?: { _id?: string; title?: string; category?: string; images?: RentalImage[] }; rentalItem?: Rental }> = [];
      let rentalsData: Rental[] = [];
      
      if (result.success && result.data) {
        if (Array.isArray(result.data)) {
          rentalsData = result.data;
        } else if (result.data.rentals && Array.isArray(result.data.rentals)) {
          rentalsData = result.data.rentals;
        }
      } else if (Array.isArray(result)) {
        rentalsData = result;
      }

      // Extract bookings from each rental item
      rentalsData.forEach((rental: Rental) => {
        if (rental.bookings && Array.isArray(rental.bookings)) {
          rental.bookings.forEach((booking: Booking) => {
            // Add rental item info to each booking
            allBookings.push({
              ...booking,
              item: {
                _id: rental._id,
                title: rental.title || rental.name,
                category: rental.category,
                images: rental.images
              },
              rentalItem: rental
            });
          });
        }
      });

      // Apply status filter if needed
      let filteredBookings = allBookings;
      if (transactionStatusFilter !== 'all') {
        filteredBookings = allBookings.filter((booking) => {
          const bookingStatus = (booking.status || '').toLowerCase();
          return bookingStatus === transactionStatusFilter.toLowerCase();
        });
      }

      setTransactions(filteredBookings);
      setLastUpdated(new Date());
      
      logger.debug('Rental transactions loaded', { 
        totalBookings: allBookings.length,
        filteredBookings: filteredBookings.length,
        statusFilter: transactionStatusFilter
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Error fetching rental transactions', error);
      setTransactionsError(error.message);
      
      // Provide user-friendly error message
      if (error.message.includes('400')) {
        toast.error('Unable to fetch transactions. The backend may not support admin access to all bookings yet.');
      } else {
        toast.error(`Failed to load transactions: ${error.message}`);
      }
    } finally {
      setTransactionsLoading(false);
    }
  }, [transactionStatusFilter]);

  useEffect(() => {
    if (activeTab === 'transactions') {
      fetchTransactions();
    }
  }, [activeTab, fetchTransactions]);

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    if (activeTab === 'items') {
      await fetchData();
    } else {
      await fetchTransactions();
    }
    setRefreshing(false);
  }, [fetchData, fetchTransactions, activeTab]);

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
        type: rentalFormData.type || undefined,
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
      // Use provider field value as owner (since UI shows "Owner" but uses provider field)
      if (rentalFormData.provider) {
        rentalData.owner = rentalFormData.provider;
      } else if (rentalFormData.owner) {
        rentalData.owner = rentalFormData.owner;
      }

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
        type: rentalFormData.type || undefined,
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
      // Use provider field value as owner (since UI shows "Owner" but uses provider field)
      if (rentalFormData.provider) {
        rentalData.owner = rentalFormData.provider;
      } else if (rentalFormData.owner) {
        rentalData.owner = rentalFormData.owner;
      }

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

  // Fetch rental details by ID
  const handleViewRental = async (rentalId: string) => {
    if (!rentalId || !getApiToken()) {
      const errorMessage = 'Failed to fetch rental details';
      logger.error(errorMessage);
      toast.error(errorMessage);
      return;
    }

    try {
      setSubmitting(true);
      const url = `${API_BASE_URL}${API_ENDPOINTS.rentalsById}/${rentalId}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));

      if (!response.ok) {
        const errorMessage = 'Failed to fetch rental details';
        logger.error(errorMessage);
        toast.error(errorMessage);
        return;
      }

      let result;
      try {
        result = await response.json();
      } catch {
        const errorMessage = 'Failed to parse rental details response';
        logger.error(errorMessage);
        toast.error(errorMessage);
        return;
      }

      // Extract rental data from response
      let rentalData: (RentalItem & { id?: string; owner?: string | { _id?: string; id?: string; firstName?: string; lastName?: string; email?: string } }) | null = null;
      try {
        if (result.success && result.data) {
          rentalData = result.data as RentalItem & { id?: string; owner?: string | { _id?: string; id?: string; firstName?: string; lastName?: string; email?: string } };
        } else if (result.data) {
          rentalData = result.data as RentalItem & { id?: string; owner?: string | { _id?: string; id?: string; firstName?: string; lastName?: string; email?: string } };
        } else {
          rentalData = result as RentalItem & { id?: string; owner?: string | { _id?: string; id?: string; firstName?: string; lastName?: string; email?: string } };
        }
      } catch {
        const errorMessage = 'Failed to extract rental data from response';
        logger.error(errorMessage);
        toast.error(errorMessage);
        return;
      }

      if (!rentalData || typeof rentalData !== 'object') {
        const errorMessage = 'Invalid rental data received';
        logger.error(errorMessage);
        toast.error(errorMessage);
        return;
      }

      // Transform the API response to match the Rental interface
      // Map id to _id if needed
      if (rentalData.id && !rentalData._id) {
        rentalData._id = rentalData.id;
      }

      // Ensure title is set (use name if title is missing)
      if (!rentalData.title && rentalData.name) {
        rentalData.title = rentalData.name;
      }

      // Transform owner data if it exists
      if (rentalData.owner && typeof rentalData.owner === 'object') {
        // Owner is already an object, ensure it has the right structure
        const ownerObj = rentalData.owner as { _id?: string; id?: string; firstName?: string; lastName?: string; email?: string };
        if (!ownerObj._id && ownerObj.id) {
          ownerObj._id = ownerObj.id;
        }
      }

      setSelectedRental(rentalData as Rental);
      setViewModalOpen(true);
    } catch {
      // Completely avoid accessing err object to prevent ObjectId serialization issues
      const errorMessage = 'Failed to fetch rental details';
      logger.error(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Fetch owners for autosuggest
  const fetchOwners = useCallback(async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setOwnerSuggestions([]);
      setShowOwnerSuggestions(false);
      return;
    }

    try {
      setLoadingOwners(true);
      setShowOwnerSuggestions(true); // Show dropdown while loading
      if (!getApiToken()) {
        setLoadingOwners(false);
        return;
      }

      const queryParams = new URLSearchParams();
      queryParams.append('search', searchTerm);
      queryParams.append('limit', '10');

      const url = `${API_BASE_URL}${API_ENDPOINTS.users}?${queryParams.toString()}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));

      if (response.ok) {
        const result = await response.json();
        // Handle different response structures
        let users = [];
        if (result.data) {
          if (Array.isArray(result.data)) {
            users = result.data;
          } else if (result.data.users && Array.isArray(result.data.users)) {
            users = result.data.users;
          }
        } else if (result.users && Array.isArray(result.users)) {
          users = result.users;
        } else if (Array.isArray(result)) {
          users = result;
        }
        
        // Transform users to owner suggestions format
        interface UserSuggestion {
          _id?: string;
          id?: string;
          firstName?: string;
          lastName?: string;
          email?: string;
        }
        const suggestions = (users as UserSuggestion[])
          .filter((user) => (user._id || user.id) && (user.firstName || user.lastName || user.email))
          .map((user) => ({
            _id: user._id || user.id || '',
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || ''
          }))
          .filter((suggestion) => suggestion._id !== '');
        
        setOwnerSuggestions(suggestions);
        setShowOwnerSuggestions(suggestions.length > 0 || searchTerm.length >= 2);
      } else {
        setOwnerSuggestions([]);
        setShowOwnerSuggestions(false);
      }
    } catch {
      // Silently fail - don't show error for autosuggest
      setOwnerSuggestions([]);
      setShowOwnerSuggestions(false);
    } finally {
      setLoadingOwners(false);
    }
  }, []);

  // Debounced owner search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (ownerSearchTerm && ownerSearchTerm.length >= 2) {
        fetchOwners(ownerSearchTerm);
      } else {
        setOwnerSuggestions([]);
        setShowOwnerSuggestions(false);
        setLoadingOwners(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [ownerSearchTerm, fetchOwners]);

  // Handle owner selection
  const handleOwnerSelect = (owner: { _id: string; firstName: string; lastName: string; email: string }) => {
    setSelectedOwner(owner);
    setRentalFormData({ ...rentalFormData, provider: owner._id, owner: owner._id });
    setOwnerSearchTerm(`${owner.firstName} ${owner.lastName}`.trim() || owner.email);
    setShowOwnerSuggestions(false);
  };

  // Clear owner selection
  const handleOwnerClear = () => {
    setSelectedOwner(null);
    setRentalFormData({ ...rentalFormData, provider: '', owner: '' });
    setOwnerSearchTerm('');
    setShowOwnerSuggestions(false);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ownerAutosuggestRef.current && !ownerAutosuggestRef.current.contains(event.target as Node)) {
        setShowOwnerSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch owner details by ID
  const fetchOwnerById = useCallback(async (ownerId: string) => {
    if (!ownerId || !getApiToken()) return;

    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.usersById}/${ownerId}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));

      if (response.ok) {
        const result = await response.json();
        const user = result.data || result;
        
        if (user._id || user.id) {
          const owner = {
            _id: user._id || user.id,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || ''
          };
          setSelectedOwner(owner);
          setOwnerSearchTerm(`${owner.firstName} ${owner.lastName}`.trim() || owner.email);
        }
      }
    } catch {
      // Silently fail - owner might not exist
    }
  }, []);

  const handleUploadImages = async () => {
    if (!selectedRental?._id || imageFiles.length === 0) return;

    try {
      setSubmitting(true);
      const token = getApiToken();
      if (!token) {
        const error = new Error('No authentication token found');
        logger.error('Error uploading images', error, { rentalId: selectedRental._id });
        toast.error('Authentication required. Please log in again.');
        return;
      }

      // Validate files before creating FormData
      const validFiles = imageFiles.filter(file => file instanceof File && file.size > 0);
      if (validFiles.length === 0) {
        toast.error('No valid files selected. Please select image files.');
        setSubmitting(false);
        return;
      }

      const formData = new FormData();
      // Append files - use 'images' as the field name (same as marketplace and supplies endpoints)
      validFiles.forEach((file, index) => {
        formData.append('images', file, file.name || `image-${index}.jpg`);
      });

      // Endpoint: POST /api/rentals/:id/images
      const url = `${API_BASE_URL}${API_ENDPOINTS.rentalsImages}/${selectedRental._id}/images`;
      const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`
      };
      // Don't set Content-Type for FormData - browser will set it with boundary
      
      logger.debug('Uploading images', { 
        url, 
        rentalId: selectedRental._id, 
        fileCount: validFiles.length,
        fileNames: validFiles.map(f => f.name),
        fileSizes: validFiles.map(f => f.size),
        fileTypes: validFiles.map(f => f.type),
        note: 'Using field name: images'
      });

      let response: Response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers,
          body: formData
        });
      } catch (networkError) {
        // Handle network errors (fetch failed)
        const error = networkError instanceof Error ? networkError : new Error(String(networkError));
        logger.error('Network error uploading images', error, {
          url,
          rentalId: selectedRental._id,
          fileCount: validFiles.length
        });
        toast.error('Network error: Failed to connect to server. Please check your connection and try again.');
        return;
      }

      if (!response.ok) {
        // Try to extract error message from response
        let errorMessage = 'Failed to upload images';
        let errorData: { error?: string; message?: string } = {};
        
        try {
          const responseText = await response.text();
          if (responseText) {
            try {
              errorData = JSON.parse(responseText);
              errorMessage = errorData.error || errorData.message || errorMessage;
            } catch {
              // If not JSON, use the text as error message
              errorMessage = responseText || errorMessage;
            }
          }
        } catch (parseError) {
          logger.warn('Failed to parse error response', { parseError });
        }

        const error = new Error(errorMessage);
        logger.error('Error uploading images', error, {
          url,
          rentalId: selectedRental._id,
          status: response.status,
          statusText: response.statusText,
          errorData,
          fileCount: validFiles.length,
          fieldName: 'images'
        });

        // Provide user-friendly error messages based on status code
        if (response.status === 400) {
          // 400 Bad Request - often means "No files uploaded" or wrong field name
          const backendMessage = errorData.message || errorMessage;
          if (backendMessage.toLowerCase().includes('no files') || backendMessage.toLowerCase().includes('file')) {
            toast.error(backendMessage || 'No files were received by the server. The backend may expect a different field name.');
            logger.warn('400 Bad Request - files not received', {
              rentalId: selectedRental._id,
              backendMessage,
              fieldName: 'images',
              fileCount: validFiles.length,
              note: 'Backend may expect different field name (e.g., "image" instead of "images")'
            });
          } else {
            toast.error(backendMessage || 'Invalid request. Please check your file selection and try again.');
          }
        } else if (response.status === 401) {
          toast.error('Authentication failed. Please log in again.');
        } else if (response.status === 403) {
          const backendMessage = errorData.message || errorMessage;
          toast.error(backendMessage || 'You do not have permission to upload images for this rental. Admin access may not be properly configured on the backend.');
          logger.warn('403 Forbidden when uploading images - possible backend authorization issue', {
            rentalId: selectedRental._id,
            backendMessage,
            note: 'Admin users should have permission to upload images for any rental according to API documentation'
          });
        } else if (response.status === 404) {
          toast.error('Rental not found. Please refresh and try again.');
        } else if (response.status === 413) {
          toast.error('Image files are too large. Please select smaller images.');
        } else if (response.status === 415) {
          toast.error('Invalid file type. Please select image files only.');
        } else if (response.status >= 500) {
          toast.error('Server error. Please try again later.');
        } else {
          toast.error(errorMessage || 'Failed to upload images');
        }
        return;
      }

      // Success
      const result = await response.json().catch(() => ({}));
      logger.debug('Images uploaded successfully', { 
        rentalId: selectedRental._id, 
        fileCount: validFiles.length,
        result
      });

      toast.success(`Successfully uploaded ${validFiles.length} image(s)`);
      setImagesModalOpen(false);
      setImageFiles([]);
      await refreshData();
    } catch (err) {
      // Catch any unexpected errors
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Unexpected error uploading images', error, {
        rentalId: selectedRental?._id,
        fileCount: imageFiles?.length || 0
      });
      toast.error(error.message || 'An unexpected error occurred. Please try again.');
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
    // Reset owner autosuggest state
    setSelectedOwner(null);
    setOwnerSearchTerm('');
    setOwnerSuggestions([]);
    setShowOwnerSuggestions(false);
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
      currency: getDefaultCurrency(appSettings),
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

  const openEditModal = async (rental: Rental) => {
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
      currency: pricing?.currency || getDefaultCurrency(appSettings),
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
      // Set provider field from owner (since UI shows "Owner" but uses provider field)
      provider: typeof rental.owner === 'string' ? rental.owner : rental.owner?._id || (typeof rental.provider === 'string' ? rental.provider : rental.provider?._id || ""),
      tags: Array.isArray(rental.tags) ? rental.tags.join(', ') : rental.tags || ""
    });

    // Fetch owner details if owner ID exists
    const ownerId = typeof rental.owner === 'string' ? rental.owner : rental.owner?._id || "";
    if (ownerId) {
      await fetchOwnerById(ownerId);
    } else {
      setSelectedOwner(null);
      setOwnerSearchTerm('');
    }

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
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
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
          <p className="text-gray-600 text-sm">Manage rental items and transactions</p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center space-x-2">
          {lastUpdated && (
            <p className="text-xs text-gray-500">
              Updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
          <button
            onClick={refreshData}
            disabled={refreshing || transactionsLoading}
            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 transition-all duration-200"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${(refreshing || transactionsLoading) ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {activeTab === 'items' && (
            <button
              onClick={() => {
                resetForm();
                setCreateModalOpen(true);
              }}
              className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-all duration-200"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Rental Item
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('items')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'items'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Rental Items
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'transactions'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Rental Transactions
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'items' ? (
        <>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded shadow p-3 border-l-4 border-primary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Total Rentals</p>
                <p className="text-lg font-bold text-gray-900">{stats.totalRentals || 0}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg flex-shrink-0 ml-4">
                <Home className="w-5 h-5 text-primary" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded shadow p-3 border-l-4 border-accent">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Active Rentals</p>
                <p className="text-lg font-bold text-gray-900">{stats.activeRentals || 0}</p>
              </div>
              <div className="p-3 bg-accent/10 rounded-lg flex-shrink-0 ml-4">
                <TrendingUp className="w-5 h-5 text-accent" />
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
                  {formatCurrency(stats.totalRevenue || 0, getDefaultCurrency(appSettings), { appSettings })}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg flex-shrink-0 ml-4">
                <Coins className="w-5 h-5 text-yellow-600" />
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
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
              >
                <Filter className="w-3 h-3 mr-1" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </button>
              <div className="text-xs text-gray-500">
                {rentals.length} rental{rentals.length !== 1 ? 's' : ''} found
              </div>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="p-4 border-b border-gray-200">
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
                    className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-ring"
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
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="all">All Types</option>
                  {types.map(type => (
                    <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setTypeFilter('all');
                }}
                className="text-xs text-gray-600 hover:text-gray-800"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}
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
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {rental.category || 'N/A'}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent">
                        {rental.type || 'N/A'}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      {(() => {
                        const pricing = rental.pricing || rental.price;
                        if (!pricing) return 'N/A';
                        const currency = pricing.currency || getDefaultCurrency(appSettings);
                        const prices: string[] = [];
                        const pricingAny = pricing as Pricing & { hourly?: number };
                        if (pricingAny?.hourly) prices.push(`Hourly: ${formatCurrency(pricingAny.hourly, currency, { appSettings })}`);
                        if (pricing.daily) prices.push(`Daily: ${formatCurrency(pricing.daily, currency, { appSettings })}`);
                        if (pricing.weekly) prices.push(`Weekly: ${formatCurrency(pricing.weekly, currency, { appSettings })}`);
                        if (pricing.monthly) prices.push(`Monthly: ${formatCurrency(pricing.monthly, currency, { appSettings })}`);
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
                          ? 'bg-accent/10 text-accent' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {rental.isActive && rental.availability?.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => rental._id && handleViewRental(rental._id)}
                          className="text-primary hover:text-primary"
                          title="View rental details"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => openEditModal(rental)}
                          className="text-accent hover:text-accent"
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
        </>
      ) : (
        <>
          {/* Transactions Section */}
          <div className="bg-white rounded shadow">
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">Rental Transactions</h3>
                <div className="flex items-center space-x-2">
                  <select
                    value={transactionStatusFilter}
                    onChange={(e) => setTransactionStatusFilter(e.target.value)}
                    className="text-xs border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="disputed">Disputed</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              {transactionsLoading ? (
                <div className="p-8 text-center">
                  <Loading />
                </div>
              ) : transactionsError ? (
                <div className="p-8 text-center">
                  <p className="text-red-600 mb-4">{transactionsError}</p>
                  <button
                    onClick={fetchTransactions}
                    className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
                  >
                    Retry
                  </button>
                </div>
              ) : transactions.length === 0 ? (
                <div className="p-8 text-center">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No transactions found</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Renter</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction, index) => {
                      const item = transaction.item || transaction.rentalItem || {};
                      const renter = ('renter' in transaction ? transaction.renter : null) || transaction.user || {};
                      const owner = ('owner' in transaction ? transaction.owner : null) || (typeof item === 'object' && item !== null && 'owner' in item ? item.owner : null) || {};
                      const startDate = transaction.startDate || ('start' in transaction ? transaction.start : null) || '';
                      const endDate = transaction.endDate || ('end' in transaction ? transaction.end : null) || '';
                      const totalAmountRaw = ('totalAmount' in transaction ? transaction.totalAmount : null) || ('amount' in transaction ? transaction.amount : null) || 0;
                      const totalAmount = typeof totalAmountRaw === 'number' ? totalAmountRaw : (typeof totalAmountRaw === 'string' ? parseFloat(totalAmountRaw) : 0) || 0;
                      const status = (transaction.status as string) || 'pending';
                      const payment = 'payment' in transaction ? (transaction as { payment?: Payment }).payment : null;
                      const paymentStatusRaw = (payment?.status) || ('paymentStatus' in transaction ? transaction.paymentStatus : null) || 'pending';
                      const paymentStatus = typeof paymentStatusRaw === 'string' ? paymentStatusRaw : String(paymentStatusRaw) || 'pending';
                      const transactionId = ('_id' in transaction && transaction._id ? String(transaction._id) : null) || ('id' in transaction && transaction.id ? String(transaction.id) : null) || `transaction-${index}`;
                      
                      // Extract email values with proper typing
                      const renterEmail = (typeof renter === 'object' && renter !== null && 'email' in renter && renter.email) ? String((renter as { email: unknown }).email) : null;
                      const ownerEmail = (typeof owner === 'object' && owner !== null && 'email' in owner && owner.email) ? String((owner as { email: unknown }).email) : null;
                      
                      return (
                        <tr key={transactionId} className="hover:bg-gray-50">
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{item.title || (typeof item === 'object' && item !== null && 'name' in item && item.name ? String(item.name) : null) || 'N/A'}</div>
                            <div className="text-xs text-gray-500">{item.category || ''}</div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {(typeof renter === 'object' && renter !== null && 'firstName' in renter && renter.firstName && 'lastName' in renter && renter.lastName)
                                ? `${renter.firstName} ${renter.lastName}`
                                : (typeof renter === 'object' && renter !== null && 'name' in renter && renter.name ? String((renter as { name: unknown }).name) : null) || renterEmail || 'N/A'}
                            </div>
                            {renterEmail && <div className="text-xs text-gray-500">{renterEmail}</div>}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {(typeof owner === 'object' && owner !== null && 'firstName' in owner && owner.firstName && 'lastName' in owner && owner.lastName)
                                ? `${owner.firstName} ${owner.lastName}`
                                : (typeof owner === 'object' && owner !== null && 'name' in owner && owner.name ? String((owner as { name: unknown }).name) : null) || ownerEmail || 'N/A'}
                            </div>
                            {ownerEmail && <div className="text-xs text-gray-500">{ownerEmail}</div>}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {startDate ? new Date(startDate).toLocaleDateString() : 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {endDate ? new Date(endDate).toLocaleDateString() : ''}
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(
                                totalAmount,
                                ('currency' in transaction ? (transaction as { currency?: string }).currency : null) || getDefaultCurrency(appSettings),
                                { appSettings }
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                              status === 'completed' ? 'bg-accent/10 text-accent' :
                              status === 'active' ? 'bg-primary/10 text-primary' :
                              status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              status === 'disputed' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                              paymentStatus === 'paid' || paymentStatus === 'completed' ? 'bg-accent/10 text-accent' :
                              paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                            <button
                              onClick={() => {
                                if (transaction.rentalItem?._id) {
                                  handleViewRental(transaction.rentalItem._id);
                                } else if (transaction.item?._id) {
                                  handleViewRental(transaction.item._id);
                                } else {
                                  setSelectedRental(transaction.rentalItem || null);
                                  setViewModalOpen(true);
                                }
                              }}
                              className="text-primary hover:text-primary"
                              title="View details"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              value={rentalFormData.description}
              onChange={(e) => setRentalFormData({ ...rentalFormData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                value={rentalFormData.category}
                onChange={(e) => setRentalFormData({ ...rentalFormData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
                required
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
              <input
                type="text"
                value={rentalFormData.subcategory}
                onChange={(e) => setRentalFormData({ ...rentalFormData, subcategory: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
                placeholder="e.g., pickup_truck, sedan"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
            <div ref={ownerAutosuggestRef} className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={ownerSearchTerm}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setOwnerSearchTerm(newValue);
                    if (newValue === '') {
                      handleOwnerClear();
                    } else if (selectedOwner) {
                      // If user starts typing and it doesn't match the selected owner, clear selection
                      const selectedName = `${selectedOwner.firstName} ${selectedOwner.lastName}`.trim();
                      const selectedEmail = selectedOwner.email;
                      if (newValue !== selectedName && newValue !== selectedEmail && !newValue.startsWith(selectedName) && !newValue.startsWith(selectedEmail)) {
                        setSelectedOwner(null);
                        setRentalFormData({ ...rentalFormData, provider: '', owner: '' });
                      }
                    }
                  }}
                  onFocus={() => {
                    if (ownerSearchTerm && ownerSearchTerm.length >= 2) {
                      if (ownerSuggestions.length > 0) {
                        setShowOwnerSuggestions(true);
                      } else if (!loadingOwners) {
                        // Trigger search if we have a search term but no suggestions yet
                        fetchOwners(ownerSearchTerm);
                      }
                    }
                  }}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
                  placeholder="Search for owner by name or email..."
                />
                {selectedOwner && (
                  <button
                    type="button"
                    onClick={handleOwnerClear}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {/* Suggestions Dropdown */}
              {showOwnerSuggestions && ownerSearchTerm.length >= 2 && (
                <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {loadingOwners ? (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                      Searching...
                    </div>
                  ) : ownerSuggestions.length > 0 ? (
                    ownerSuggestions.map((owner) => (
                      <div
                        key={owner._id}
                        onClick={() => handleOwnerSelect(owner)}
                        className="px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-primary/5 transition-colors"
                      >
                        <div className="font-medium text-gray-900">
                          {owner.firstName} {owner.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{owner.email}</div>
                        <div className="text-xs text-gray-400 mt-1">ID: {owner._id}</div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                      No owners found
                    </div>
                  )}
                </div>
              )}
              
              {selectedOwner && (
                <div className="mt-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="text-sm font-medium text-primary">
                    Selected: {selectedOwner.firstName} {selectedOwner.lastName}
                  </div>
                  <div className="text-xs text-primary">{selectedOwner.email}</div>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Price</label>
              <input
                type="number"
                value={rentalFormData.hourlyPrice}
                onChange={(e) => setRentalFormData({ ...rentalFormData, hourlyPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Daily Price</label>
              <input
                type="number"
                value={rentalFormData.dailyPrice}
                onChange={(e) => setRentalFormData({ ...rentalFormData, dailyPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <select
              value={rentalFormData.currency}
              onChange={(e) => setRentalFormData({ ...rentalFormData, currency: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="PHP">PHP</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={rentalFormData.street}
                onChange={(e) => setRentalFormData({ ...rentalFormData, street: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
                placeholder="Street address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={rentalFormData.city}
                onChange={(e) => setRentalFormData({ ...rentalFormData, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
                placeholder="State"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
              <input
                type="text"
                value={rentalFormData.zipCode}
                onChange={(e) => setRentalFormData({ ...rentalFormData, zipCode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
                placeholder="Zip Code"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <input
              type="text"
              value={rentalFormData.country}
              onChange={(e) => setRentalFormData({ ...rentalFormData, country: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
              placeholder="Country"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
              <input
                type="text"
                value={rentalFormData.lat}
                onChange={(e) => setRentalFormData({ ...rentalFormData, lat: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
                placeholder="e.g., 34.0522"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
              <input
                type="text"
                value={rentalFormData.lng}
                onChange={(e) => setRentalFormData({ ...rentalFormData, lng: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
                placeholder="e.g., -118.2437"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={rentalFormData.pickupRequired}
                onChange={(e) => setRentalFormData({ ...rentalFormData, pickupRequired: e.target.checked })}
                className="h-4 w-4 text-primary focus:ring-ring border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">Pickup Required</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={rentalFormData.deliveryAvailable}
                onChange={(e) => setRentalFormData({ ...rentalFormData, deliveryAvailable: e.target.checked })}
                className="h-4 w-4 text-primary focus:ring-ring border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">Delivery Available</label>
            </div>
          </div>
          {rentalFormData.deliveryAvailable && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Fee</label>
              <input
                type="number"
                value={rentalFormData.deliveryFee}
                onChange={(e) => setRentalFormData({ ...rentalFormData, deliveryFee: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
                min="0"
                step="0.01"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <input
              type="text"
              value={typeof rentalFormData.tags === 'string' ? rentalFormData.tags : rentalFormData.tags.join(', ')}
              onChange={(e) => setRentalFormData({ ...rentalFormData, tags: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
              placeholder="Comma-separated tags (e.g., pickup, truck, moving)"
            />
            <p className="mt-1 text-xs text-gray-500">Separate multiple tags with commas</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={rentalFormData.isAvailable}
                onChange={(e) => setRentalFormData({ ...rentalFormData, isAvailable: e.target.checked })}
                className="h-4 w-4 text-primary focus:ring-ring border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">Available</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={rentalFormData.isActive}
                onChange={(e) => setRentalFormData({ ...rentalFormData, isActive: e.target.checked })}
                className="h-4 w-4 text-primary focus:ring-ring border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">Active</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={rentalFormData.isFeatured}
                onChange={(e) => setRentalFormData({ ...rentalFormData, isFeatured: e.target.checked })}
                className="h-4 w-4 text-primary focus:ring-ring border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">Featured</label>
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
              disabled={submitting || !rentalFormData.title || !rentalFormData.description || !rentalFormData.category}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              value={rentalFormData.description}
              onChange={(e) => setRentalFormData({ ...rentalFormData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                value={rentalFormData.category}
                onChange={(e) => setRentalFormData({ ...rentalFormData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
                required
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
              <input
                type="text"
                value={rentalFormData.subcategory}
                onChange={(e) => setRentalFormData({ ...rentalFormData, subcategory: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
                placeholder="e.g., pickup_truck, sedan"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
            <div ref={ownerAutosuggestRef} className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={ownerSearchTerm}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setOwnerSearchTerm(newValue);
                    if (newValue === '') {
                      handleOwnerClear();
                    } else if (selectedOwner) {
                      // If user starts typing and it doesn't match the selected owner, clear selection
                      const selectedName = `${selectedOwner.firstName} ${selectedOwner.lastName}`.trim();
                      const selectedEmail = selectedOwner.email;
                      if (newValue !== selectedName && newValue !== selectedEmail && !newValue.startsWith(selectedName) && !newValue.startsWith(selectedEmail)) {
                        setSelectedOwner(null);
                        setRentalFormData({ ...rentalFormData, provider: '', owner: '' });
                      }
                    }
                  }}
                  onFocus={() => {
                    if (ownerSearchTerm && ownerSearchTerm.length >= 2) {
                      if (ownerSuggestions.length > 0) {
                        setShowOwnerSuggestions(true);
                      } else if (!loadingOwners) {
                        // Trigger search if we have a search term but no suggestions yet
                        fetchOwners(ownerSearchTerm);
                      }
                    }
                  }}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
                  placeholder="Search for owner by name or email..."
                />
                {selectedOwner && (
                  <button
                    type="button"
                    onClick={handleOwnerClear}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {/* Suggestions Dropdown */}
              {showOwnerSuggestions && ownerSearchTerm.length >= 2 && (
                <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {loadingOwners ? (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                      Searching...
                    </div>
                  ) : ownerSuggestions.length > 0 ? (
                    ownerSuggestions.map((owner) => (
                      <div
                        key={owner._id}
                        onClick={() => handleOwnerSelect(owner)}
                        className="px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-primary/5 transition-colors"
                      >
                        <div className="font-medium text-gray-900">
                          {owner.firstName} {owner.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{owner.email}</div>
                        <div className="text-xs text-gray-400 mt-1">ID: {owner._id}</div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                      No owners found
                    </div>
                  )}
                </div>
              )}
              
              {selectedOwner && (
                <div className="mt-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="text-sm font-medium text-primary">
                    Selected: {selectedOwner.firstName} {selectedOwner.lastName}
                  </div>
                  <div className="text-xs text-primary">{selectedOwner.email}</div>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Price</label>
              <input
                type="number"
                value={rentalFormData.hourlyPrice}
                onChange={(e) => setRentalFormData({ ...rentalFormData, hourlyPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Daily Price</label>
              <input
                type="number"
                value={rentalFormData.dailyPrice}
                onChange={(e) => setRentalFormData({ ...rentalFormData, dailyPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <select
              value={rentalFormData.currency}
              onChange={(e) => setRentalFormData({ ...rentalFormData, currency: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="PHP">PHP</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={rentalFormData.street}
                onChange={(e) => setRentalFormData({ ...rentalFormData, street: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
                placeholder="Street address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={rentalFormData.city}
                onChange={(e) => setRentalFormData({ ...rentalFormData, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
                placeholder="State"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
              <input
                type="text"
                value={rentalFormData.zipCode}
                onChange={(e) => setRentalFormData({ ...rentalFormData, zipCode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
                placeholder="Zip Code"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <input
              type="text"
              value={rentalFormData.country}
              onChange={(e) => setRentalFormData({ ...rentalFormData, country: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
              placeholder="Country"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
              <input
                type="text"
                value={rentalFormData.lat}
                onChange={(e) => setRentalFormData({ ...rentalFormData, lat: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
                placeholder="e.g., 34.0522"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
              <input
                type="text"
                value={rentalFormData.lng}
                onChange={(e) => setRentalFormData({ ...rentalFormData, lng: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
                placeholder="e.g., -118.2437"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={rentalFormData.pickupRequired}
                onChange={(e) => setRentalFormData({ ...rentalFormData, pickupRequired: e.target.checked })}
                className="h-4 w-4 text-primary focus:ring-ring border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">Pickup Required</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={rentalFormData.deliveryAvailable}
                onChange={(e) => setRentalFormData({ ...rentalFormData, deliveryAvailable: e.target.checked })}
                className="h-4 w-4 text-primary focus:ring-ring border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">Delivery Available</label>
            </div>
          </div>
          {rentalFormData.deliveryAvailable && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Fee</label>
              <input
                type="number"
                value={rentalFormData.deliveryFee}
                onChange={(e) => setRentalFormData({ ...rentalFormData, deliveryFee: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
                min="0"
                step="0.01"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <input
              type="text"
              value={typeof rentalFormData.tags === 'string' ? rentalFormData.tags : rentalFormData.tags.join(', ')}
              onChange={(e) => setRentalFormData({ ...rentalFormData, tags: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
              placeholder="Comma-separated tags (e.g., pickup, truck, moving)"
            />
            <p className="mt-1 text-xs text-gray-500">Separate multiple tags with commas</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={rentalFormData.isAvailable}
                onChange={(e) => setRentalFormData({ ...rentalFormData, isAvailable: e.target.checked })}
                className="h-4 w-4 text-primary focus:ring-ring border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">Available</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={rentalFormData.isActive}
                onChange={(e) => setRentalFormData({ ...rentalFormData, isActive: e.target.checked })}
                className="h-4 w-4 text-primary focus:ring-ring border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">Active</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={rentalFormData.isFeatured}
                onChange={(e) => setRentalFormData({ ...rentalFormData, isFeatured: e.target.checked })}
                className="h-4 w-4 text-primary focus:ring-ring border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">Featured</label>
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
              disabled={submitting || !rentalFormData.title || !rentalFormData.description || !rentalFormData.category}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
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
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
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
          <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
            {/* Images */}
            {selectedRental.images && selectedRental.images.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Images</h3>
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
              </div>
            )}

            {/* Basic Information */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Name</h4>
                  <p className="mt-1 text-sm text-gray-900">{(selectedRental as Rental).name || selectedRental.title || 'N/A'}</p>
                </div>
                {selectedRental.title && (selectedRental as Rental).name !== selectedRental.title && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Title</h4>
                    <p className="mt-1 text-sm text-gray-900">{selectedRental.title}</p>
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Description</h4>
                  <p className="mt-1 text-sm text-gray-900">{selectedRental.description || 'N/A'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Category</h4>
                    <p className="mt-1 text-sm text-gray-900">{selectedRental.category || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Subcategory</h4>
                    <p className="mt-1 text-sm text-gray-900">{selectedRental.subcategory || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Owner</h4>
                  <div className="mt-1 text-sm text-gray-900">
                    {typeof selectedRental.owner === 'object' && selectedRental.owner ? (
                      <div>
                        <div className="font-medium">
                          {selectedRental.owner.firstName && selectedRental.owner.lastName 
                            ? `${selectedRental.owner.firstName} ${selectedRental.owner.lastName}`
                            : selectedRental.owner.email || 'N/A'}
                        </div>
                        {selectedRental.owner.email && (
                          <div className="text-xs text-gray-500 mt-1">{selectedRental.owner.email}</div>
                        )}
                        {selectedRental.owner && typeof selectedRental.owner === 'object' && 'profile' in selectedRental.owner && 
                         selectedRental.owner.profile && typeof selectedRental.owner.profile === 'object' && 'bio' in selectedRental.owner.profile ? (
                          <div className="text-xs text-gray-600 mt-1 italic">
                            {String((selectedRental.owner.profile as { bio?: string }).bio || '')}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <span>{selectedRental.owner || 'N/A'}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Pricing</h3>
              <div className="grid grid-cols-2 gap-4">
                {(() => {
                  const pricing = selectedRental.pricing || selectedRental.price;
                  const pricingAny = pricing as Pricing & { hourly?: number }; // Type assertion to handle hourly property
                  return (
                    <>
                      {pricingAny?.hourly && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Hourly</h4>
                          <p className="mt-1 text-sm text-gray-900">
                            {formatCurrency(pricingAny.hourly, pricingAny.currency || getDefaultCurrency(appSettings), { appSettings })}
                          </p>
                        </div>
                      )}
                      {pricing?.daily && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Daily</h4>
                          <p className="mt-1 text-sm text-gray-900">
                            {formatCurrency(pricing.daily, pricing.currency || getDefaultCurrency(appSettings), { appSettings })}
                          </p>
                        </div>
                      )}
                      {pricing?.weekly && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Weekly</h4>
                          <p className="mt-1 text-sm text-gray-900">
                            {formatCurrency(pricing.weekly, pricing.currency || getDefaultCurrency(appSettings), { appSettings })}
                          </p>
                        </div>
                      )}
                      {pricing?.monthly && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Monthly</h4>
                          <p className="mt-1 text-sm text-gray-900">
                            {formatCurrency(pricing.monthly, pricing.currency || getDefaultCurrency(appSettings), { appSettings })}
                          </p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Availability */}
            {selectedRental.availability && (
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Availability</h3>
                <div className="space-y-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Available</h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedRental.availability.isAvailable !== undefined 
                        ? (selectedRental.availability.isAvailable ? 'Yes' : 'No')
                        : 'N/A'}
                    </p>
                  </div>
                  {selectedRental.availability.schedule && Array.isArray(selectedRental.availability.schedule) && selectedRental.availability.schedule.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Schedule</h4>
                      <div className="space-y-1">
                        {selectedRental.availability.schedule.map((scheduleItem, idx: number) => (
                          <div key={idx} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                            {scheduleItem.startDate && scheduleItem.endDate 
                              ? `${new Date(scheduleItem.startDate).toLocaleDateString()} - ${new Date(scheduleItem.endDate).toLocaleDateString()}`
                              : scheduleItem.startDate 
                                ? `From ${new Date(scheduleItem.startDate).toLocaleDateString()}`
                                : scheduleItem.endDate
                                  ? `Until ${new Date(scheduleItem.endDate).toLocaleDateString()}`
                                  : 'All day'}
                            {scheduleItem.reason && <div className="text-xs text-gray-500 mt-1">Reason: {scheduleItem.reason}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Location */}
            {selectedRental.location && (
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Location</h3>
                <div className="space-y-2">
                  {selectedRental.location.address?.street && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Street</h4>
                      <p className="mt-1 text-sm text-gray-900">{selectedRental.location.address.street}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    {selectedRental.location.address?.city && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">City</h4>
                        <p className="mt-1 text-sm text-gray-900">{selectedRental.location.address.city}</p>
                      </div>
                    )}
                    {selectedRental.location.address?.state && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">State</h4>
                        <p className="mt-1 text-sm text-gray-900">{selectedRental.location.address.state}</p>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedRental.location.address?.zipCode && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Zip Code</h4>
                        <p className="mt-1 text-sm text-gray-900">{selectedRental.location.address.zipCode}</p>
                      </div>
                    )}
                    {selectedRental.location.address?.country && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Country</h4>
                        <p className="mt-1 text-sm text-gray-900">{selectedRental.location.address.country}</p>
                      </div>
                    )}
                  </div>
                  {selectedRental.location.coordinates && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Latitude</h4>
                        <p className="mt-1 text-sm text-gray-900">{selectedRental.location.coordinates.lat}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Longitude</h4>
                        <p className="mt-1 text-sm text-gray-900">{selectedRental.location.coordinates.lng}</p>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Pickup Required</h4>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedRental.location.pickupRequired !== undefined 
                          ? (selectedRental.location.pickupRequired ? 'Yes' : 'No')
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Delivery Available</h4>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedRental.location.deliveryAvailable !== undefined 
                          ? (selectedRental.location.deliveryAvailable ? 'Yes' : 'No')
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                  {selectedRental.location.deliveryAvailable && selectedRental.location.deliveryFee !== undefined && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Delivery Fee</h4>
                      <p className="mt-1 text-sm text-gray-900">
                        {formatCurrency(
                          selectedRental.location.deliveryFee,
                          (selectedRental.pricing || selectedRental.price)?.currency || getDefaultCurrency(appSettings),
                          { appSettings }
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Specifications */}
            {selectedRental.specifications && (
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Specifications</h3>
                <div className="grid grid-cols-2 gap-4">
                  {selectedRental.specifications.brand && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Brand</h4>
                      <p className="mt-1 text-sm text-gray-900">{selectedRental.specifications.brand}</p>
                    </div>
                  )}
                  {selectedRental.specifications.model && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Model</h4>
                      <p className="mt-1 text-sm text-gray-900">{selectedRental.specifications.model}</p>
                    </div>
                  )}
                  {selectedRental.specifications.year && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Year</h4>
                      <p className="mt-1 text-sm text-gray-900">{selectedRental.specifications.year}</p>
                    </div>
                  )}
                  {selectedRental.specifications.condition && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Condition</h4>
                      <p className="mt-1 text-sm text-gray-900 capitalize">{selectedRental.specifications.condition}</p>
                    </div>
                  )}
                </div>
                {selectedRental.specifications.features && selectedRental.specifications.features.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-gray-500">Features</h4>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {selectedRental.specifications.features.map((feature, idx) => (
                        <span key={idx} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedRental.specifications.dimensions && (
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Dimensions</h4>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedRental.specifications.dimensions.length && 
                         selectedRental.specifications.dimensions.width && 
                         selectedRental.specifications.dimensions.height
                          ? `${selectedRental.specifications.dimensions.length} × ${selectedRental.specifications.dimensions.width} × ${selectedRental.specifications.dimensions.height} ${selectedRental.specifications.dimensions.unit || 'inches'}`
                          : 'N/A'}
                      </p>
                    </div>
                    {selectedRental.specifications.weight && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Weight</h4>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedRental.specifications.weight.value 
                            ? `${selectedRental.specifications.weight.value} ${selectedRental.specifications.weight.unit || 'lbs'}`
                            : 'N/A'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Requirements */}
            {selectedRental.requirements && (
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h3>
                <div className="grid grid-cols-2 gap-4">
                  {selectedRental.requirements.minAge && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Minimum Age</h4>
                      <p className="mt-1 text-sm text-gray-900">{selectedRental.requirements.minAge} years</p>
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">License Required</h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedRental.requirements.licenseRequired !== undefined 
                        ? (selectedRental.requirements.licenseRequired ? 'Yes' : 'No')
                        : 'N/A'}
                    </p>
                  </div>
                  {selectedRental.requirements.licenseType && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">License Type</h4>
                      <p className="mt-1 text-sm text-gray-900">{selectedRental.requirements.licenseType}</p>
                    </div>
                  )}
                  {selectedRental.requirements.deposit !== undefined && selectedRental.requirements.deposit > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Deposit</h4>
                      <p className="mt-1 text-sm text-gray-900">
                        {formatCurrency(
                          selectedRental.requirements.deposit,
                          (selectedRental.pricing || selectedRental.price)?.currency || getDefaultCurrency(appSettings),
                          { appSettings }
                        )}
                      </p>
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Insurance Required</h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedRental.requirements.insuranceRequired !== undefined 
                        ? (selectedRental.requirements.insuranceRequired ? 'Yes' : 'No')
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Status & Metadata */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Status & Metadata</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Status</h4>
                  <p className="mt-1">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      selectedRental.isActive && selectedRental.availability?.isAvailable
                        ? 'bg-accent/10 text-accent' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedRental.isActive && selectedRental.availability?.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Active</h4>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedRental.isActive !== undefined ? (selectedRental.isActive ? 'Yes' : 'No') : 'N/A'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Featured</h4>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedRental.isFeatured !== undefined ? (selectedRental.isFeatured ? 'Yes' : 'No') : 'N/A'}
                  </p>
                </div>
                {selectedRental.views !== undefined && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Views</h4>
                    <p className="mt-1 text-sm text-gray-900">{selectedRental.views}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            {selectedRental.tags && selectedRental.tags.length > 0 && (
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedRental.tags.map((tag, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Rating */}
            {(selectedRental.rating || ((selectedRental as Rental & { averageRating?: number }).averageRating !== undefined)) && (
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Rating</h3>
                <div>
                  <p className="text-sm text-gray-900">
                    <span className="text-lg font-semibold">
                      {selectedRental.rating?.average 
                        ? selectedRental.rating.average.toFixed(1) 
                        : (selectedRental as Rental & { averageRating?: number }).averageRating !== undefined
                          ? (selectedRental as Rental & { averageRating?: number }).averageRating!.toFixed(1)
                          : '0.0'}
                    </span>
                    {selectedRental.rating && selectedRental.rating.count !== undefined && selectedRental.rating.count > 0 && ` (${selectedRental.rating.count} reviews)`}
                  </p>
                </div>
              </div>
            )}

            {/* Maintenance */}
            {((selectedRental as Rental & { maintenance?: { serviceHistory?: Array<{ date?: string; type?: string; description?: string; cost?: number }> } }).maintenance) && (
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Maintenance</h3>
                {(() => {
                  const rentalWithMaintenance = selectedRental as Rental & { maintenance?: { serviceHistory?: Array<{ date?: string; type?: string; description?: string; cost?: number }> } };
                  return rentalWithMaintenance.maintenance?.serviceHistory && Array.isArray(rentalWithMaintenance.maintenance.serviceHistory) && rentalWithMaintenance.maintenance.serviceHistory.length > 0 ? (
                  <div className="space-y-2">
                    {rentalWithMaintenance.maintenance.serviceHistory.map((service, idx: number) => (
                      <div key={idx} className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                        {service.date && <div className="font-medium">{new Date(service.date).toLocaleDateString()}</div>}
                        {service.type && <div className="text-xs text-gray-600">Type: {service.type}</div>}
                        {service.description && <div className="text-xs text-gray-600 mt-1">{service.description}</div>}
                        {service.cost !== undefined && (
                          <div className="text-xs text-gray-600 mt-1">
                            Cost: {formatCurrency(
                              service.cost,
                              (selectedRental.pricing || selectedRental.price)?.currency || getDefaultCurrency(appSettings),
                              { appSettings }
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No service history available</p>
                );
                })()}
              </div>
            )}

            {/* Dates */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Dates</h3>
              <div className="grid grid-cols-2 gap-4">
                {selectedRental.createdAt && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Created</h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedRental.createdAt).toLocaleString()}
                    </p>
                  </div>
                )}
                {selectedRental.updatedAt && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Last Updated</h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedRental.updatedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

