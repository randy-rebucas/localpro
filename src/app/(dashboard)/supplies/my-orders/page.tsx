"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Search,
  Filter,
  Package,
  Clock,
  DollarSign,
  Star,
  MapPin,
  Truck,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone,
  Mail
} from "lucide-react";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import { ListSkeleton } from "@/components/ui/loading";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { makeClientAuthenticatedRequestWithEndpointSafe, makeClientAuthenticatedRequestWithPathSafe } from "@/lib/client-api-utils";
import { API_ENDPOINTS } from "@/lib/api";

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
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'confirmed': return 'bg-blue-100 text-blue-800';
    case 'processing': return 'bg-purple-100 text-purple-800';
    case 'shipped': return 'bg-indigo-100 text-indigo-800';
    case 'delivered': return 'bg-green-100 text-green-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    case 'returned': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getPaymentStatusColor = (status: SupplyOrder['paymentStatus']) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'paid': return 'bg-green-100 text-green-800';
    case 'failed': return 'bg-red-100 text-red-800';
    case 'refunded': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusIcon = (status: SupplyOrder['status']) => {
  switch (status) {
    case 'pending': return <Clock className="w-4 h-4" />;
    case 'confirmed': return <CheckCircle className="w-4 h-4" />;
    case 'processing': return <Package className="w-4 h-4" />;
    case 'shipped': return <Truck className="w-4 h-4" />;
    case 'delivered': return <CheckCircle className="w-4 h-4" />;
    case 'cancelled': return <XCircle className="w-4 h-4" />;
    case 'returned': return <AlertCircle className="w-4 h-4" />;
    default: return <Clock className="w-4 h-4" />;
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

  // Mock data for development - remove when API is integrated
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
        price: 89.99,
        unit: 'set',
        images: ['https://via.placeholder.com/400x300'],
        supplier: {
          id: '1',
          name: 'Professional Supply Co.',
          rating: 4.8,
          reviewCount: 156,
          verified: true,
          location: 'New York, NY'
        }
      },
      quantity: 2,
      totalPrice: 179.98,
      status: 'shipped',
      paymentStatus: 'paid',
      shippingAddress: {
        name: 'John Doe',
        address: '123 Main Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        phone: '+1-555-0123',
        email: 'john@example.com'
      },
      delivery: {
        estimatedDays: 2,
        cost: 9.99,
        trackingNumber: 'TRK123456789',
        carrier: 'FedEx'
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
        price: 149.99,
        unit: 'set',
        images: ['https://via.placeholder.com/400x300'],
        supplier: {
          id: '2',
          name: 'Tool Supply Depot',
          rating: 4.6,
          reviewCount: 89,
          verified: true,
          location: 'Los Angeles, CA'
        }
      },
      quantity: 1,
      totalPrice: 149.99,
      status: 'delivered',
      paymentStatus: 'paid',
      shippingAddress: {
        name: 'John Doe',
        address: '123 Main Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        phone: '+1-555-0123',
        email: 'john@example.com'
      },
      delivery: {
        estimatedDays: 3,
        cost: 15.99,
        trackingNumber: 'TRK987654321',
        carrier: 'UPS'
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
        price: 29.99,
        unit: 'box',
        images: ['https://via.placeholder.com/400x300'],
        supplier: {
          id: '3',
          name: 'Subscription Supply Co.',
          rating: 4.9,
          reviewCount: 234,
          verified: true,
          location: 'Chicago, IL'
        }
      },
      quantity: 1,
      totalPrice: 29.99,
      status: 'processing',
      paymentStatus: 'paid',
      shippingAddress: {
        name: 'John Doe',
        address: '123 Main Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        phone: '+1-555-0123',
        email: 'john@example.com'
      },
      delivery: {
        estimatedDays: 1,
        cost: 0,
        trackingNumber: 'TRK456789123',
        carrier: 'USPS'
      },
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  ], []);

  useEffect(() => {
    const fetchMyOrders = async () => {
      try {
        setLoading(true);
        const response = await makeClientAuthenticatedRequestWithEndpointSafe(
          'suppliesMyOrders' as keyof typeof API_ENDPOINTS,
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch my orders');
        }

        const data = await response.json();
        setOrders(data.orders || []);
      } catch (error) {
        console.error('Error fetching my orders:', error);
        // Use mock data when API is unavailable
        setOrders(mockOrders);
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
        const response = await makeClientAuthenticatedRequestWithPathSafe(
          'suppliesOrderStatus' as keyof typeof API_ENDPOINTS,
          [orderId, 'cancel'],
          {},
          { method: 'PUT' }
        );

        if (response.ok) {
          setOrders(prev => prev.map(order => 
            order.id === orderId 
              ? { ...order, status: 'cancelled' as const, cancelledAt: new Date().toISOString() }
              : order
          ));
        } else {
          console.error('Error cancelling order');
        }
      } catch (error) {
        console.error('Error cancelling order:', error);
      }
    }
  };

  const handleTrackOrder = (order: SupplyOrder) => {
    if (order.delivery.trackingNumber) {
      // Open tracking in new tab
      window.open(`https://www.${order.delivery.carrier?.toLowerCase()}.com/tracking/${order.delivery.trackingNumber}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
            <p className="text-gray-600">Track your supply orders</p>
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
          { label: 'Supplies & Materials', href: '/supplies' },
          { label: 'My Orders', href: '/supplies/my-orders' }
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600">Track your supply orders and delivery status</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {orders.filter(order => order.status === 'pending').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Delivered</p>
              <p className="text-2xl font-bold text-green-600">
                {orders.filter(order => order.status === 'delivered').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-purple-600">
                ${orders.reduce((sum, order) => sum + order.totalPrice, 0).toFixed(2)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-600" />
          </div>
        </Card>
      </div>

      {/* Main Content with Sidebar */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Filters */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <Card className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Filters</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden"
                >
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
              <div className={`space-y-4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                
                {/* Search */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search orders..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Order Status</label>
                  <Select
                    value={selectedStatus}
                    onValueChange={(value) => setSelectedStatus(value)}
                    options={statuses.map(status => ({ value: status, label: status }))}
                  />
                </div>

                {/* Payment Status */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Payment Status</label>
                  <Select
                    value={selectedPaymentStatus}
                    onValueChange={(value) => setSelectedPaymentStatus(value)}
                    options={paymentStatuses.map(status => ({ value: status, label: status }))}
                  />
                </div>

              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <Card className="p-8 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || selectedStatus !== "All Status" || selectedPaymentStatus !== "All Payment"
                  ? "Try adjusting your filters to see more results."
                  : "You haven't placed any orders yet."}
              </p>
              <Button onClick={() => router.push('/supplies')}>
                Browse Supplies
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        {order.supply.images.length > 0 && (
                          <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={order.supply.images[0]}
                              alt={order.supply.name}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{order.supply.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">{order.supply.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>Qty: {order.quantity}</span>
                            <span>•</span>
                            <span>${order.supply.price}/{order.supply.unit}</span>
                            <span>•</span>
                            <span>Total: ${order.totalPrice.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(order.status)}
                            {order.status}
                          </div>
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                          {order.paymentStatus}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Shipping Address</h4>
                        <div className="text-sm text-gray-600">
                          <p>{order.shippingAddress.name}</p>
                          <p>{order.shippingAddress.address}</p>
                          <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" />
                            <span>{order.shippingAddress.phone}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            <span>{order.shippingAddress.email}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Supplier</h4>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium">
                              {order.supply.supplier.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">{order.supply.supplier.name}</p>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                              <span className="text-xs text-gray-500">
                                {order.supply.supplier.rating} ({order.supply.supplier.reviewCount})
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <MapPin className="w-3 h-3" />
                          <span>{order.supply.supplier.location}</span>
                        </div>
                      </div>
                    </div>

                    {order.delivery.trackingNumber && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-900">Tracking Information</p>
                            <p className="text-sm text-blue-700">
                              {order.delivery.carrier} - {order.delivery.trackingNumber}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTrackOrder(order)}
                            className="text-blue-600 border-blue-300 hover:bg-blue-100"
                          >
                            Track Package
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        <p>Ordered: {new Date(order.createdAt).toLocaleDateString()}</p>
                        {order.deliveredAt && (
                          <p>Delivered: {new Date(order.deliveredAt).toLocaleDateString()}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewSupply(order.supplyId)}
                        >
                          View Supply
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewOrder(order.id)}
                        >
                          View Details
                        </Button>
                        {order.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelOrder(order.id)}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            Cancel Order
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
      </div>
    </div>
  );
}
