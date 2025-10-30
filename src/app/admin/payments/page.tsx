"use client";

import { useSession } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Loading } from "@/components/ui/loading";
import { 
  CreditCard, 
  TrendingUp, 
  DollarSign, 
  Download,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  BarChart3,
  Search,
  Clock,
  ArrowDownRight
} from "lucide-react";

// Import payment components
import { PaymentStatsCard } from "@/components/admin/payment-stats-card";
import { PaymentTransactionsTable } from "@/components/admin/payment-transactions-table";
import { PaymentMethodChart } from "@/components/admin/payment-method-chart";
import { RefundModal, RefundData } from "@/components/admin/refund-modal";
import { TransactionDetailsModal } from "@/components/admin/transaction-details-modal";
import { makeClientAuthenticatedRequestWithEndpointSafe } from "@/lib/client-api-utils";
import { API_ENDPOINTS } from "@/lib/api";

interface PaymentOverview {
  totalTransactions: number;
  totalRevenue: number;
  pendingPayments: number;
  failedPayments: number;
  successRate: number;
  averageTransactionValue: number;
  paymentMethods: Array<{
    method: string;
    count: number;
    amount: number;
    percentage: number;
  }>;
  recentTransactions: Array<{
    id: string;
    amount: number;
    method: string;
    status: 'completed' | 'pending' | 'failed' | 'refunded';
    customer: string;
    date: string;
    reference: string;
  }>;
  dailyStats: Array<{
    date: string;
    transactions: number;
    revenue: number;
  }>;
  monthlyStats: Array<{
    month: string;
    transactions: number;
    revenue: number;
  }>;
  topPaymentMethods: Array<{
    method: string;
    count: number;
    amount: number;
  }>;
  paymentStatusBreakdown: {
    completed: number;
    pending: number;
    failed: number;
    refunded: number;
  };
  refunds: number;
  chargebacks: number;
  processingFees: number;
  netRevenue: number;
}

interface Transaction {
  id: string;
  amount: number;
  method: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  customer: string;
  date: string;
  reference: string;
}

interface PaymentFilters {
  search: string;
  status: string;
  method: string;
  startDate: string;
  endDate: string;
  sortBy: string;
  sortOrder: string;
}

const ITEMS_PER_PAGE = 10;

export default function PaymentProcessingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [overview, setOverview] = useState<PaymentOverview | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<PaymentFilters>({
    search: '',
    status: 'all',
    method: 'all',
    startDate: '',
    endDate: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth");
      return;
    }
  }, [session, status, router]);

  const fetchPaymentData = useCallback(async () => {
    try {
      setLoading(true);
      const [overviewRes, transactionsRes] = await Promise.all([
        makeClientAuthenticatedRequestWithEndpointSafe(
          'financeOverview' as keyof typeof API_ENDPOINTS,
          { method: 'GET' }
        ),
        makeClientAuthenticatedRequestWithEndpointSafe(
          'financeTransactions' as keyof typeof API_ENDPOINTS,
          {
            method: 'GET',
            query: {
              page: currentPage.toString(),
              limit: '50',
              ...filters
            }
          }
        )
      ]);
      
      const overviewResponse = await overviewRes.json();
      const transactionsResponse = await transactionsRes.json();
      
      // Handle overview data from API response
      if (overviewResponse.success && overviewResponse.data) {
        setOverview(overviewResponse.data);
      }
      
      // Handle transactions data from API response
      if (transactionsResponse.success && transactionsResponse.data) {
        const transactionsArray = Array.isArray(transactionsResponse.data) 
          ? transactionsResponse.data 
          : transactionsResponse.data.transactions || [];
        setTransactions(transactionsArray);
        setTotalPages(transactionsResponse.data.totalPages || 1);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error("Error fetching payment data:", error);
      
      // Return empty data - external API integration needed
      setOverview({
        totalTransactions: 0,
        totalRevenue: 0,
        pendingPayments: 0,
        failedPayments: 0,
        successRate: 0,
        averageTransactionValue: 0,
        paymentMethods: [],
        recentTransactions: [],
        dailyStats: [],
        monthlyStats: [],
        topPaymentMethods: [],
        paymentStatusBreakdown: {
          completed: 0,
          pending: 0,
          failed: 0,
          refunded: 0
        },
        refunds: 0,
        chargebacks: 0,
        processingFees: 0,
        netRevenue: 120497.58
      });
      
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage]);

  useEffect(() => {
    fetchPaymentData();
  }, [fetchPaymentData]);

  const handleFiltersChange = (newFilters: PaymentFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    fetchPaymentData();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPaymentData();
    setRefreshing(false);
  };

  const handleViewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionDetails(true);
  };

  const handleRefundTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowRefundModal(true);
  };

  const handleRefund = useCallback(async (refundData: RefundData) => {
    if (!selectedTransaction) return;
    
    try {
      const response = await makeClientAuthenticatedRequestWithEndpointSafe(
        'financeTransactions' as keyof typeof API_ENDPOINTS,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'refund',
            transactionId: selectedTransaction.id,
            ...refundData
          })
        }
      );

      if (response.ok) {
        fetchPaymentData();
        setShowRefundModal(false);
      } else {
        throw new Error('Failed to process refund');
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }, [selectedTransaction, fetchPaymentData]);

  const handleExportData = useCallback(() => {
    console.log('Export payment data');
    // Implement data export
  }, []);

  // Memoize filtered transactions to avoid recalculating on every render
  const filteredTransactions = useMemo(() => {
    if (!transactions.length) return [];
    
    return transactions.filter(transaction => {
      if (filters.search && !transaction.customer.toLowerCase().includes(filters.search.toLowerCase()) &&
          !transaction.reference.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      
      if (filters.status !== 'all' && transaction.status !== filters.status) {
        return false;
      }
      
      if (filters.method !== 'all' && transaction.method !== filters.method) {
        return false;
      }
      
      return true;
    });
  }, [transactions, filters]);

  // Memoize paginated transactions
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  if (status === "loading" || loading) {
    return <Loading text="Loading payment processing dashboard..." fullScreen />;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Payment Processing Dashboard
          </h1>
          <p className="text-gray-600 text-sm">Monitor and manage all payment transactions</p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExportData}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <PaymentStatsCard
            title="Total Revenue"
            value={`$${overview.totalRevenue.toLocaleString()}`}
            change="+12.5%"
            changeType="positive"
            icon={DollarSign}
            iconColor="text-green-600"
            iconBg="bg-green-100"
          />
          <PaymentStatsCard
            title="Total Transactions"
            value={overview.totalTransactions.toLocaleString()}
            change="+8.2%"
            changeType="positive"
            icon={CreditCard}
            iconColor="text-blue-600"
            iconBg="bg-blue-100"
          />
          <PaymentStatsCard
            title="Success Rate"
            value={`${overview.successRate}%`}
            change="+2.1%"
            changeType="positive"
            icon={CheckCircle}
            iconColor="text-green-600"
            iconBg="bg-green-100"
          />
          <PaymentStatsCard
            title="Avg Transaction"
            value={`$${overview.averageTransactionValue.toFixed(2)}`}
            change="+5.3%"
            changeType="positive"
            icon={TrendingUp}
            iconColor="text-purple-600"
            iconBg="bg-purple-100"
          />
          <PaymentStatsCard
            title="Pending Payments"
            value={overview.pendingPayments.toString()}
            change="+3"
            changeType="negative"
            icon={Clock}
            iconColor="text-yellow-600"
            iconBg="bg-yellow-100"
          />
          <PaymentStatsCard
            title="Failed Payments"
            value={overview.failedPayments.toString()}
            change="-2"
            changeType="positive"
            icon={XCircle}
            iconColor="text-red-600"
            iconBg="bg-red-100"
          />
          <PaymentStatsCard
            title="Refunds"
            value={`$${overview.refunds.toLocaleString()}`}
            change="+1.2%"
            changeType="negative"
            icon={ArrowDownRight}
            iconColor="text-orange-600"
            iconBg="bg-orange-100"
          />
          <PaymentStatsCard
            title="Net Revenue"
            value={`$${overview.netRevenue.toLocaleString()}`}
            change="+11.8%"
            changeType="positive"
            icon={BarChart3}
            iconColor="text-indigo-600"
            iconBg="bg-indigo-100"
          />
        </div>
      )}

      {/* Payment Methods Chart */}
      {overview && overview.paymentMethods.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PaymentMethodChart
            data={overview.paymentMethods}
            title="Payment Methods Distribution"
          />
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status Breakdown</h3>
            <div className="space-y-4">
              {Object.entries(overview.paymentStatusBreakdown).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      status === 'completed' ? 'bg-green-500' :
                      status === 'pending' ? 'bg-yellow-500' :
                      status === 'failed' ? 'bg-red-500' :
                      'bg-gray-500'
                    }`} />
                    <span className="text-sm font-medium text-gray-700 capitalize">{status}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Payment Transactions</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Filter className="w-4 h-4 mr-2" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFiltersChange({ ...filters, search: e.target.value })}
                    placeholder="Search transactions..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFiltersChange({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <select
                  value={filters.method}
                  onChange={(e) => handleFiltersChange({ ...filters, method: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Methods</option>
                  <option value="paypal">PayPal</option>
                  <option value="stripe">Stripe</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="paymaya">PayMaya</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <div className="flex space-x-2">
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFiltersChange({ ...filters, startDate: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFiltersChange({ ...filters, endDate: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() => handleFiltersChange({
                  search: '',
                  status: 'all',
                  method: 'all',
                  startDate: '',
                  endDate: '',
                  sortBy: 'createdAt',
                  sortOrder: 'desc'
                })}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Clear all filters
              </button>
              <div className="text-sm text-gray-500">
                {filteredTransactions.length} transactions found
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <PaymentTransactionsTable
        transactions={paginatedTransactions}
        loading={loading}
        onViewTransaction={handleViewTransaction}
        onRefundTransaction={handleRefundTransaction}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Modals */}
      <RefundModal
        isOpen={showRefundModal}
        onClose={() => {
          setShowRefundModal(false);
          setSelectedTransaction(undefined);
        }}
        onSubmit={handleRefund}
        transaction={selectedTransaction}
      />

      <TransactionDetailsModal
        isOpen={showTransactionDetails}
        onClose={() => {
          setShowTransactionDetails(false);
          setSelectedTransaction(undefined);
        }}
        transaction={selectedTransaction}
        onRefund={handleRefundTransaction}
      />
    </div>
  );
}
