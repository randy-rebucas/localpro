"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Filter,
  Package,
  Clock,
  Coins,
  Star,
  MapPin,
  Truck,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone,
  Mail,
  ArrowLeft,
  ChevronDown,
  Eye,
  ExternalLink,
  Calendar,
  ShoppingBag,
  TrendingUp
} from "lucide-react";
import { ListSkeleton } from "@/components/ui/loading";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { formatCurrency } from "@/lib/currency-utils";
import { useAppSettings } from "@/hooks/useAppSettings";

export interface SupplyOrder {
  id: string;
  supplyId: string;
  supply: {
    id: string;
    name: string;
    description: string;
    category: string;
    type: string;
    price: number;
    unit: string;
    images: string[];
    supplier: {
      id: string;
      name: string;
      avatar?: string;
      rating: number;
      reviewCount: number;
      verified: boolean;
      location: string;
    };
  };
  quantity: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
    email: string;
  };
  delivery: {
    estimatedDays: number;
    cost: number;
    trackingNumber?: string;
    carrier?: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
  cancelledAt?: string;
}

const statuses = [
  "All Status",
  "Pending",
  "Confirmed",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
  "Returned"
];

const paymentStatuses = [
  "All Payment",
  "Pending",
  "Paid",
  "Failed",
  "Refunded"
];

const getStatusColor = (status: SupplyOrder['status']) => {
  switch (status) {
    case 'pending': return 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white';
    case 'confirmed': return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
    case 'processing': return 'bg-gradient-to-r from-purple-500 to-violet-500 text-white';
    case 'shipped': return 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white';
    case 'delivered': return 'bg-gradient-to-r from-emerald-500 to-green-500 text-white';
    case 'cancelled': return 'bg-gradient-to-r from-red-500 to-rose-500 text-white';
    case 'returned': return 'bg-gradient-to-r from-gray-500 to-slate-500 text-white';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getPaymentStatusColor = (status: SupplyOrder['paymentStatus']) => {
  switch (status) {
    case 'pending': return 'bg-amber-100 text-amber-700 border border-amber-200';
    case 'paid': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    case 'failed': return 'bg-red-100 text-red-700 border border-red-200';
    case 'refunded': return 'bg-gray-100 text-gray-700 border border-gray-200';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusIcon = (status: SupplyOrder['status']) => {
  switch (status) {
    case 'pending': return <Clock className="w-3.5 h-3.5" />;
    case 'confirmed': return <CheckCircle className="w-3.5 h-3.5" />;
    case 'processing': return <Package className="w-3.5 h-3.5" />;
    case 'shipped': return <Truck className="w-3.5 h-3.5" />;
    case 'delivered': return <CheckCircle className="w-3.5 h-3.5" />;
    case 'cancelled': return <XCircle className="w-3.5 h-3.5" />;
    case 'returned': return <AlertCircle className="w-3.5 h-3.5" />;
    default: return <Clock className="w-3.5 h-3.5" />;
  }
};

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<SupplyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("All Payment");
  const [showFilters, setShowFilters] = useState(false);
  const router = useRouter();
  const { settings: appSettings } = useAppSettings();

  // Mock data for development
  const mockOrders = useMemo((): SupplyOrder[] => [
    {
      id: '1',
      supplyId: '1',
      supply: {
        id: '1',
        name: 'Professional Cleaning Kit - Complete Set',
        description: 'Complete cleaning kit with all essential tools and supplies for professional cleaning services.',
        category: 'Cleaning Supplies',
        type: 'cleaning',
        price: 4500,
        unit: 'set',
        images: ['https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400'],
        supplier: {
          id: '1',
          name: 'Professional Supply Co.',
          rating: 4.8,
          reviewCount: 156,
          verified: true,
          location: 'Makati City'
        }
      },
      quantity: 2,
      totalPrice: 9000,
      status: 'shipped',
      paymentStatus: 'paid',
      shippingAddress: {
        name: 'Juan Dela Cruz',
        address: '123 Rizal Street',
        city: 'Quezon City',
        state: 'Metro Manila',
        zipCode: '1100',
        phone: '+63-917-123-4567',
        email: 'juan@example.com'
      },
      delivery: {
        estimatedDays: 2,
        cost: 150,
        trackingNumber: 'TRK123456789',
        carrier: 'LBC'
      },
      notes: 'Please deliver during business hours',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '2',
      supplyId: '2',
      supply: {
        id: '2',
        name: 'Heavy Duty Drill Set - 20 Piece',
        description: 'Professional grade drill set with various bits and accessories.',
        category: 'Tools & Equipment',
        type: 'tools',
        price: 7500,
        unit: 'set',
        images: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400'],
        supplier: {
          id: '2',
          name: 'Tool Supply Depot',
          rating: 4.6,
          reviewCount: 89,
          verified: true,
          location: 'Pasig City'
        }
      },
      quantity: 1,
      totalPrice: 7500,
      status: 'delivered',
      paymentStatus: 'paid',
      shippingAddress: {
        name: 'Juan Dela Cruz',
        address: '123 Rizal Street',
        city: 'Quezon City',
        state: 'Metro Manila',
        zipCode: '1100',
        phone: '+63-917-123-4567',
        email: 'juan@example.com'
      },
      delivery: {
        estimatedDays: 3,
        cost: 200,
        trackingNumber: 'TRK987654321',
        carrier: 'JRS Express'
      },
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '3',
      supplyId: '3',
      supply: {
        id: '3',
        name: 'Monthly Cleaning Subscription Box',
        description: 'Monthly subscription box with curated cleaning supplies delivered to your door.',
        category: 'Maintenance Kits',
        type: 'subscription',
        price: 1500,
        unit: 'box',
        images: ['https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=400'],
        supplier: {
          id: '3',
          name: 'Subscription Supply Co.',
          rating: 4.9,
          reviewCount: 234,
          verified: true,
          location: 'Taguig City'
        }
      },
      quantity: 1,
      totalPrice: 1500,
      status: 'processing',
      paymentStatus: 'paid',
      shippingAddress: {
        name: 'Juan Dela Cruz',
        address: '123 Rizal Street',
        city: 'Quezon City',
        state: 'Metro Manila',
        zipCode: '1100',
        phone: '+63-917-123-4567',
        email: 'juan@example.com'
      },
      delivery: {
        estimatedDays: 1,
        cost: 0,
        trackingNumber: 'TRK456789123',
        carrier: 'Grab Express'
      },
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  ], []);

  useEffect(() => {
    const fetchMyOrders = async () => {
      try {
        setLoading(true);
        if (!getApiToken()) {
          setOrders(mockOrders);
          return;
        }
        
        const url = `${API_BASE_URL}${API_ENDPOINTS.suppliesMyOrders}`;
        const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));

        if (!response.ok) {
          logger.debug('My orders API not available, using sample data', { status: response.status });
          setOrders(mockOrders);
          return;
        }

        const data = await response.json();
        const ordersData = data.orders || data.data || data || [];
        
        if (Array.isArray(ordersData) && ordersData.length > 0) {
          setOrders(ordersData);
        } else {
          setOrders([]);
        }
      } catch (error) {
        logger.debug('Could not fetch my orders, using sample data', { error: error instanceof Error ? error.message : String(error) });
        setOrders(mockOrders);
      } finally {
        setLoading(false);
      }
    };

    fetchMyOrders();
  }, [mockOrders]);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.supply.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.supply.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.supply.supplier.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === "All Status" || order.status === selectedStatus.toLowerCase();
    const matchesPaymentStatus = selectedPaymentStatus === "All Payment" || order.paymentStatus === selectedPaymentStatus.toLowerCase();
    
    return matchesSearch && matchesStatus && matchesPaymentStatus;
  });

  const handleViewOrder = (orderId: string) => {
    router.push(`/supplies/orders/${orderId}`);
  };

  const handleViewSupply = (supplyId: string) => {
    router.push(`/supplies/${supplyId}`);
  };

  const handleCancelOrder = async (orderId: string) => {
    if (confirm('Are you sure you want to cancel this order?')) {
      try {
        if (!getApiToken()) return;
        
        const endpoint = API_ENDPOINTS.suppliesOrderStatus?.includes('[id]')
          ? API_ENDPOINTS.suppliesOrderStatus.replace('[id]', orderId).replace('[action]', 'cancel')
          : `${API_ENDPOINTS.suppliesMyOrders}/${orderId}/cancel`;
        const url = `${API_BASE_URL}${endpoint}`;
        const response = await fetch(url, createAuthFetchOptions({ method: 'PUT' }));

        if (response.ok) {
          setOrders(prev => prev.map(order => 
            order.id === orderId 
              ? { ...order, status: 'cancelled' as const, cancelledAt: new Date().toISOString() }
              : order
          ));
        } else {
          logger.error('Error cancelling order', new Error('Order cancellation failed'), { orderId, status: response.status });
        }
      } catch (error) {
        logger.error('Error cancelling order', error instanceof Error ? error : new Error(String(error)), { orderId });
      }
    }
  };

  const handleTrackOrder = (order: SupplyOrder) => {
    if (order.delivery.trackingNumber) {
      window.open(`https://www.${order.delivery.carrier?.toLowerCase().replace(/\s/g, '')}.com/tracking/${order.delivery.trackingNumber}`, '_blank');
    }
  };

  // Stats calculations
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(order => order.status === 'pending' || order.status === 'processing').length;
  const deliveredOrders = orders.filter(order => order.status === 'delivered').length;
  const totalSpent = orders.reduce((sum, order) => sum + order.totalPrice, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-8">
            <Link
              href="/supplies"
              className="p-2.5 hover:bg-white rounded-lg transition-all border-2 border-transparent hover:border-gray-200 hover:shadow-sm"
              title="Back to Supplies"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
              <p className="text-sm text-gray-600">Loading your orders...</p>
            </div>
          </div>
          <ListSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-green-200/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/supplies"
            className="p-2.5 hover:bg-white rounded-lg transition-all border-2 border-transparent hover:border-gray-200 hover:shadow-sm"
            title="Back to Supplies"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
            <p className="text-sm text-gray-600">
              {totalOrders} order{totalOrders !== 1 ? "s" : ""} • {formatCurrency(totalSpent, 'PHP', { appSettings })} total spent
            </p>
          </div>
          <Link
            href="/supplies"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg font-semibold shadow-lg shadow-emerald-500/20 hover:from-emerald-700 hover:to-emerald-800 hover:shadow-xl transition-all"
          >
            <Package className="w-4 h-4" />
            Browse Supplies
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-5 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{totalOrders}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-5 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">In Progress</p>
                <p className="text-3xl font-bold text-amber-600 mt-1">{pendingOrders}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl flex items-center justify-center shadow-md">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-5 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Delivered</p>
                <p className="text-3xl font-bold text-emerald-600 mt-1">{deliveredOrders}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center shadow-md">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-5 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Spent</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {formatCurrency(totalSpent, 'PHP', { appSettings })}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center shadow-md">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Filters */}
          <div className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-5 sticky top-4">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-gray-900">Filters</h3>
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>
              </div>
              
              <div className={`space-y-5 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                {/* Search */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Search Orders</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search orders..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm"
                    />
                  </div>
                </div>

                {/* Order Status */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Order Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm appearance-none bg-white cursor-pointer"
                  >
                    {statuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                {/* Payment Status */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Payment Status</label>
                  <select
                    value={selectedPaymentStatus}
                    onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm appearance-none bg-white cursor-pointer"
                  >
                    {paymentStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                {/* Clear Filters */}
                {(searchQuery || selectedStatus !== "All Status" || selectedPaymentStatus !== "All Payment") && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedStatus("All Status");
                      setSelectedPaymentStatus("All Payment");
                    }}
                    className="w-full py-2.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Orders List */}
          <div className="flex-1">
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Package className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No orders found</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {searchQuery || selectedStatus !== "All Status" || selectedPaymentStatus !== "All Payment"
                    ? "Try adjusting your filters to see more results."
                    : "You haven't placed any orders yet. Start shopping to see your orders here!"}
                </p>
                <Link
                  href="/supplies"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-semibold shadow-lg hover:from-emerald-700 hover:to-emerald-800 hover:shadow-xl transition-all"
                >
                  <Package className="w-4 h-4" />
                  Browse Supplies
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 font-medium">
                  Showing {filteredOrders.length} of {orders.length} orders
                </p>
                
                {filteredOrders.map((order) => (
                  <div 
                    key={order.id} 
                    className="bg-white rounded-xl border-2 border-gray-200 shadow-lg hover:shadow-xl hover:border-emerald-300 transition-all overflow-hidden"
                  >
                    <div className="p-5 md:p-6">
                      {/* Order Header */}
                      <div className="flex flex-col md:flex-row md:items-start gap-4 mb-5">
                        {/* Product Image */}
                        <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border-2 border-gray-200">
                          {order.supply.images.length > 0 ? (
                            <Image
                              src={order.supply.images[0]}
                              alt={order.supply.name}
                              width={96}
                              height={96}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                            <h3 className="font-bold text-gray-900 text-lg leading-tight">{order.supply.name}</h3>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${getStatusColor(order.status)}`}>
                                {getStatusIcon(order.status)}
                                <span className="capitalize">{order.status}</span>
                              </span>
                              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${getPaymentStatusColor(order.paymentStatus)}`}>
                                {order.paymentStatus}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{order.supply.description}</p>
                          <div className="flex flex-wrap items-center gap-3 text-sm">
                            <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg font-medium">
                              Qty: {order.quantity}
                            </span>
                            <span className="flex items-center gap-1 text-gray-600">
                              <Coins className="w-4 h-4 text-emerald-600" />
                              {formatCurrency(order.supply.price, 'PHP', { appSettings })}/{order.supply.unit}
                            </span>
                            <span className="font-bold text-emerald-600">
                              Total: {formatCurrency(order.totalPrice, 'PHP', { appSettings })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Order Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                        {/* Shipping Address */}
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <MapPin className="w-4 h-4 text-emerald-600" />
                            <h4 className="text-sm font-semibold text-gray-900">Shipping Address</h4>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p className="font-medium text-gray-800">{order.shippingAddress.name}</p>
                            <p>{order.shippingAddress.address}</p>
                            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                            <div className="flex items-center gap-4 pt-2">
                              <span className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-gray-400" />
                                {order.shippingAddress.phone}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-gray-400" />
                              {order.shippingAddress.email}
                            </div>
                          </div>
                        </div>
                        
                        {/* Supplier Info */}
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Package className="w-4 h-4 text-emerald-600" />
                            <h4 className="text-sm font-semibold text-gray-900">Supplier</h4>
                          </div>
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                              {order.supply.supplier.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{order.supply.supplier.name}</p>
                              <div className="flex items-center gap-1.5">
                                <Star className="w-4 h-4 text-amber-400 fill-current" />
                                <span className="text-sm text-gray-600">
                                  {order.supply.supplier.rating} ({order.supply.supplier.reviewCount} reviews)
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            {order.supply.supplier.location}
                          </div>
                        </div>
                      </div>

                      {/* Order Progress Timeline */}
                      {['confirmed', 'processing', 'shipped', 'delivered'].includes(order.status) && (
                        <div className="mb-5 p-4 bg-gradient-to-r from-gray-50 to-emerald-50/50 rounded-xl border border-gray-200">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-gray-900">Order Progress</h4>
                            {order.delivery.trackingNumber && order.status === 'shipped' && (
                              <button
                                onClick={() => handleTrackOrder(order)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                Track via {order.delivery.carrier}
                              </button>
                            )}
                          </div>
                          
                          {/* Progress Steps */}
                          <div className="flex items-center justify-between relative">
                            {/* Progress Line Background */}
                            <div className="absolute top-4 left-0 right-0 h-1 bg-gray-200 rounded-full"></div>
                            
                            {/* Progress Line Fill */}
                            <div 
                              className="absolute top-4 left-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500"
                              style={{ 
                                width: order.status === 'confirmed' ? '0%' 
                                     : order.status === 'processing' ? '33%' 
                                     : order.status === 'shipped' ? '66%' 
                                     : order.status === 'delivered' ? '100%' 
                                     : '0%' 
                              }}
                            ></div>
                            
                            {/* Step: Confirmed */}
                            <div className="relative z-10 flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                ['confirmed', 'processing', 'shipped', 'delivered'].includes(order.status)
                                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md'
                                  : 'bg-gray-200 text-gray-400'
                              }`}>
                                <CheckCircle className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-medium text-gray-600 mt-2">Confirmed</span>
                            </div>
                            
                            {/* Step: Processing */}
                            <div className="relative z-10 flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                ['processing', 'shipped', 'delivered'].includes(order.status)
                                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md'
                                  : 'bg-gray-200 text-gray-400'
                              }`}>
                                <Package className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-medium text-gray-600 mt-2">Processing</span>
                            </div>
                            
                            {/* Step: Shipped */}
                            <div className="relative z-10 flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                ['shipped', 'delivered'].includes(order.status)
                                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md'
                                  : 'bg-gray-200 text-gray-400'
                              }`}>
                                <Truck className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-medium text-gray-600 mt-2">Shipped</span>
                            </div>
                            
                            {/* Step: Delivered */}
                            <div className="relative z-10 flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                order.status === 'delivered'
                                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md'
                                  : 'bg-gray-200 text-gray-400'
                              }`}>
                                <CheckCircle className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-medium text-gray-600 mt-2">Delivered</span>
                            </div>
                          </div>
                          
                          {/* Tracking Number (only for shipped) */}
                          {order.delivery.trackingNumber && order.status === 'shipped' && (
                            <div className="mt-4 pt-3 border-t border-gray-200">
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Tracking #:</span> {order.delivery.trackingNumber}
                              </p>
                            </div>
                          )}
                          
                          {/* Delivery Confirmation (for delivered) */}
                          {order.status === 'delivered' && order.deliveredAt && (
                            <div className="mt-4 pt-3 border-t border-gray-200 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                              <p className="text-sm text-emerald-700 font-medium">
                                Delivered on {new Date(order.deliveredAt).toLocaleDateString('en-PH', { 
                                  weekday: 'long',
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Order Footer */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t-2 border-gray-100">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            Ordered: {new Date(order.createdAt).toLocaleDateString('en-PH', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                          {order.deliveredAt && (
                            <span className="flex items-center gap-1.5 text-emerald-600">
                              <CheckCircle className="w-4 h-4" />
                              Delivered: {new Date(order.deliveredAt).toLocaleDateString('en-PH', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleViewSupply(order.supplyId)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            View Supply
                          </button>
                          <button
                            onClick={() => handleViewOrder(order.id)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </button>
                          {order.status === 'pending' && (
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                              Cancel Order
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
