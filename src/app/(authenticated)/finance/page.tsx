"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Coins,
  Search,
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  PiggyBank,
  Receipt,
  Clock,
  AlertCircle,
  Filter,
  Star,
  Headphones,
  HelpCircle,
  Banknote,
  Building2,
  RefreshCw,
  FileText,
  Plus,
  Send,
  Settings,
  Grid3x3,
  List,
  ArrowUp,
  ArrowDown,
  Tag,
  X
} from "lucide-react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { formatCurrency as formatCurrencyUtil } from "@/lib/currency-utils";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useRoleAccess } from "@/components/role-guard";
import { Broadcaster } from "@/components/broadcaster";

export const dynamic = 'force-dynamic';

interface Transaction {
  _id?: string;
  id?: string;
  type: 'credit' | 'debit' | 'withdrawal' | 'deposit' | 'payment' | 'refund' | 'loan' | 'repayment' | 'topup' | 'top_up' | 'earning' | 'payout' | 'transfer' | 'fee' | 'commission' | 'interest' | 'penalty' | 'other';
  amount: number;
  currency?: string;
  description?: string;
  reference?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  category?: string;
  timestamp?: string | Date;
  createdAt?: string | Date;
}

interface WalletData {
  balance: number;
  availableBalance?: number;
  pendingBalance?: number;
  currency: string;
  lastUpdated?: string | Date;
}

interface LoanData {
  _id?: string;
  id?: string;
  type: 'micro' | 'business' | 'equipment' | 'salary_advance';
  amount: number;
  remainingBalance?: number;
  interestRate?: number;
  term?: number;
  status: 'pending' | 'approved' | 'disbursed' | 'active' | 'repaid' | 'defaulted' | 'rejected';
  nextPaymentDate?: string | Date;
  nextPaymentAmount?: number;
  createdAt?: string | Date;
}

interface FinanceOverview {
  wallet?: WalletData;
  monthlyEarnings?: {
    totalEarnings?: number;
    bookingCount?: number;
  };
  pendingPayments?: {
    totalPending?: number;
    count?: number;
  };
  totalExpenses?: number;
}

export default function FinancePage() {
  const { settings: appSettings, loading: settingsLoading } = useAppSettings();
  useRoleAccess(); // For authentication check
  
  const [mounted, setMounted] = useState(false);
  const [overview, setOverview] = useState<FinanceOverview | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loans, setLoans] = useState<LoanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  // const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [transactionType, setTransactionType] = useState<string>("all");
  // const [showFilters, setShowFilters] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 20,
    count: 0
  });
  
  // Active tab
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'loans'>('overview');
  
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const formatCurrency = useCallback((amount: number) => {
    try {
      return formatCurrencyUtil(amount, overview?.wallet?.currency || 'PHP');
    } catch {
      return `₱${amount?.toLocaleString() || '0'}`;
    }
  }, [overview?.wallet?.currency]);

  const fetchFinanceData = useCallback(async (isRefresh = false) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Fetch overview and transactions in parallel
      const [overviewRes, transactionsRes] = await Promise.all([
        fetch(
          `${API_BASE_URL}${API_ENDPOINTS.financeOverview}`,
          { ...createAuthFetchOptions(), signal }
        ),
        fetch(
          `${API_BASE_URL}${API_ENDPOINTS.financeTransactions}?page=${currentPage}&limit=20`,
          { ...createAuthFetchOptions(), signal }
        )
      ]);

      if (!overviewRes.ok || !transactionsRes.ok) {
        throw new Error('Failed to fetch finance data');
      }

      const overviewData = await overviewRes.json();
      const transactionsData = await transactionsRes.json();

      if (overviewData.success) {
        setOverview(overviewData.data || overviewData);
      }

      if (transactionsData.success) {
        setTransactions(transactionsData.data || transactionsData.transactions || []);
        if (transactionsData.pagination) {
          setTotalPages(transactionsData.pagination.pages || 1);
        }
      }

      // Try to fetch loans (may not exist for all users)
      try {
        const loansRes = await fetch(
          `${API_BASE_URL}/api/finance/loans`,
          { ...createAuthFetchOptions(), signal }
        );
        if (loansRes.ok) {
          const loansData = await loansRes.json();
          if (loansData.success) {
            setLoans(loansData.data || []);
          }
        }
      } catch {
        // Loans endpoint might not exist
        logger.debug('Loans endpoint not available');
      }

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      logger.error('Error fetching finance data:', err instanceof Error ? err : undefined);
      setError('Failed to load finance data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage]);

  useEffect(() => {
    if (mounted) {
      fetchFinanceData();
    }
  }, [mounted, fetchFinanceData]);

  // Debounce search input
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchInput);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchInput]);

  const handleRefresh = () => {
    fetchFinanceData(true);
  };

  // Feature check helper
  const isFeatureEnabled = useCallback((featureKey: string): boolean => {
    if (!appSettings?.features) return true;
    const features = appSettings.features as Record<string, { enabled?: boolean }>;
    return features[featureKey]?.enabled !== false;
  }, [appSettings]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch = !debouncedSearchQuery || 
        tx.description?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        tx.reference?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      
      const matchesType = transactionType === 'all' || tx.type === transactionType;
      
      return matchesSearch && matchesType;
    });
  }, [transactions, debouncedSearchQuery, transactionType]);

  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      let aValue: string | number | Date;
      let bValue: string | number | Date;
      switch (sortBy) {
        case 'amount': aValue = a.amount; bValue = b.amount; break;
        case 'description': aValue = a.description || ''; bValue = b.description || ''; break;
        default: aValue = new Date(a.createdAt || a.timestamp || 0).getTime(); bValue = new Date(b.createdAt || b.timestamp || 0).getTime(); break;
      }
      return sortOrder === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
    });
  }, [filteredTransactions, sortBy, sortOrder]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (transactionType !== 'all') count++;
    return count;
  }, [transactionType]);

  const clearFilters = () => {
    setTransactionType('all');
    setSearchInput("");
    // setSearchQuery("");
  };

  const handlePageChange = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [totalPages]);

  // Helper to determine if transaction is incoming (positive) money
  const isPositiveTransaction = (type: string): boolean => {
    const positiveTypes = ['credit', 'deposit', 'refund', 'topup', 'top_up', 'loan', 'earning', 'payout'];
    return positiveTypes.includes(type.toLowerCase());
  };

  const getTransactionIcon = (type: string) => {
    const normalizedType = type.toLowerCase();
    switch (normalizedType) {
      case 'credit':
      case 'deposit':
      case 'topup':
      case 'top_up':
      case 'earning':
        return <ArrowDownRight className="w-4 h-4 text-accent" />;
      case 'debit':
      case 'withdrawal':
      case 'payment':
      case 'transfer':
        return <ArrowUpRight className="w-4 h-4 text-red-600" />;
      case 'loan':
      case 'payout':
        return <Banknote className="w-4 h-4 text-primary" />;
      case 'repayment':
        return <RefreshCw className="w-4 h-4 text-purple-600" />;
      case 'refund':
        return <ArrowDownRight className="w-4 h-4 text-yellow-600" />;
      default:
        return <Coins className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClasses: Record<string, string> = {
      completed: 'bg-accent/10 text-accent border-accent/20',
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      failed: 'bg-red-100 text-red-700 border-red-200',
      cancelled: 'bg-gray-100 text-gray-700 border-gray-200',
      active: 'bg-primary/10 text-primary border-primary/20',
      approved: 'bg-accent/10 text-accent border-accent/20',
      disbursed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      repaid: 'bg-purple-100 text-purple-700 border-purple-200',
      defaulted: 'bg-red-100 text-red-700 border-red-200',
      rejected: 'bg-red-100 text-red-700 border-red-200'
    };

    return (
      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${statusClasses[status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!mounted || settingsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-accent/10/30 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-accent/10/30 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float animation-delay-4000"></div>
      </div>

      <div className="relative z-0">
        {/* Broadcaster - Only shown for clients */}
        <Broadcaster />

        {/* Header Section - Following Reference Layout */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Finance — Manage Your Wallet, Transactions & Loans
              </h1>
              <p className="text-gray-600">
                Track your earnings, expenses, and manage your financial activities.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2.5 rounded-xl bg-white border-2 border-gray-200 hover:border-accent hover:shadow-md transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <Link
                href="/wallet"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-accent to-accent/90 rounded-lg hover:from-accent/90 hover:to-accent transition-all shadow-lg shadow-accent/30 hover:shadow-xl hover:scale-105 flex-shrink-0"
              >
                <Wallet className="w-4 h-4" />
                Open Wallet
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Links Row */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 border-b border-gray-200 pb-4">
            <Link
              href="/finance"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-accent transition-colors group"
            >
              <Coins className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Overview</span>
            </Link>
            <Link
              href="/wallet"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-accent transition-colors group"
            >
              <Wallet className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Wallet</span>
            </Link>
            {isFeatureEnabled('referrals') && (
              <Link
                href="/referrals"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-accent transition-colors group"
              >
                <Star className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">Referral Earnings</span>
              </Link>
            )}
            <Link
              href="/support"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-accent transition-colors group"
            >
              <Headphones className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Support</span>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          {/* Error State */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 flex-1">{error}</p>
              <button
                onClick={() => fetchFinanceData()}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && !overview && (
            <div className="grid gap-6">
              {/* Skeleton for balance cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border-2 border-gray-200 p-5 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                    <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
              {/* Skeleton for content */}
              <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded-xl"></div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          {!loading && (
            <>
            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-emerald-500 to-accent rounded-2xl p-5 text-white shadow-xl shadow-emerald-500/25">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-emerald-100 text-sm font-medium">Total Balance</p>
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-3xl font-bold">{formatCurrency(overview?.wallet?.balance || 0)}</p>
                <p className="text-emerald-100 text-xs mt-1">Available: {formatCurrency(overview?.wallet?.availableBalance || overview?.wallet?.balance || 0)}</p>
              </div>

              <div className="bg-white rounded-2xl border-2 border-gray-200 p-5 hover:border-emerald-300 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-600 text-sm font-medium">Monthly Earnings</p>
                  <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-accent" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(overview?.monthlyEarnings?.totalEarnings || 0)}</p>
                <p className="text-gray-500 text-xs mt-1">{overview?.monthlyEarnings?.bookingCount || 0} transactions</p>
              </div>

              <div className="bg-white rounded-2xl border-2 border-gray-200 p-5 hover:border-yellow-300 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-600 text-sm font-medium">Pending Payments</p>
                  <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(overview?.pendingPayments?.totalPending || 0)}</p>
                <p className="text-gray-500 text-xs mt-1">{overview?.pendingPayments?.count || 0} pending</p>
              </div>

              <div className="bg-white rounded-2xl border-2 border-gray-200 p-5 hover:border-red-300 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-600 text-sm font-medium">Total Expenses</p>
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                    <ArrowUpRight className="w-5 h-5 text-red-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(overview?.totalExpenses || 0)}</p>
                <p className="text-gray-500 text-xs mt-1">This month</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <Link
                href="/wallet?action=add"
                className="flex items-center gap-3 p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-emerald-300 hover:shadow-lg transition-all group"
              >
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                  <Plus className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Add Funds</p>
                  <p className="text-xs text-gray-500">Top up wallet</p>
                </div>
              </Link>

              <Link
                href="/wallet?action=withdraw"
                className="flex items-center gap-3 p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-primary/30 hover:shadow-lg transition-all group"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Send className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Withdraw</p>
                  <p className="text-xs text-gray-500">Transfer out</p>
                </div>
              </Link>

              <Link
                href="/wallet?action=expense"
                className="flex items-center gap-3 p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all group"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <Receipt className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Add Expense</p>
                  <p className="text-xs text-gray-500">Track spending</p>
                </div>
              </Link>

              <Link
                href="/wallet?action=settings"
                className="flex items-center gap-3 p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all group"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                  <Settings className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Settings</p>
                  <p className="text-xs text-gray-500">Wallet config</p>
                </div>
              </Link>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 bg-white/80 backdrop-blur-sm p-2 rounded-xl border-2 border-gray-200">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                  activeTab === 'overview'
                    ? 'bg-gradient-to-r from-emerald-500 to-accent text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                  activeTab === 'transactions'
                    ? 'bg-gradient-to-r from-emerald-500 to-accent text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Transactions
              </button>
              <button
                onClick={() => setActiveTab('loans')}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                  activeTab === 'loans'
                    ? 'bg-gradient-to-r from-emerald-500 to-accent text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Loans
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Recent Transactions */}
                <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Recent Transactions</h3>
                    <button
                      onClick={() => setActiveTab('transactions')}
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      View All
                    </button>
                  </div>
                  {transactions.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Receipt className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500">No transactions yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {transactions.slice(0, 5).map((tx) => (
                        <div
                          key={tx._id || tx.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-200">
                            {getTransactionIcon(tx.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {tx.description || tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                            </p>
                            <p className="text-xs text-gray-500">{formatDate(tx.timestamp || tx.createdAt)}</p>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${
                              isPositiveTransaction(tx.type) ? 'text-accent' : 'text-red-600'
                            }`}>
                              {isPositiveTransaction(tx.type) ? '+' : '-'}
                              {formatCurrency(tx.amount)}
                            </p>
                            {getStatusBadge(tx.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Active Loans */}
                <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Active Loans</h3>
                    <button
                      onClick={() => setActiveTab('loans')}
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      View All
                    </button>
                  </div>
                  {loans.filter(l => ['active', 'disbursed'].includes(l.status)).length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Banknote className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 mb-3">No active loans</p>
                      <p className="text-sm text-gray-400">Apply for a loan to grow your business</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {loans
                        .filter(l => ['active', 'disbursed'].includes(l.status))
                        .slice(0, 3)
                        .map((loan) => (
                          <div
                            key={loan._id || loan.id}
                            className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-gray-900 capitalize">{loan.type.replace('_', ' ')} Loan</span>
                              {getStatusBadge(loan.status)}
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Remaining:</span>
                              <span className="font-semibold">{formatCurrency(loan.remainingBalance || loan.amount)}</span>
                            </div>
                            {loan.nextPaymentDate && (
                              <div className="flex items-center justify-between text-sm mt-1">
                                <span className="text-gray-600">Next Payment:</span>
                                <span>{formatDate(loan.nextPaymentDate)}</span>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Loan CTA */}
                  <div className="mt-4 p-4 bg-gradient-to-r from-emerald-500 to-accent rounded-xl text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <PiggyBank className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">Need Funds?</p>
                        <p className="text-emerald-100 text-sm">Apply for micro-loans or salary advance</p>
                      </div>
                    </div>
                    <button className="mt-3 w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors">
                      Apply Now
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'transactions' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                  {/* Left Sidebar - Filters */}
                  <>
                    {/* Mobile Filter Drawer Overlay */}
                    {filterDrawerOpen && (
                      <div
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={() => setFilterDrawerOpen(false)}
                      />
                    )}

                    {/* Filter Sidebar */}
                    <aside
                      className={`bg-white rounded-2xl shadow-lg border border-gray-100 lg:w-[280px] flex-shrink-0 lg:sticky lg:top-24 ${
                        filterDrawerOpen
                          ? "fixed right-0 top-0 h-full w-80 z-50 lg:relative lg:w-[280px] lg:h-auto"
                          : "hidden lg:block"
                      }`}
                    >
                      {/* Header Section */}
                      <div className="bg-gradient-to-r from-accent/10 to-emerald-50 px-6 py-4 border-b border-accent/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-md">
                              <Filter className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                              <p className="text-xs text-gray-600">Refine your search</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setFilterDrawerOpen(false)}
                            className="lg:hidden text-gray-500 hover:text-gray-700"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Filter Content Area */}
                      <div className="p-6 space-y-8">
                        {/* Transaction Type Filter */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-accent" />
                            <label className="text-sm font-semibold text-gray-900">Transaction Type</label>
                          </div>
                          <select
                            value={transactionType}
                            onChange={(e) => setTransactionType(e.target.value)}
                            className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                          >
                            <option value="all">All Types</option>
                            <option value="credit">Credit</option>
                            <option value="debit">Debit</option>
                            <option value="deposit">Deposit</option>
                            <option value="topup">Top Up</option>
                            <option value="withdrawal">Withdrawal</option>
                            <option value="payment">Payment</option>
                            <option value="refund">Refund</option>
                            <option value="earning">Earning</option>
                            <option value="payout">Payout</option>
                            <option value="loan">Loan</option>
                            <option value="repayment">Repayment</option>
                          </select>
                        </div>

                        {/* Clear Filters */}
                        {activeFiltersCount > 0 && (
                          <button
                            onClick={clearFilters}
                            className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 border-2 border-transparent hover:border-gray-300 transition-all flex items-center justify-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Clear Filters
                          </button>
                        )}
                      </div>

                      {/* Help Section */}
                      <div className="px-6 pb-6">
                        <div className="bg-gradient-to-br from-accent/10 to-emerald-50 rounded-lg p-4 border border-accent/20">
                          <div className="flex items-start gap-3 mb-3">
                            <HelpCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                            <div>
                              <h3 className="font-semibold text-gray-900 text-sm">Need Help?</h3>
                              <p className="text-xs text-gray-600 mt-1">Our support team is here to assist you.</p>
                            </div>
                          </div>
                          <Link
                            href="/support"
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-accent rounded-lg hover:bg-accent/10 transition-all border border-accent/20 font-medium text-sm"
                          >
                            <Headphones className="w-4 h-4" />
                            Contact Support
                          </Link>
                        </div>
                      </div>
                    </aside>
                  </>

                  {/* Main Content Area */}
                  <div className="flex-1 min-w-0 space-y-6">
                    {/* Mobile Filter Button */}
                    <button
                      onClick={() => setFilterDrawerOpen(true)}
                      className="lg:hidden w-full px-4 py-3 bg-white rounded-lg border border-gray-200 shadow-sm flex items-center justify-center gap-2 text-gray-700 font-medium hover:bg-gray-50"
                    >
                      <Filter className="w-4 h-4" />
                      Filters
                      {activeFiltersCount > 0 && (
                        <span className="px-2 py-0.5 bg-accent text-white text-xs font-medium rounded-full">
                          {activeFiltersCount}
                        </span>
                      )}
                    </button>

                    {/* Unified Controls Bar */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        {/* Search - 70% */}
                        <div className="w-full sm:w-[70%] relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2">
                            <Search className="w-4 h-4 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            placeholder="Search transactions..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="w-full pl-9 pr-9 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                          />
                          {searchInput && (
                            <button
                              onClick={() => {
                                setSearchInput("");
                              }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Sort - 20% */}
                        <div className="w-full sm:w-[20%] flex items-center gap-1.5">
                          <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="flex-1 px-3 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-white"
                          >
                            <option value="createdAt">Date</option>
                            <option value="amount">Amount</option>
                            <option value="description">Description</option>
                          </select>
                          <button
                            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                            className="flex-shrink-0 w-10 h-10 flex items-center justify-center border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            title={sortOrder === "asc" ? "Ascending" : "Descending"}
                          >
                            {sortOrder === "asc" ? (
                              <ArrowUp className="w-4 h-4 text-gray-600" />
                            ) : (
                              <ArrowDown className="w-4 h-4 text-gray-600" />
                            )}
                          </button>
                        </div>

                        {/* Display Mode - 10% */}
                        <div className="w-full sm:w-[10%] flex items-center justify-end">
                          <div className="bg-gray-100 rounded-lg p-1 flex items-center gap-1">
                            <button
                              onClick={() => setViewMode("grid")}
                              className={`p-1.5 rounded transition-all ${
                                viewMode === "grid"
                                  ? "bg-white text-accent shadow-sm"
                                  : "text-gray-600 hover:text-gray-900"
                              }`}
                              title="Grid view"
                            >
                              <Grid3x3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setViewMode("list")}
                              className={`p-1.5 rounded transition-all ${
                                viewMode === "list"
                                  ? "bg-white text-accent shadow-sm"
                                  : "text-gray-600 hover:text-gray-900"
                              }`}
                              title="List view"
                            >
                              <List className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Results Count */}
                    <div className="text-sm text-gray-600">
                      {sortedTransactions.length > 0 ? (
                        <>
                          Showing {((currentPage - 1) * pagination.limit) + 1} to {Math.min(currentPage * pagination.limit, sortedTransactions.length)} of {sortedTransactions.length} results
                        </>
                      ) : (
                        <>No results found</>
                      )}
                    </div>

                    {/* Transaction List */}
                    {sortedTransactions.length === 0 ? (
                      <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-8 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Receipt className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Transactions Found</h3>
                        <p className="text-gray-500 mb-4">
                          {debouncedSearchQuery || activeFiltersCount > 0 ? 'Try adjusting your search or filters' : 'Your transactions will appear here'}
                        </p>
                        {activeFiltersCount > 0 && (
                          <button
                            onClick={clearFilters}
                            className="px-6 py-3 bg-gradient-to-r from-accent to-accent/90 text-white rounded-lg hover:from-accent/90 hover:to-accent transition-all shadow-lg shadow-accent/30 hover:shadow-xl hover:scale-105 font-semibold"
                          >
                            Clear Filters
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className={viewMode === "grid" 
                          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                          : "space-y-3"
                        }>
                          {sortedTransactions.map((tx) => (
                            <div
                              key={tx._id || tx.id}
                              className={`flex items-center gap-4 p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-accent/30 hover:shadow-lg transition-all ${
                                viewMode === "list" ? "" : "flex-col"
                              }`}
                            >
                              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center border-2 border-gray-200">
                                {getTransactionIcon(tx.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-semibold text-gray-900">
                                    {tx.description || tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                                  </p>
                                  {getStatusBadge(tx.status)}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                  <span>{formatDate(tx.timestamp || tx.createdAt)}</span>
                                  {tx.reference && (
                                    <>
                                      <span>•</span>
                                      <span className="truncate">Ref: {tx.reference}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`text-lg font-bold ${
                                  isPositiveTransaction(tx.type) ? 'text-accent' : 'text-red-600'
                                }`}>
                                  {isPositiveTransaction(tx.type) ? '+' : '-'}
                                  {formatCurrency(tx.amount)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                              <div className="text-sm text-gray-600">
                                Showing {((currentPage - 1) * pagination.limit) + 1} to {Math.min(currentPage * pagination.limit, sortedTransactions.length)} of {sortedTransactions.length} results
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handlePageChange(currentPage - 1)}
                                  disabled={currentPage === 1}
                                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  Previous
                                </button>
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum: number;
                                    if (totalPages <= 5) {
                                      pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                      pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                      pageNum = totalPages - 4 + i;
                                    } else {
                                      pageNum = currentPage - 2 + i;
                                    }
                                    return (
                                      <button
                                        key={pageNum}
                                        onClick={() => handlePageChange(pageNum)}
                                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                          currentPage === pageNum
                                            ? "bg-accent text-white"
                                            : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                                        }`}
                                      >
                                        {pageNum}
                                      </button>
                                    );
                                  })}
                                </div>
                                <button
                                  onClick={() => handlePageChange(currentPage + 1)}
                                  disabled={currentPage === totalPages}
                                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  Next
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'loans' && (
              <div className="space-y-6">
                {/* Loan Types */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 hover:border-primary/30 hover:shadow-lg transition-all group cursor-pointer">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Banknote className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Micro Loan</h3>
                    <p className="text-gray-600 text-sm mb-4">Quick small loans for immediate needs. Up to ₱100,000</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Interest:</span>
                      <span className="font-semibold text-primary">5% monthly</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 hover:border-purple-300 hover:shadow-lg transition-all group cursor-pointer">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Building2 className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Business Loan</h3>
                    <p className="text-gray-600 text-sm mb-4">Grow your business with larger loans. Up to ₱5,000,000</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Interest:</span>
                      <span className="font-semibold text-purple-600">3% monthly</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 hover:border-emerald-300 hover:shadow-lg transition-all group cursor-pointer">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <CreditCard className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Salary Advance</h3>
                    <p className="text-gray-600 text-sm mb-4">Get your salary early. Based on your earning history</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Interest:</span>
                      <span className="font-semibold text-emerald-600">2% fee</span>
                    </div>
                  </div>
                </div>

                {/* My Loans */}
                <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">My Loans</h3>
                  
                  {loans.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Banknote className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Loans Yet</h3>
                      <p className="text-gray-500 mb-4">Apply for a loan to get started</p>
                      <button className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-accent text-white rounded-xl font-medium hover:from-emerald-600 hover:to-accent transition-all shadow-lg shadow-emerald-500/25">
                        Apply for Loan
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {loans.map((loan) => (
                        <div
                          key={loan._id || loan.id}
                          className="p-5 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-emerald-300 transition-all"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-primary to-indigo-600 rounded-xl flex items-center justify-center">
                                <Banknote className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900 capitalize">{loan.type.replace('_', ' ')} Loan</h4>
                                <p className="text-sm text-gray-500">Applied: {formatDate(loan.createdAt)}</p>
                              </div>
                            </div>
                            {getStatusBadge(loan.status)}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Amount</p>
                              <p className="font-semibold">{formatCurrency(loan.amount)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Remaining</p>
                              <p className="font-semibold">{formatCurrency(loan.remainingBalance || 0)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Interest Rate</p>
                              <p className="font-semibold">{loan.interestRate || 0}%</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Next Payment</p>
                              <p className="font-semibold">{loan.nextPaymentDate ? formatDate(loan.nextPaymentDate) : 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

              {/* Help Section */}
              <div className="mt-8 bg-gradient-to-r from-accent via-accent/90 to-accent rounded-2xl p-6 text-white">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                      <HelpCircle className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Need Help with Finances?</h3>
                      <p className="text-accent-100">Our support team is here to assist you with any questions</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Link
                      href="/support"
                      className="flex items-center gap-2 px-5 py-2.5 bg-white text-accent rounded-xl font-medium hover:bg-accent/10 transition-colors"
                    >
                      <Headphones className="w-4 h-4" />
                      Contact Support
                    </Link>
                    <Link
                      href="/support#faq"
                      className="flex items-center gap-2 px-5 py-2.5 bg-white/20 text-white rounded-xl font-medium hover:bg-white/30 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      FAQs
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

