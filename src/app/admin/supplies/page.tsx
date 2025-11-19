"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { 
  Search, 
  Edit, 
  Trash2, 
  RefreshCw,
  Filter,
  Download,
  Plus,
  Eye,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  X,
  Package,
  BarChart3
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { Modal } from "@/components/ui/modal";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import toast from "react-hot-toast";
import { Product, ProductCategory, ProductImage } from "@/types/supplies";
import { useAppSettings } from "@/hooks/useAppSettings";
import { formatCurrency } from "@/lib/currency-utils";
import { getDefaultCurrency } from "@/lib/settings-utils";
import { AppSettings } from "@/types/app-settings";

// Extended ProductImage interface for admin page (includes _id)
type ProductImageWithId = ProductImage & { _id?: string };

// Type for API product response (raw data from backend)
interface ApiProductData {
  _id?: string;
  name?: string;
  title?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  brand?: string;
  sku?: string;
  pricing?: {
    retailPrice?: number;
    wholesalePrice?: number;
    currency?: string;
  };
  inventory?: {
    quantity?: number;
    minStock?: number;
    maxStock?: number;
    location?: string;
  };
  specifications?: {
    weight?: string;
    dimensions?: string;
    material?: string;
    color?: string;
    warranty?: string;
  };
  location?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    coordinates?: {
      lat?: number;
      lng?: number;
    };
  };
  images?: Array<{
    url?: string;
    publicId?: string;
    thumbnail?: string;
    alt?: string;
    _id?: string;
  }>;
  tags?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
  views?: number;
  isSubscriptionEligible?: boolean;
  supplier?: string | { 
    _id?: string; 
    id?: string; 
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    profile?: {
      bio?: string;
      avatar?: string;
      [key: string]: unknown;
    };
  };
  averageRating?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  orders?: unknown[];
  reviews?: unknown[];
  __v?: number;
}

interface SupplyStatistics {
  totalProducts?: number;
  activeProducts?: number;
  inactiveProducts?: number;
  totalInventory?: number;
  lowStockItems?: number;
  totalRevenue?: number;
  totalOrders?: number;
  averageRating?: number;
}

// Helper function to transform API product data to frontend format
// Note: This function is called before component render, so we'll use a default currency
// The actual app settings will be used in the component for display
const transformProductData = (apiProduct: ApiProductData, defaultCurrency: string = 'PHP'): Product => {
  const product: Product = {
    _id: apiProduct._id,
    name: apiProduct.name || '',
    title: apiProduct.title || '',
    description: apiProduct.description || '',
    category: (apiProduct.category as ProductCategory) || 'cleaning_supplies',
    subcategory: apiProduct.subcategory || '',
    brand: apiProduct.brand || '',
    sku: apiProduct.sku || '',
    pricing: {
      retailPrice: apiProduct.pricing?.retailPrice || 0,
      wholesalePrice: apiProduct.pricing?.wholesalePrice,
      currency: apiProduct.pricing?.currency || defaultCurrency
    },
    inventory: {
      quantity: apiProduct.inventory?.quantity || 0,
      minStock: apiProduct.inventory?.minStock,
      maxStock: apiProduct.inventory?.maxStock,
      location: apiProduct.inventory?.location
    },
    specifications: apiProduct.specifications,
    location: apiProduct.location,
    images: apiProduct.images || [],
    tags: apiProduct.tags || [],
    isActive: apiProduct.isActive !== undefined ? apiProduct.isActive : true,
    isFeatured: apiProduct.isFeatured || false,
    views: apiProduct.views || 0,
    isSubscriptionEligible: apiProduct.isSubscriptionEligible || false,
    supplier: typeof apiProduct.supplier === 'string' 
      ? apiProduct.supplier 
      : apiProduct.supplier?._id || apiProduct.supplier?.id || '',
    averageRating: apiProduct.averageRating,
    createdAt: apiProduct.createdAt ? new Date(apiProduct.createdAt) : new Date(),
    updatedAt: apiProduct.updatedAt ? new Date(apiProduct.updatedAt) : new Date(),
  };

  return product;
};

export default function AdminSuppliesPage() {
  // App settings for currency formatting and other settings
  const { settings: appSettings } = useAppSettings();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [slowRequest, setSlowRequest] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'createdAt' | 'price'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [statistics, setStatistics] = useState<SupplyStatistics | null>(null);

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [imageUploadModalOpen, setImageUploadModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProductDetails, setSelectedProductDetails] = useState<Product | null>(null);
  const [loadingProductDetails, setLoadingProductDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  // Form data states
  const [createFormData, setCreateFormData] = useState({
    name: '',
    title: '',
    description: '',
    category: 'cleaning_supplies' as ProductCategory,
    subcategory: '',
    brand: '',
    sku: '',
    retailPrice: '',
    wholesalePrice: '',
    currency: getDefaultCurrency(appSettings),
    quantity: '',
    minStock: '',
    maxStock: '',
    location: '',
    isActive: true
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    title: '',
    description: '',
    category: 'cleaning_supplies' as ProductCategory,
    subcategory: '',
    brand: '',
    sku: '',
    retailPrice: '',
    wholesalePrice: '',
    currency: getDefaultCurrency(appSettings),
    quantity: '',
    minStock: '',
    maxStock: '',
    location: '',
    isActive: true
  });

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    try {
      if (!getApiToken()) return;

      const url = `${API_BASE_URL}${API_ENDPOINTS.suppliesStatistics}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));

      if (!response.ok) {
        logger.warn('Failed to fetch supply statistics', { status: response.status });
        return;
      }

      const result = await response.json();
      if (result.success && result.data) {
        setStatistics(result.data);
      }
    } catch (err) {
      logger.error('Error fetching supply statistics', err instanceof Error ? err : new Error(String(err)));
    }
  }, []);

  const fetchData = useCallback(async () => {
    let slowRequestTimer: NodeJS.Timeout | null = null;
    let productsUrl = '';
    
    try {
      setLoading(true);
      setError(null);
      setSlowRequest(false);

      // Set a timer to show slow request warning
      slowRequestTimer = setTimeout(() => {
        setSlowRequest(true);
      }, 10000);

      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.set('page', currentPage.toString());
      queryParams.set('limit', itemsPerPage.toString());
      if (searchTerm) queryParams.set('search', searchTerm);
      if (categoryFilter !== 'all') queryParams.set('category', categoryFilter);
      if (statusFilter !== 'all') queryParams.set('isActive', statusFilter === 'active' ? 'true' : 'false');
      queryParams.set('sortBy', sortBy);
      queryParams.set('sortOrder', sortOrder);

      if (!getApiToken()) {
        logger.warn('No API token found, cannot fetch products');
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }
      
      const productsQuery = new URLSearchParams(Object.fromEntries(queryParams)).toString();
      productsUrl = `${API_BASE_URL}${API_ENDPOINTS.supplies}${productsQuery ? `?${productsQuery}` : ''}`;
      
      logger.debug('Fetching products', { 
        productsUrl, 
        queryParams: Object.fromEntries(queryParams),
        apiBaseUrl: API_BASE_URL,
        endpoint: API_ENDPOINTS.supplies
      });
      
      const dataResponse = await fetch(productsUrl, createAuthFetchOptions({ method: 'GET' }));

      if (!dataResponse.ok) {
        const errorText = await dataResponse.text().catch(() => '');
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || `HTTP ${dataResponse.status}: ${dataResponse.statusText}` };
        }
        logger.error('Failed to fetch products', new Error(errorData.error || errorData.message || 'Failed to fetch products data'), {
          status: dataResponse.status,
          statusText: dataResponse.statusText,
          url: productsUrl,
          errorData
        });
        throw new Error(errorData.error || errorData.message || `HTTP ${dataResponse.status}: Failed to fetch products data`);
      }

      const dataResult = await dataResponse.json();

      // Log the response for debugging
      logger.debug('Products API response', { 
        hasSuccess: !!dataResult.success,
        hasData: !!dataResult.data,
        dataType: Array.isArray(dataResult.data) ? 'array' : typeof dataResult.data,
        dataKeys: dataResult.data ? Object.keys(dataResult.data) : []
      });

      // Transform the API response data
      let productsData: Product[] = [];
      let totalCount = 0;

      // Handle different response structures
      // Response format: { success: true, count: 2, total: 2, page: 1, pages: 1, data: [...] }
      if (dataResult.success && dataResult.data) {
        if (dataResult.data.products && Array.isArray(dataResult.data.products)) {
          productsData = dataResult.data.products.map((p: ApiProductData) => transformProductData(p, getDefaultCurrency(appSettings)));
          totalCount = dataResult.data.pagination?.total || dataResult.total || dataResult.count || dataResult.data.products.length;
        } else if (Array.isArray(dataResult.data)) {
          productsData = dataResult.data.map((p: ApiProductData) => transformProductData(p, getDefaultCurrency(appSettings)));
          totalCount = dataResult.total || dataResult.count || dataResult.data.length;
        }
      } else if (Array.isArray(dataResult)) {
        productsData = dataResult.map((p: ApiProductData) => transformProductData(p, getDefaultCurrency(appSettings)));
        totalCount = dataResult.length;
      } else if (dataResult.data) {
        if (Array.isArray(dataResult.data)) {
          productsData = dataResult.data.map((p: ApiProductData) => transformProductData(p, getDefaultCurrency(appSettings)));
          totalCount = dataResult.total || dataResult.count || dataResult.data.length;
        } else if (dataResult.data.products && Array.isArray(dataResult.data.products)) {
          productsData = dataResult.data.products.map((p: ApiProductData) => transformProductData(p, getDefaultCurrency(appSettings)));
          totalCount = dataResult.data.pagination?.total || dataResult.total || dataResult.count || dataResult.data.products.length;
        }
      } else if (Array.isArray(dataResult.products)) {
        productsData = dataResult.products.map((p: ApiProductData) => transformProductData(p, getDefaultCurrency(appSettings)));
        totalCount = dataResult.pagination?.total || dataResult.total || dataResult.count || dataResult.products.length;
      }

      setProducts(productsData);
      setTotalCount(totalCount);
      setLastUpdated(new Date());
    } catch (err) {
      logger.error('Error fetching products data', err instanceof Error ? err : new Error(String(err)), {
        url: productsUrl,
        error: err instanceof Error ? err.message : String(err)
      });
      let errorMessage = 'Failed to load products data';
      
      if (err instanceof Error) {
        if (err.message.includes('timed out')) {
          errorMessage = 'Request timed out. The server may be slow. Please try again.';
        } else if (err.message.includes('aborted')) {
          errorMessage = 'Request was cancelled. Please try again.';
        } else if (err.message.includes('401') || err.message.includes('Unauthorized')) {
          errorMessage = 'Unauthorized. Please check your authentication.';
        } else if (err.message.includes('403') || err.message.includes('Forbidden')) {
          errorMessage = 'Access forbidden. You may not have permission to view products.';
        } else if (err.message.includes('404')) {
          errorMessage = 'Products endpoint not found. Please check the API configuration.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setProducts([]);
      setTotalCount(0);
    } finally {
      if (slowRequestTimer) {
        clearTimeout(slowRequestTimer);
      }
      setLoading(false);
      setSlowRequest(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, categoryFilter, statusFilter, sortBy, sortOrder, appSettings]);

  useEffect(() => {
    fetchData();
    fetchStatistics();
  }, [fetchData, fetchStatistics]);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await fetchData();
      await fetchStatistics();
    } catch (err) {
      logger.error('Error refreshing data', err instanceof Error ? err : new Error(String(err)));
      toast.error('Failed to refresh products data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSort = (field: 'name' | 'category' | 'createdAt' | 'price') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleViewProduct = async (productId: string) => {
    try {
      setLoadingProductDetails(true);
      if (!getApiToken()) return;
      
      // Validate productId format (should be a valid ObjectId or string)
      if (!productId || typeof productId !== 'string') {
        throw new Error('Invalid product ID');
      }
      
      const url = `${API_BASE_URL}${API_ENDPOINTS.suppliesById.replace('[id]', productId)}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || `Failed to fetch product details: ${response.status}`;
        throw new Error(errorMessage);
      }

      // Safely parse JSON response
      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error('Invalid JSON response from server');
      }
      
      // Safely extract product data from nested structure
      // Response format: { success: true, data: { supply: {...}, reviews: [], statistics: {...} } }
      let productData;
      try {
        // Handle nested structure: data.supply contains the actual product
        if (result.data && result.data.supply) {
          productData = result.data.supply;
          // Map 'id' to '_id' if present (API uses 'id' but our transform expects '_id')
          if (productData.id && !productData._id) {
            productData._id = productData.id;
          }
        } else if (result.data) {
          // Fallback: if data exists but no supply property, use data directly
          productData = result.data;
          if (productData.id && !productData._id) {
            productData._id = productData.id;
          }
        } else if (result.supply) {
          // Another fallback: supply at root level
          productData = result.supply;
          if (productData.id && !productData._id) {
            productData._id = productData.id;
          }
        } else {
          // Last fallback: use result directly
          productData = result;
          if (productData.id && !productData._id) {
            productData._id = productData.id;
          }
        }
      } catch {
        throw new Error('Invalid product data structure');
      }
      
      // Ensure productData is a plain object before transformation
      if (!productData || typeof productData !== 'object' || Array.isArray(productData)) {
        throw new Error('Invalid product data received');
      }
      
      // Safely transform the product data with error handling
      let transformedProduct;
      try {
        transformedProduct = transformProductData(productData, getDefaultCurrency(appSettings));
      } catch {
        // If transformation fails (e.g., due to ObjectId in data), throw a safe error
        throw new Error('Failed to process product data');
      }
      
      setSelectedProductDetails(transformedProduct);
      setViewModalOpen(true);
    } catch {
      // Completely avoid accessing error object to prevent ObjectId serialization issues
      // Don't try to extract message, don't convert to string, just use a safe default
      const errorMessage = 'Failed to fetch product details';
      
      // Create a completely clean error object with only the safe message
      // Never pass the original error to logger as it might contain ObjectId instances
      const cleanError = new Error(errorMessage);
      logger.error('Error fetching product details', cleanError);
      toast.error(errorMessage);
    } finally {
      setLoadingProductDetails(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      cleaning_supplies: 'bg-blue-100 text-blue-800',
      tools: 'bg-green-100 text-green-800',
      materials: 'bg-yellow-100 text-yellow-800',
      equipment: 'bg-purple-100 text-purple-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (isActive: boolean | undefined) => {
    return isActive ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100';
  };

  const handleCreateProduct = async () => {
    try {
      setSubmitting(true);
      if (!getApiToken()) return;

      if (!createFormData.name || !createFormData.title || !createFormData.description) {
        toast.error('Please fill in all required fields');
        return;
      }

      const formData = {
        name: createFormData.name,
        title: createFormData.title,
        description: createFormData.description,
        category: createFormData.category,
        subcategory: createFormData.subcategory,
        brand: createFormData.brand,
        sku: createFormData.sku,
        pricing: {
          retailPrice: parseFloat(createFormData.retailPrice) || 0,
          wholesalePrice: createFormData.wholesalePrice ? parseFloat(createFormData.wholesalePrice) : undefined,
          currency: createFormData.currency
        },
        inventory: {
          quantity: parseInt(createFormData.quantity) || 0,
          minStock: createFormData.minStock ? parseInt(createFormData.minStock) : undefined,
          maxStock: createFormData.maxStock ? parseInt(createFormData.maxStock) : undefined,
          location: createFormData.location || undefined
        },
        isActive: createFormData.isActive
      };

      // Try POST /api/supplies first, fallback to /api/supplies/products
      let url = `${API_BASE_URL}${API_ENDPOINTS.supplies}`;
      let response = await fetch(url, createAuthFetchOptions({
        method: 'POST',
        body: JSON.stringify(formData)
      }));

      // If the first endpoint fails, try the alias endpoint
      if (!response.ok && response.status === 404) {
        url = `${API_BASE_URL}${API_ENDPOINTS.suppliesProducts}`;
        response = await fetch(url, createAuthFetchOptions({
          method: 'POST',
          body: JSON.stringify(formData)
        }));
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create product');
      }

      toast.success('Product created successfully');
      setCreateModalOpen(false);
      setCreateFormData({
        name: '',
        title: '',
        description: '',
        category: 'cleaning_supplies',
        subcategory: '',
        brand: '',
        sku: '',
        retailPrice: '',
        wholesalePrice: '',
        currency: getDefaultCurrency(appSettings),
        quantity: '',
        minStock: '',
        maxStock: '',
        location: '',
        isActive: true
      });
      await fetchData();
      await fetchStatistics();
    } catch (err) {
      logger.error('Error creating product', err instanceof Error ? err : new Error(String(err)));
      toast.error(err instanceof Error ? err.message : 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProduct = async () => {
    if (!selectedProduct?._id) return;
    
    try {
      setSubmitting(true);
      if (!getApiToken()) return;

      if (!editFormData.name || !editFormData.title || !editFormData.description) {
        toast.error('Please fill in all required fields');
        return;
      }

      const formData = {
        name: editFormData.name,
        title: editFormData.title,
        description: editFormData.description,
        category: editFormData.category,
        subcategory: editFormData.subcategory,
        brand: editFormData.brand,
        sku: editFormData.sku,
        pricing: {
          retailPrice: parseFloat(editFormData.retailPrice) || 0,
          wholesalePrice: editFormData.wholesalePrice ? parseFloat(editFormData.wholesalePrice) : undefined,
          currency: editFormData.currency
        },
        inventory: {
          quantity: parseInt(editFormData.quantity) || 0,
          minStock: editFormData.minStock ? parseInt(editFormData.minStock) : undefined,
          maxStock: editFormData.maxStock ? parseInt(editFormData.maxStock) : undefined,
          location: editFormData.location || undefined
        },
        isActive: editFormData.isActive
      };

      const url = `${API_BASE_URL}${API_ENDPOINTS.suppliesById.replace('[id]', selectedProduct._id)}`;
      const response = await fetch(url, createAuthFetchOptions({
        method: 'PUT',
        body: JSON.stringify(formData)
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update product');
      }

      toast.success('Product updated successfully');
      setEditModalOpen(false);
      setSelectedProduct(null);
      await fetchData();
      await fetchStatistics();
    } catch (err) {
      logger.error('Error updating product', err instanceof Error ? err : new Error(String(err)));
      toast.error(err instanceof Error ? err.message : 'Failed to update product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct?._id) return;
    
    try {
      setSubmitting(true);
      if (!getApiToken()) return;

      const url = `${API_BASE_URL}${API_ENDPOINTS.suppliesById.replace('[id]', selectedProduct._id)}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'DELETE' }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete product');
      }

      toast.success('Product deleted successfully');
      setDeleteModalOpen(false);
      setSelectedProduct(null);
      await fetchData();
      await fetchStatistics();
    } catch (err) {
      logger.error('Error deleting product', err instanceof Error ? err : new Error(String(err)));
      toast.error(err instanceof Error ? err.message : 'Failed to delete product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadImages = async () => {
    if (!selectedProduct?._id || !selectedFiles || selectedFiles.length === 0) return;
    
    // Validate files before creating FormData
    const validFiles = selectedFiles.filter(file => file instanceof File && file.size > 0);
    if (validFiles.length === 0) {
      toast.error('No valid files selected. Please select image files.');
      return;
    }
    
    try {
      setSubmitting(true);
      const token = getApiToken();
      if (!token) {
        const error = new Error('No authentication token found');
        logger.error('Error uploading images', error, { productId: selectedProduct._id });
        toast.error('Authentication required. Please log in again.');
        return;
      }

      const formData = new FormData();
      // Append files - try 'images' first (most common), backend may also accept 'image' or 'files'
      validFiles.forEach((file, index) => {
        // Use 'images' as the field name (same as marketplace endpoint)
        formData.append('images', file, file.name || `image-${index}.jpg`);
      });

      // Endpoint: POST /api/supplies/:id/images
      const url = `${API_BASE_URL}${API_ENDPOINTS.suppliesById.replace('[id]', selectedProduct._id)}/images`;
      const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`
      };
      // Don't set Content-Type for FormData - browser will set it with boundary
      
      // Log FormData contents for debugging (note: FormData.entries() is not enumerable in all browsers)
      logger.debug('Uploading images', { 
        url, 
        productId: selectedProduct._id, 
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
          productId: selectedProduct._id,
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
          productId: selectedProduct._id,
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
              productId: selectedProduct._id,
              backendMessage,
              fieldName: 'images',
              fileCount: validFiles.length,
              note: 'Backend may expect different field name (e.g., "image" or "files" instead of "images")'
            });
          } else {
            toast.error(backendMessage || 'Invalid request. Please check your file selection and try again.');
          }
        } else if (response.status === 401) {
          toast.error('Authentication failed. Please log in again.');
        } else if (response.status === 403) {
          const backendMessage = errorData.message || errorMessage;
          toast.error(backendMessage || 'You do not have permission to upload images for this product. Admin access may not be properly configured on the backend.');
          logger.warn('403 Forbidden when uploading images - possible backend authorization issue', {
            productId: selectedProduct._id,
            backendMessage,
            note: 'Admin users should have permission to upload images for any product according to API documentation'
          });
        } else if (response.status === 404) {
          toast.error('Product not found. Please refresh and try again.');
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
        productId: selectedProduct._id, 
        fileCount: validFiles.length,
        result
      });

      toast.success(`Successfully uploaded ${validFiles.length} image(s)`);
      setImageUploadModalOpen(false);
      setSelectedProduct(null);
      setSelectedFiles([]);
      await fetchData();
    } catch (err) {
      // Catch any unexpected errors
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Unexpected error uploading images', error, {
        productId: selectedProduct?._id,
        fileCount: selectedFiles?.length || 0
      });
      toast.error(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!selectedProduct?._id || !imageId) return;
    
    try {
      if (!getApiToken()) return;

      const url = `${API_BASE_URL}${API_ENDPOINTS.suppliesById.replace('[id]', selectedProduct._id)}/images/${imageId}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'DELETE' }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete image');
      }

      toast.success('Image deleted successfully');
      await fetchData();
      // Refresh the selected product to update images
      if (selectedProduct._id) {
        await handleViewProduct(selectedProduct._id);
      }
    } catch (err) {
      logger.error('Error deleting image', err instanceof Error ? err : new Error(String(err)));
      toast.error(err instanceof Error ? err.message : 'Failed to delete image');
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loading size="xl" text="Loading products data..." />
          {slowRequest && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                <strong>Slow Response:</strong> The request is taking longer than usual. 
                This might be due to a large dataset or slow external API. Please wait...
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error && products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Supplies Management
          </h1>
          <p className="text-gray-600 text-sm">Manage supply products and inventory</p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center space-x-2">
          {lastUpdated && (
            <p className="text-xs text-gray-500">
              Updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Product
          </button>
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalProducts || 0}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Active Products</p>
                <p className="text-2xl font-bold text-green-600">{statistics.activeProducts || 0}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total Inventory</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalInventory?.toLocaleString() || 0}</p>
              </div>
              <Package className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Low Stock Items</p>
                <p className="text-2xl font-bold text-red-600">{statistics.lowStockItems || 0}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="bg-white rounded shadow">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Filters & Search</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Filter className="w-3 h-3 mr-1" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </button>
              <button className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <Download className="w-3 h-3 mr-1" />
                Export
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="p-4 border-b border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search products..."
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
                  <option value="cleaning_supplies">Cleaning Supplies</option>
                  <option value="tools">Tools</option>
                  <option value="materials">Materials</option>
                  <option value="equipment">Equipment</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setStatusFilter('all');
                }}
                className="text-xs text-gray-600 hover:text-gray-800"
              >
                Clear all filters
              </button>
              <div className="text-xs text-gray-500">
                {totalCount > 0 ? `${totalCount} products found` : `${products.length} products found`}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Products</h3>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-500">Sort:</span>
              <button
                onClick={() => handleSort('name')}
                className={`inline-flex items-center px-1 py-0.5 text-xs font-medium rounded ${
                  sortBy === 'name' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Name
                {sortBy === 'name' && (
                  sortOrder === 'asc' ? <ChevronUp className="w-2 h-2 ml-0.5" /> : <ChevronDown className="w-2 h-2 ml-0.5" />
                )}
              </button>
              <button
                onClick={() => handleSort('category')}
                className={`inline-flex items-center px-1 py-0.5 text-xs font-medium rounded ${
                  sortBy === 'category' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Category
                {sortBy === 'category' && (
                  sortOrder === 'asc' ? <ChevronUp className="w-2 h-2 ml-0.5" /> : <ChevronDown className="w-2 h-2 ml-0.5" />
                )}
              </button>
              <button
                onClick={() => handleSort('createdAt')}
                className={`inline-flex items-center px-1 py-0.5 text-xs font-medium rounded ${
                  sortBy === 'createdAt' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Date
                {sortBy === 'createdAt' && (
                  sortOrder === 'asc' ? <ChevronUp className="w-2 h-2 ml-0.5" /> : <ChevronDown className="w-2 h-2 ml-0.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product._id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        {product.images && product.images.length > 0 ? (
                          <Image 
                            src={product.images[0].url || product.images[0].thumbnail || ''} 
                            alt={product.title}
                            width={32}
                            height={32}
                            className="h-8 w-8 rounded object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="h-8 w-8 rounded bg-gray-300 flex items-center justify-center">
                            <ImageIcon className="w-4 h-4 text-gray-600" />
                          </div>
                        )}
                      </div>
                      <div className="ml-3">
                        <div className="text-xs font-semibold text-gray-900">
                          {product.title || product.name || 'Untitled Product'}
                        </div>
                        <div className="text-xs text-gray-600 line-clamp-1">
                          {product.description || 'No description'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(product.category)}`}>
                      {product.category.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">
                    <span>
                      {formatCurrency(
                        product.pricing?.retailPrice || 0,
                        product.pricing?.currency || getDefaultCurrency(appSettings),
                        { appSettings }
                      )}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">
                    <span className={product.inventory?.quantity && product.inventory.quantity < (product.inventory.minStock || 10) ? 'text-red-600 font-semibold' : ''}>
                      {product.inventory?.quantity || 0}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(product.isActive)}`}>
                      {product.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                    {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                    <div className="flex items-center space-x-2">
                      {product._id && (
                        <>
                          <button 
                            onClick={() => handleViewProduct(product._id!)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View product details"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedProduct(product);
                              setEditFormData({
                                name: product.name || '',
                                title: product.title || '',
                                description: product.description || '',
                                category: product.category || 'cleaning_supplies',
                                subcategory: product.subcategory || '',
                                brand: product.brand || '',
                                sku: product.sku || '',
                                retailPrice: product.pricing?.retailPrice?.toString() || '',
                                wholesalePrice: product.pricing?.wholesalePrice?.toString() || '',
                                currency: product.pricing?.currency || getDefaultCurrency(appSettings),
                                quantity: product.inventory?.quantity?.toString() || '',
                                minStock: product.inventory?.minStock?.toString() || '',
                                maxStock: product.inventory?.maxStock?.toString() || '',
                                location: product.inventory?.location || '',
                                isActive: product.isActive !== undefined ? product.isActive : true
                              });
                              setEditModalOpen(true);
                            }}
                            className="text-green-600 hover:text-green-900"
                            title="Edit product"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedProduct(product);
                              setImageUploadModalOpen(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Upload images"
                          >
                            <ImageIcon className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedProduct(product);
                              setDeleteModalOpen(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="Delete product"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {products.length === 0 && (
          <div className="text-center py-8">
            <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">No products found</h3>
            <p className="text-xs text-gray-500">Try adjusting your filters or search criteria.</p>
          </div>
        )}
      </div>

      {/* View Product Modal - Will be implemented in next chunk */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedProductDetails(null);
        }}
        title="Product Details"
        size="xl"
      >
        {loadingProductDetails ? (
          <div className="flex justify-center py-8">
            <Loading size="md" />
          </div>
        ) : selectedProductDetails ? (
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Basic Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500">Name</label>
                  <p className="text-sm font-semibold">{selectedProductDetails.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Title</label>
                  <p className="text-sm font-semibold">{selectedProductDetails.title || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Category</label>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(selectedProductDetails.category)}`}>
                    {selectedProductDetails.category.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Subcategory</label>
                  <p className="text-sm">{selectedProductDetails.subcategory || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Brand</label>
                  <p className="text-sm">{selectedProductDetails.brand || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">SKU</label>
                  <p className="text-sm font-mono">{selectedProductDetails.sku || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-500">Description</label>
                  <p className="text-sm text-gray-700">{selectedProductDetails.description || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Pricing Information */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Pricing</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500">Retail Price</label>
                  <p className="text-sm font-semibold">
                    {formatCurrency(
                      selectedProductDetails.pricing?.retailPrice || 0,
                      selectedProductDetails.pricing?.currency || getDefaultCurrency(appSettings),
                      { appSettings }
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Wholesale Price</label>
                  <p className="text-sm">
                    {selectedProductDetails.pricing?.wholesalePrice 
                      ? formatCurrency(
                          selectedProductDetails.pricing.wholesalePrice,
                          selectedProductDetails.pricing?.currency || getDefaultCurrency(appSettings),
                          { appSettings }
                        )
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Currency</label>
                  <p className="text-sm">{selectedProductDetails.pricing?.currency || getDefaultCurrency(appSettings)}</p>
                </div>
              </div>
            </div>

            {/* Inventory Information */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Inventory</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500">Quantity</label>
                  <p className={`text-sm font-semibold ${
                    selectedProductDetails.inventory?.quantity && 
                    selectedProductDetails.inventory.quantity < (selectedProductDetails.inventory.minStock || 10)
                      ? 'text-red-600' 
                      : ''
                  }`}>
                    {selectedProductDetails.inventory?.quantity || 0}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Min Stock</label>
                  <p className="text-sm">{selectedProductDetails.inventory?.minStock || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Max Stock</label>
                  <p className="text-sm">{selectedProductDetails.inventory?.maxStock || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Location</label>
                  <p className="text-sm">{selectedProductDetails.inventory?.location || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Specifications */}
            {selectedProductDetails.specifications && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Specifications</h4>
                <div className="grid grid-cols-2 gap-4">
                  {selectedProductDetails.specifications.weight && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Weight</label>
                      <p className="text-sm">{selectedProductDetails.specifications.weight}</p>
                    </div>
                  )}
                  {selectedProductDetails.specifications.dimensions && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Dimensions</label>
                      <p className="text-sm">{selectedProductDetails.specifications.dimensions}</p>
                    </div>
                  )}
                  {selectedProductDetails.specifications.material && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Material</label>
                      <p className="text-sm">{selectedProductDetails.specifications.material}</p>
                    </div>
                  )}
                  {selectedProductDetails.specifications.color && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Color</label>
                      <p className="text-sm">{selectedProductDetails.specifications.color}</p>
                    </div>
                  )}
                  {selectedProductDetails.specifications.warranty && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Warranty</label>
                      <p className="text-sm">{selectedProductDetails.specifications.warranty}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Additional Information */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Additional Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500">Status</label>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedProductDetails.isActive)}`}>
                    {selectedProductDetails.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Featured</label>
                  <p className="text-sm">{selectedProductDetails.isFeatured ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Subscription Eligible</label>
                  <p className="text-sm">{selectedProductDetails.isSubscriptionEligible ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Views</label>
                  <p className="text-sm">{selectedProductDetails.views || 0}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Average Rating</label>
                  <p className="text-sm">{selectedProductDetails.averageRating || 0}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Created At</label>
                  <p className="text-sm">{selectedProductDetails.createdAt ? new Date(selectedProductDetails.createdAt).toLocaleString() : 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Updated At</label>
                  <p className="text-sm">{selectedProductDetails.updatedAt ? new Date(selectedProductDetails.updatedAt).toLocaleString() : 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Tags */}
            {selectedProductDetails.tags && selectedProductDetails.tags.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProductDetails.tags.map((tag, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      {/* Create Product Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Product"
        size="lg"
        footer={
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateProduct}
              disabled={submitting}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        }
      >
        <CreateProductForm 
          formData={createFormData}
          setFormData={setCreateFormData}
          appSettings={appSettings}
        />
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedProduct(null);
        }}
        title="Edit Product"
        size="lg"
        footer={
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setEditModalOpen(false);
                setSelectedProduct(null);
              }}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateProduct}
              disabled={submitting}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Update Product'}
            </button>
          </div>
        }
      >
        {selectedProduct && (
          <EditProductForm 
            formData={editFormData}
            setFormData={setEditFormData}
            appSettings={appSettings}
          />
        )}
      </Modal>

      {/* Delete Product Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedProduct(null);
        }}
        title="Delete Product"
        size="md"
        footer={
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setDeleteModalOpen(false);
                setSelectedProduct(null);
              }}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteProduct}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? 'Deleting...' : 'Delete Product'}
            </button>
          </div>
        }
      >
        {selectedProduct && (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Are you sure you want to delete the product <strong>{selectedProduct.title || selectedProduct.name}</strong>? 
              This action cannot be undone.
            </p>
          </div>
        )}
      </Modal>

      {/* Image Upload Modal */}
      <Modal
        isOpen={imageUploadModalOpen}
        onClose={() => {
          setImageUploadModalOpen(false);
          setSelectedProduct(null);
          setSelectedFiles([]);
        }}
        title="Upload Product Images"
        size="lg"
        footer={
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setImageUploadModalOpen(false);
                setSelectedProduct(null);
                setSelectedFiles([]);
              }}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUploadImages}
              disabled={submitting || !selectedFiles || selectedFiles.length === 0}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Uploading...' : 'Upload Images'}
            </button>
          </div>
        }
      >
        {selectedProduct && (
          <ImageUploadForm 
            product={selectedProduct}
            onFilesChange={setSelectedFiles}
            selectedFiles={selectedFiles || []}
            onImageDelete={handleDeleteImage}
          />
        )}
      </Modal>
    </div>
  );
}

// Create Product Form Component
function CreateProductForm({ 
  formData, 
  setFormData,
  appSettings
}: {
  appSettings: AppSettings | null; 
  formData: {
    name: string;
    title: string;
    description: string;
    category: ProductCategory;
    subcategory: string;
    brand: string;
    sku: string;
    retailPrice: string;
    wholesalePrice: string;
    currency: string;
    quantity: string;
    minStock: string;
    maxStock: string;
    location: string;
    isActive: boolean;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    name: string;
    title: string;
    description: string;
    category: ProductCategory;
    subcategory: string;
    brand: string;
    sku: string;
    retailPrice: string;
    wholesalePrice: string;
    currency: string;
    quantity: string;
    minStock: string;
    maxStock: string;
    location: string;
    isActive: boolean;
  }>>;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as ProductCategory })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="cleaning_supplies">Cleaning Supplies</option>
            <option value="tools">Tools</option>
            <option value="materials">Materials</option>
            <option value="equipment">Equipment</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory *</label>
          <input
            type="text"
            value={formData.subcategory}
            onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Brand *</label>
          <input
            type="text"
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
          <input
            type="text"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Retail Price *</label>
          <input
            type="number"
            step="0.01"
            value={formData.retailPrice}
            onChange={(e) => setFormData({ ...formData, retailPrice: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Wholesale Price</label>
          <input
            type="number"
            step="0.01"
            value={formData.wholesalePrice}
            onChange={(e) => setFormData({ ...formData, wholesalePrice: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
          <select
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={getDefaultCurrency(appSettings)}>{getDefaultCurrency(appSettings)}</option>
            <option value="USD">USD</option>
            <option value="PHP">PHP</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="JPY">JPY</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
          <input
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock</label>
          <input
            type="number"
            value={formData.minStock}
            onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Stock</label>
          <input
            type="number"
            value={formData.maxStock}
            onChange={(e) => setFormData({ ...formData, maxStock: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
    </div>
  );
}

// Edit Product Form Component
function EditProductForm({ 
  formData, 
  setFormData,
  appSettings
}: {
  appSettings: AppSettings | null; 
  formData: {
    name: string;
    title: string;
    description: string;
    category: ProductCategory;
    subcategory: string;
    brand: string;
    sku: string;
    retailPrice: string;
    wholesalePrice: string;
    currency: string;
    quantity: string;
    minStock: string;
    maxStock: string;
    location: string;
    isActive: boolean;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    name: string;
    title: string;
    description: string;
    category: ProductCategory;
    subcategory: string;
    brand: string;
    sku: string;
    retailPrice: string;
    wholesalePrice: string;
    currency: string;
    quantity: string;
    minStock: string;
    maxStock: string;
    location: string;
    isActive: boolean;
  }>>;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as ProductCategory })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="cleaning_supplies">Cleaning Supplies</option>
            <option value="tools">Tools</option>
            <option value="materials">Materials</option>
            <option value="equipment">Equipment</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory *</label>
          <input
            type="text"
            value={formData.subcategory}
            onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Brand *</label>
          <input
            type="text"
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
          <input
            type="text"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Retail Price *</label>
          <input
            type="number"
            step="0.01"
            value={formData.retailPrice}
            onChange={(e) => setFormData({ ...formData, retailPrice: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Wholesale Price</label>
          <input
            type="number"
            step="0.01"
            value={formData.wholesalePrice}
            onChange={(e) => setFormData({ ...formData, wholesalePrice: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
          <select
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={getDefaultCurrency(appSettings)}>{getDefaultCurrency(appSettings)}</option>
            <option value="USD">USD</option>
            <option value="PHP">PHP</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="JPY">JPY</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
          <input
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock</label>
          <input
            type="number"
            value={formData.minStock}
            onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Stock</label>
          <input
            type="number"
            value={formData.maxStock}
            onChange={(e) => setFormData({ ...formData, maxStock: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Active</span>
        </label>
      </div>
    </div>
  );
}

// Image Upload Form Component
function ImageUploadForm({ 
  product,
  onFilesChange, 
  selectedFiles,
  onImageDelete
}: { 
  product: Product;
  onFilesChange: (files: File[]) => void;
  selectedFiles: File[];
  onImageDelete: (imageId: string) => Promise<void>;
}) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      onFilesChange([...selectedFiles, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    onFilesChange(selectedFiles.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Images</label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">You can select multiple images</p>
      </div>
      {selectedFiles.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Selected Images ({selectedFiles.length})</label>
          <div className="grid grid-cols-3 gap-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative">
                <Image
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  width={200}
                  height={96}
                  className="w-full h-24 object-cover rounded border border-gray-300"
                  unoptimized
                />
                <button
                  onClick={() => removeFile(index)}
                  className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                >
                  <X className="w-3 h-3" />
                </button>
                <p className="text-xs text-gray-600 truncate mt-1">{file.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {product.images && product.images.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Existing Images</label>
          <div className="grid grid-cols-3 gap-2">
            {(product.images as ProductImageWithId[]).map((image, index) => (
              <div key={index} className="relative">
                <Image
                  src={image.url || image.thumbnail || ''}
                  alt={image.alt || `Product image ${index + 1}`}
                  width={200}
                  height={96}
                  className="w-full h-24 object-cover rounded border border-gray-300"
                  unoptimized
                />
                <button
                  onClick={() => {
                    if (image.publicId || image._id) {
                      onImageDelete(image.publicId || image._id || '');
                    }
                  }}
                  className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

