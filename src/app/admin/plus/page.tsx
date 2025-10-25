"use client";

import { useState, useEffect } from "react";
import { 
  Crown, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Star, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Calendar,
  CreditCard,
  Zap,
  Shield,
  Phone,
  Sparkles,
  Clock
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { AdminErrorState } from "@/components/admin/admin-error-state";
import { useRoleAccess } from "@/components/role-guard";
import { useSession } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/currency-utils";

interface SubscriptionPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  features: string[];
  popular?: boolean;
  icon: React.ReactNode;
  color: string;
  targetAudience?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Subscription {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  planId: string;
  planName: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  billingPeriod: 'monthly' | 'annual';
  amount: number;
  currency: string;
  startDate: string;
  endDate: string;
  nextBillingDate: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
}

interface PlusStats {
  totalSubscribers: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  annualRevenue: number;
  averageRating: number;
  churnRate: number;
  conversionRate: number;
  popularPlan: string;
  revenueGrowth: number;
  newSubscribersToday: number;
  cancelledSubscriptions: number;
  pendingPayments: number;
}

export default function PlusAdmin() {
  const { data: session, status } = useSession();
  const roleAccess = useRoleAccess();
  const [stats, setStats] = useState<PlusStats | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPlan, setFilterPlan] = useState("all");
  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);

  const loadData = async () => {
    try {
      setError(null);
      
      // Load stats
      const statsResponse = await fetch('/api/admin/plus/stats', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setStats(statsData.data);
        }
      }

      // Load plans
      const plansResponse = await fetch('/api/admin/plus/plans', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (plansResponse.ok) {
        const plansData = await plansResponse.json();
        if (plansData.success) {
          setPlans(plansData.data);
        }
      }

      // Load subscriptions
      const subscriptionsResponse = await fetch('/api/admin/plus/subscriptions', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (subscriptionsResponse.ok) {
        const subscriptionsData = await subscriptionsResponse.json();
        if (subscriptionsData.success) {
          setSubscriptions(subscriptionsData.data);
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const refreshData = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const createPlan = async (planData: Partial<SubscriptionPlan>) => {
    try {
      const response = await fetch('/api/admin/plus/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(planData),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          await refreshData();
          setShowCreatePlanModal(false);
        } else {
          setError(result.error || 'Failed to create plan');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create plan');
      }
    } catch (err) {
      console.error('Error creating plan:', err);
      setError('Failed to create plan. Please try again.');
    }
  };

  const updatePlan = async (planId: string, planData: Partial<SubscriptionPlan>) => {
    try {
      const response = await fetch(`/api/admin/plus/plans/${planId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(planData),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          await refreshData();
        } else {
          setError(result.error || 'Failed to update plan');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update plan');
      }
    } catch (err) {
      console.error('Error updating plan:', err);
      setError('Failed to update plan. Please try again.');
    }
  };

  const deletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/plus/plans/${planId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          await refreshData();
        } else {
          setError(result.error || 'Failed to delete plan');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete plan');
      }
    } catch (err) {
      console.error('Error deleting plan:', err);
      setError('Failed to delete plan. Please try again.');
    }
  };

  // Check access after all hooks and functions
  if (status === "loading") {
    return <Loading />;
  }

  if (!session) {
    return null;
  }

  if (!roleAccess.isAdmin) {
    return <AdminErrorState error="Access denied. Admin privileges required." />;
  }

  const filteredSubscriptions = subscriptions.filter(subscription => {
    const matchesSearch = subscription.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subscription.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subscription.planName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || subscription.status === filterStatus;
    const matchesPlan = filterPlan === "all" || subscription.planId === filterPlan;
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      case 'expired': return <AlertTriangle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Plus Management
            </h1>
            <p className="text-gray-600 text-sm">Manage subscription plans and monitor revenue</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-4 rounded-lg border animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Plus Management
          </h1>
          <p className="text-gray-600 text-sm">Manage subscription plans, monitor revenue, and track subscriber metrics</p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center space-x-2">
          <button 
            onClick={refreshData}
            disabled={refreshing}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 hover:shadow-md"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button 
            onClick={() => setShowCreatePlanModal(true)}
            className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 hover:shadow-md"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Plan
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded shadow p-3 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Total Subscribers</p>
                <p className="text-lg font-bold text-gray-900">{stats.totalSubscribers.toLocaleString()}</p>
                <p className="text-xs text-gray-500">All subscribers</p>
              </div>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded shadow p-3 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Active Subscriptions</p>
                <p className="text-lg font-bold text-gray-900">{stats.activeSubscriptions.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Currently active</p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded shadow p-3 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Monthly Revenue</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(stats.monthlyRevenue, 'PHP')}
                </p>
                <p className="text-xs text-gray-500">This month</p>
              </div>
              <DollarSign className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white rounded shadow p-3 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Revenue Growth</p>
                <p className={`text-lg font-bold ${stats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.revenueGrowth >= 0 ? '+' : ''}{stats.revenueGrowth.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500">vs last month</p>
              </div>
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      {/* Subscription Plans */}
      <div className="bg-white rounded shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-900">Subscription Plans</h2>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">{plans.length} plans</span>
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {plans.map((plan) => (
              <div key={plan.id} className="bg-white rounded shadow p-3 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-1.5 rounded ${plan.color}`}>
                    {plan.icon}
                  </div>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                    plan.isActive ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'
                  }`}>
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{plan.name}</h3>
                <p className="text-xs text-gray-600 mb-2">{plan.description}</p>
                <div className="flex items-baseline space-x-1 mb-2">
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(plan.monthlyPrice, 'PHP')}
                  </span>
                  <span className="text-xs text-gray-600">/month</span>
                </div>
                <div className="flex space-x-1">
                  <button 
                    onClick={() => {
                      // TODO: Implement edit plan modal
                      console.log('Edit plan:', plan.id);
                    }}
                    className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </button>
                  <button 
                    onClick={() => deletePlan(plan.id)}
                    className="inline-flex items-center px-2 py-1 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-all duration-200"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-900">Subscriptions</h2>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">{filteredSubscriptions.length} subscriptions</span>
            </div>
          </div>
          <div className="mt-3 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
              <input
                type="text"
                placeholder="Search subscriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 pr-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="cancelled">Cancelled</option>
              <option value="expired">Expired</option>
              <option value="pending">Pending</option>
            </select>
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Plans</option>
              {plans.map(plan => (
                <option key={plan.id} value={plan.id}>{plan.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Next Billing
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSubscriptions.map((subscription) => (
                <tr key={subscription.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{subscription.userName}</div>
                      <div className="text-xs text-gray-500">{subscription.userEmail}</div>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{subscription.planName}</div>
                    <div className="text-xs text-gray-500">{subscription.billingPeriod}</div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
                      {getStatusIcon(subscription.status)}
                      <span className="ml-1 capitalize">{subscription.status}</span>
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(subscription.amount, subscription.currency)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                    {new Date(subscription.nextBillingDate).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-1">
                      <button 
                        onClick={() => setSelectedSubscription(subscription)}
                        className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      <button className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200">
                        <Edit className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredSubscriptions.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No subscriptions found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Create Plan Modal */}
      {showCreatePlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow p-4 w-full max-w-md mx-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Create New Plan</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const planData = {
                name: formData.get('name') as string,
                description: formData.get('description') as string,
                monthlyPrice: parseFloat(formData.get('monthlyPrice') as string),
                annualPrice: parseFloat(formData.get('annualPrice') as string),
                features: (formData.get('features') as string).split('\n').filter(f => f.trim()),
                isActive: true,
                color: formData.get('color') as string,
                targetAudience: formData.get('targetAudience') as string,
              };
              createPlan(planData);
            }}>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Plan Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    required
                    rows={2}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Monthly Price</label>
                    <input
                      type="number"
                      name="monthlyPrice"
                      required
                      step="0.01"
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Annual Price</label>
                    <input
                      type="number"
                      name="annualPrice"
                      required
                      step="0.01"
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Features (one per line)</label>
                  <textarea
                    name="features"
                    required
                    rows={3}
                    placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
                  <select
                    name="color"
                    required
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="bg-blue-100 text-blue-700">Blue</option>
                    <option value="bg-green-100 text-green-700">Green</option>
                    <option value="bg-yellow-100 text-yellow-700">Yellow</option>
                    <option value="bg-purple-100 text-purple-700">Purple</option>
                    <option value="bg-red-100 text-red-700">Red</option>
                    <option value="bg-indigo-100 text-indigo-700">Indigo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Target Audience (optional)</label>
                  <input
                    type="text"
                    name="targetAudience"
                    placeholder="e.g., For hotels, developers, agencies"
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowCreatePlanModal(false)}
                  className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-2 py-1 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
                >
                  Create Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
