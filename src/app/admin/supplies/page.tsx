"use client";

import { useSession } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { makeClientAuthenticatedRequestWithEndpointSafe, makeClientAuthenticatedRequestWithPathSafe } from "@/lib/client-api-utils";
import { API_ENDPOINTS } from "@/lib/api";
import { Loading } from "@/components/ui/loading";
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  TrendingUp,
  DollarSign,
  Users,
  Star,
  RefreshCw,
  XCircle
} from "lucide-react";

interface Supply {
  _id: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  brand: string;
  sku: string;
  tags: string[];
  isActive: boolean;
  isSubscriptionEligible: boolean;
  pricing: {
    retailPrice: number;
    wholesalePrice: number;
    currency: string;
  };
  inventory: {
    quantity: number;
    minStock: number;
    maxStock: number;
    location: string;
  };
  specifications: {
    weight: string;
    material: string;
    color: string;
  };
  supplier: {
    _id: string;
    firstName: string;
    lastName: string;
    profile: {
      rating: number;
    };
  };
  images: string[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface SuppliesResponse {
  success: boolean;
  data: Supply[];
  pagination?: {
    page: number;
    pages: number;
    total: number;
    count: number;
  };
}

export default function SuppliesAdmin() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    count: 0
  });
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [selectedSupply, setSelectedSupply] = useState<Supply | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'view' | 'edit' | 'delete'>('view');
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  const fetchSupplies = useCallback(async (page = 1) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setPaginationLoading(true);
      }
      setError(null);
      
      // Use admin API endpoint for proper admin access
      const response = await makeClientAuthenticatedRequestWithEndpointSafe(
        'suppliesAdmin' as keyof typeof API_ENDPOINTS,
        { method: 'GET', query: { type: 'supplies', page: String(page), limit: '10', category: filterCategory !== 'all' ? filterCategory : '' } }
      );
      const data: SuppliesResponse = await response.json();
      
      if (data.success) {
        setSupplies(data.data || []);
        setPagination({
          page: data.pagination?.page || page,
          pages: data.pagination?.pages || 1,
          total: data.pagination?.total || 0,
          count: data.pagination?.total || 0
        });
      } else {
        console.error("Failed to fetch supplies:", data);
        setError("Failed to fetch supplies. Please try again.");
        setSupplies([]);
      }
    } catch (error) {
      console.error("Error fetching supplies:", error);
      setError("An error occurred while fetching supplies. Please try again.");
      setSupplies([]);
    } finally {
      setLoading(false);
      setPaginationLoading(false);
    }
  }, [filterCategory]);

  useEffect(() => {
    fetchSupplies();
  }, [fetchSupplies]);

  // Refetch when filter changes
  useEffect(() => {
    fetchSupplies(1);
  }, [fetchSupplies]);

  const handleAction = (supply: Supply, action: 'view' | 'edit' | 'delete') => {
    setSelectedSupply(supply);
    setModalType(action);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSupply(null);
  };

  const handleDeleteSupply = async (supplyId: string) => {
    try {
      setActionLoading(true);
      setError(null);
      
      const response = await makeClientAuthenticatedRequestWithPathSafe(
        'suppliesAdminDelete' as keyof typeof API_ENDPOINTS,
        [supplyId],
        {},
        { method: 'DELETE' }
      );
      
      if (response.ok) {
        // Refresh the supplies list
        await fetchSupplies(pagination.page);
        setSuccessMessage('Supply deleted successfully');
        handleCloseModal();
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete supply');
      }
    } catch (error) {
      console.error('Error deleting supply:', error);
      setError('An error occurred while deleting the supply');
    } finally {
      setActionLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return <Loading text="Loading supplies" fullScreen />;
  }

  if (!session) {
    return null;
  }

  const filteredSupplies = supplies.filter(supply => {
    const matchesSearch = supply.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supply.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supply.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supply.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || supply.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Supplies Management
          </h1>
          <p className="text-gray-600 text-sm">Manage supply products, orders, and inventory</p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center space-x-2">
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 hover:shadow-md">
            <Plus className="w-4 h-4 mr-2" />
            Add Supply
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded shadow p-3 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Total Supplies</p>
                <p className="text-lg font-bold text-gray-900">{pagination.total}</p>
                <p className="text-xs text-gray-500">All products</p>
              </div>
              <Package className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded shadow p-3 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Active Supplies</p>
                <p className="text-lg font-bold text-gray-900">{supplies.filter(s => s.isActive).length}</p>
                <p className="text-xs text-gray-500">Currently active</p>
              </div>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded shadow p-3 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Avg. Retail Price</p>
                <p className="text-lg font-bold text-gray-900">
                  ${supplies.length > 0 ? (supplies.reduce((sum, s) => sum + s.pricing.retailPrice, 0) / supplies.length).toFixed(2) : '0.00'}
                </p>
                <p className="text-xs text-gray-500">Average price</p>
              </div>
              <DollarSign className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-white rounded shadow p-3 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Unique Suppliers</p>
                <p className="text-lg font-bold text-gray-900">
                  {new Set(supplies.map(s => s.supplier._id)).size}
                </p>
                <p className="text-xs text-gray-500">Active suppliers</p>
              </div>
              <Users className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircle className="h-4 w-4 text-red-400" />
              </div>
              <div className="ml-2">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-600"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Display */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <Star className="h-4 w-4 text-green-400" />
              </div>
              <div className="ml-2">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setSuccessMessage(null)}
                  className="text-green-400 hover:text-green-600"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded shadow">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">Filters & Search</h3>
              <div className="flex items-center space-x-2">
                <button className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <Filter className="w-3 h-3 mr-1" />
                  Show Filters
                </button>
              </div>
            </div>
          </div>
          <div className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search supplies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="cleaning_supplies">Cleaning Supplies</option>
                  <option value="tools">Tools</option>
                  <option value="materials">Materials</option>
                  <option value="equipment">Equipment</option>
                  <option value="safety">Safety</option>
                  <option value="office_supplies">Office Supplies</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Supplies Table */}
        <div className="bg-white rounded shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">Supplies</h3>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => fetchSupplies(pagination.page)}
                  className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  disabled={paginationLoading}
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${paginationLoading ? 'animate-spin' : ''}`} />
                  {paginationLoading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supply
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pricing
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inventory
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
              {filteredSupplies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center">
                    <div className="text-center">
                      <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <h3 className="text-sm font-medium text-gray-900 mb-1">No supplies found</h3>
                      <p className="text-xs text-gray-500">Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSupplies.map((supply) => (
                  <tr key={supply._id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      <div className="flex items-center">
                        <div className="h-8 w-8 flex-shrink-0">
                          <div className="h-8 w-8 rounded bg-gray-200 flex items-center justify-center">
                            <Package className="w-4 h-4 text-gray-500" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-xs font-medium text-gray-900">
                            {supply.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {supply.brand} • {supply.sku}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium text-green-600 bg-green-100">
                        {supply.category}
                      </span>
                      {supply.subcategory && (
                        <div className="text-xs text-gray-500 mt-1">{supply.subcategory}</div>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      <div className="text-xs font-medium text-gray-900">
                        ${supply.pricing.retailPrice.toFixed(2)} {supply.pricing.currency}
                      </div>
                      <div className="text-xs text-gray-500">
                        Wholesale: ${supply.pricing.wholesalePrice.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      <div className="text-xs font-medium text-gray-900">
                        {supply.inventory.quantity} units
                      </div>
                      <div className="text-xs text-gray-500">
                        Min: {supply.inventory.minStock} • Max: {supply.inventory.maxStock}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      <div className="text-xs font-medium text-gray-900">
                        {supply.supplier.firstName} {supply.supplier.lastName}
                      </div>
                      <div className="flex items-center">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span className="ml-1 text-xs text-gray-500">
                          {supply.supplier.profile.rating.toFixed(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                        supply.isActive 
                          ? 'text-green-600 bg-green-100' 
                          : 'text-red-600 bg-red-100'
                      }`}>
                        {supply.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {supply.isSubscriptionEligible && (
                        <div className="text-xs text-blue-600 mt-1">Subscription</div>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      <div className="flex space-x-1">
                        <button 
                          onClick={() => handleAction(supply, 'view')}
                          className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          title="View details"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => handleAction(supply, 'edit')}
                          className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          title="Edit supply"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => handleAction(supply, 'delete')}
                          className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          title="Delete supply"
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

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded shadow">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => fetchSupplies(pagination.page - 1)}
                disabled={pagination.page <= 1 || paginationLoading}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {paginationLoading ? '...' : 'Previous'}
              </button>
              <button
                onClick={() => fetchSupplies(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages || paginationLoading}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {paginationLoading ? '...' : 'Next'}
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{((pagination.page - 1) * 10) + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * 10, pagination.total)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => fetchSupplies(pagination.page - 1)}
                    disabled={pagination.page <= 1 || paginationLoading}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {paginationLoading ? '...' : 'Previous'}
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const pageNum = Math.max(1, pagination.page - 2) + i;
                    if (pageNum > pagination.pages) return null;
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => fetchSupplies(pageNum)}
                        disabled={paginationLoading}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pageNum === pagination.page
                            ? 'z-10 bg-green-50 border-green-500 text-green-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => fetchSupplies(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages || paginationLoading}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {paginationLoading ? '...' : 'Next'}
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}

      {/* Modal */}
      {showModal && selectedSupply && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-4 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded bg-white">
            <div className="mt-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900">
                  {modalType === 'view' && 'Supply Details'}
                  {modalType === 'edit' && 'Edit Supply'}
                  {modalType === 'delete' && 'Delete Supply'}
                </h3>
                <button 
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              
              {modalType === 'view' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                      <p className="text-sm text-gray-900">{selectedSupply.name}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Brand</label>
                      <p className="text-sm text-gray-900">{selectedSupply.brand}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">SKU</label>
                      <p className="text-sm text-gray-900">{selectedSupply.sku}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                      <p className="text-sm text-gray-900">{selectedSupply.category}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Retail Price</label>
                      <p className="text-sm text-gray-900">${selectedSupply.pricing.retailPrice.toFixed(2)} {selectedSupply.pricing.currency}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Wholesale Price</label>
                      <p className="text-sm text-gray-900">${selectedSupply.pricing.wholesalePrice.toFixed(2)} {selectedSupply.pricing.currency}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                      <p className="text-sm text-gray-900">{selectedSupply.inventory.quantity} units</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedSupply.isActive 
                          ? 'text-green-600 bg-green-100' 
                          : 'text-red-600 bg-red-100'
                      }`}>
                        {selectedSupply.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                    <p className="text-sm text-gray-900">{selectedSupply.description}</p>
                  </div>
                </div>
              )}
              
              {modalType === 'delete' && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Are you sure you want to delete &quot;{selectedSupply.name}&quot;? This action cannot be undone.
                  </p>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={handleCloseModal}
                      className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDeleteSupply(selectedSupply._id)}
                      disabled={actionLoading}
                      className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
