"use client";

import { useSession } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Loading } from "@/components/ui/loading";
import { Modal } from "@/components/ui/modal";
import { 
  CreditCard, 
  TrendingUp, 
  TrendingDown,
  Coins, 
  Download,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  BarChart3,
  Search,
  Clock,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  X,
  Image as ImageIcon,
  User,
  FileText,
  Eye,
  Wallet
} from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";

// Lazy load heavy components
import { 
  LazyPaymentMethodChart, 
  LazyRefundModal, 
  LazyPaymentTransactionsTable
} from "@/lib/lazy-components";
import type { RefundData } from "@/components/admin/refund-modal";
import { makeClientAuthenticatedRequestWithEndpointSafe, makeClientAuthenticatedRequestWithPathSafe } from "@/lib/client-api-utils";
import { API_ENDPOINTS } from "@/lib/api";
import { logger } from "@/lib/logger";
import { PaymentStatus, PaymentMethod } from "@/types/subscriptions";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useUserSettings } from "@/hooks/useUserSettings";
import { formatCurrency } from "@/lib/currency-utils";
import { getUserPreferredCurrency } from "@/lib/user-settings-utils";
import { getDefaultCurrency } from "@/lib/settings-utils";

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
    status: PaymentStatus;
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

interface PaymentTransaction {
  _id: string;
  id?: string; // For backward compatibility
  type: 'income' | 'expense' | 'withdrawal' | 'refund' | 'bonus' | 'referral' | 'topup';
  amount: number;
  category: string;
  description: string;
  paymentMethod: PaymentMethod | string;
  status: 'completed' | 'pending' | 'failed' | 'cancelled' | 'refunded';
  timestamp: string;
  reference: string;
  accountDetails?: {
    [key: string]: unknown;
  };
  processedAt?: string;
  processedBy?: string;
  adminNotes?: string;
}

interface Transaction {
  id: string;
  amount: number;
  method: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  customer: string;
  date: string;
  reference: string;
  description?: string;
  fees?: number;
  type?: 'income' | 'expense' | 'withdrawal' | 'refund' | 'bonus' | 'referral' | 'topup';
  category?: string;
  accountDetails?: {
    [key: string]: unknown;
  };
  adminNotes?: string;
  processedAt?: string;
  processedBy?: string;
}

interface PaymentFilters {
  search: string;
  status: string;
  type: string; // Transaction type: income, expense, withdrawal, refund, bonus, referral, topup
  method: string; // Payment method
  startDate: string;
  endDate: string;
  sortBy: string;
  sortOrder: string;
}

interface TopUpRequest {
  _id: string;
  id?: string;
  user?: string | {
    _id?: string;
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  amount: number;
  paymentMethod?: string;
  receipt?: {
    url?: string;
    thumbnail?: string;
  } | string;
  reference?: string;
  notes?: string;
  description?: string;
  accountDetails?: {
    receipt?: string | { url?: string; thumbnail?: string };
    [key: string]: unknown;
  };
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed' | 'failed';
  createdAt?: string;
  timestamp?: string;
  updatedAt?: string;
  processedAt?: string;
  processedBy?: string;
  adminNotes?: string;
}

interface WithdrawalRequest {
  _id: string;
  id?: string;
  user?: string | {
    _id?: string;
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  amount: number;
  paymentMethod?: string;
  accountDetails?: {
    bankName?: string;
    accountNumber?: string;
    routingNumber?: string;
    paypalEmail?: string;
    mobileNumber?: string;
    [key: string]: unknown;
  };
  reference?: string;
  notes?: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed' | 'failed';
  createdAt?: string;
  timestamp?: string;
  updatedAt?: string;
  processedAt?: string;
  processedBy?: string;
  adminNotes?: string;
}

const ITEMS_PER_PAGE = 10;

export default function PaymentProcessingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { settings: userSettings } = useUserSettings();
  const { settings: appSettings } = useAppSettings();
  const [overview, setOverview] = useState<PaymentOverview | null>(null);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Currency formatting helper - uses currency utilities consistently
  const formatPrice = useCallback((price: number | undefined | null | unknown, currency?: string | null) => {
    // Normalize the price value (handle objects, strings, null, undefined)
    let safeAmount = 0;
    if (price === null || price === undefined) {
      safeAmount = 0;
    } else if (typeof price === 'number' && !isNaN(price)) {
      safeAmount = price;
    } else if (typeof price === 'string') {
      const parsed = parseFloat(price);
      safeAmount = isNaN(parsed) ? 0 : parsed;
    } else if (typeof price === 'object' && price !== null) {
      // Handle object values (e.g., { count: 5, total: 1000 })
      const priceObj = price as { count?: number; total?: number; value?: number; amount?: number; number?: number };
      safeAmount = priceObj.count ?? priceObj.total ?? priceObj.value ?? priceObj.amount ?? priceObj.number ?? 0;
    } else {
      safeAmount = 0;
    }
    
    // Priority: 1. Provided currency, 2. User preferred currency, 3. App default currency
    const currencyCode = currency || getUserPreferredCurrency(userSettings) || getDefaultCurrency(appSettings);
    
    return formatCurrency(safeAmount, currencyCode, {
      appSettings,
      showSymbol: true,
    });
  }, [userSettings, appSettings]);
  const [filters, setFilters] = useState<PaymentFilters>({
    search: '',
    status: 'all',
    type: 'all',
    method: 'all',
    startDate: '',
    endDate: '',
    sortBy: 'timestamp',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<PaymentTransaction | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [topUpRequests, setTopUpRequests] = useState<TopUpRequest[]>([]);
  const [loadingTopUps, setLoadingTopUps] = useState(false);
  const [processingTopUp, setProcessingTopUp] = useState<string | null>(null);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [selectedTopUp, setSelectedTopUp] = useState<TopUpRequest | null>(null);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);
  const [processingWithdrawal, setProcessingWithdrawal] = useState<string | null>(null);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'transactions' | 'topups' | 'withdrawals'>('transactions');

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
              limit: ITEMS_PER_PAGE.toString(),
              ...(filters.status !== 'all' && { status: filters.status }),
              ...(filters.type !== 'all' && { type: filters.type }),
              ...(filters.method !== 'all' && { method: filters.method }),
              ...(filters.startDate && { startDate: filters.startDate }),
              ...(filters.endDate && { endDate: filters.endDate }),
            }
          }
        )
      ]);
      
      const overviewResponse = await overviewRes.json();
      const transactionsResponse = await transactionsRes.json();
      
      // Handle overview data from API response with default values
      if (overviewResponse.success && overviewResponse.data) {
        const defaultOverview: PaymentOverview = {
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
          netRevenue: 0
        };
        // Helper function to normalize numeric values (handles objects, numbers, null, undefined)
        const normalizeNumericValue = (value: unknown, defaultValue: number = 0): number => {
          if (value === null || value === undefined) return defaultValue;
          if (typeof value === 'number' && !isNaN(value)) return value;
          if (typeof value === 'string') {
            const parsed = parseFloat(value);
            return isNaN(parsed) ? defaultValue : parsed;
          }
          if (typeof value === 'object' && value !== null) {
            // Try common object properties
            const valueObj = value as { count?: number; total?: number; value?: number; amount?: number; number?: number };
            return valueObj.count ?? valueObj.total ?? valueObj.value ?? valueObj.amount ?? valueObj.number ?? defaultValue;
          }
          return defaultValue;
        };

        // Normalize all numeric fields from API response
        const data = overviewResponse.data;
        setOverview({
          ...defaultOverview,
          totalTransactions: normalizeNumericValue(data.totalTransactions, 0),
          totalRevenue: normalizeNumericValue(data.totalRevenue, 0),
          pendingPayments: normalizeNumericValue(data.pendingPayments, 0),
          failedPayments: normalizeNumericValue(data.failedPayments, 0),
          successRate: normalizeNumericValue(data.successRate, 0),
          averageTransactionValue: normalizeNumericValue(data.averageTransactionValue, 0),
          refunds: normalizeNumericValue(data.refunds, 0),
          chargebacks: normalizeNumericValue(data.chargebacks, 0),
          processingFees: normalizeNumericValue(data.processingFees, 0),
          netRevenue: normalizeNumericValue(data.netRevenue, 0),
          // Preserve array/object fields
          paymentMethods: Array.isArray(data.paymentMethods) ? data.paymentMethods : defaultOverview.paymentMethods,
          recentTransactions: Array.isArray(data.recentTransactions) ? data.recentTransactions : defaultOverview.recentTransactions,
          dailyStats: Array.isArray(data.dailyStats) ? data.dailyStats : defaultOverview.dailyStats,
          monthlyStats: Array.isArray(data.monthlyStats) ? data.monthlyStats : defaultOverview.monthlyStats,
          topPaymentMethods: Array.isArray(data.topPaymentMethods) ? data.topPaymentMethods : defaultOverview.topPaymentMethods,
          paymentStatusBreakdown: {
            ...defaultOverview.paymentStatusBreakdown,
            ...(data.paymentStatusBreakdown && typeof data.paymentStatusBreakdown === 'object' ? {
              completed: normalizeNumericValue(data.paymentStatusBreakdown.completed, 0),
              pending: normalizeNumericValue(data.paymentStatusBreakdown.pending, 0),
              failed: normalizeNumericValue(data.paymentStatusBreakdown.failed, 0),
              refunded: normalizeNumericValue(data.paymentStatusBreakdown.refunded, 0),
            } : {})
          }
        });
      }
      
      // Handle transactions data from API response
      if (transactionsResponse.success && transactionsResponse.data) {
        const transactionsArray = Array.isArray(transactionsResponse.data) 
          ? transactionsResponse.data 
          : transactionsResponse.data.transactions || [];
        
        // Transform API response to match interface (add id for backward compatibility)
        const transformedTransactions: PaymentTransaction[] = transactionsArray.map((tx: Record<string, unknown>) => ({
          ...tx,
          id: tx._id || tx.id, // Add id field for backward compatibility
          // Ensure all required fields have defaults
          type: tx.type || 'income',
          category: tx.category || '',
          description: tx.description || '',
          paymentMethod: tx.paymentMethod || tx.method || 'unknown',
          status: tx.status || 'pending',
          timestamp: tx.timestamp || tx.date || new Date().toISOString(),
          reference: tx.reference || '',
        }));
        
        setTransactions(transformedTransactions);
        // Use pages from response (API returns pages, not totalPages)
        setTotalPages(transactionsResponse.pages || transactionsResponse.data?.pages || 1);

        // If overview data is missing or incomplete, calculate from transactions
        if (transformedTransactions.length > 0) {
          setOverview(prev => {
            if (!prev) return prev;
            
            const calculatedMetrics = {
              totalTransactions: prev.totalTransactions || transformedTransactions.length,
              pendingPayments: prev.pendingPayments || transformedTransactions.filter(tx => tx.status === 'pending').length,
              failedPayments: prev.failedPayments || transformedTransactions.filter(tx => tx.status === 'failed').length,
              totalRevenue: prev.totalRevenue || transformedTransactions
                .filter(tx => (tx.type === 'income' || tx.type === 'topup') && tx.status === 'completed')
                .reduce((sum, tx) => sum + (tx.amount || 0), 0),
              refunds: prev.refunds || transformedTransactions
                .filter(tx => tx.type === 'refund' && tx.status === 'completed')
                .reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0),
            };

            // Only update if values are missing (0 or undefined)
            const needsUpdate = prev.totalTransactions === 0 || prev.pendingPayments === 0 || 
                                prev.failedPayments === 0 || prev.totalRevenue === 0;

            if (needsUpdate) {
              const avgTransaction = calculatedMetrics.totalTransactions > 0 
                ? (calculatedMetrics.totalRevenue / calculatedMetrics.totalTransactions)
                : 0;
              const successRate = calculatedMetrics.totalTransactions > 0 
                ? ((calculatedMetrics.totalTransactions - calculatedMetrics.failedPayments - calculatedMetrics.pendingPayments) / calculatedMetrics.totalTransactions * 100)
                : 0;
              const netRevenue = calculatedMetrics.totalRevenue - (prev.processingFees || 0) - calculatedMetrics.refunds;

              return {
                ...prev,
                totalTransactions: prev.totalTransactions || calculatedMetrics.totalTransactions,
                pendingPayments: prev.pendingPayments || calculatedMetrics.pendingPayments,
                failedPayments: prev.failedPayments || calculatedMetrics.failedPayments,
                totalRevenue: prev.totalRevenue || calculatedMetrics.totalRevenue,
                refunds: prev.refunds || calculatedMetrics.refunds,
                averageTransactionValue: prev.averageTransactionValue || avgTransaction,
                successRate: prev.successRate || successRate,
                netRevenue: prev.netRevenue || netRevenue,
              };
            }
            return prev;
          });
        }
      } else {
        setTransactions([]);
        setTotalPages(1);
      }
    } catch (error) {
      logger.error("Error fetching payment data", error instanceof Error ? error : new Error(String(error)));
      
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

  // Fetch top-up requests
  const fetchTopUpRequests = useCallback(async () => {
    try {
      setLoadingTopUps(true);
      
      // Use the top-ups endpoint: GET /api/finance/top-ups?status=pending&limit=50
      const response = await makeClientAuthenticatedRequestWithEndpointSafe(
        'financeTopUps' as keyof typeof API_ENDPOINTS,
        {
          method: 'GET',
          query: {
            status: 'pending',
            limit: '50',
            page: '1'
          }
        }
      );

      const data = await response.json();
      if (data.success && data.data) {
        // Handle response structure: { success, data: [...] } or { success, data: { topUps: [...] } }
        const requestsArray = Array.isArray(data.data) 
          ? data.data 
          : data.data.topUps || data.data.topUps || [];
        setTopUpRequests(requestsArray);
      } else {
        setTopUpRequests([]);
      }
    } catch (error) {
      logger.error("Error fetching top-up requests", error instanceof Error ? error : new Error(String(error)));
      setTopUpRequests([]);
    } finally {
      setLoadingTopUps(false);
    }
  }, []);

  // Process top-up request (approve/reject)
  // PUT /api/finance/top-ups/:topUpId/process
  const processTopUpRequest = useCallback(async (topUpId: string, action: 'approved' | 'rejected', notes?: string) => {
    try {
      setProcessingTopUp(topUpId);
      
      // Use makeClientAuthenticatedRequestWithPathSafe for path parameters
      // Endpoint: /api/finance/top-ups/:topUpId/process
      const response = await makeClientAuthenticatedRequestWithPathSafe(
        'financeTopUps' as keyof typeof API_ENDPOINTS,
        [topUpId, 'process'], // Path params: topUpId and 'process'
        {}, // No query params
        {
          method: 'PUT',
          body: JSON.stringify({
            status: action,
            adminNotes: notes || adminNotes || undefined
          })
        }
      );

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(`Top-up request ${action === 'approved' ? 'approved' : 'rejected'} successfully`);
        await fetchTopUpRequests();
        await fetchPaymentData();
        setShowTopUpModal(false);
        setSelectedTopUp(null);
        setAdminNotes('');
      } else {
        throw new Error(data.message || data.error || `Failed to ${action} top-up request`);
      }
    } catch (error) {
      logger.error('Error processing top-up request', error instanceof Error ? error : new Error(String(error)), { topUpId, action });
      toast.error(error instanceof Error ? error.message : `Failed to ${action} top-up request`);
    } finally {
      setProcessingTopUp(null);
    }
  }, [adminNotes, fetchTopUpRequests, fetchPaymentData]);

  // Fetch withdrawal requests
  const fetchWithdrawalRequests = useCallback(async () => {
    try {
      setLoadingWithdrawals(true);
      
      // Filter transactions to get pending withdrawal requests
      // Use the transactions endpoint with type=withdrawal and status=pending
      const response = await makeClientAuthenticatedRequestWithEndpointSafe(
        'financeTransactions' as keyof typeof API_ENDPOINTS,
        {
          method: 'GET',
          query: {
            type: 'withdrawal',
            status: 'pending',
            limit: '50',
            page: '1'
          }
        }
      );

      const data = await response.json();
      if (data.success && data.data) {
        // Transform transactions to withdrawal requests
        const transactionsArray = Array.isArray(data.data) 
          ? data.data 
          : data.data.transactions || [];
        
        const withdrawals: WithdrawalRequest[] = transactionsArray.map((tx: Record<string, unknown>) => ({
          _id: tx._id || tx.id,
          id: tx._id || tx.id,
          user: tx.user,
          amount: tx.amount,
          paymentMethod: tx.paymentMethod || tx.method,
          accountDetails: tx.accountDetails || {},
          reference: tx.reference,
          notes: tx.notes || tx.description,
          description: tx.description,
          status: tx.status || 'pending',
          createdAt: tx.createdAt || tx.timestamp,
          timestamp: tx.timestamp,
          updatedAt: tx.updatedAt,
          processedAt: tx.processedAt,
          processedBy: tx.processedBy,
          adminNotes: tx.adminNotes
        }));
        
        setWithdrawalRequests(withdrawals);
      } else {
        setWithdrawalRequests([]);
      }
    } catch (error) {
      logger.error("Error fetching withdrawal requests", error instanceof Error ? error : new Error(String(error)));
      setWithdrawalRequests([]);
    } finally {
      setLoadingWithdrawals(false);
    }
  }, []);

  // Process withdrawal request (approve/reject)
  // PUT /api/finance/withdrawals/:withdrawalId/process
  const processWithdrawalRequest = useCallback(async (withdrawalId: string, action: 'approved' | 'rejected', notes?: string) => {
    try {
      setProcessingWithdrawal(withdrawalId);
      
      // Use makeClientAuthenticatedRequestWithPathSafe for path parameters
      // Endpoint: /api/finance/withdrawals/:withdrawalId/process
      const response = await makeClientAuthenticatedRequestWithPathSafe(
        'financeWithdrawalsProcess' as keyof typeof API_ENDPOINTS,
        [withdrawalId, 'process'], // Path params: withdrawalId and 'process'
        {}, // No query params
        {
          method: 'PUT',
          body: JSON.stringify({
            status: action,
            adminNotes: notes || adminNotes || undefined
          })
        }
      );

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(`Withdrawal request ${action === 'approved' ? 'approved' : 'rejected'} successfully`);
        await fetchWithdrawalRequests();
        await fetchPaymentData();
        setShowWithdrawalModal(false);
        setSelectedWithdrawal(null);
        setAdminNotes('');
      } else {
        throw new Error(data.message || data.error || `Failed to ${action} withdrawal request`);
      }
    } catch (error) {
      logger.error('Error processing withdrawal request', error instanceof Error ? error : new Error(String(error)), { withdrawalId, action });
      toast.error(error instanceof Error ? error.message : `Failed to ${action} withdrawal request`);
    } finally {
      setProcessingWithdrawal(null);
    }
  }, [adminNotes, fetchWithdrawalRequests, fetchPaymentData]);

  useEffect(() => {
    fetchPaymentData();
    fetchTopUpRequests();
    fetchWithdrawalRequests();
  }, [fetchPaymentData, fetchTopUpRequests, fetchWithdrawalRequests]);

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

  // Adapter function to convert PaymentTransaction to component Transaction format
  const adaptTransactionForComponents = (tx: PaymentTransaction): Transaction => {
    return {
      id: tx.id || tx._id,
      amount: tx.amount,
      method: typeof tx.paymentMethod === 'string' ? tx.paymentMethod : 'unknown',
      status: tx.status === 'cancelled' ? 'failed' : (tx.status === 'refunded' ? 'refunded' : tx.status as 'completed' | 'pending' | 'failed'),
      customer: tx.description || 'N/A', // Use description as customer fallback
      date: tx.timestamp || new Date().toISOString(),
      reference: tx.reference,
      description: tx.description,
      type: tx.type,
      category: tx.category,
      accountDetails: tx.accountDetails,
      adminNotes: tx.adminNotes,
      processedAt: tx.processedAt,
      processedBy: tx.processedBy,
    };
  };

  const handleViewTransaction = (transaction: { id?: string }) => {
    // Find the original transaction from our state
    const originalTx = transactions.find(tx => (tx.id || tx._id) === transaction.id);
    if (originalTx) {
      setSelectedTransaction(originalTx);
      setShowTransactionDetails(true);
    }
  };

  const handleRefundTransaction = (transaction: { id?: string }) => {
    // Find the original transaction from our state
    const originalTx = transactions.find(tx => (tx.id || tx._id) === transaction.id);
    if (originalTx) {
      setSelectedTransaction(originalTx);
      setShowRefundModal(true);
    }
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
      logger.error('Error processing refund', error instanceof Error ? error : new Error(String(error)), { transactionId: selectedTransaction?.id });
      throw error;
    }
  }, [selectedTransaction, fetchPaymentData]);

  const handleExportData = useCallback(() => {
    logger.debug('Export payment data');
    // Implement data export
  }, []);

  // Memoize filtered transactions to avoid recalculating on every render
  const filteredTransactions = useMemo(() => {
    if (!transactions.length) return [];
    
    return transactions.filter(transaction => {
      // Search filter - check description, reference, category
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          (transaction.description?.toLowerCase().includes(searchLower)) ||
          (transaction.reference?.toLowerCase().includes(searchLower)) ||
          (transaction.category?.toLowerCase().includes(searchLower));
        if (!matchesSearch) {
          return false;
        }
      }
      
      // Status filter
      if (filters.status !== 'all' && transaction.status !== filters.status) {
        return false;
      }
      
      // Type filter
      if (filters.type !== 'all' && transaction.type !== filters.type) {
        return false;
      }
      
      // Payment method filter
      if (filters.method !== 'all' && transaction.paymentMethod !== filters.method) {
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
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Payment Processing Dashboard
          </h1>
          <p className="text-gray-600 text-sm">Monitor and manage all payment transactions</p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center space-x-1.5">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExportData}
            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
          >
            <Download className="w-3 h-3 mr-1" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded shadow p-3 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Total Revenue</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatPrice(overview.totalRevenue ?? 0)}
                </p>
                <p className="text-xs text-gray-500">+12.5% from last period</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg flex-shrink-0 ml-4">
                <Coins className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded shadow p-3 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Total Transactions</p>
                <p className="text-lg font-bold text-gray-900">
                  {typeof overview.totalTransactions === 'number' 
                    ? overview.totalTransactions.toLocaleString() 
                    : String(overview.totalTransactions ?? 0)}
                </p>
                <p className="text-xs text-gray-500">+8.2% from last period</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0 ml-4">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded shadow p-3 border-l-4 border-emerald-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Success Rate</p>
                <p className="text-lg font-bold text-gray-900">
                  {typeof overview.successRate === 'number' 
                    ? overview.successRate.toFixed(1) 
                    : '0.0'}%
                </p>
                <p className="text-xs text-gray-500">+2.1% from last period</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-lg flex-shrink-0 ml-4">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded shadow p-3 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Avg Transaction</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatPrice(overview.averageTransactionValue ?? 0)}
                </p>
                <p className="text-xs text-gray-500">+5.3% from last period</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg flex-shrink-0 ml-4">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded shadow p-3 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Pending Payments</p>
                <p className="text-lg font-bold text-gray-900">
                  {typeof overview.pendingPayments === 'number' 
                    ? overview.pendingPayments.toLocaleString() 
                    : String(overview.pendingPayments ?? 0)}
                </p>
                <p className="text-xs text-gray-500">Awaiting processing</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg flex-shrink-0 ml-4">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded shadow p-3 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Failed Payments</p>
                <p className="text-lg font-bold text-gray-900">
                  {typeof overview.failedPayments === 'number' 
                    ? overview.failedPayments.toLocaleString() 
                    : String(overview.failedPayments ?? 0)}
                </p>
                <p className="text-xs text-gray-500">Requires attention</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg flex-shrink-0 ml-4">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded shadow p-3 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Refunds</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatPrice(overview.refunds ?? 0)}
                </p>
                <p className="text-xs text-gray-500">Total refunded</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg flex-shrink-0 ml-4">
                <ArrowDownRight className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded shadow p-3 border-l-4 border-indigo-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Net Revenue</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatPrice(overview.netRevenue ?? 0)}
                </p>
                <p className="text-xs text-gray-500">+11.8% from last period</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-lg flex-shrink-0 ml-4">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Methods Chart */}
      {overview && (overview.paymentMethods ?? []).length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <LazyPaymentMethodChart
            data={overview.paymentMethods ?? []}
            title="Payment Methods Distribution"
          />
          <div className="bg-white rounded shadow p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Payment Status Breakdown</h3>
            <div className="space-y-2">
              {Object.entries(overview.paymentStatusBreakdown ?? {}).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between py-1">
                  <div className="flex items-center">
                    <div className={`w-2.5 h-2.5 rounded-full mr-2 ${
                      status === 'completed' ? 'bg-green-500' :
                      status === 'pending' ? 'bg-yellow-500' :
                      status === 'failed' ? 'bg-red-500' :
                      'bg-gray-500'
                    }`} />
                    <span className="text-xs font-medium text-gray-700 capitalize">{status}</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-900">{count ?? 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Transactions & Top-Up Requests Tabs */}
      <div className="bg-white rounded shadow">
        <div className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('transactions')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'transactions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  <span>Transactions</span>
                  {transactions.length > 0 && (
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      activeTab === 'transactions'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {transactions.length}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => setActiveTab('topups')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'topups'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Top-Up Requests</span>
                  {topUpRequests.length > 0 && (
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      activeTab === 'topups'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {topUpRequests.length}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => setActiveTab('withdrawals')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'withdrawals'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ArrowDownRight className="w-4 h-4" />
                  <span>Withdrawal Requests</span>
                  {withdrawalRequests.length > 0 && (
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      activeTab === 'withdrawals'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {withdrawalRequests.length}
                    </span>
                  )}
                </div>
              </button>
            </nav>
            <div className="flex items-center gap-1.5 px-6">
              {activeTab === 'topups' && (
                <button
                  onClick={fetchTopUpRequests}
                  disabled={loadingTopUps}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${loadingTopUps ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              )}
              {activeTab === 'withdrawals' && (
                <button
                  onClick={fetchWithdrawalRequests}
                  disabled={loadingWithdrawals}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${loadingWithdrawals ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              )}
              {activeTab === 'transactions' && (
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                >
                  <Filter className="w-3 h-3 mr-1" />
                  {showFilters ? 'Hide' : 'Show'} Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white">
          {/* Transactions Tab Content */}
          {activeTab === 'transactions' && (
            <>

              {showFilters && (
                <div className="p-4 border-b border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFiltersChange({ ...filters, search: e.target.value })}
                    placeholder="Search transactions..."
                    className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Transaction Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFiltersChange({ ...filters, type: e.target.value })}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                  <option value="withdrawal">Withdrawal</option>
                  <option value="refund">Refund</option>
                  <option value="bonus">Bonus</option>
                  <option value="referral">Referral</option>
                  <option value="topup">Top-up</option>
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
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={filters.method}
                  onChange={(e) => handleFiltersChange({ ...filters, method: e.target.value })}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Methods</option>
                  <option value="paypal">PayPal</option>
                  <option value="paymaya">PayMaya</option>
                  <option value="gcash">GCash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="wallet">Wallet</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date Range</label>
                <div className="flex space-x-2">
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFiltersChange({ ...filters, startDate: e.target.value })}
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFiltersChange({ ...filters, endDate: e.target.value })}
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={() => handleFiltersChange({
                  search: '',
                  status: 'all',
                  type: 'all',
                  method: 'all',
                  startDate: '',
                  endDate: '',
                  sortBy: 'timestamp',
                  sortOrder: 'desc'
                })}
                className="text-xs text-gray-600 hover:text-gray-800"
              >
                Clear all filters
              </button>
              <div className="text-xs text-gray-500">
                {filteredTransactions.length} transactions found
              </div>
            </div>
                </div>
              )}

              {/* Transactions Table - Lazy loaded for better performance */}
              <LazyPaymentTransactionsTable
                transactions={paginatedTransactions.map(adaptTransactionForComponents)}
                loading={loading}
                onViewTransaction={handleViewTransaction}
                onRefundTransaction={handleRefundTransaction}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                formatAmount={formatPrice}
              />
            </>
          )}

          {/* Top-Up Requests Tab Content */}
          {activeTab === 'topups' && (
            <>
              {loadingTopUps ? (
                <div className="p-16 text-center">
                  <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Loading top-up requests...</p>
                  <p className="text-sm text-gray-500 mt-1">Please wait while we fetch your data</p>
                </div>
              ) : topUpRequests.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center mx-auto mb-5 shadow-inner">
                    <ArrowUpRight className="w-10 h-10 text-blue-400" />
                  </div>
                  <p className="text-lg font-semibold text-gray-700 mb-1.5">No pending top-up requests</p>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto">All top-up requests have been processed</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {topUpRequests.map((request) => {
                    const userName = typeof request.user === 'object' 
                      ? `${request.user.firstName || ''} ${request.user.lastName || ''}`.trim() || request.user.email || 'Unknown User'
                      : 'Unknown User';
                    const userEmail = typeof request.user === 'object' ? request.user.email : '';
                    const receiptUrl = typeof request.receipt === 'object' 
                      ? (request.receipt.url || request.receipt.thumbnail)
                      : typeof request.receipt === 'string' 
                      ? request.receipt 
                      : request.accountDetails?.receipt
                      ? (typeof request.accountDetails.receipt === 'string' 
                        ? request.accountDetails.receipt 
                        : request.accountDetails.receipt.url || request.accountDetails.receipt.thumbnail)
                      : null;
                    
                    return (
                      <div key={request._id} className="p-5 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/30 transition-all duration-200 group">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3.5 flex-1 min-w-0">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/20">
                              <User className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                                <p className="font-semibold text-gray-900 text-base">{userName}</p>
                                {userEmail && (
                                  <span className="text-xs text-gray-500">({userEmail})</span>
                                )}
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                                <div className="bg-gray-50/50 rounded-lg p-2.5">
                                  <p className="text-xs font-medium text-gray-500 mb-1">Amount</p>
                                  <p className="text-base font-bold text-gray-900">{formatPrice(request.amount)}</p>
                                </div>
                                <div className="bg-gray-50/50 rounded-lg p-2.5">
                                  <p className="text-xs font-medium text-gray-500 mb-1">Payment Method</p>
                                  <p className="text-sm font-semibold text-gray-700 capitalize">{request.paymentMethod?.replace('_', ' ') || 'N/A'}</p>
                                </div>
                                {request.reference && (
                                  <div className="bg-gray-50/50 rounded-lg p-2.5">
                                    <p className="text-xs font-medium text-gray-500 mb-1">Reference</p>
                                    <p className="text-xs font-mono font-semibold text-gray-700 truncate">{request.reference}</p>
                                  </div>
                                )}
                                <div className="bg-gray-50/50 rounded-lg p-2.5">
                                  <p className="text-xs font-medium text-gray-500 mb-1">Requested</p>
                                  <p className="text-xs font-semibold text-gray-700">
                                    {new Date(request.createdAt || request.timestamp || new Date()).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              {(request.notes || request.description) && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                  <div className="flex items-start gap-2">
                                    <FileText className="w-3.5 h-3.5 text-gray-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
                                      <p className="text-sm text-gray-700 leading-relaxed">{request.notes || request.description}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {receiptUrl && (
                                <div className="mt-3">
                                  <button
                                    onClick={() => {
                                      setSelectedTopUp(request);
                                      setShowTopUpModal(true);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-all hover:shadow-sm"
                                  >
                                    <ImageIcon className="w-3 h-3" />
                                    View Receipt
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => {
                                setSelectedTopUp(request);
                                setShowTopUpModal(true);
                              }}
                              className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-sm hover:shadow"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Review
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Withdrawal Requests Tab Content */}
          {activeTab === 'withdrawals' && (
            <>
              {loadingWithdrawals ? (
                <div className="p-16 text-center">
                  <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Loading withdrawal requests...</p>
                  <p className="text-sm text-gray-500 mt-1">Please wait while we fetch your data</p>
                </div>
              ) : withdrawalRequests.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-100 to-orange-200 flex items-center justify-center mx-auto mb-5 shadow-inner">
                    <ArrowDownRight className="w-10 h-10 text-red-400" />
                  </div>
                  <p className="text-lg font-semibold text-gray-700 mb-1.5">No pending withdrawal requests</p>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto">All withdrawal requests have been processed</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {withdrawalRequests.map((request) => {
                    const userName = typeof request.user === 'object' 
                      ? `${request.user.firstName || ''} ${request.user.lastName || ''}`.trim() || request.user.email || 'Unknown User'
                      : 'Unknown User';
                    const userEmail = typeof request.user === 'object' ? request.user.email : '';
                    
                    return (
                      <div key={request._id} className="p-5 hover:bg-gradient-to-r hover:from-red-50/30 hover:to-orange-50/30 transition-all duration-200 group">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3.5 flex-1 min-w-0">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-red-500/20">
                              <User className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                                <p className="font-semibold text-gray-900 text-base">{userName}</p>
                                {userEmail && (
                                  <span className="text-xs text-gray-500">({userEmail})</span>
                                )}
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                                <div className="bg-gray-50/50 rounded-lg p-2.5">
                                  <p className="text-xs font-medium text-gray-500 mb-1">Amount</p>
                                  <p className="text-base font-bold text-gray-900">{formatPrice(request.amount)}</p>
                                </div>
                                <div className="bg-gray-50/50 rounded-lg p-2.5">
                                  <p className="text-xs font-medium text-gray-500 mb-1">Payment Method</p>
                                  <p className="text-sm font-semibold text-gray-700 capitalize">{request.paymentMethod?.replace('_', ' ') || 'N/A'}</p>
                                </div>
                                {request.reference && (
                                  <div className="bg-gray-50/50 rounded-lg p-2.5">
                                    <p className="text-xs font-medium text-gray-500 mb-1">Reference</p>
                                    <p className="text-xs font-mono font-semibold text-gray-700 truncate">{request.reference}</p>
                                  </div>
                                )}
                                <div className="bg-gray-50/50 rounded-lg p-2.5">
                                  <p className="text-xs font-medium text-gray-500 mb-1">Requested</p>
                                  <p className="text-xs font-semibold text-gray-700">
                                    {new Date(request.createdAt || request.timestamp || new Date()).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              {request.accountDetails && Object.keys(request.accountDetails).length > 0 && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                  <div className="flex items-start gap-2">
                                    <FileText className="w-3.5 h-3.5 text-gray-500 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="text-xs font-medium text-gray-500 mb-1">Account Details</p>
                                      <div className="text-sm text-gray-700 space-y-1">
                                        {request.accountDetails.bankName && (
                                          <p><span className="font-medium">Bank:</span> {request.accountDetails.bankName}</p>
                                        )}
                                        {request.accountDetails.accountNumber && (
                                          <p><span className="font-medium">Account:</span> {request.accountDetails.accountNumber}</p>
                                        )}
                                        {request.accountDetails.routingNumber && (
                                          <p><span className="font-medium">Routing:</span> {request.accountDetails.routingNumber}</p>
                                        )}
                                        {request.accountDetails.paypalEmail && (
                                          <p><span className="font-medium">PayPal:</span> {request.accountDetails.paypalEmail}</p>
                                        )}
                                        {request.accountDetails.mobileNumber && (
                                          <p><span className="font-medium">Mobile:</span> {request.accountDetails.mobileNumber}</p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {(request.notes || request.description) && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                  <div className="flex items-start gap-2">
                                    <FileText className="w-3.5 h-3.5 text-gray-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
                                      <p className="text-sm text-gray-700 leading-relaxed">{request.notes || request.description}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => {
                                setSelectedWithdrawal(request);
                                setShowWithdrawalModal(true);
                              }}
                              className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-sm hover:shadow"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Review
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals - Lazy loaded for better performance */}
      {showRefundModal && selectedTransaction && (
        <LazyRefundModal
          isOpen={showRefundModal}
          onClose={() => {
            setShowRefundModal(false);
            setSelectedTransaction(undefined);
          }}
          onSubmit={handleRefund}
          transaction={adaptTransactionForComponents(selectedTransaction)}
        />
      )}

      {/* Transaction Details Modal */}
      {showTransactionDetails && selectedTransaction && (
        <Modal
          isOpen={showTransactionDetails}
          onClose={() => {
            setShowTransactionDetails(false);
            setSelectedTransaction(undefined);
          }}
          title="Transaction Details"
          size="xl"
        >
          {(() => {
            const tx = adaptTransactionForComponents(selectedTransaction);
            const isIncome = tx.type === 'income' || tx.type === 'bonus' || tx.type === 'referral' || tx.type === 'refund';
            const rawAmount = tx.amount || 0;
            const displayAmount = isIncome ? Math.abs(rawAmount) : -Math.abs(rawAmount);
            
            return (
              <div className="space-y-4">
                {/* Transaction Header */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{tx.reference || tx.id}</h3>
                    <p className="text-sm text-gray-600">{tx.description || 'Transaction'}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${isIncome ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatPrice(displayAmount)}
                    </p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                      tx.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : tx.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : tx.status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {tx.status || 'pending'}
                    </span>
                  </div>
                </div>

                {/* Transaction Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500">Transaction ID</label>
                    <p className="text-sm font-semibold text-gray-900 font-mono">{tx.id}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Reference</label>
                    <p className="text-sm text-gray-900">{tx.reference || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Type</label>
                    <p className="text-sm text-gray-900 capitalize">{tx.type || 'transaction'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Category</label>
                    <p className="text-sm text-gray-900">{tx.category || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Amount</label>
                    <p className={`text-sm font-semibold ${isIncome ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatPrice(displayAmount)}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Payment Method</label>
                    <p className="text-sm text-gray-900 capitalize">{(tx.method || '').replace('_', ' ')}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Date</label>
                    <p className="text-sm text-gray-900">
                      {tx.date ? new Date(tx.date).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Status</label>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      tx.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : tx.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : tx.status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {tx.status || 'pending'}
                    </span>
                  </div>
                  {tx.processedAt && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Processed At</label>
                      <p className="text-sm text-gray-900">
                        {new Date(tx.processedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {tx.processedBy && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Processed By</label>
                      <p className="text-sm text-gray-900">{tx.processedBy}</p>
                    </div>
                  )}
                </div>

                {/* Account Details */}
                {tx.accountDetails && Object.keys(tx.accountDetails).length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-2 block">Account Details</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="space-y-2">
                        {Object.entries(tx.accountDetails).map(([key, value]) => {
                          if (!value || typeof value === 'object') return null;
                          return (
                            <div key={key} className="flex justify-between">
                              <span className="text-xs text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                              <span className="text-xs font-medium text-gray-900">{String(value)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Admin Notes */}
                {tx.adminNotes && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-2 block">Admin Notes</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-700">{tx.adminNotes}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    {tx.status === 'completed' && (
                      <button
                        onClick={() => {
                          handleRefundTransaction(tx);
                          setShowTransactionDetails(false);
                        }}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200"
                      >
                        <TrendingDown className="w-3 h-3 mr-1" />
                        Process Refund
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setShowTransactionDetails(false);
                      setSelectedTransaction(undefined);
                    }}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* Top-Up Request Modal */}
      <Modal
        isOpen={showTopUpModal}
        onClose={() => {
          setShowTopUpModal(false);
          setSelectedTopUp(null);
          setAdminNotes('');
        }}
        title="Top-Up Request Details"
        size="xl"
        footer={
          selectedTopUp ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => processTopUpRequest(selectedTopUp._id || selectedTopUp.id || '', 'approved', adminNotes)}
                disabled={processingTopUp === (selectedTopUp._id || selectedTopUp.id)}
                className="flex-1 inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-all duration-200"
              >
                <Check className="w-3 h-3 mr-1" />
                {processingTopUp === (selectedTopUp._id || selectedTopUp.id) ? 'Processing...' : 'Approve Request'}
              </button>
              <button
                onClick={() => processTopUpRequest(selectedTopUp._id || selectedTopUp.id || '', 'rejected', adminNotes)}
                disabled={processingTopUp === (selectedTopUp._id || selectedTopUp.id)}
                className="flex-1 inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-all duration-200"
              >
                <X className="w-3 h-3 mr-1" />
                {processingTopUp === (selectedTopUp._id || selectedTopUp.id) ? 'Processing...' : 'Reject Request'}
              </button>
            </div>
          ) : null
        }
      >
        {selectedTopUp && (
          <div className="space-y-4">
            {/* User Info */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {typeof selectedTopUp.user === 'object' 
                    ? `${selectedTopUp.user.firstName || ''} ${selectedTopUp.user.lastName || ''}`.trim() || selectedTopUp.user.email || 'Unknown User'
                    : 'Unknown User'}
                </p>
                {typeof selectedTopUp.user === 'object' && selectedTopUp.user.email && (
                  <p className="text-xs text-gray-500">{selectedTopUp.user.email}</p>
                )}
              </div>
            </div>

            {/* Request Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Amount</p>
                <p className="text-lg font-bold text-gray-900">{formatPrice(selectedTopUp.amount)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Payment Method</p>
                <p className="text-sm font-medium text-gray-700 capitalize">{selectedTopUp.paymentMethod?.replace('_', ' ') || 'N/A'}</p>
              </div>
              {selectedTopUp.reference && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Reference</p>
                  <p className="text-sm font-medium text-gray-700">{selectedTopUp.reference}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Requested</p>
                <p className="text-sm font-medium text-gray-700">
                  {new Date(selectedTopUp.createdAt || selectedTopUp.timestamp || new Date()).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Notes */}
            {(selectedTopUp.notes || selectedTopUp.description) && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-500 mb-1">User Notes</p>
                <p className="text-sm text-gray-700">{selectedTopUp.notes || selectedTopUp.description}</p>
              </div>
            )}

            {/* Receipt Image */}
            {(() => {
              const receiptUrl = typeof selectedTopUp.receipt === 'object' 
                ? (selectedTopUp.receipt.url || selectedTopUp.receipt.thumbnail)
                : typeof selectedTopUp.receipt === 'string' 
                ? selectedTopUp.receipt 
                : selectedTopUp.accountDetails?.receipt
                ? (typeof selectedTopUp.accountDetails.receipt === 'string' 
                  ? selectedTopUp.accountDetails.receipt 
                  : selectedTopUp.accountDetails.receipt.url || selectedTopUp.accountDetails.receipt.thumbnail)
                : null;
              
              return receiptUrl ? (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">Receipt</p>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <Image
                      src={receiptUrl}
                      alt="Receipt"
                      width={600}
                      height={400}
                      className="w-full h-auto object-contain"
                    />
                  </div>
                </div>
              ) : null;
            })()}

            {/* Admin Notes */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Admin Notes (optional)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes about this request..."
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={3}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Withdrawal Request Modal */}
      <Modal
        isOpen={showWithdrawalModal}
        onClose={() => {
          setShowWithdrawalModal(false);
          setSelectedWithdrawal(null);
          setAdminNotes('');
        }}
        title="Withdrawal Request Details"
        size="xl"
        footer={
          selectedWithdrawal ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => processWithdrawalRequest(selectedWithdrawal._id || selectedWithdrawal.id || '', 'approved', adminNotes)}
                disabled={processingWithdrawal === (selectedWithdrawal._id || selectedWithdrawal.id)}
                className="flex-1 inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-all duration-200"
              >
                <Check className="w-3 h-3 mr-1" />
                {processingWithdrawal === (selectedWithdrawal._id || selectedWithdrawal.id) ? 'Processing...' : 'Approve Request'}
              </button>
              <button
                onClick={() => processWithdrawalRequest(selectedWithdrawal._id || selectedWithdrawal.id || '', 'rejected', adminNotes)}
                disabled={processingWithdrawal === (selectedWithdrawal._id || selectedWithdrawal.id)}
                className="flex-1 inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-all duration-200"
              >
                <X className="w-3 h-3 mr-1" />
                {processingWithdrawal === (selectedWithdrawal._id || selectedWithdrawal.id) ? 'Processing...' : 'Reject Request'}
              </button>
            </div>
          ) : null
        }
      >
        {selectedWithdrawal && (
          <div className="space-y-4">
            {/* User Info */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-red-100 rounded-lg">
                <User className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {typeof selectedWithdrawal.user === 'object' 
                    ? `${selectedWithdrawal.user.firstName || ''} ${selectedWithdrawal.user.lastName || ''}`.trim() || selectedWithdrawal.user.email || 'Unknown User'
                    : 'Unknown User'}
                </p>
                {typeof selectedWithdrawal.user === 'object' && selectedWithdrawal.user.email && (
                  <p className="text-xs text-gray-500">{selectedWithdrawal.user.email}</p>
                )}
              </div>
            </div>

            {/* Request Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Amount</p>
                <p className="text-lg font-bold text-gray-900">{formatPrice(selectedWithdrawal.amount)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Payment Method</p>
                <p className="text-sm font-medium text-gray-700 capitalize">{selectedWithdrawal.paymentMethod?.replace('_', ' ') || 'N/A'}</p>
              </div>
              {selectedWithdrawal.reference && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Reference</p>
                  <p className="text-sm font-medium text-gray-700">{selectedWithdrawal.reference}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Requested</p>
                <p className="text-sm font-medium text-gray-700">
                  {new Date(selectedWithdrawal.createdAt || selectedWithdrawal.timestamp || new Date()).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Account Details */}
            {selectedWithdrawal.accountDetails && Object.keys(selectedWithdrawal.accountDetails).length > 0 && (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs font-medium text-gray-500 mb-2">Account Details</p>
                <div className="space-y-2">
                  {selectedWithdrawal.accountDetails.bankName && (
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600">Bank Name:</span>
                      <span className="text-xs font-medium text-gray-900">{selectedWithdrawal.accountDetails.bankName}</span>
                    </div>
                  )}
                  {selectedWithdrawal.accountDetails.accountNumber && (
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600">Account Number:</span>
                      <span className="text-xs font-medium text-gray-900">{selectedWithdrawal.accountDetails.accountNumber}</span>
                    </div>
                  )}
                  {selectedWithdrawal.accountDetails.routingNumber && (
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600">Routing Number:</span>
                      <span className="text-xs font-medium text-gray-900">{selectedWithdrawal.accountDetails.routingNumber}</span>
                    </div>
                  )}
                  {selectedWithdrawal.accountDetails.paypalEmail && (
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600">PayPal Email:</span>
                      <span className="text-xs font-medium text-gray-900">{selectedWithdrawal.accountDetails.paypalEmail}</span>
                    </div>
                  )}
                  {selectedWithdrawal.accountDetails.mobileNumber && (
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600">Mobile Number:</span>
                      <span className="text-xs font-medium text-gray-900">{selectedWithdrawal.accountDetails.mobileNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {(selectedWithdrawal.notes || selectedWithdrawal.description) && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-500 mb-1">User Notes</p>
                <p className="text-sm text-gray-700">{selectedWithdrawal.notes || selectedWithdrawal.description}</p>
              </div>
            )}

            {/* Admin Notes */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Admin Notes (optional)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes about this request..."
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={3}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
