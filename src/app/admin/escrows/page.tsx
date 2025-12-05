"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Lock, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  User,
  ChevronDown,
  ChevronUp,
  Scale,
  TrendingUp
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { AdminErrorState } from "@/components/admin/admin-error-state";
import { Modal } from "@/components/ui/modal";
import { makeClientAuthenticatedRequestWithEndpointSafe, makeClientAuthenticatedRequestWithPathSafe } from "@/lib/client-api-utils";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import toast from "react-hot-toast";
import { useAppSettings } from "@/hooks/useAppSettings";
import { formatCurrency } from "@/lib/currency-utils";
import { getDefaultCurrency } from "@/lib/settings-utils";

interface Escrow {
  _id: string;
  id?: string;
  bookingId?: string;
  serviceId?: string;
  client: {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
    profile?: { avatar?: string };
  };
  provider: {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
    profile?: { avatar?: string };
  };
  amount: number;
  currency: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'disputed' | 'refunded';
  dispute?: {
    status: 'open' | 'resolved' | 'closed';
    reason?: string;
    raisedBy?: string;
    raisedAt?: string;
    resolution?: string;
    resolvedAt?: string;
    resolvedBy?: string;
  };
  createdAt: string;
  completedAt?: string;
  cancelledAt?: string;
  disputeRaisedAt?: string;
}

interface EscrowStats {
  totalEscrows: number;
  activeEscrows: number;
  completedEscrows: number;
  disputedEscrows: number;
  totalAmount: number;
  pendingAmount: number;
  completedAmount: number;
  disputedAmount: number;
}

export default function EscrowManagementPage() {
  const { settings: appSettings } = useAppSettings();
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [stats, setStats] = useState<EscrowStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEscrow, setSelectedEscrow] = useState<Escrow | null>(null);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  // Dispute resolution form
  const [disputeResolution, setDisputeResolution] = useState({
    resolution: 'favor_client' as 'favor_client' | 'favor_provider' | 'partial_refund',
    refundAmount: 0,
    notes: ''
  });

  const fetchEscrows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!getApiToken()) {
        throw new Error('Authentication required');
      }

      const queryParams = new URLSearchParams();
      queryParams.set('page', currentPage.toString());
      queryParams.set('limit', itemsPerPage.toString());
      if (statusFilter !== 'all') {
        queryParams.set('status', statusFilter);
      }

      const response = await makeClientAuthenticatedRequestWithEndpointSafe(
        'escrowsAdminAll' as keyof typeof API_ENDPOINTS,
        {
          method: 'GET',
          query: Object.fromEntries(queryParams)
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Failed to fetch escrows: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        const escrowsArray = Array.isArray(data.data) ? data.data : (data.data.escrows || []);
        setEscrows(escrowsArray);
      } else {
        setEscrows([]);
      }
    } catch (err) {
      logger.error('Error fetching escrows', err instanceof Error ? err : new Error(String(err)));
      setError(err instanceof Error ? err.message : 'Failed to load escrows');
      setEscrows([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter]);

  const fetchStats = useCallback(async () => {
    try {
      if (!getApiToken()) return;

      const response = await makeClientAuthenticatedRequestWithEndpointSafe(
        'escrowsAdminStats' as keyof typeof API_ENDPOINTS,
        {
          method: 'GET',
          query: { timeframe: '30d' }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setStats(data.data);
        }
      }
    } catch (err) {
      logger.warn('Error fetching escrow stats', err instanceof Error ? err : new Error(String(err)));
    }
  }, []);

  const fetchData = useCallback(async () => {
    await Promise.all([fetchEscrows(), fetchStats()]);
    setLastUpdated(new Date());
  }, [fetchEscrows, fetchStats]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleResolveDispute = async () => {
    if (!selectedEscrow?._id) return;

    try {
      setSubmitting(true);

      if (!getApiToken()) {
        throw new Error('Authentication required');
      }

      const response = await makeClientAuthenticatedRequestWithPathSafe(
        'escrowsDisputeResolve' as keyof typeof API_ENDPOINTS,
        [selectedEscrow._id, 'dispute', 'resolve'],
        {},
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resolution: disputeResolution.resolution,
            refundAmount: disputeResolution.refundAmount || undefined,
            notes: disputeResolution.notes || undefined
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to resolve dispute');
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success('Dispute resolved successfully');
        setShowDisputeModal(false);
        setSelectedEscrow(null);
        setDisputeResolution({
          resolution: 'favor_client',
          refundAmount: 0,
          notes: ''
        });
        await fetchData();
      } else {
        throw new Error(data.message || 'Failed to resolve dispute');
      }
    } catch (err) {
      logger.error('Error resolving dispute', err instanceof Error ? err : new Error(String(err)));
      toast.error(err instanceof Error ? err.message : 'Failed to resolve dispute');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'disputed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'refunded': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredEscrows = escrows.filter(escrow => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const clientName = `${escrow.client.firstName} ${escrow.client.lastName}`.toLowerCase();
      const providerName = `${escrow.provider.firstName} ${escrow.provider.lastName}`.toLowerCase();
      return clientName.includes(search) || providerName.includes(search) || 
             escrow.client.email?.toLowerCase().includes(search) ||
             escrow.provider.email?.toLowerCase().includes(search);
    }
    return true;
  });

  if (loading && !escrows.length) {
    return <Loading text="Loading escrows..." />;
  }

  if (error && !escrows.length) {
    return <AdminErrorState error={error} onRetry={fetchData} />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Escrow Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage escrow transactions and disputes</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            <Filter className="w-3 h-3 mr-1" />
            Filters
          </button>
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total Escrows</p>
                <p className="text-lg font-bold text-gray-900">{stats.totalEscrows || 0}</p>
              </div>
              <Scale className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Active</p>
                <p className="text-lg font-bold text-green-600">{stats.activeEscrows || 0}</p>
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Completed</p>
                <p className="text-lg font-bold text-blue-600">{stats.completedEscrows || 0}</p>
              </div>
              <CheckCircle className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Disputed</p>
                <p className="text-lg font-bold text-red-600">{stats.disputedEscrows || 0}</p>
              </div>
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="disputed">Disputed</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by client or provider..."
                  className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Escrows Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEscrows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-xs text-gray-500">
                    No escrows found
                  </td>
                </tr>
              ) : (
                filteredEscrows.map((escrow) => (
                  <tr key={escrow._id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="w-3 h-3 text-gray-600" />
                        </div>
                        <div className="ml-2">
                          <div className="text-xs font-medium text-gray-900">
                            {escrow.client.firstName} {escrow.client.lastName}
                          </div>
                          <div className="text-xs text-gray-500">{escrow.client.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="w-3 h-3 text-gray-600" />
                        </div>
                        <div className="ml-2">
                          <div className="text-xs font-medium text-gray-900">
                            {escrow.provider.firstName} {escrow.provider.lastName}
                          </div>
                          <div className="text-xs text-gray-500">{escrow.provider.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs font-semibold text-gray-900">
                        {formatCurrency(escrow.amount, escrow.currency || getDefaultCurrency(appSettings), { appSettings })}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(escrow.status)}`}>
                        {escrow.status}
                      </span>
                      {escrow.dispute && escrow.dispute.status === 'open' && (
                        <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          Disputed
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                      {new Date(escrow.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedEscrow(escrow);
                            setShowViewModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {escrow.dispute && escrow.dispute.status === 'open' && (
                          <button
                            onClick={() => {
                              setSelectedEscrow(escrow);
                              setDisputeResolution({
                                resolution: 'favor_client',
                                refundAmount: 0,
                                notes: ''
                              });
                              setShowDisputeModal(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="Resolve dispute"
                          >
                            <Scale className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Escrow Modal */}
      {showViewModal && selectedEscrow && (
        <Modal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedEscrow(null);
          }}
          title="Escrow Details"
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Client</p>
                <p className="text-sm font-semibold text-gray-900">
                  {selectedEscrow.client.firstName} {selectedEscrow.client.lastName}
                </p>
                <p className="text-xs text-gray-500">{selectedEscrow.client.email}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Provider</p>
                <p className="text-sm font-semibold text-gray-900">
                  {selectedEscrow.provider.firstName} {selectedEscrow.provider.lastName}
                </p>
                <p className="text-xs text-gray-500">{selectedEscrow.provider.email}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Amount</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(selectedEscrow.amount, selectedEscrow.currency || getDefaultCurrency(appSettings), { appSettings })}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Status</p>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedEscrow.status)}`}>
                {selectedEscrow.status}
              </span>
            </div>
            {selectedEscrow.dispute && (
              <div className="border-t pt-4">
                <p className="text-xs font-medium text-gray-500 mb-2">Dispute Information</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Status: {selectedEscrow.dispute.status}</p>
                    {selectedEscrow.dispute.reason && (
                      <p className="text-xs text-gray-700 mt-1">Reason: {selectedEscrow.dispute.reason}</p>
                    )}
                  </div>
                  {selectedEscrow.dispute.resolution && (
                    <div>
                      <p className="text-xs text-gray-500">Resolution: {selectedEscrow.dispute.resolution}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Resolve Dispute Modal */}
      {showDisputeModal && selectedEscrow && (
        <Modal
          isOpen={showDisputeModal}
          onClose={() => {
            setShowDisputeModal(false);
            setSelectedEscrow(null);
            setDisputeResolution({
              resolution: 'favor_client',
              refundAmount: 0,
              notes: ''
            });
          }}
          title="Resolve Dispute"
          size="md"
          footer={
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowDisputeModal(false);
                  setSelectedEscrow(null);
                }}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveDispute}
                disabled={submitting}
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Resolving...' : 'Resolve Dispute'}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-gray-700 mb-1">Escrow Amount</p>
              <p className="text-sm font-semibold text-gray-900">
                {formatCurrency(selectedEscrow.amount, selectedEscrow.currency || getDefaultCurrency(appSettings), { appSettings })}
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Resolution</label>
              <select
                value={disputeResolution.resolution}
                onChange={(e) => setDisputeResolution({ ...disputeResolution, resolution: e.target.value as any })}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="favor_client">Favor Client (Full Refund)</option>
                <option value="favor_provider">Favor Provider (No Refund)</option>
                <option value="partial_refund">Partial Refund</option>
              </select>
            </div>
            {disputeResolution.resolution === 'partial_refund' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Refund Amount</label>
                <input
                  type="number"
                  value={disputeResolution.refundAmount}
                  onChange={(e) => setDisputeResolution({ ...disputeResolution, refundAmount: parseFloat(e.target.value) || 0 })}
                  min="0"
                  max={selectedEscrow.amount}
                  step="0.01"
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Admin Notes</label>
              <textarea
                value={disputeResolution.notes}
                onChange={(e) => setDisputeResolution({ ...disputeResolution, notes: e.target.value })}
                rows={4}
                placeholder="Add notes about the resolution..."
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

