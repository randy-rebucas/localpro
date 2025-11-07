"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import toast from "react-hot-toast";
import { Wallet, RefreshCw, AlertCircle, ArrowUpRight, ArrowDownRight, TrendingUp, DollarSign, Clock, Plus, Minus, X, Settings, Receipt } from "lucide-react";
import { Wallet as WalletType, TransactionDetails, PaymentMethod } from "@/types/finance";

// Disable static generation for this page
export const dynamic = 'force-dynamic';

interface FinanceOverview {
  wallet?: WalletType;
  monthlyEarnings?: {
    totalEarnings?: number;
    bookingCount?: number;
  };
  pendingPayments?: {
    totalPending?: number;
    count?: number;
  };
  referralEarnings?: {
    totalEarnings?: number;
    count?: number;
  };
  recentTransactions?: TransactionDetails[];
}

interface EarningsData {
  totalEarnings?: number;
  total?: number;
  bookingCount?: number;
  [key: string]: unknown;
}

interface ExpenseData {
  _id?: string;
  id?: string;
  amount?: number;
  category?: string;
  description?: string;
  paymentMethod?: string;
  status?: string;
  timestamp?: string | Date;
  [key: string]: unknown;
}

export default function WalletPage() {
  const [mounted, setMounted] = useState(false);
  const [overview, setOverview] = useState<FinanceOverview | null>(null);
  const [transactions, setTransactions] = useState<TransactionDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modal states
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showWalletSettingsModal, setShowWalletSettingsModal] = useState(false);
  
  // Form states
  const [addFundsAmount, setAddFundsAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState<PaymentMethod>("bank_transfer");
  const [bankAccount, setBankAccount] = useState({ bankName: "", accountNumber: "", routingNumber: "" });
  const [expenseData, setExpenseData] = useState({ amount: "", category: "", description: "", paymentMethod: "" });
  const [walletSettings, setWalletSettings] = useState({ autoWithdraw: false, minBalance: "", lowBalance: true, withdrawal: true, payment: true });
  
  const [processing, setProcessing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [expenses, setExpenses] = useState<ExpenseData[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Keyboard shortcuts for modals
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showAddFundsModal) setShowAddFundsModal(false);
        if (showWithdrawModal) setShowWithdrawModal(false);
        if (showExpenseModal) setShowExpenseModal(false);
        if (showWalletSettingsModal) setShowWalletSettingsModal(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showAddFundsModal, showWithdrawModal, showExpenseModal, showWalletSettingsModal]);

  const fetchWalletData = useCallback(async (isRefresh = false, page = currentPage) => {
      // Cancel previous request if still in progress
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

        // Fetch overview, transactions, earnings, and expenses in parallel
        const [overviewRes, transactionsRes, earningsRes, expensesRes] = await Promise.all([
          fetch(
            `${API_BASE_URL}${API_ENDPOINTS.financeOverview}`,
            { ...createAuthFetchOptions(), signal }
          ),
          fetch(
            `${API_BASE_URL}${API_ENDPOINTS.financeTransactions}?page=${page}&limit=20`,
            { ...createAuthFetchOptions(), signal }
          ),
          fetch(
            `${API_BASE_URL}${API_ENDPOINTS.financeEarnings}`,
            { ...createAuthFetchOptions(), signal }
          ).catch(() => null), // Optional endpoint
          fetch(
            `${API_BASE_URL}${API_ENDPOINTS.financeExpenses}`,
            { ...createAuthFetchOptions(), signal }
          ).catch(() => null), // Optional endpoint
        ]);

        // Check if request was aborted
        if (signal.aborted) return;

        // Handle overview response - check response body for errors
        let overviewData = null;
        try {
          overviewData = await overviewRes.json();
          
          // Check if response contains an error message (even if status is 200)
          const hasError = !overviewRes.ok || !overviewData.success || overviewData.error;
          if (hasError) {
            const errorMessage = overviewData.error || overviewData.message || `Failed to fetch wallet overview: ${overviewRes.status}`;
            // Treat "not found" errors as empty state, not actual errors
            if (errorMessage && (
                errorMessage.toLowerCase().includes('not found') || 
                errorMessage.toLowerCase().includes('financial data not found')
              ) || overviewRes.status === 404) {
              logger.debug('Financial data not found, initializing empty wallet');
              overviewData = { success: true, data: null };
            } else if (errorMessage) {
              throw new Error(errorMessage);
            }
          }
        } catch (parseError) {
          // If JSON parsing fails, check status code
          if (overviewRes.status === 404) {
            logger.debug('Financial data not found (404), initializing empty wallet');
            overviewData = { success: true, data: null };
          } else {
            // Re-throw only if it's not a "not found" error
            const errorMsg = parseError instanceof Error ? parseError.message : String(parseError);
            if (errorMsg.toLowerCase().includes('not found') || 
                errorMsg.toLowerCase().includes('financial data not found')) {
              logger.debug('Financial data not found (from parse error), initializing empty wallet');
              overviewData = { success: true, data: null };
            } else {
              throw parseError;
            }
          }
        }

        // Handle transactions response - check response body for errors
        let transactionsData = null;
        try {
          transactionsData = await transactionsRes.json();
          
          // Check if response contains an error message (even if status is 200)
          const hasError = !transactionsRes.ok || !transactionsData.success || transactionsData.error;
          if (hasError) {
            const errorMessage = transactionsData.error || transactionsData.message || `Failed to fetch transactions: ${transactionsRes.status}`;
            // Treat "not found" errors as empty state, not actual errors
            if (errorMessage && (
                errorMessage.toLowerCase().includes('not found') || 
                errorMessage.toLowerCase().includes('financial data not found')
              ) || transactionsRes.status === 404) {
              logger.debug('Transactions not found, initializing empty list');
              transactionsData = { success: true, data: [] };
            } else if (errorMessage) {
              throw new Error(errorMessage);
            }
          }
        } catch (parseError) {
          // If JSON parsing fails, check status code
          if (transactionsRes.status === 404) {
            logger.debug('Transactions not found (404), initializing empty list');
            transactionsData = { success: true, data: [] };
          } else {
            // Re-throw only if it's not a "not found" error
            const errorMsg = parseError instanceof Error ? parseError.message : String(parseError);
            if (errorMsg.toLowerCase().includes('not found')) {
              logger.debug('Transactions not found (from parse error), initializing empty list');
              transactionsData = { success: true, data: [] };
            } else {
              throw parseError;
            }
          }
        }

        logger.debug('Wallet API responses', { 
          hasOverview: !!overviewData, 
          hasTransactions: !!transactionsData 
        });

        // Handle overview data
        if (overviewData?.success && overviewData.data) {
          setOverview(overviewData.data);
          
          // Load wallet settings if available
          if (overviewData.data.wallet) {
            const wallet = overviewData.data.wallet;
            setWalletSettings({
              autoWithdraw: wallet.autoWithdraw || false,
              minBalance: wallet.minBalance?.toString() || "",
              lowBalance: wallet.notificationSettings?.lowBalance ?? true,
              withdrawal: wallet.notificationSettings?.withdrawal ?? true,
              payment: wallet.notificationSettings?.payment ?? true,
            });
          }
        } else {
          // Initialize with empty wallet structure
          setOverview({
            wallet: {
              balance: 0,
              pendingBalance: 0,
            },
            monthlyEarnings: {
              totalEarnings: 0,
              bookingCount: 0,
            },
            referralEarnings: {
              totalEarnings: 0,
              count: 0,
            },
          });
        }

        // Handle transactions data
        if (transactionsData?.success && transactionsData.data) {
          const transactionsArray = Array.isArray(transactionsData.data) 
            ? transactionsData.data 
            : transactionsData.data.transactions || [];
          setTransactions(transactionsArray);
          setTotalPages(transactionsData.data.pages || transactionsData.pages || 1);
        } else {
          setTransactions([]);
          setTotalPages(1);
        }

        // Handle earnings data
        if (earningsRes && earningsRes.ok) {
          try {
            const earningsData = await earningsRes.json();
            if (earningsData.success && earningsData.data) {
              setEarnings(earningsData.data);
            }
          } catch (e) {
            logger.debug('Error parsing earnings data', { error: e });
          }
        }

        // Handle expenses data
        if (expensesRes && expensesRes.ok) {
          try {
            const expensesData = await expensesRes.json();
            if (expensesData.success && expensesData.data) {
              const expensesArray = Array.isArray(expensesData.data) ? expensesData.data : [];
              setExpenses(expensesArray);
            }
          } catch (e) {
            logger.debug('Error parsing expenses data', { error: e });
          }
        }
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch wallet data";
        // Only log and show error for actual errors, not "not found" cases
        if (!errorMessage.toLowerCase().includes('not found') && 
            !errorMessage.toLowerCase().includes('financial data not found')) {
          logger.error('Error fetching wallet data', err instanceof Error ? err : new Error(String(err)));
          setError(errorMessage);
          if (!isRefresh) {
            toast.error(errorMessage);
          }
        } else {
          // Log as debug for "not found" cases (expected scenario for new users)
          logger.debug('Financial data not found, initializing empty wallet state');
          // Initialize with empty state for "not found" cases
          setOverview({
            wallet: {
              balance: 0,
              pendingBalance: 0,
            },
            monthlyEarnings: {
              totalEarnings: 0,
              bookingCount: 0,
            },
            referralEarnings: {
              totalEarnings: 0,
              count: 0,
            },
          });
          setTransactions([]);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }, [currentPage]);

  useEffect(() => {
    if (!mounted) return;
    fetchWalletData(false, currentPage);
  }, [mounted, currentPage, fetchWalletData]);

  const refreshWalletData = useCallback(() => {
    fetchWalletData(true, currentPage);
  }, [fetchWalletData, currentPage]);

  const formatCurrency = (amount: number | undefined | null, currency: string = 'USD') => {
    const safeAmount = amount && !isNaN(amount) ? amount : 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(safeAmount);
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  };

  const getTransactionIcon = (type: string | undefined) => {
    switch (type) {
      case 'income':
      case 'bonus':
      case 'referral':
        return <ArrowDownRight className="w-5 h-5 text-green-600" />;
      case 'expense':
      case 'withdrawal':
        return <ArrowUpRight className="w-5 h-5 text-red-600" />;
      case 'refund':
        return <RefreshCw className="w-5 h-5 text-blue-600" />;
      default:
        return <DollarSign className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string | undefined) => {
    switch (type) {
      case 'income':
      case 'bonus':
      case 'referral':
        return 'text-green-600 bg-green-50';
      case 'expense':
      case 'withdrawal':
        return 'text-red-600 bg-red-50';
      case 'refund':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const balance = (overview?.wallet?.balance && !isNaN(overview.wallet.balance)) ? overview.wallet.balance : 0;
  const pendingBalance = (overview?.wallet?.pendingBalance && !isNaN(overview.wallet.pendingBalance)) ? overview.wallet.pendingBalance : 0;
  const currency = 'USD'; // Default currency

  const handleAddFunds = async () => {
    const amount = parseFloat(addFundsAmount);
    if (!addFundsAmount || isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setProcessing(true);
    try {
      // Note: This endpoint might need to be created on the backend
      // For now, we'll show a placeholder implementation
      toast.success(`Adding ${formatCurrency(amount, currency)} to your wallet...`);
      setShowAddFundsModal(false);
      setAddFundsAmount("");
      // Refresh wallet data
      setTimeout(() => {
        fetchWalletData(true);
      }, 500);
    } catch (err) {
      logger.error('Error adding funds', err instanceof Error ? err : new Error(String(err)));
      toast.error("Failed to add funds. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!withdrawAmount || isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (amount < 100) {
      toast.error("Minimum withdrawal amount is $100");
      return;
    }

    if (amount > balance) {
      toast.error("Insufficient balance");
      return;
    }

    if (withdrawMethod === "bank_transfer" && (!bankAccount.bankName || !bankAccount.accountNumber)) {
      toast.error("Please provide bank account details");
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.financeWithdraw}`,
        createAuthFetchOptions({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: amount,
            paymentMethod: withdrawMethod,
            accountDetails: withdrawMethod === "bank_transfer" ? bankAccount : undefined,
          }),
        })
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || "Failed to process withdrawal");
      }

      toast.success("Withdrawal request submitted successfully");
      setShowWithdrawModal(false);
      setWithdrawAmount("");
      setBankAccount({ bankName: "", accountNumber: "", routingNumber: "" });
      // Refresh wallet data
      setTimeout(() => {
        fetchWalletData(true);
      }, 500);
    } catch (err) {
      logger.error('Error processing withdrawal', err instanceof Error ? err : new Error(String(err)));
      const errorMessage = err instanceof Error ? err.message : "Failed to process withdrawal";
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handleAddExpense = async () => {
    const amount = parseFloat(expenseData.amount);
    if (!expenseData.amount || isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!expenseData.category || !expenseData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.financeExpenseAdd}`,
        createAuthFetchOptions({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: amount,
            category: expenseData.category,
            description: expenseData.description,
            paymentMethod: expenseData.paymentMethod || undefined,
          }),
        })
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || "Failed to add expense");
      }

      toast.success("Expense added successfully");
      setShowExpenseModal(false);
      setExpenseData({ amount: "", category: "", description: "", paymentMethod: "" });
      // Refresh wallet data
      setTimeout(() => {
        fetchWalletData(true);
      }, 500);
    } catch (err) {
      logger.error('Error adding expense', err instanceof Error ? err : new Error(String(err)));
      const errorMessage = err instanceof Error ? err.message : "Failed to add expense";
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateWalletSettings = async () => {
    setProcessing(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.financeWalletSettings}`,
        createAuthFetchOptions({
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            autoWithdraw: walletSettings.autoWithdraw,
            minBalance: walletSettings.minBalance ? (() => {
              const minBal = parseFloat(walletSettings.minBalance);
              return !isNaN(minBal) && minBal >= 0 ? minBal : undefined;
            })() : undefined,
            notificationSettings: {
              lowBalance: walletSettings.lowBalance,
              withdrawal: walletSettings.withdrawal,
              payment: walletSettings.payment,
            },
          }),
        })
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || "Failed to update wallet settings");
      }

      toast.success("Wallet settings updated successfully");
      setShowWalletSettingsModal(false);
      // Refresh wallet data
      setTimeout(() => {
        fetchWalletData(true);
      }, 500);
    } catch (err) {
      logger.error('Error updating wallet settings', err instanceof Error ? err : new Error(String(err)));
      const errorMessage = err instanceof Error ? err.message : "Failed to update wallet settings";
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };


  if (!mounted || loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Wallet</h1>
            <p className="text-sm text-gray-600">Manage your finances and transactions</p>
          </div>
        </div>

        {/* Loading State */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mb-4"></div>
            <p className="text-gray-600 font-medium">Loading wallet...</p>
            <p className="text-sm text-gray-500 mt-1">Please wait while we fetch your information</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Wallet</h1>
            <p className="text-sm text-gray-600">Manage your finances and transactions</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExpenseModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
            title="Add expense"
          >
            <Receipt className="w-4 h-4" />
            Add Expense
          </button>
          <button
            onClick={() => setShowWalletSettingsModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="Wallet settings"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <button
            onClick={refreshWalletData}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh wallet data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Unable to Load Wallet</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  fetchWalletData(false, currentPage);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Balance Cards */}
      {!error && (
        <>
          {/* Main Balance Card with Actions */}
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-8 text-white">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-emerald-100 text-sm mb-2">Available Balance</p>
                <p className="text-4xl font-bold">{formatCurrency(balance, currency)}</p>
                {pendingBalance > 0 && (
                  <p className="text-emerald-100 text-sm mt-2">
                    {formatCurrency(pendingBalance, currency)} pending
                  </p>
                )}
              </div>
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                <Wallet className="w-8 h-8" />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddFundsModal(true)}
                className="flex-1 bg-white text-emerald-600 font-semibold py-3 px-4 rounded-lg hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Funds
              </button>
              <button
                onClick={() => setShowWithdrawModal(true)}
                disabled={balance === 0}
                className="flex-1 bg-emerald-600/20 text-white font-semibold py-3 px-4 rounded-lg hover:bg-emerald-600/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Minus className="w-5 h-5" />
                Withdraw
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Monthly Earnings */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Monthly Earnings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(
                    (overview?.monthlyEarnings?.totalEarnings && !isNaN(overview.monthlyEarnings.totalEarnings))
                      ? overview.monthlyEarnings.totalEarnings
                      : 0,
                    currency
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {(overview?.monthlyEarnings?.bookingCount && !isNaN(overview.monthlyEarnings.bookingCount))
                    ? overview.monthlyEarnings.bookingCount
                    : 0} bookings
                </p>
              </div>
            </div>

            {/* Referral Earnings */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Referral Earnings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(
                    (overview?.referralEarnings?.totalEarnings && !isNaN(overview.referralEarnings.totalEarnings))
                      ? overview.referralEarnings.totalEarnings
                      : 0,
                    currency
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {(overview?.referralEarnings?.count && !isNaN(overview.referralEarnings.count))
                    ? overview.referralEarnings.count
                    : 0} referrals
                </p>
              </div>
            </div>

            {/* Pending Balance */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Balance</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(pendingBalance, currency)}</p>
              </div>
            </div>
          </div>
        </>
      )}


      {/* Earnings & Expenses Summary */}
      {!error && (earnings || expenses.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {earnings && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Earnings Summary</h3>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Earnings</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(
                      (earnings.totalEarnings && !isNaN(earnings.totalEarnings)) 
                        ? earnings.totalEarnings 
                        : (earnings.total && !isNaN(earnings.total)) 
                          ? earnings.total 
                          : 0, 
                      currency
                    )}
                  </span>
                </div>
                {earnings.bookingCount && !isNaN(earnings.bookingCount) && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Bookings</span>
                    <span className="text-sm text-gray-900">{earnings.bookingCount}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          {expenses.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Expenses</h3>
                <Receipt className="w-5 h-5 text-red-600" />
              </div>
              <div className="space-y-3">
                {expenses.slice(0, 3).map((expense: ExpenseData, index: number) => {
                  const expenseAmount = (expense.amount && !isNaN(expense.amount)) ? expense.amount : 0;
                  return (
                    <div key={expense._id || expense.id || `expense-${index}`} className="flex justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{expense.description || expense.category}</p>
                        <p className="text-xs text-gray-500">{expense.category}</p>
                      </div>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(expenseAmount, currency)}
                      </span>
                    </div>
                  );
                })}
              </div>
              {expenses.length > 3 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-center">
                    Showing 3 of {expenses.length} expenses
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Transactions Section */}
      {!error && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
            <p className="text-sm text-gray-600 mt-1">View your transaction history</p>
          </div>

          {transactions.length === 0 ? (
            <div className="p-12 text-center">
              <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No transactions yet</p>
              <p className="text-sm text-gray-500 mt-1">Your transaction history will appear here</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {transactions.map((transaction, index) => {
                  const transactionKey = transaction.reference 
                    || (transaction.timestamp ? (typeof transaction.timestamp === 'string' ? transaction.timestamp : transaction.timestamp.toString()) : null)
                    || `transaction-${index}`;
                  return (
                    <div key={transactionKey} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getTransactionColor(transaction.type)}`}>
                            {getTransactionIcon(transaction.type)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {transaction.description || transaction.category || 'Transaction'}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500 capitalize">
                                {transaction.type || 'transaction'}
                              </span>
                              {transaction.reference && (
                                <>
                                  <span className="text-gray-300">•</span>
                                  <span className="text-xs text-gray-500">
                                    {transaction.reference}
                                  </span>
                                </>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(transaction.timestamp)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${
                            transaction.type === 'income' || transaction.type === 'bonus' || transaction.type === 'referral' || transaction.type === 'refund'
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}>
                            {transaction.type === 'income' || transaction.type === 'bonus' || transaction.type === 'referral' || transaction.type === 'refund'
                              ? '+'
                              : '-'
                            }
                            {formatCurrency(
                              (transaction.amount && !isNaN(transaction.amount)) 
                                ? Math.abs(transaction.amount) 
                                : 0, 
                              currency
                            )}
                          </p>
                          <p className={`text-xs mt-1 px-2 py-1 rounded-full inline-block ${
                            transaction.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : transaction.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : transaction.status === 'failed'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {transaction.status || 'pending'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-6 border-t border-gray-200 flex items-center justify-between">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Add Funds Modal */}
      {showAddFundsModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !processing) {
              setShowAddFundsModal(false);
              setAddFundsAmount("");
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            {processing && (
              <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center z-10">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-2"></div>
                  <p className="text-sm text-gray-600">Processing...</p>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Add Funds</h2>
              <button
                onClick={() => {
                  setShowAddFundsModal(false);
                  setAddFundsAmount("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={addFundsAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
                        setAddFundsAmount(value);
                      }
                    }}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    max="999999.99"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    aria-label="Amount to add"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                  <option value="card">Credit/Debit Card</option>
                  <option value="paypal">PayPal</option>
                  <option value="paymaya">PayMaya</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowAddFundsModal(false);
                    setAddFundsAmount("");
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddFunds}
                  disabled={processing || !addFundsAmount}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? "Processing..." : "Add Funds"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !processing) {
              setShowWithdrawModal(false);
              setWithdrawAmount("");
              setBankAccount({ bankName: "", accountNumber: "", routingNumber: "" });
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            {processing && (
              <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center z-10">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-2"></div>
                  <p className="text-sm text-gray-600">Processing...</p>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Withdraw Funds</h2>
              <button
                onClick={() => {
                  setShowWithdrawModal(false);
                  setWithdrawAmount("");
                  setBankAccount({ bankName: "", accountNumber: "", routingNumber: "" });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0 && parseFloat(value) <= balance)) {
                        setWithdrawAmount(value);
                      }
                    }}
                    placeholder="0.00"
                    min="0"
                    max={balance}
                    step="0.01"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    aria-label="Amount to withdraw"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Available: {formatCurrency(balance, currency)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Withdrawal Method
                </label>
                <select
                  value={withdrawMethod}
                  onChange={(e) => setWithdrawMethod(e.target.value as PaymentMethod)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="paypal">PayPal</option>
                  <option value="paymaya">PayMaya</option>
                </select>
              </div>
              {withdrawMethod === "bank_transfer" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={bankAccount.bankName}
                      onChange={(e) => setBankAccount({ ...bankAccount, bankName: e.target.value })}
                      placeholder="Enter bank name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={bankAccount.accountNumber}
                      onChange={(e) => setBankAccount({ ...bankAccount, accountNumber: e.target.value })}
                      placeholder="Enter account number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Routing Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={bankAccount.routingNumber}
                      onChange={(e) => setBankAccount({ ...bankAccount, routingNumber: e.target.value })}
                      placeholder="Enter routing number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowWithdrawModal(false);
                    setWithdrawAmount("");
                    setBankAccount({ bankName: "", accountNumber: "", routingNumber: "" });
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={processing || !withdrawAmount}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? "Processing..." : "Request Withdrawal"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showExpenseModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !processing) {
              setShowExpenseModal(false);
              setExpenseData({ amount: "", category: "", description: "", paymentMethod: "" });
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto relative">
            {processing && (
              <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center z-10">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-2"></div>
                  <p className="text-sm text-gray-600">Processing...</p>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Add Expense</h2>
              <button
                onClick={() => {
                  setShowExpenseModal(false);
                  setExpenseData({ amount: "", category: "", description: "", paymentMethod: "" });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={expenseData.amount}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
                        setExpenseData({ ...expenseData, amount: value });
                      }
                    }}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    max="999999.99"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    aria-label="Expense amount"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <input
                  type="text"
                  value={expenseData.category}
                  onChange={(e) => setExpenseData({ ...expenseData, category: e.target.value })}
                  placeholder="e.g., supplies, equipment, travel"
                  maxLength={100}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  aria-label="Expense category"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={expenseData.description}
                  onChange={(e) => setExpenseData({ ...expenseData, description: e.target.value })}
                  placeholder="Describe the expense"
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  aria-label="Expense description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method (Optional)
                </label>
                <select
                  value={expenseData.paymentMethod}
                  onChange={(e) => setExpenseData({ ...expenseData, paymentMethod: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">Select method</option>
                  <option value="card">Credit/Debit Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="paypal">PayPal</option>
                  <option value="paymaya">PayMaya</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowExpenseModal(false);
                    setExpenseData({ amount: "", category: "", description: "", paymentMethod: "" });
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddExpense}
                  disabled={processing || !expenseData.amount || !expenseData.category || !expenseData.description}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? "Adding..." : "Add Expense"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Settings Modal */}
      {showWalletSettingsModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !processing) {
              setShowWalletSettingsModal(false);
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto relative">
            {processing && (
              <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center z-10">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-2"></div>
                  <p className="text-sm text-gray-600">Saving...</p>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Wallet Settings</h2>
              <button
                onClick={() => setShowWalletSettingsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Auto Withdraw
                  </label>
                  <p className="text-xs text-gray-500">Automatically withdraw funds when balance exceeds minimum</p>
                </div>
                <input
                  type="checkbox"
                  checked={walletSettings.autoWithdraw}
                  onChange={(e) => setWalletSettings({ ...walletSettings, autoWithdraw: e.target.checked })}
                  className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Balance
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={walletSettings.minBalance}
                    onChange={(e) => setWalletSettings({ ...walletSettings, minBalance: e.target.value })}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Notification Settings</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-700">Low Balance Alerts</label>
                    <input
                      type="checkbox"
                      checked={walletSettings.lowBalance}
                      onChange={(e) => setWalletSettings({ ...walletSettings, lowBalance: e.target.checked })}
                      className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-700">Withdrawal Notifications</label>
                    <input
                      type="checkbox"
                      checked={walletSettings.withdrawal}
                      onChange={(e) => setWalletSettings({ ...walletSettings, withdrawal: e.target.checked })}
                      className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-700">Payment Notifications</label>
                    <input
                      type="checkbox"
                      checked={walletSettings.payment}
                      onChange={(e) => setWalletSettings({ ...walletSettings, payment: e.target.checked })}
                      className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowWalletSettingsModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateWalletSettings}
                  disabled={processing}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

