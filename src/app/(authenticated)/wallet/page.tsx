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
  const [topUpRequests, setTopUpRequests] = useState<Record<string, unknown>[]>([]);
  const [loadingTopUps, setLoadingTopUps] = useState(false);
  const [activeTab, setActiveTab] = useState<'transactions' | 'topups'>('transactions');
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
        if (transactionsData?.success) {
          let transactionsArray: TransactionDetails[] = [];
          let totalPagesValue = 1;
          
          if (transactionsData.data) {
            let rawTransactions: Record<string, unknown>[] = [];
            
            // Handle different response structures
            if (Array.isArray(transactionsData.data)) {
              // Direct array response
              rawTransactions = transactionsData.data;
            } else if (transactionsData.data.transactions && Array.isArray(transactionsData.data.transactions)) {
              // Nested transactions array
              rawTransactions = transactionsData.data.transactions;
              totalPagesValue = transactionsData.data.pages || transactionsData.data.totalPages || 1;
            } else if (transactionsData.data.results && Array.isArray(transactionsData.data.results)) {
              // Alternative nested structure
              rawTransactions = transactionsData.data.results;
              totalPagesValue = transactionsData.data.pages || transactionsData.data.totalPages || 1;
            }
            
            // Transform API response to TransactionDetails format
            transactionsArray = rawTransactions.map((tx: Record<string, unknown>) => {
              // Map Transaction to TransactionDetails
              return {
                type: tx.type || tx.category || 'transaction',
                amount: tx.amount || 0,
                category: tx.category || tx.type || 'transaction',
                description: tx.description || tx.category || 'Transaction',
                paymentMethod: tx.paymentMethod || tx.method || '',
                status: tx.status || 'pending',
                timestamp: tx.timestamp || tx.createdAt || tx.date || new Date(),
                reference: tx.reference || tx.transactionId || tx._id || tx.id || '',
                accountDetails: tx.accountDetails,
                adminNotes: tx.adminNotes,
                processedAt: tx.processedAt,
                processedBy: tx.processedBy,
              } as TransactionDetails;
            });
            
            // Try to get pagination from root level if not found in data
            if (totalPagesValue === 1 && transactionsData.pages) {
              totalPagesValue = transactionsData.pages;
            }
          }
          
          logger.debug('Transactions loaded', { 
            count: transactionsArray.length, 
            totalPages: totalPagesValue,
            hasData: !!transactionsData.data,
            dataType: transactionsData.data ? typeof transactionsData.data : 'null',
            isArray: Array.isArray(transactionsData.data),
            sampleTransaction: transactionsArray[0] || null
          });
          
          setTransactions(transactionsArray);
          setTotalPages(totalPagesValue);
        } else {
          logger.debug('No transactions data in response', { 
            success: transactionsData?.success,
            hasData: !!transactionsData?.data,
            transactionsData 
          });
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

  // Fetch top-up requests
  const fetchTopUpRequests = useCallback(async () => {
    try {
      setLoadingTopUps(true);
      const token = getApiToken();
      
      if (!token) {
        setTopUpRequests([]);
        return;
      }

      // GET /api/finance/top-ups/my-requests?page=1&limit=20
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.financeTopUpsMyRequests}?page=1&limit=20`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      if (response.ok && data.success && data.data) {
        // Handle response structure: { success, data: [...] } or { success, data: { topUps: [...] } }
        const requestsArray = Array.isArray(data.data) 
          ? data.data 
          : data.data.topUps || data.data.requests || [];
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

  useEffect(() => {
    if (!mounted) return;
    fetchWalletData(false, currentPage);
    fetchTopUpRequests();
  }, [mounted, currentPage, fetchWalletData, fetchTopUpRequests]);

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
    const normalizedType = type?.toLowerCase() || '';
    switch (normalizedType) {
      case 'income':
      case 'bonus':
      case 'referral':
      case 'topup':
      case 'top-up':
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
    const normalizedType = type?.toLowerCase() || '';
    switch (normalizedType) {
      case 'income':
      case 'bonus':
      case 'referral':
      case 'topup':
      case 'top-up':
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
      let response: Response;
      
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
      } catch (fetchError) {
        // Handle network errors
        if (fetchError instanceof TypeError && (fetchError.message.includes('fetch') || fetchError.message.includes('Failed to fetch'))) {
          throw new Error('Network error: Unable to connect to the server. Please check your internet connection and try again.');
        }
        throw fetchError;
      }

      // Check if response is ok before trying to parse JSON
      const contentType = response.headers.get('content-type');
      let data: Record<string, unknown>;
      
      try {
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          // If not JSON, read as text to get error message
          const text = await response.text();
          throw new Error(text || `Server error: ${response.status} ${response.statusText}`);
        }
      } catch (parseError) {
        // If JSON parsing fails, provide a helpful error message
        if (parseError instanceof Error && parseError.message.includes('Server error')) {
          throw parseError;
        }
        throw new Error(`Server error: ${response.status} ${response.statusText}. Please try again later.`);
      }

      if (!response.ok) {
        // Handle specific error messages from API
        const message = typeof data?.message === 'string' ? data.message : (typeof data?.error === 'string' ? data.error : null);
        const errorMessage = message || `Server error: ${response.status} ${response.statusText}`;
        logger.error('Top-up request failed', new Error(errorMessage), {
          status: response.status,
          statusText: response.statusText,
          responseData: data
        });
        throw new Error(errorMessage);
      }

      if (data?.success) {
        const message = typeof data.message === 'string' ? data.message : "Top-up request submitted successfully. Please wait for admin approval.";
        toast.success(message);
        // Reset form
        setShowAddFundsModal(false);
        resetTopUpForm();
        
        // Refresh wallet data and top-up requests
        setTimeout(() => {
          fetchWalletData(true);
          fetchTopUpRequests();
        }, 500);
      } else {
        const message = typeof data?.message === 'string' ? data.message : null;
        const errorMessage = message || "Failed to submit top-up request";
        logger.error('Top-up request unsuccessful', new Error(errorMessage), { responseData: data });
        throw new Error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to submit top-up request. Please try again.";
      logger.error('Error submitting top-up request', err instanceof Error ? err : new Error(String(err)), {
        url: `${API_BASE_URL}${API_ENDPOINTS.financeTopUp}`,
        amount: addFundsAmount,
        paymentMethod: addFundsPaymentMethod
      });
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

    // Validate payment method is selected
    if (!withdrawMethod) {
      toast.error("Please select a withdrawal method");
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
      // Prepare account details - always send as object, not undefined
      const accountDetails = withdrawMethod === "bank_transfer" 
        ? bankAccount 
        : {}; // Empty object for other payment methods

      // Use the correct withdrawal endpoint: /api/finance/withdraw
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
            accountDetails: accountDetails,
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
      <div className="min-h-screen bg-slate-950 relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-8 space-y-6 relative z-10">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-1">Wallet</h1>
              <p className="text-sm text-slate-400">Manage your finances and transactions</p>
            </div>
          </div>

          {/* Loading State */}
          <div className="bg-slate-900/80 rounded-xl border border-slate-800 shadow-lg p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mb-4"></div>
              <p className="text-slate-300 font-medium">Loading wallet...</p>
              <p className="text-sm text-slate-500 mt-1">Please wait while we fetch your information</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 space-y-6 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-1">Wallet</h1>
              <p className="text-sm text-slate-400">Manage your finances and transactions</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowExpenseModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md shadow-emerald-500/25 hover:shadow-lg"
              title="Add expense"
            >
              <span className="text-base font-semibold">{currencySymbol}</span>
              <span className="hidden sm:inline">Add Expense</span>
              <span className="sm:hidden">Expense</span>
            </button>
            <button
              onClick={() => setShowWalletSettingsModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 hover:text-white transition-all"
              title="Wallet settings"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </button>
            <button
              onClick={refreshWalletData}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh wallet data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

      {/* Error State */}
      {error && (
        <div className="bg-slate-900/80 to-red-500/10 rounded-xl border border-red-500/30 shadow-lg p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1">Unable to Load Wallet</h3>
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  fetchWalletData(false, currentPage);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md shadow-emerald-500/25"
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
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowAddFundsModal(true)}
                  className="flex-1 bg-white text-emerald-600 font-semibold py-3 px-4 rounded-lg hover:bg-emerald-50 transition-all shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Funds</span>
                </button>
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  disabled={balance === 0}
                  className="flex-1 bg-white/20 backdrop-blur-sm text-white font-semibold py-3 px-4 rounded-lg hover:bg-white/30 transition-all shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <Minus className="w-5 h-5" />
                  <span>Withdraw</span>
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Monthly Earnings */}
            <div className="bg-slate-900/80 rounded-xl border border-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center shadow-md">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Monthly Earnings</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(
                    (overview?.monthlyEarnings?.totalEarnings && !isNaN(overview.monthlyEarnings.totalEarnings))
                      ? overview.monthlyEarnings.totalEarnings
                      : 0
                  )}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {(overview?.monthlyEarnings?.bookingCount && !isNaN(overview.monthlyEarnings.bookingCount))
                    ? overview.monthlyEarnings.bookingCount
                    : 0} bookings
                </p>
              </div>
            </div>

            {/* Referral Earnings */}
            <div className="bg-slate-900/80 rounded-xl border border-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white flex items-center justify-center shadow-md">
                  <span className="text-lg font-semibold">{currencySymbol}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Referral Earnings</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(
                    (overview?.referralEarnings?.totalEarnings && !isNaN(overview.referralEarnings.totalEarnings))
                      ? overview.referralEarnings.totalEarnings
                      : 0
                  )}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {(overview?.referralEarnings?.count && !isNaN(overview.referralEarnings.count))
                    ? overview.referralEarnings.count
                    : 0} referrals
                </p>
              </div>
            </div>

            {/* Pending Balance */}
            <div className="bg-slate-900/80 rounded-xl border border-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-md">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Pending Balance</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(pendingBalance)}</p>
                {payoutSchedule && (
                  <div className="mt-2 pt-2 border-t border-slate-700">
                    <p className="text-xs text-slate-500 mb-1">Payout Schedule</p>
                    <p className="text-xs font-medium text-slate-300">{payoutSchedule}</p>
                    {nextPayoutDate && (
                      <p className="text-xs text-slate-500 mt-1">
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


      {/* Earnings Summary - 3 Blocks */}
      {!error && (earnings || expenses.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Total Earnings Block */}
          {earnings && (
            <div className="bg-slate-900/80 rounded-xl border border-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Total Earnings</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(
                    (earnings.totalEarnings && !isNaN(earnings.totalEarnings)) 
                      ? earnings.totalEarnings 
                      : (earnings.total && !isNaN(earnings.total)) 
                        ? earnings.total 
                        : 0
                  )}
                </p>
                {earnings.bookingCount && !isNaN(earnings.bookingCount) && (
                  <p className="text-xs text-slate-500 mt-1">
                    {earnings.bookingCount} bookings
                  </p>
                )}
              </div>
            </div>
          )}
          
          {/* Expenses Summary Block */}
          {expenses.length > 0 && (
            <div className="bg-slate-900/80 rounded-xl border border-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-600 text-white flex items-center justify-center shadow-md">
                  <Receipt className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Total Expenses</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(
                    expenses.reduce((sum: number, expense: ExpenseData) => {
                      const amount = (expense.amount && !isNaN(expense.amount)) ? expense.amount : 0;
                      return sum + amount;
                    }, 0)
                  )}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          )}
          
          {/* Net Earnings Block */}
          {earnings && (
            <div className="bg-slate-900/80 rounded-xl border border-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center shadow-md">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Net Earnings</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(
                    ((earnings.totalEarnings && !isNaN(earnings.totalEarnings)) 
                      ? earnings.totalEarnings 
                      : (earnings.total && !isNaN(earnings.total)) 
                        ? earnings.total 
                        : 0) - 
                    (expenses.length > 0 
                      ? expenses.reduce((sum: number, expense: ExpenseData) => {
                          const amount = (expense.amount && !isNaN(expense.amount)) ? expense.amount : 0;
                          return sum + amount;
                        }, 0)
                      : 0)
                  )}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  After expenses
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transactions & Top-Up Requests Tabs */}
      {!error && mounted && !loading && (
        <div className="bg-slate-900/80 rounded-xl border border-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-slate-800 bg-slate-900/50">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between px-4 sm:px-6 pt-4 pb-0 gap-3">
              <div className="flex space-x-0.5 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('transactions')}
                  className={`relative px-4 sm:px-5 py-2.5 text-sm font-semibold rounded-t-lg transition-all duration-200 whitespace-nowrap ${
                    activeTab === 'transactions'
                      ? 'bg-slate-800 text-emerald-400 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  {activeTab === 'transactions' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-t-full"></div>
                  )}
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Recent Transactions</span>
                    <span className="sm:hidden">Transactions</span>
                    {transactions.length > 0 && (
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium flex-shrink-0 ${
                        activeTab === 'transactions'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-700 text-slate-400'
                      }`}>
                        {transactions.length}
                      </span>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('topups')}
                  className={`relative px-4 sm:px-5 py-2.5 text-sm font-semibold rounded-t-lg transition-all duration-200 whitespace-nowrap ${
                    activeTab === 'topups'
                      ? 'bg-slate-800 text-emerald-400 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  {activeTab === 'topups' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-t-full"></div>
                  )}
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Top-Up Requests</span>
                    <span className="sm:hidden">Top-Ups</span>
                    {topUpRequests.length > 0 && (
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium flex-shrink-0 ${
                        activeTab === 'topups'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-700 text-slate-400'
                      }`}>
                        {topUpRequests.length}
                      </span>
                    )}
                  </div>
                </button>
              </div>
              {activeTab === 'topups' && (
                <button
                  onClick={fetchTopUpRequests}
                  disabled={loadingTopUps}
                  className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-all self-start sm:self-auto"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingTopUps ? 'animate-spin' : ''} ${topUpRequests.length > 0 ? 'mr-2' : ''}`} />
                  {topUpRequests.length > 0 && <span>Refresh</span>}
                </button>
              )}
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white">
            {/* Transactions Tab Content */}
            {activeTab === 'transactions' && (
              <>
                {transactions.length === 0 ? (
                  <div className="p-16 text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-5 shadow-inner">
                      <Wallet className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-lg font-semibold text-gray-700 mb-1.5">No transactions yet</p>
                    <p className="text-sm text-gray-500 max-w-sm mx-auto">Your transaction history will appear here once you start making transactions</p>
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-gray-100">
                      {transactions.map((transaction, index) => {
                        const transactionKey = transaction.reference 
                          || (transaction.timestamp ? (typeof transaction.timestamp === 'string' ? transaction.timestamp : transaction.timestamp.toString()) : null)
                          || `transaction-${index}`;
                        // Determine if transaction is income (money coming in) or expense (money going out)
                        // Income types: income, bonus, referral, refund, topup/top-up (money added to wallet)
                        // Expense types: expense, withdrawal (money removed from wallet)
                        const transactionType = transaction.type?.toLowerCase() || '';
                        const isIncome = transactionType === 'income' 
                          || transactionType === 'bonus' 
                          || transactionType === 'referral' 
                          || transactionType === 'refund'
                          || transactionType === 'topup'
                          || transactionType === 'top-up';
                        
                        // Get the raw amount value
                        const rawAmount = (transaction.amount && !isNaN(transaction.amount)) ? transaction.amount : 0;
                        
                        // Normalize amount based on transaction type
                        // Income types should always display as positive (green)
                        // Expense/withdrawal types should always display as negative (red)
                        // This handles cases where amounts might be stored inconsistently in the database
                        const displayAmount = isIncome 
                          ? Math.abs(rawAmount) // Income: always positive (money coming in)
                          : -Math.abs(rawAmount); // Expenses/withdrawals: always negative (money going out)
                        
                        return (
                          <div key={transactionKey} className="p-4 sm:p-5 hover:bg-gradient-to-r hover:from-emerald-50/30 hover:to-green-50/30 transition-all duration-200 group">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                              <div className="flex items-start gap-3 sm:gap-3.5 flex-1 min-w-0 w-full sm:w-auto">
                                <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${getTransactionColor(transaction.type)}`}>
                                  {getTransactionIcon(transaction.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-900 text-sm sm:text-base mb-1.5 truncate">
                                    {transaction.description || transaction.category || 'Transaction'}
                                  </p>
                                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                    <span className="text-xs font-medium text-gray-500 capitalize px-2 py-0.5 bg-gray-100 rounded-md">
                                      {transaction.type || 'transaction'}
                                    </span>
                                    {transaction.reference && (
                                      <>
                                        <span className="text-gray-300 text-xs hidden sm:inline">•</span>
                                        <span className="text-xs text-gray-500 font-mono truncate max-w-[100px] sm:max-w-[120px]">
                                          {transaction.reference}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{formatDate(transaction.timestamp)}</span>
                                  </p>
                                </div>
                              </div>
                              <div className="text-left sm:text-right flex-shrink-0 w-full sm:w-auto flex items-center sm:items-end justify-between sm:flex-col gap-2">
                                <p className={`text-base sm:text-lg font-bold ${
                                  isIncome
                                    ? 'text-emerald-600'
                                    : 'text-red-600'
                                }`}>
                                  {formatCurrency(displayAmount)}
                                </p>
                                <span className={`text-xs font-medium px-2.5 py-1 rounded-full inline-block ${
                                  transaction.status === 'completed'
                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                    : transaction.status === 'pending'
                                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                    : transaction.status === 'failed'
                                    ? 'bg-red-100 text-red-700 border border-red-200'
                                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                                }`}>
                                  {transaction.status || 'pending'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm"
                        >
                          Previous
                        </button>
                        <span className="text-sm font-medium text-gray-600 text-center">
                          Page <span className="text-emerald-600 font-semibold">{currentPage}</span> of <span className="text-gray-900 font-semibold">{totalPages}</span>
                        </span>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* Top-Up Requests Tab Content */}
            {activeTab === 'topups' && (
              <>
                {loadingTopUps ? (
                  <div className="p-16 text-center">
                    <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Loading top-up requests...</p>
                    <p className="text-sm text-gray-500 mt-1">Please wait while we fetch your data</p>
                  </div>
                ) : topUpRequests.length === 0 ? (
                  <div className="p-16 text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-green-200 flex items-center justify-center mx-auto mb-5 shadow-inner">
                      <Receipt className="w-10 h-10 text-emerald-400" />
                    </div>
                    <p className="text-lg font-semibold text-gray-700 mb-1.5">No top-up requests yet</p>
                    <p className="text-sm text-gray-500 max-w-sm mx-auto">Your top-up request history will appear here once you submit a request</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {topUpRequests.map((request) => {
                      const receiptUrl = request.receipt && typeof request.receipt === 'object' && request.receipt !== null
                        ? ((request.receipt as { url?: string; thumbnail?: string }).url || (request.receipt as { url?: string; thumbnail?: string }).thumbnail)
                        : typeof request.receipt === 'string' 
                        ? request.receipt 
                        : request.accountDetails && typeof request.accountDetails === 'object' && request.accountDetails !== null && 'receipt' in request.accountDetails && request.accountDetails.receipt
                        ? (typeof request.accountDetails.receipt === 'string' 
                          ? request.accountDetails.receipt 
                          : request.accountDetails.receipt && typeof request.accountDetails.receipt === 'object' && request.accountDetails.receipt !== null
                          ? ((request.accountDetails.receipt as { url?: string; thumbnail?: string }).url || (request.accountDetails.receipt as { url?: string; thumbnail?: string }).thumbnail)
                          : null)
                        : null;

                      const statusColors = {
                        pending: 'bg-amber-100 text-amber-700 border border-amber-200',
                        approved: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
                        rejected: 'bg-red-100 text-red-700 border border-red-200',
                        completed: 'bg-blue-100 text-blue-700 border border-blue-200',
                        cancelled: 'bg-gray-100 text-gray-700 border border-gray-200',
                        failed: 'bg-red-100 text-red-700 border border-red-200'
                      };

                      return (
                        <div key={String(request._id || request.id || `request-${topUpRequests.indexOf(request)}`)} className="p-4 sm:p-5 hover:bg-gradient-to-r hover:from-emerald-50/30 hover:to-green-50/30 transition-all duration-200 group">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                            <div className="flex items-start gap-3 sm:gap-3.5 flex-1 min-w-0 w-full">
                              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/20">
                                <ArrowUpRight className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                                  <p className="font-semibold text-gray-900 text-sm sm:text-base">
                                    Top-Up Request
                                  </p>
                                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[request.status as keyof typeof statusColors] || statusColors.pending}`}>
                                    {typeof request.status === 'string' ? request.status : 'pending'}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-3">
                                  <div className="bg-gray-50/50 rounded-lg p-2.5">
                                    <p className="text-xs font-medium text-gray-500 mb-1">Amount</p>
                                    <p className="text-base font-bold text-gray-900">{formatCurrency(typeof request.amount === 'number' ? request.amount : 0)}</p>
                                  </div>
                                  <div className="bg-gray-50/50 rounded-lg p-2.5">
                                    <p className="text-xs font-medium text-gray-500 mb-1">Payment Method</p>
                                    <p className="text-sm font-semibold text-gray-700 capitalize">{typeof request.paymentMethod === 'string' ? request.paymentMethod.replace('_', ' ') : 'N/A'}</p>
                                  </div>
                                  {(typeof request.reference === 'string' || typeof request.reference === 'number') && (
                                    <div className="bg-gray-50/50 rounded-lg p-2.5">
                                      <p className="text-xs font-medium text-gray-500 mb-1">Reference</p>
                                      <p className="text-xs font-mono font-semibold text-gray-700 truncate">{String(request.reference)}</p>
                                    </div>
                                  )}
                                  <div className="bg-gray-50/50 rounded-lg p-2.5">
                                    <p className="text-xs font-medium text-gray-500 mb-1">Requested</p>
                                    <p className="text-xs font-semibold text-gray-700">
                                      {formatDate(
                                        (typeof request.createdAt === 'string' || request.createdAt instanceof Date) ? request.createdAt
                                        : (typeof request.timestamp === 'string' || request.timestamp instanceof Date) ? request.timestamp
                                        : new Date()
                                      )}
                                    </p>
                                  </div>
                                </div>
                                {((typeof request.notes === 'string' && request.notes) || (typeof request.description === 'string' && request.description)) && (
                                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
                                    <p className="text-sm text-gray-700 leading-relaxed">{typeof request.notes === 'string' ? request.notes : (typeof request.description === 'string' ? request.description : '')}</p>
                                  </div>
                                )}
                                {typeof request.adminNotes === 'string' && request.adminNotes && (
                                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <p className="text-xs font-semibold text-blue-900 mb-1.5">Admin Notes</p>
                                    <p className="text-sm text-blue-800 leading-relaxed">{request.adminNotes}</p>
                                  </div>
                                )}
                                {receiptUrl && (
                                  <div className="mt-3">
                                    <a
                                      href={receiptUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all hover:shadow-sm"
                                    >
                                      <Receipt className="w-3.5 h-3.5" />
                                      View Receipt
                                    </a>
                                  </div>
                                )}
                              </div>
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
      )}

      {/* Add Funds Modal */}
      {showAddFundsModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget && !processing) {
              setShowAddFundsModal(false);
              resetTopUpForm();
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] my-4 flex flex-col relative border border-gray-100">
            {processing && (
              <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center z-10">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-2"></div>
                  <p className="text-sm text-gray-600">Processing...</p>
                </div>
              </div>
            )}
            {/* Header - Fixed */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0 bg-gradient-to-r from-emerald-50 to-transparent">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Request Top-Up</h2>
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
                      // Include all top-up payment methods from API: bank_transfer, mobile_money, card, cash, paypal, paymaya
                      const topUpMethods = ["bank_transfer", "mobile_money", "card", "cash", "paypal", "paymaya"];
                      const allMethods = [...enabledMethods, ...topUpMethods].filter((v, i, a) => a.indexOf(v) === i);
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
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget && !processing) {
              setShowWithdrawModal(false);
              setWithdrawAmount("");
              setBankAccount({ bankName: "", accountNumber: "", routingNumber: "" });
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-4 sm:p-6 my-4 relative">
            {processing && (
              <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center z-10">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-2"></div>
                  <p className="text-sm text-gray-600">Processing...</p>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Withdraw Funds</h2>
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
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowWithdrawModal(false);
                    setWithdrawAmount("");
                    setBankAccount({ bankName: "", accountNumber: "", routingNumber: "" });
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={processing || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > balance || (minPayout > 0 && parseFloat(withdrawAmount) < minPayout)}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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

