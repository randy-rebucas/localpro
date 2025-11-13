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
  PieChart,
  Download,
  Filter,
  Eye,
  Plus,
  X
} from "lucide-react";

// Import finance components - Lazy load modals for better performance
import { LazyAddExpenseModal, LazyWithdrawalRequestModal } from "@/lib/lazy-components";
import type { ExpenseData } from "@/components/admin/add-expense-modal";
import type { WithdrawalData } from "@/components/admin/withdrawal-request-modal";
import { makeClientAuthenticatedRequestWithEndpointSafe } from "@/lib/client-api-utils";
import { API_ENDPOINTS } from "@/lib/api";
import { logger } from "@/lib/logger";
import { Transaction, TransactionType, TransactionStatus, TransactionCategory, Wallet } from "@/types/finance";

interface FinanceOverview {
  wallet: Omit<Wallet, 'lastUpdated'> & {
    lastUpdated: string;
  };
  monthlyEarnings: {
    totalEarnings: number;
    bookingCount: number;
  };
  pendingPayments: {
    totalPending: number;
    count: number;
  };
  referralEarnings: {
    totalEarnings: number;
    count: number;
  };
  recentTransactions: TransactionWithDetails[];
}

// Extended Transaction interface for admin page
interface TransactionWithDetails extends Omit<Transaction, 'type' | 'status' | 'paymentMethod' | 'reference' | 'createdAt' | 'updatedAt'> {
  id?: string;
  _id?: string;
  type: TransactionType | 'income' | 'expense';
  amount: number;
  category: TransactionCategory | string;
  description: string;
  paymentMethod: string;
  status: TransactionStatus | 'completed' | 'pending' | 'failed';
  timestamp: string;
  reference?: string;
}

interface FinanceFilters {
  search: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  category: string;
}

export default function FinanceAdmin() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [overview, setOverview] = useState<FinanceOverview | null>(null);
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FinanceFilters>({
    search: '',
    type: 'all',
    status: 'all',
    startDate: '',
    endDate: '',
    category: 'all'
  });
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showWithdrawal, setShowWithdrawal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  const fetchFinanceData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [overviewRes, transactionsRes] = await Promise.all([
        makeClientAuthenticatedRequestWithEndpointSafe(
          'financeOverview' as keyof typeof API_ENDPOINTS,
          { method: 'GET' }
        ),
        makeClientAuthenticatedRequestWithEndpointSafe(
          'financeTransactions' as keyof typeof API_ENDPOINTS,
          { method: 'GET', query: { page: '1', limit: '50', ...filters } }
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
          : [];
        setTransactions(transactionsArray);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      logger.error("Error fetching finance data", error instanceof Error ? error : new Error(String(error)));
      setError(error instanceof Error ? error.message : "Failed to load finance data");
      setOverview(null);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchFinanceData();
  }, [fetchFinanceData]);

  const handleFiltersChange = (newFilters: FinanceFilters) => {
    setFilters(newFilters);
    // Refetch data with new filters
    fetchFinanceData();
  };

  const handleAddExpense = async (expenseData: ExpenseData) => {
    try {
      const response = await makeClientAuthenticatedRequestWithEndpointSafe(
        'financeExpenses' as keyof typeof API_ENDPOINTS,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(expenseData) }
      );

      if (response.ok) {
        // Refresh data
        fetchFinanceData();
        setShowAddExpense(false);
      } else {
        throw new Error('Failed to add expense');
      }
    } catch (error) {
      logger.error('Error adding expense', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  };

  const handleWithdrawalRequest = async (withdrawalData: WithdrawalData) => {
    try {
      const response = await makeClientAuthenticatedRequestWithEndpointSafe(
        'financeWithdraw' as keyof typeof API_ENDPOINTS,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(withdrawalData) }
      );

      if (response.ok) {
        // Refresh data
        fetchFinanceData();
        setShowWithdrawal(false);
      } else {
        throw new Error('Failed to request withdrawal');
      }
    } catch (error) {
      logger.error('Error requesting withdrawal', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  };

  const handleViewTransaction = (transaction: TransactionWithDetails) => {
    logger.debug('View transaction', { transactionId: transaction.id || transaction._id || 'unknown', amount: transaction.amount });
    // Implement transaction detail view
  };

  const handleExportData = () => {
    logger.debug('Export finance data');
    // Implement data export
  };

  if (status === "loading" || loading) {
    return <Loading text="Loading finance" fullScreen />;
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
          <p className="text-gray-600 text-sm">Monitor revenue, expenses, and financial performance</p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center space-x-2">
          <button
            onClick={handleExportData}
            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Download className="w-3 h-3 mr-1" />
            Export
          </button>
          <button
            onClick={() => setShowAddExpense(true)}
            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Expense
          </button>
          <button
            onClick={() => setShowWithdrawal(true)}
            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <DollarSign className="w-3 h-3 mr-1" />
            Withdraw
          </button>
        </div>
      </div>
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded shadow p-3 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Wallet Balance</p>
              <p className="text-lg font-bold text-gray-900">
                ${overview?.wallet?.balance?.toLocaleString() || "0"}
              </p>
              <p className="text-xs text-gray-500">
                ${overview?.wallet?.pendingBalance || 0} pending
              </p>
            </div>
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded shadow p-3 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Monthly Earnings</p>
              <p className="text-lg font-bold text-gray-900">
                ${overview?.monthlyEarnings?.totalEarnings?.toLocaleString() || "0"}
              </p>
              <p className="text-xs text-gray-500">
                {overview?.monthlyEarnings?.bookingCount || 0} bookings
              </p>
            </div>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded shadow p-3 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Pending Payments</p>
              <p className="text-lg font-bold text-gray-900">
                ${overview?.pendingPayments?.totalPending?.toLocaleString() || "0"}
              </p>
              <p className="text-xs text-gray-500">
                {overview?.pendingPayments?.count || 0} payments
              </p>
            </div>
            <TrendingDown className="w-5 h-5 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded shadow p-3 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Referral Earnings</p>
              <p className="text-lg font-bold text-gray-900">
                ${overview?.referralEarnings?.totalEarnings?.toLocaleString() || "0"}
              </p>
              <p className="text-xs text-gray-500">
                {overview?.referralEarnings?.count || 0} referrals
              </p>
            </div>
            <PieChart className="w-5 h-5 text-purple-600" />
          </div>
        </div>
      </div>

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
              <button
                onClick={handleExportData}
                className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Download className="w-3 h-3 mr-1" />
                Export
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="p-4 border-b border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFiltersChange({ ...filters, search: e.target.value })}
                  placeholder="Search transactions..."
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFiltersChange({ ...filters, type: e.target.value })}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="revenue">Revenue</option>
                  <option value="expense">Expense</option>
                  <option value="withdrawal">Withdrawal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFiltersChange({ ...filters, status: e.target.value })}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFiltersChange({ ...filters, category: e.target.value })}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="marketing">Marketing</option>
                  <option value="operations">Operations</option>
                  <option value="development">Development</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFiltersChange({ ...filters, startDate: e.target.value })}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFiltersChange({ ...filters, endDate: e.target.value })}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={() => handleFiltersChange({
                  search: '',
                  type: 'all',
                  status: 'all',
                  startDate: '',
                  endDate: '',
                  category: 'all'
                })}
                className="text-xs text-gray-600 hover:text-gray-800"
              >
                Clear all filters
              </button>
              <div className="text-xs text-gray-500">
                {Array.isArray(transactions) ? transactions.length : 0} transactions found
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Recent Transactions</h3>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-500">Sort:</span>
              <button className="inline-flex items-center px-1 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-800">
                Date
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.isArray(transactions) && transactions.map((transaction, index) => (
                <tr key={transaction.reference || `transaction-${index}`} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-6 w-6">
                        <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center">
                          <CreditCard className="w-3 h-3 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-2">
                        <div className="text-xs font-medium text-gray-900">{transaction.description}</div>
                        <div className="text-xs text-gray-500">{transaction.reference || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                      transaction.type === 'income' ? 'text-green-600 bg-green-100' : 
                      transaction.type === 'expense' ? 'text-red-600 bg-red-100' : 
                      'text-blue-600 bg-blue-100'
                    }`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    ${Math.abs(transaction.amount).toFixed(2)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {new Date(transaction.timestamp).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                      transaction.status === 'completed' ? 'text-green-600 bg-green-100' :
                      transaction.status === 'pending' ? 'text-yellow-600 bg-yellow-100' :
                      'text-red-600 bg-red-100'
                    }`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                    <button
                      onClick={() => handleViewTransaction(transaction)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(!Array.isArray(transactions) || transactions.length === 0) && (
          <div className="text-center py-8">
            <CreditCard className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">No transactions found</h3>
            <p className="text-xs text-gray-500">Try adjusting your filters or date range.</p>
          </div>
        )}
      </div>

      {/* Modals - Lazy loaded for better performance */}
      {showAddExpense && (
        <LazyAddExpenseModal
          isOpen={showAddExpense}
          onClose={() => setShowAddExpense(false)}
          onSubmit={handleAddExpense}
        />
      )}

      {showWithdrawal && (
        <LazyWithdrawalRequestModal
          isOpen={showWithdrawal}
          onClose={() => setShowWithdrawal(false)}
          onSubmit={handleWithdrawalRequest}
          availableBalance={overview?.wallet?.balance || 0}
        />
      )}
    </div>
  );
}
