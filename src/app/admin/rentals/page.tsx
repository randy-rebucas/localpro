"use client";

import { useSession } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loading } from "@/components/ui/loading";
import { 
  Home, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  MapPin,
  DollarSign,
  Star,
  Users
} from "lucide-react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";

interface Pricing {
  hourly: number;
  daily: number;
  weekly: number;
  monthly: number;
  currency: string;
}

interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface Location {
  address: Address;
  pickupRequired: boolean;
  deliveryAvailable: boolean;
  deliveryFee: number;
}

interface Dimensions {
  unit: string;
}

interface Weight {
  unit: string;
}

interface Specifications {
  dimensions: Dimensions;
  weight: Weight;
  brand: string;
  model: string;
  condition: string;
  features: string[];
}

interface Requirements {
  minAge: number;
  licenseRequired: boolean;
  deposit: number;
  insuranceRequired: boolean;
}

interface Maintenance {
  serviceHistory: unknown[];
}

interface Rating {
  average: number;
  count: number;
}

interface Owner {
  profile: {
    rating: number;
  };
  _id: string;
  firstName: string;
  lastName: string;
}

interface Availability {
  isAvailable: boolean;
  schedule: unknown[];
}

interface Rental {
  _id: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  pricing: Pricing;
  availability: Availability;
  location: Location;
  specifications: Specifications;
  requirements: Requirements;
  maintenance: Maintenance;
  rating: Rating;
  owner: Owner;
  isActive: boolean;
  images: unknown[];
  documents: unknown[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface ApiResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  pages: number;
  data: Rental[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}


export default function RentalsAdmin() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRentals, setTotalRentals] = useState(0);
  const [stats, setStats] = useState({
    totalRentals: 0,
    availableRentals: 0,
    averageDailyRate: 0,
    totalProviders: 0
  });

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  useEffect(() => {
    fetchRentals();
    fetchStats();
  }, [currentPage, filterCategory, filterStatus, searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchRentals = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        type: 'rentals',
        page: currentPage.toString(),
        limit: '20',
        ...(filterCategory !== 'all' && { category: filterCategory }),
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(searchTerm && { search: searchTerm })
      });
      
      const response = await fetch(`${API_BASE_URL}/api/admin/rentals?${params}`, createAuthFetchOptions());
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const apiResponse: ApiResponse = await response.json();
      
      if (apiResponse.success && apiResponse.data) {
        setRentals(apiResponse.data);
        if (apiResponse.pagination) {
          setTotalPages(apiResponse.pagination.pages);
          setTotalRentals(apiResponse.pagination.total);
        }
      } else {
        console.error("Failed to fetch rentals:", apiResponse);
        setRentals([]);
      }
    } catch (error) {
      console.error("Error fetching rentals:", error);
      setRentals([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await (await import("@/lib/client-api-utils")).makeClientAuthenticatedRequestWithEndpointSafe(
        'rentalsStatistics' as keyof typeof API_ENDPOINTS,
        { method: 'GET' }
      );
      
      if (!response.ok) {
        console.warn(`Stats API returned ${response.status}, using fallback data`);
        // Set fallback stats instead of throwing error
        setStats({
          totalRentals: 0,
          availableRentals: 0,
          averageDailyRate: 0,
          totalProviders: 0
        });
        return;
      }
      
      const apiResponse = await response.json();
      
      if (apiResponse.success && apiResponse.data) {
        setStats(apiResponse.data);
      } else {
        console.warn("Stats API returned unsuccessful response, using fallback data");
        setStats({
          totalRentals: 0,
          availableRentals: 0,
          averageDailyRate: 0,
          totalProviders: 0
        });
      }
    } catch (error) {
      console.warn("Error fetching stats, using fallback data:", error);
      setStats({
        totalRentals: 0,
        availableRentals: 0,
        averageDailyRate: 0,
        totalProviders: 0
      });
    }
  };

  if (status === "loading" || loading) {
    return <Loading text="Loading rentals" fullScreen />;
  }

  if (!session) {
    return null;
  }

  const filteredRentals = rentals.filter(rental => {
    const matchesSearch = rental.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rental.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rental.specifications.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rental.specifications.model?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || rental.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Rentals Management
          </h1>
          <p className="text-gray-600 text-sm">Manage rental items, bookings, and availability</p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center space-x-2">
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 hover:shadow-md">
            <Plus className="w-4 h-4 mr-2" />
            Add Rental
          </button>
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 hover:shadow-md">
            <Filter className="w-4 h-4 mr-2" />
            Export Data
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded shadow p-3 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Total Rentals</p>
              <p className="text-lg font-bold text-gray-900">{stats.totalRentals || totalRentals}</p>
              <p className="text-xs text-gray-500">All items</p>
            </div>
            <Home className="w-5 h-5 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded shadow p-3 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Available Items</p>
              <p className="text-lg font-bold text-gray-900">
                {stats.availableRentals || rentals.filter(rental => rental.availability.isAvailable).length}
              </p>
              <p className="text-xs text-gray-500">Ready to rent</p>
            </div>
            <Calendar className="w-5 h-5 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded shadow p-3 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Avg Daily Rate</p>
              <p className="text-lg font-bold text-gray-900">
                ${stats.averageDailyRate || (rentals.length > 0 ? (rentals.reduce((sum, rental) => sum + rental.pricing.daily, 0) / rentals.length).toFixed(0) : "0")}
              </p>
              <p className="text-xs text-gray-500">Per day</p>
            </div>
            <DollarSign className="w-5 h-5 text-purple-600" />
          </div>
        </div>
        
        <div className="bg-white rounded shadow p-3 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Providers</p>
              <p className="text-lg font-bold text-gray-900">
                {stats.totalProviders || new Set(rentals.map(rental => rental.owner._id)).size}
              </p>
              <p className="text-xs text-gray-500">Active owners</p>
            </div>
            <Users className="w-5 h-5 text-yellow-600" />
          </div>
        </div>
      </div>

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
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
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
            <div className="flex gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="tools">Tools</option>
                  <option value="equipment">Equipment</option>
                  <option value="vehicles">Vehicles</option>
                  <option value="machinery">Machinery</option>
                  <option value="electronics">Electronics</option>
                  <option value="furniture">Furniture</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="available">Available</option>
                  <option value="unavailable">Unavailable</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rentals Table */}
      <div className="bg-white rounded shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Rental Items</h3>
            <div className="flex items-center space-x-2">
              <button className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <Filter className="w-3 h-3 mr-1" />
                Sort
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rental Item
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pricing
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Specifications
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Availability
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRentals.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center">
                    <div className="text-center">
                      <Home className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <h3 className="text-sm font-medium text-gray-900 mb-1">No rentals found</h3>
                      <p className="text-xs text-gray-500">Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRentals.map((rental, index) => (
                  <tr key={rental._id || index} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      <div className="flex items-center">
                        <div className="h-8 w-8 flex-shrink-0">
                          <div className="h-8 w-8 rounded bg-gray-200 flex items-center justify-center">
                            <Home className="w-4 h-4 text-gray-500" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-xs font-medium text-gray-900">
                            {rental.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {rental.description}
                          </div>
                          <div className="text-xs text-gray-400">
                            {rental.subcategory}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {rental.category}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      <div>
                        <div className="font-medium">${rental.pricing.daily}/{rental.pricing.currency}</div>
                        <div className="text-xs text-gray-500">
                          ${rental.pricing.hourly}/hr • ${rental.pricing.weekly}/wk
                        </div>
                        <div className="text-xs text-gray-500">
                          ${rental.pricing.monthly}/mo
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      <div>
                        <div className="flex items-center">
                          <MapPin className="w-3 h-3 text-gray-400 mr-1" />
                          <span className="font-medium">{rental.location.address.city}, {rental.location.address.state}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {rental.location.address.street}
                        </div>
                        <div className="text-xs text-gray-500">
                          {rental.location.pickupRequired ? "Pickup required" : "Delivery available"}
                          {rental.location.deliveryAvailable && rental.location.deliveryFee > 0 && 
                            ` • $${rental.location.deliveryFee} delivery fee`}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      <div>
                        <div className="font-medium">{rental.specifications.brand} {rental.specifications.model}</div>
                        <div className="text-xs text-gray-500">
                          Condition: {rental.specifications.condition}
                        </div>
                        <div className="text-xs text-gray-500">
                          {rental.specifications.features.slice(0, 2).join(", ")}
                          {rental.specifications.features.length > 2 && "..."}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      <div>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                          rental.availability.isAvailable 
                            ? "text-green-600 bg-green-100" 
                            : "text-red-600 bg-red-100"
                        }`}>
                          {rental.availability.isAvailable ? "Available" : "Unavailable"}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          {rental.availability.schedule.length > 0 ? "Scheduled" : "Open"}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      <div className="flex items-center">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span className="ml-1 text-xs text-gray-700">
                          {rental.rating.average > 0 ? rental.rating.average.toFixed(1) : "No rating"}
                        </span>
                        <span className="text-xs text-gray-500 ml-1">
                          ({rental.rating.count})
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      <div>
                        <div className="font-medium">{rental.owner.firstName} {rental.owner.lastName}</div>
                        <div className="text-xs text-gray-500">
                          Rating: {rental.owner.profile.rating > 0 ? rental.owner.profile.rating.toFixed(1) : "New"}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      <div className="flex space-x-1">
                        <button 
                          className="text-blue-600 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 p-1 rounded hover:bg-blue-50" 
                          title="View Details"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        <button 
                          className="text-green-600 hover:text-green-900 focus:outline-none focus:ring-2 focus:ring-green-500 p-1 rounded hover:bg-green-50" 
                          title="Edit Rental"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button 
                          className={`p-1 rounded focus:outline-none focus:ring-2 ${
                            rental.availability.isAvailable 
                              ? "text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50 focus:ring-yellow-500" 
                              : "text-green-600 hover:text-green-900 hover:bg-green-50 focus:ring-green-500"
                          }`}
                          title={rental.availability.isAvailable ? "Mark Unavailable" : "Mark Available"}
                        >
                          <Calendar className="w-3 h-3" />
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 p-1 rounded hover:bg-red-50" 
                          title="Delete Rental"
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
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-700">
                Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, totalRentals)} of {totalRentals} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-xs text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
