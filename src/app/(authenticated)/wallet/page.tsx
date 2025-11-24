"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useUserSettings } from "@/hooks/useUserSettings";
import { getEnabledPaymentMethods, getDefaultCurrency, calculateTransactionFee, getMinimumPayout, formatPayoutSchedule, getNextPayoutDate } from "@/lib/settings-utils";
import { getUserPreferredCurrency } from "@/lib/user-settings-utils";
import { formatCurrency as formatCurrencyUtil, getCurrencySymbol } from "@/lib/currency-utils";
import { logger } from "@/lib/logger";
import toast from "react-hot-toast";
import { Wallet, RefreshCw, AlertCircle, ArrowUpRight, ArrowDownRight, TrendingUp, DollarSign, Clock, Plus, Minus, X, Settings, Receipt, Upload } from "lucide-react";
import Image from "next/image";
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
  const { settings: appSettings } = useAppSettings();
  const { settings: userSettings } = useUserSettings();
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
  const [addFundsPaymentMethod, setAddFundsPaymentMethod] = useState<string>("bank_transfer");
  const [addFundsReceipt, setAddFundsReceipt] = useState<File | null>(null);
  const [addFundsReference, setAddFundsReference] = useState("");
  const [addFundsNotes, setAddFundsNotes] = useState("");
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
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

  // Get default currency - prefer user settings, fallback to app settings
  const userCurrency = getUserPreferredCurrency(userSettings);
  const appCurrency = getDefaultCurrency(appSettings);
  const defaultCurrency = userCurrency || appCurrency;
  
  const formatCurrency = (amount: number | undefined | null, currency?: string) => {
    const safeAmount = amount && !isNaN(amount) ? amount : 0;
    const currencyCode = currency || defaultCurrency;
    return formatCurrencyUtil(safeAmount, currencyCode, {
      appSettings,
    });
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
  const currency = defaultCurrency; // Use default currency from app settings
  const currencySymbol = getCurrencySymbol(currency);

  // Calculate transaction fees for top-up and withdrawal
  const topUpAmount = parseFloat(addFundsAmount) || 0;
  const topUpFee = topUpAmount > 0 ? calculateTransactionFee(topUpAmount, appSettings) : 0;
  const topUpTotal = topUpAmount + topUpFee;

  const withdrawAmountValue = parseFloat(withdrawAmount) || 0;
  const withdrawFee = withdrawAmountValue > 0 ? calculateTransactionFee(withdrawAmountValue, appSettings) : 0;
  const withdrawTotal = withdrawAmountValue - withdrawFee; // Fee is deducted from withdrawal
  const minPayout = getMinimumPayout(appSettings);
  const payoutSchedule = formatPayoutSchedule(appSettings);
  const nextPayoutDate = getNextPayoutDate(appSettings);

  const resetTopUpForm = () => {
    setAddFundsAmount("");
    setAddFundsPaymentMethod("bank_transfer");
    setAddFundsReceipt(null);
    setAddFundsReference("");
    setAddFundsNotes("");
    setReceiptPreview(null);
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setAddFundsReceipt(null);
      setReceiptPreview(null);
      return;
    }

    // Validate file type (images only)
    if (!file.type.startsWith('image/')) {
      toast.error("Only image files are allowed");
      e.target.value = '';
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast.error("Receipt image must be less than 5MB");
      e.target.value = '';
      return;
    }

    setAddFundsReceipt(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddFunds = async () => {
    const amount = parseFloat(addFundsAmount);
    
    // Validate amount
    if (!addFundsAmount || isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    // Validate minimum amount (10 in default currency)
    const minAmount = 10;
    if (amount < minAmount) {
      toast.error(`Minimum top-up amount is ${formatCurrency(minAmount)}`);
      return;
    }

    // Validate payment method
    if (!addFundsPaymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    // Validate receipt
    if (!addFundsReceipt) {
      toast.error("Receipt image is required");
      return;
    }

    setProcessing(true);
    try {
      // Create FormData for multipart/form-data
      const formData = new FormData();
      formData.append('amount', amount.toString());
      formData.append('paymentMethod', addFundsPaymentMethod);
      formData.append('receipt', addFundsReceipt);
      
      if (addFundsReference.trim()) {
        formData.append('reference', addFundsReference.trim());
      }
      
      if (addFundsNotes.trim()) {
        formData.append('notes', addFundsNotes.trim());
      }

      // Get auth token
      const token = getApiToken();
      if (!token) {
        throw new Error('Please log in to request a top-up');
      }

      // Make request
      const url = `${API_BASE_URL}${API_ENDPOINTS.financeTopUp}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error messages from API
        const errorMessage = data.message || data.error || "Failed to submit top-up request";
        throw new Error(errorMessage);
      }

      if (data.success) {
        toast.success(data.message || "Top-up request submitted successfully. Please wait for admin approval.");
        // Reset form
        setShowAddFundsModal(false);
        resetTopUpForm();
        
        // Refresh wallet data
        setTimeout(() => {
          fetchWalletData(true);
        }, 500);
      } else {
        throw new Error(data.message || "Failed to submit top-up request");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to submit top-up request. Please try again.";
      logger.error('Error submitting top-up request', err instanceof Error ? err : new Error(String(err)));
      toast.error(errorMessage);
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

    // Validate minimum payout amount from app settings
    const minPayout = getMinimumPayout(appSettings);
    if (minPayout > 0 && amount < minPayout) {
      toast.error(`Minimum withdrawal amount is ${formatCurrency(minPayout)}`);
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-200/30 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-8 space-y-6 relative z-10">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-1">Wallet</h1>
              <p className="text-sm text-gray-600">Manage your finances and transactions</p>
            </div>
          </div>

          {/* Loading State */}
          <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border border-gray-200 shadow-md p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mb-4"></div>
              <p className="text-gray-600 font-medium">Loading wallet...</p>
              <p className="text-sm text-gray-500 mt-1">Please wait while we fetch your information</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-200/30 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-8 space-y-6 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-1">Wallet</h1>
              <p className="text-sm text-gray-600">Manage your finances and transactions</p>
            </div>
          </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExpenseModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-green-600 rounded-lg hover:from-emerald-700 hover:to-green-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
            title="Add expense"
          >
            <span className="text-base font-semibold">{currencySymbol}</span>
            Add Expense
          </button>
          <button
            onClick={() => setShowWalletSettingsModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gradient-to-br from-white to-gray-50 border border-gray-300 rounded-lg hover:from-gray-50 hover:to-gray-100 transition-all shadow-sm hover:shadow-md"
            title="Wallet settings"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <button
            onClick={refreshWalletData}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gradient-to-br from-white to-gray-50 border border-gray-300 rounded-lg hover:from-gray-50 hover:to-gray-100 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh wallet data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-gradient-to-br from-white to-red-50/30 rounded-xl border border-red-200 shadow-md hover:shadow-lg transition-all p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Unable to Load Wallet</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  fetchWalletData(false, currentPage);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-green-600 rounded-lg hover:from-emerald-700 hover:to-green-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
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
          <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-600 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 p-8 text-white relative overflow-hidden">
            {/* Decorative gradient overlay */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-emerald-100 text-sm mb-2">Available Balance</p>
                  <p className="text-4xl font-bold">{formatCurrency(balance)}</p>
                  {pendingBalance > 0 && (
                    <p className="text-emerald-100 text-sm mt-2">
                      {formatCurrency(pendingBalance)} pending
                    </p>
                  )}
                </div>
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <Wallet className="w-8 h-8" />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddFundsModal(true)}
                  className="flex-1 bg-white text-emerald-600 font-semibold py-3 px-4 rounded-lg hover:bg-emerald-50 transition-all shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Funds
                </button>
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  disabled={balance === 0}
                  className="flex-1 bg-white/20 backdrop-blur-sm text-white font-semibold py-3 px-4 rounded-lg hover:bg-white/30 transition-all shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <Minus className="w-5 h-5" />
                  Withdraw
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Monthly Earnings */}
            <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center shadow-md">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Monthly Earnings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(
                    (overview?.monthlyEarnings?.totalEarnings && !isNaN(overview.monthlyEarnings.totalEarnings))
                      ? overview.monthlyEarnings.totalEarnings
                      : 0
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
            <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white flex items-center justify-center shadow-md">
                  <span className="text-lg font-semibold">{currencySymbol}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Referral Earnings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(
                    (overview?.referralEarnings?.totalEarnings && !isNaN(overview.referralEarnings.totalEarnings))
                      ? overview.referralEarnings.totalEarnings
                      : 0
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
            <div className="bg-gradient-to-br from-white to-yellow-50/30 rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600 text-white flex items-center justify-center shadow-md">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Balance</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(pendingBalance)}</p>
                {payoutSchedule && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Payout Schedule</p>
                    <p className="text-xs font-medium text-gray-700">{payoutSchedule}</p>
                    {nextPayoutDate && (
                      <p className="text-xs text-gray-500 mt-1">
                        Next payout: {nextPayoutDate.toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}


      {/* Earnings & Expenses Summary */}
      {!error && (earnings || expenses.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {earnings && (
            <div className="bg-gradient-to-br from-white to-green-50/30 rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Earnings Summary</h3>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center shadow-md">
                  <TrendingUp className="w-5 h-5" />
                </div>
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
                          : 0
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
            <div className="bg-gradient-to-br from-white to-red-50/30 rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Expenses</h3>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-600 text-white flex items-center justify-center shadow-md">
                  <Receipt className="w-5 h-5" />
                </div>
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
                        {formatCurrency(expenseAmount)}
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
        <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
            <p className="text-sm text-gray-600 mt-1">View your transaction history</p>
          </div>

          {transactions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-gray-500" />
              </div>
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
                    <div key={transactionKey} className="p-6 hover:bg-gradient-to-r hover:from-green-50/50 hover:to-emerald-50/50 transition-all duration-300">
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
                                : 0
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
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gradient-to-br from-white to-gray-50 border border-gray-300 rounded-lg hover:from-gray-50 hover:to-gray-100 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gradient-to-br from-white to-gray-50 border border-gray-300 rounded-lg hover:from-gray-50 hover:to-gray-100 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
              resetTopUpForm();
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col relative border border-gray-100">
            {processing && (
              <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center z-10">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-2"></div>
                  <p className="text-sm text-gray-600">Processing...</p>
                </div>
              </div>
            )}
            {/* Header - Fixed */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0 bg-gradient-to-r from-emerald-50 to-transparent">
              <h2 className="text-xl font-bold text-gray-900">Request Top-Up</h2>
              <button
                onClick={() => {
                  setShowAddFundsModal(false);
                  resetTopUpForm();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={processing}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Content - Scrollable */}
            <div className="overflow-y-auto flex-1 px-6 py-5">
              <div className="space-y-5 max-w-none">
                {/* Amount Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-base">{currencySymbol}</span>
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
                      min="10"
                      step="0.01"
                      max="999999.99"
                      className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all hover:border-gray-400"
                      aria-label="Amount to add"
                      disabled={processing}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5 ml-1">Minimum amount: {formatCurrency(10)}</p>
                  {topUpAmount > 0 && topUpFee > 0 && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Amount:</span>
                          <span className="text-gray-900 font-medium">{formatCurrency(topUpAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Transaction Fee:</span>
                          <span className="text-gray-700">{formatCurrency(topUpFee)}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-gray-300">
                          <span className="text-gray-900 font-semibold">Total to Pay:</span>
                          <span className="text-emerald-600 font-bold">{formatCurrency(topUpTotal)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method <span className="text-red-500">*</span>
                  </label>
                  <select 
                    value={addFundsPaymentMethod}
                    onChange={(e) => setAddFundsPaymentMethod(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all hover:border-gray-400 bg-white cursor-pointer"
                    disabled={processing}
                  >
                    {(() => {
                      const enabledMethods = getEnabledPaymentMethods(appSettings);
                      const methodLabels: Record<string, string> = {
                        paypal: "PayPal",
                        paymaya: "PayMaya",
                        gcash: "GCash",
                        bank_transfer: "Bank Transfer",
                        cash: "Cash",
                        mobile_money: "Mobile Money",
                        card: "Credit/Debit Card"
                      };
                      // Include enabled methods plus mobile_money and card for add funds
                      const allMethods = [...enabledMethods, "mobile_money", "card"].filter((v, i, a) => a.indexOf(v) === i);
                      return allMethods.map(method => (
                        <option key={method} value={method}>
                          {methodLabels[method] || method}
                        </option>
                      ));
                    })()}
                  </select>
                </div>

                {/* Receipt Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Receipt Image <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    <label className="flex flex-col items-center justify-center w-full min-h-[140px] border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 hover:border-emerald-200 transition-all relative overflow-hidden group">
                      {receiptPreview ? (
                        <div className="relative w-full h-full min-h-[140px] flex items-center justify-center p-2">
                          <div className="relative max-w-full max-h-[200px]">
                            <Image 
                              src={receiptPreview} 
                              alt="Receipt preview" 
                              width={400}
                              height={300}
                              className="max-w-full max-h-[200px] object-contain rounded"
                              unoptimized
                            />
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAddFundsReceipt(null);
                              setReceiptPreview(null);
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg z-10"
                            disabled={processing}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 px-4">
                          <Upload className="w-10 h-10 text-gray-400 mb-3" />
                          <p className="text-sm text-gray-600 mb-1 text-center">
                            <span className="font-semibold text-emerald-600">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500 text-center">PNG, JPG, GIF up to 5MB</p>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleReceiptChange}
                        className="hidden"
                        disabled={processing}
                      />
                    </label>
                    {addFundsReceipt && (
                      <p className="text-xs text-gray-600 flex items-center gap-1">
                        <Receipt className="w-3 h-3" />
                        Selected: {addFundsReceipt.name} ({(addFundsReceipt.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                </div>

                {/* Payment Reference */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Reference/Transaction ID 
                    <span className="text-gray-400 font-normal ml-1">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={addFundsReference}
                    onChange={(e) => setAddFundsReference(e.target.value)}
                    placeholder="e.g., TXN123456789"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all hover:border-gray-400"
                    disabled={processing}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes 
                    <span className="text-gray-400 font-normal ml-1">(Optional)</span>
                  </label>
                  <textarea
                    value={addFundsNotes}
                    onChange={(e) => setAddFundsNotes(e.target.value)}
                    placeholder="Additional notes about this payment..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none transition-all hover:border-gray-400"
                    disabled={processing}
                  />
                </div>

                {/* Info Message */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Your top-up request will be reviewed by an administrator. You&apos;ll be notified once it&apos;s processed.</span>
                  </p>
                </div>
              </div>
            </div>
            
            {/* Footer - Fixed */}
            <div className="flex gap-3 p-6 border-t border-gray-200 flex-shrink-0 bg-gray-50">
              <button
                onClick={() => {
                  setShowAddFundsModal(false);
                  resetTopUpForm();
                }}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-100 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={handleAddFunds}
                disabled={processing || !addFundsAmount || !addFundsReceipt || parseFloat(addFundsAmount) < 10}
                className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
              >
                {processing ? "Submitting..." : "Submit Request"}
              </button>
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
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{currencySymbol}</span>
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
                  Available: {formatCurrency(balance)}
                  {minPayout > 0 && (
                    <span className="ml-2">• Minimum: {formatCurrency(minPayout)}</span>
                  )}
                </p>
                {withdrawAmountValue > 0 && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Withdrawal Amount:</span>
                        <span className="text-gray-900 font-medium">{formatCurrency(withdrawAmountValue)}</span>
                      </div>
                      {withdrawFee > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Transaction Fee:</span>
                          <span className="text-red-600">-{formatCurrency(withdrawFee)}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-1 border-t border-gray-300">
                        <span className="text-gray-900 font-semibold">You&apos;ll Receive:</span>
                        <span className="text-emerald-600 font-bold">{formatCurrency(Math.max(0, withdrawTotal))}</span>
                      </div>
                    </div>
                  </div>
                )}
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
              {minPayout > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                  <p className="text-xs text-blue-700">
                    <strong>Minimum withdrawal:</strong> {formatCurrency(minPayout)}
                  </p>
                  {payoutSchedule && (
                    <p className="text-xs text-blue-600 mt-1">
                      Payouts are processed {payoutSchedule.toLowerCase()}
                      {nextPayoutDate && (
                        <span>. Next payout: {nextPayoutDate.toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}</span>
                      )}
                    </p>
                  )}
                </div>
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
                  disabled={processing || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > balance || (minPayout > 0 && parseFloat(withdrawAmount) < minPayout)}
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
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{currencySymbol}</span>
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
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{currencySymbol}</span>
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
    </div>
  );
}

