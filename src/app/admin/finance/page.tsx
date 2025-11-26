"use client";

import { useSession } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Loading } from "@/components/ui/loading";
import { 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Image as ImageIcon,
  X,
  RefreshCw,
  FileText,
  Search
} from "lucide-react";
import { makeClientAuthenticatedRequestWithEndpointSafe, makeClientAuthenticatedRequestWithPathSafe } from "@/lib/client-api-utils";
import { API_ENDPOINTS } from "@/lib/api";
import { logger } from "@/lib/logger";

// Types
interface TopUpRequest {
  _id: string;
  id?: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  receipt?: {
    url: string;
    publicId: string;
  };
  user?: {
    _id?: string;
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    profile?: {
      avatar?: string;
    };
  };
  processedAt?: string;
  processedBy?: string;
  adminNotes?: string;
}

interface WithdrawalRequest {
  _id: string;
  id?: string;
  type: 'withdrawal';
  amount: number;
  category: string;
  description: string;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'cancelled' | 'failed';
  timestamp: string;
  reference?: string;
  accountDetails?: {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    routingNumber?: string;
    paypalEmail?: string;
    mobileNumber?: string;
    [key: string]: any;
  };
  user?: {
    _id?: string;
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    profile?: {
      avatar?: string;
    };
  };
  processedAt?: string;
  processedBy?: string;
  adminNotes?: string;
}

type RequestStatus = 'all' | 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';

export default function FinanceAdmin() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // State
  const [activeTab, setActiveTab] = useState<'withdrawals' | 'topups'>('withdrawals');
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Withdrawal state
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);
  const [withdrawalStatusFilter, setWithdrawalStatusFilter] = useState<RequestStatus>('pending');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [processingWithdrawal, setProcessingWithdrawal] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  
  // Top-up state
  const [topUpRequests, setTopUpRequests] = useState<TopUpRequest[]>([]);
  const [loadingTopUps, setLoadingTopUps] = useState(false);
  const [topUpStatusFilter, setTopUpStatusFilter] = useState<RequestStatus>('pending');
  const [selectedTopUp, setSelectedTopUp] = useState<TopUpRequest | null>(null);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [processingTopUp, setProcessingTopUp] = useState<string | null>(null);
  
  // Pagination
  const [withdrawalPagination, setWithdrawalPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [topUpPagination, setTopUpPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  // Fetch withdrawal requests
  const fetchWithdrawalRequests = useCallback(async () => {
    try {
      setLoadingWithdrawals(true);
      setError(null);
      
      const queryParams: Record<string, string> = {
        page: withdrawalPagination.page.toString(),
        limit: withdrawalPagination.limit.toString(),
        type: 'withdrawal'
      };
      
      if (withdrawalStatusFilter !== 'all') {
        queryParams.status = withdrawalStatusFilter === 'approved' ? 'completed' : 
                            withdrawalStatusFilter === 'rejected' ? 'cancelled' : 
                            withdrawalStatusFilter;
      }
      
      const response = await makeClientAuthenticatedRequestWithEndpointSafe(
        'financeTransactions' as keyof typeof API_ENDPOINTS,
        {
          method: 'GET',
          query: queryParams
        }
      );

      const data = await response.json();
      if (data.success && data.data) {
        const transactionsArray = Array.isArray(data.data) 
          ? data.data 
          : data.data.transactions || [];
        
        const withdrawals: WithdrawalRequest[] = transactionsArray.map((tx: any) => ({
          _id: tx._id || tx.id,
          id: tx._id || tx.id,
          type: 'withdrawal',
          amount: tx.amount,
          category: tx.category || 'withdrawal',
          description: tx.description || 'Withdrawal request',
          paymentMethod: tx.paymentMethod || tx.method || 'unknown',
          status: tx.status || 'pending',
          timestamp: tx.timestamp || tx.createdAt,
          reference: tx.reference,
          accountDetails: tx.accountDetails || {},
          user: tx.user,
          processedAt: tx.processedAt,
          processedBy: tx.processedBy,
          adminNotes: tx.adminNotes
        }));
        
        setWithdrawalRequests(withdrawals);
        
        // Update pagination if available
        if (data.total !== undefined) {
          setWithdrawalPagination(prev => ({
            ...prev,
            total: data.total || 0,
            pages: data.pages || Math.ceil((data.total || 0) / prev.limit)
          }));
        }
      } else {
        setWithdrawalRequests([]);
      }
    } catch (error) {
      logger.error("Error fetching withdrawal requests", error instanceof Error ? error : new Error(String(error)));
      setError(error instanceof Error ? error.message : "Failed to load withdrawal requests");
      setWithdrawalRequests([]);
    } finally {
      setLoadingWithdrawals(false);
    }
  }, [withdrawalStatusFilter, withdrawalPagination.page, withdrawalPagination.limit]);

  // Fetch top-up requests
  const fetchTopUpRequests = useCallback(async () => {
    try {
      setLoadingTopUps(true);
      setError(null);
      
      const queryParams: Record<string, string> = {
        page: topUpPagination.page.toString(),
        limit: topUpPagination.limit.toString()
      };
      
      if (topUpStatusFilter !== 'all') {
        queryParams.status = topUpStatusFilter;
      }
      
      const response = await makeClientAuthenticatedRequestWithEndpointSafe(
        'financeTopUps' as keyof typeof API_ENDPOINTS,
        {
          method: 'GET',
          query: queryParams
        }
      );

      const data = await response.json();
      if (data.success && data.data) {
        const requestsArray = Array.isArray(data.data) 
          ? data.data 
          : data.data.topUps || [];
        setTopUpRequests(requestsArray);
        
        // Update pagination if available
        if (data.total !== undefined) {
          setTopUpPagination(prev => ({
            ...prev,
            total: data.total || 0,
            pages: data.pages || Math.ceil((data.total || 0) / prev.limit)
          }));
        }
      } else {
        setTopUpRequests([]);
      }
    } catch (error) {
      logger.error("Error fetching top-up requests", error instanceof Error ? error : new Error(String(error)));
      setError(error instanceof Error ? error.message : "Failed to load top-up requests");
      setTopUpRequests([]);
    } finally {
      setLoadingTopUps(false);
    }
  }, [topUpStatusFilter, topUpPagination.page, topUpPagination.limit]);

  // Process withdrawal request
  const processWithdrawalRequest = useCallback(async (withdrawalId: string, action: 'approved' | 'rejected') => {
    try {
      setProcessingWithdrawal(withdrawalId);
      
      const response = await makeClientAuthenticatedRequestWithPathSafe(
        'financeWithdrawalsProcess' as keyof typeof API_ENDPOINTS,
        [withdrawalId, 'process'],
        {},
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: action,
            adminNotes: adminNotes || undefined
          })
        }
      );

      const data = await response.json();
      if (response.ok && data.success) {
        await fetchWithdrawalRequests();
        setShowWithdrawalModal(false);
        setSelectedWithdrawal(null);
        setAdminNotes('');
      } else {
        throw new Error(data.message || data.error || `Failed to ${action} withdrawal request`);
      }
    } catch (error) {
      logger.error('Error processing withdrawal request', error instanceof Error ? error : new Error(String(error)), { withdrawalId, action });
      setError(error instanceof Error ? error.message : `Failed to ${action} withdrawal request`);
    } finally {
      setProcessingWithdrawal(null);
    }
  }, [adminNotes, fetchWithdrawalRequests]);

  // Process top-up request
  const processTopUpRequest = useCallback(async (topUpId: string, action: 'approved' | 'rejected') => {
    try {
      setProcessingTopUp(topUpId);
      
      const response = await makeClientAuthenticatedRequestWithPathSafe(
        'financeTopUps' as keyof typeof API_ENDPOINTS,
        [topUpId, 'process'],
        {},
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: action,
            adminNotes: adminNotes || undefined
          })
        }
      );

      const data = await response.json();
      if (response.ok && data.success) {
        await fetchTopUpRequests();
        setShowTopUpModal(false);
        setSelectedTopUp(null);
        setAdminNotes('');
      } else {
        throw new Error(data.message || data.error || `Failed to ${action} top-up request`);
      }
    } catch (error) {
      logger.error('Error processing top-up request', error instanceof Error ? error : new Error(String(error)), { topUpId, action });
      setError(error instanceof Error ? error.message : `Failed to ${action} top-up request`);
    } finally {
      setProcessingTopUp(null);
    }
  }, [adminNotes, fetchTopUpRequests]);

  useEffect(() => {
    if (activeTab === 'withdrawals') {
      fetchWithdrawalRequests();
    } else {
      fetchTopUpRequests();
    }
  }, [activeTab, fetchWithdrawalRequests, fetchTopUpRequests]);

  const handleRefresh = () => {
    if (activeTab === 'withdrawals') {
      fetchWithdrawalRequests();
    } else {
      fetchTopUpRequests();
    }
  };

  const getUserDisplayName = (user: any): string => {
    if (!user) return 'Unknown User';
    if (typeof user === 'string') return user;
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    if (firstName || lastName) return `${firstName} ${lastName}`.trim();
    return user.email || 'Unknown User';
  };

  const getUserEmail = (user: any): string => {
    if (!user) return '';
    if (typeof user === 'string') return '';
    return user.email || '';
  };

  const getUserAvatar = (user: any): string | null => {
    if (!user || typeof user === 'string') return null;
    return user.profile?.avatar || null;
  };

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter requests based on search term
  const filterWithdrawalRequests = (requests: WithdrawalRequest[]): WithdrawalRequest[] => {
    if (!searchTerm.trim()) return requests;
    
    const search = searchTerm.toLowerCase();
    return requests.filter(request => {
      const userName = getUserDisplayName(request.user).toLowerCase();
      const userEmail = getUserEmail(request.user).toLowerCase();
      const amount = Math.abs(request.amount).toString();
      const paymentMethod = request.paymentMethod.toLowerCase();
      const reference = request.reference?.toLowerCase() || '';
      const accountDetails = JSON.stringify(request.accountDetails || {}).toLowerCase();
      
      return userName.includes(search) ||
             userEmail.includes(search) ||
             amount.includes(search) ||
             paymentMethod.includes(search) ||
             reference.includes(search) ||
             accountDetails.includes(search);
    });
  };

  const filterTopUpRequests = (requests: TopUpRequest[]): TopUpRequest[] => {
    if (!searchTerm.trim()) return requests;
    
    const search = searchTerm.toLowerCase();
    return requests.filter(request => {
      const userName = getUserDisplayName(request.user).toLowerCase();
      const userEmail = getUserEmail(request.user).toLowerCase();
      const amount = request.amount.toString();
      const paymentMethod = request.paymentMethod.toLowerCase();
      const reference = request.reference?.toLowerCase() || '';
      const notes = request.notes?.toLowerCase() || '';
      
      return userName.includes(search) ||
             userEmail.includes(search) ||
             amount.includes(search) ||
             paymentMethod.includes(search) ||
             reference.includes(search) ||
             notes.includes(search);
    });
  };

  const filteredWithdrawalRequests = filterWithdrawalRequests(withdrawalRequests);
  const filteredTopUpRequests = filterTopUpRequests(topUpRequests);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Cancelled' },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Failed' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  if (status === "loading") {
    return <Loading text="Loading finance management" fullScreen />;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Finance Management
          </h1>
          <p className="text-gray-600 text-sm">Review and process withdrawal and top-up requests</p>
        </div>
        <button
          onClick={handleRefresh}
          className="mt-2 sm:mt-0 inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('withdrawals')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'withdrawals'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Withdrawal Requests
              {withdrawalRequests.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 rounded-full">
                  {withdrawalRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('topups')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'topups'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Top-Up Requests
              {topUpRequests.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 rounded-full">
                  {topUpRequests.length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Filters and Controls */}
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
              <div className="text-xs text-gray-500">
                {activeTab === 'withdrawals' 
                  ? `${filteredWithdrawalRequests.length} withdrawal${filteredWithdrawalRequests.length !== 1 ? 's' : ''}`
                  : `${filteredTopUpRequests.length} top-up${filteredTopUpRequests.length !== 1 ? 's' : ''}`
                }
              </div>
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
                    placeholder={activeTab === 'withdrawals' ? "Search withdrawals..." : "Search top-ups..."}
                    className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={activeTab === 'withdrawals' ? withdrawalStatusFilter : topUpStatusFilter}
                  onChange={(e) => {
                    if (activeTab === 'withdrawals') {
                      setWithdrawalStatusFilter(e.target.value as RequestStatus);
                    } else {
                      setTopUpStatusFilter(e.target.value as RequestStatus);
                    }
                  }}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  {activeTab === 'withdrawals' && (
                    <>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </>
                  )}
                </select>
              </div>

              {activeTab === 'withdrawals' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    defaultValue="all"
                  >
                    <option value="all">All Methods</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="paypal">PayPal</option>
                    <option value="paymaya">PayMaya</option>
                  </select>
                </div>
              )}

              {activeTab === 'topups' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    defaultValue="all"
                  >
                    <option value="all">All Methods</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="card">Card</option>
                    <option value="cash">Cash</option>
                    <option value="paypal">PayPal</option>
                    <option value="paymaya">PayMaya</option>
                  </select>
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={() => {
                  setSearchTerm('');
                  if (activeTab === 'withdrawals') {
                    setWithdrawalStatusFilter('all');
                  } else {
                    setTopUpStatusFilter('all');
                  }
                }}
                className="text-xs text-gray-600 hover:text-gray-800"
              >
                Clear all filters
              </button>
              <div className="text-xs text-gray-500">
                {activeTab === 'withdrawals' 
                  ? `${filteredWithdrawalRequests.length} withdrawal${filteredWithdrawalRequests.length !== 1 ? 's' : ''} found`
                  : `${filteredTopUpRequests.length} top-up${filteredTopUpRequests.length !== 1 ? 's' : ''} found`
                }
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="overflow-x-auto">
          {activeTab === 'withdrawals' ? (
            loadingWithdrawals ? (
              <div className="text-center py-8">
                <Loading text="Loading withdrawal requests" />
              </div>
            ) : filteredWithdrawalRequests.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">No withdrawal requests found</h3>
                <p className="text-xs text-gray-500">Try adjusting your filters.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Details</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredWithdrawalRequests.map((request) => (
                    <tr key={request._id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            {getUserAvatar(request.user) ? (
                              <img
                                src={getUserAvatar(request.user)!}
                                alt={getUserDisplayName(request.user)}
                                className="h-8 w-8 rounded-full"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                <User className="w-4 h-4 text-gray-600" />
                              </div>
                            )}
                          </div>
                          <div className="ml-3">
                            <div className="text-xs font-semibold text-gray-900">
                              {getUserDisplayName(request.user)}
                            </div>
                            <div className="text-xs text-gray-600">{getUserEmail(request.user)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs font-semibold text-gray-900">{formatAmount(request.amount)}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs text-gray-900 capitalize">{request.paymentMethod.replace('_', ' ')}</div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-xs text-gray-600 space-y-0.5">
                          {request.accountDetails?.bankName && (
                            <div>Bank: {request.accountDetails.bankName}</div>
                          )}
                          {request.accountDetails?.accountNumber && (
                            <div>Acct: {request.accountDetails.accountNumber}</div>
                          )}
                          {request.accountDetails?.paypalEmail && (
                            <div>PayPal: {request.accountDetails.paypalEmail}</div>
                          )}
                          {request.accountDetails?.mobileNumber && (
                            <div>Mobile: {request.accountDetails.mobileNumber}</div>
                          )}
                          {!request.accountDetails || Object.keys(request.accountDetails).length === 0 ? (
                            <div className="text-gray-400">N/A</div>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs text-gray-500">{new Date(request.timestamp).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-400">{new Date(request.timestamp).toLocaleTimeString()}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {getStatusBadge(request.status)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                        <div className="flex items-center space-x-2">
                          {request.status === 'pending' ? (
                            <button
                              onClick={() => {
                                setSelectedWithdrawal(request);
                                setShowWithdrawalModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="Review request"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                          ) : (
                            <div className="text-xs text-gray-500">
                              {request.processedAt && (
                                <div>Processed: {new Date(request.processedAt).toLocaleDateString()}</div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            loadingTopUps ? (
              <div className="text-center py-8">
                <Loading text="Loading top-up requests" />
              </div>
            ) : filteredTopUpRequests.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">No top-up requests found</h3>
                <p className="text-xs text-gray-500">Try adjusting your filters.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTopUpRequests.map((request) => (
                    <tr key={request._id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            {getUserAvatar(request.user) ? (
                              <img
                                src={getUserAvatar(request.user)!}
                                alt={getUserDisplayName(request.user)}
                                className="h-8 w-8 rounded-full"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                <User className="w-4 h-4 text-gray-600" />
                              </div>
                            )}
                          </div>
                          <div className="ml-3">
                            <div className="text-xs font-semibold text-gray-900">
                              {getUserDisplayName(request.user)}
                            </div>
                            <div className="text-xs text-gray-600">{getUserEmail(request.user)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs font-semibold text-gray-900">{formatAmount(request.amount)}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs text-gray-900 capitalize">{request.paymentMethod.replace('_', ' ')}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {request.receipt ? (
                          <a
                            href={request.receipt.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                          >
                            <ImageIcon className="w-3 h-3 mr-1" />
                            View
                          </a>
                        ) : (
                          <div className="text-xs text-gray-400">N/A</div>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs text-gray-600">{request.reference || 'N/A'}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs text-gray-500">{new Date(request.requestedAt).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-400">{new Date(request.requestedAt).toLocaleTimeString()}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {getStatusBadge(request.status)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                        <div className="flex items-center space-x-2">
                          {request.status === 'pending' ? (
                            <button
                              onClick={() => {
                                setSelectedTopUp(request);
                                setShowTopUpModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="Review request"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                          ) : (
                            <div className="text-xs text-gray-500">
                              {request.processedAt && (
                                <div>Processed: {new Date(request.processedAt).toLocaleDateString()}</div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>

      {/* Withdrawal Review Modal */}
      {showWithdrawalModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Review Withdrawal Request</h2>
                <button
                  onClick={() => {
                    setShowWithdrawalModal(false);
                    setSelectedWithdrawal(null);
                    setAdminNotes('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">User</p>
                  <p className="text-sm text-gray-900">{getUserDisplayName(selectedWithdrawal.user)}</p>
                  <p className="text-xs text-gray-500">{getUserEmail(selectedWithdrawal.user)}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700">Amount</p>
                  <p className="text-lg font-semibold text-gray-900">{formatAmount(selectedWithdrawal.amount)}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700">Payment Method</p>
                  <p className="text-sm text-gray-900 capitalize">{selectedWithdrawal.paymentMethod.replace('_', ' ')}</p>
                </div>

                {selectedWithdrawal.accountDetails && Object.keys(selectedWithdrawal.accountDetails).length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Account Details</p>
                    <div className="bg-gray-50 rounded p-3 space-y-1">
                      {Object.entries(selectedWithdrawal.accountDetails).map(([key, value]) => (
                        value && (
                          <p key={key} className="text-sm text-gray-900">
                            <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span> {String(value)}
                          </p>
                        )
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Admin Notes</p>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes for this request..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows={4}
                  />
                </div>

                <div className="flex space-x-3 pt-4 border-t">
                  <button
                    onClick={() => processWithdrawalRequest(selectedWithdrawal._id, 'approved')}
                    disabled={processingWithdrawal === selectedWithdrawal._id}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </button>
                  <button
                    onClick={() => processWithdrawalRequest(selectedWithdrawal._id, 'rejected')}
                    disabled={processingWithdrawal === selectedWithdrawal._id}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top-Up Review Modal */}
      {showTopUpModal && selectedTopUp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Review Top-Up Request</h2>
                <button
                  onClick={() => {
                    setShowTopUpModal(false);
                    setSelectedTopUp(null);
                    setAdminNotes('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">User</p>
                  <p className="text-sm text-gray-900">{getUserDisplayName(selectedTopUp.user)}</p>
                  <p className="text-xs text-gray-500">{getUserEmail(selectedTopUp.user)}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700">Amount</p>
                  <p className="text-lg font-semibold text-gray-900">{formatAmount(selectedTopUp.amount)}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700">Payment Method</p>
                  <p className="text-sm text-gray-900 capitalize">{selectedTopUp.paymentMethod.replace('_', ' ')}</p>
                </div>

                {selectedTopUp.reference && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Reference</p>
                    <p className="text-sm text-gray-900">{selectedTopUp.reference}</p>
                  </div>
                )}

                {selectedTopUp.notes && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">User Notes</p>
                    <p className="text-sm text-gray-900">{selectedTopUp.notes}</p>
                  </div>
                )}

                {selectedTopUp.receipt && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Receipt</p>
                    <div className="border border-gray-200 rounded p-2">
                      <img
                        src={selectedTopUp.receipt.url}
                        alt="Receipt"
                        className="max-w-full h-auto rounded"
                      />
                    </div>
                    <a
                      href={selectedTopUp.receipt.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      <ImageIcon className="w-4 h-4 mr-1" />
                      Open in new tab
                    </a>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Admin Notes</p>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes for this request..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows={4}
                  />
                </div>

                <div className="flex space-x-3 pt-4 border-t">
                  <button
                    onClick={() => processTopUpRequest(selectedTopUp._id, 'approved')}
                    disabled={processingTopUp === selectedTopUp._id}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </button>
                  <button
                    onClick={() => processTopUpRequest(selectedTopUp._id, 'rejected')}
                    disabled={processingTopUp === selectedTopUp._id}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
