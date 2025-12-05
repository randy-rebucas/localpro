"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Gift,
  Search,
  Users,
  Copy,
  Share2,
  Mail,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Star,
  Headphones,
  HelpCircle,
  Trophy,
  Coins,
  RefreshCw,
  Send,
  Link2,
  Facebook,
  Twitter,
  Linkedin,
  Target,
  Sparkles
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { formatCurrency as formatCurrencyUtil } from "@/lib/currency-utils";
import { useAppSettings } from "@/hooks/useAppSettings";
import toast from "react-hot-toast";

export const dynamic = 'force-dynamic';

interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  conversionRate: number;
}

interface Referral {
  _id?: string;
  id?: string;
  referee?: {
    _id?: string;
    id?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  referralCode: string;
  status: 'pending' | 'completed' | 'expired' | 'cancelled';
  referralType: string;
  reward?: {
    type: string;
    amount: number;
    currency?: string;
  };
  timeline?: {
    referredAt?: string | Date;
    completedAt?: string | Date;
    expiresAt?: string | Date;
  };
  rewardDistribution?: {
    referrerReward?: {
      amount: number;
      currency?: string;
      status: string;
    };
  };
}

interface ReferralLink {
  code: string;
  url: string;
  shortUrl?: string;
  qrCode?: string;
  // API response fields (mapped to our fields)
  referralCode?: string;
  referralLink?: string;
  shareOptions?: Record<string, unknown>;
}

interface LeaderboardEntry {
  _id?: string;
  id?: string;
  user?: {
    name?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  referralCount: number;
  totalEarnings: number;
  rank: number;
}

export default function ReferralsPage() {
  const { loading: settingsLoading } = useAppSettings();
  
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [referralLink, setReferralLink] = useState<ReferralLink | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("all");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Active tab
  const [activeTab, setActiveTab] = useState<'overview' | 'referrals' | 'leaderboard'>('overview');
  
  // Invite modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteMethod, setInviteMethod] = useState<'email' | 'sms'>('email');
  const [inviteEmails, setInviteEmails] = useState("");
  const [invitePhones, setInvitePhones] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [sendingInvites, setSendingInvites] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const mockCodeRef = useRef<string | null>(null);

  // Generate a stable mock referral code
  const getStableMockCode = useCallback(() => {
    if (!mockCodeRef.current) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = 'LP';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      mockCodeRef.current = code;
    }
    return mockCodeRef.current;
  }, []);

  useEffect(() => {
    setMounted(true);
    // Set default referral link immediately on mount
    const mockCode = getStableMockCode();
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://localpro.app';
    setReferralLink({
      code: mockCode,
      url: `${baseUrl}/join?ref=${mockCode}`,
      shortUrl: `localpro.app/r/${mockCode}`
    });
  }, [getStableMockCode]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const formatCurrency = useCallback((amount: number) => {
    // Always use PHP currency through the utility
    return formatCurrencyUtil(amount, 'PHP');
  }, []);

  // Use the stable mock referral code
  const generateMockReferralCode = useCallback(() => {
    return getStableMockCode();
  }, [getStableMockCode]);

  const fetchReferralData = useCallback(async (isRefresh = false) => {
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

      let hasStats = false;
      let hasLinks = false;

      // Try to fetch from API with individual error handling
      try {
        const statsRes = await fetch(
          `${API_BASE_URL}/api/referrals/stats?timeRange=${timeRange}`,
          { ...createAuthFetchOptions(), signal }
        );
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          if (statsData.success) {
            setStats(statsData.data || statsData);
            hasStats = true;
          }
        }
      } catch {
        logger.debug('Stats endpoint not available');
      }

      try {
        const referralsRes = await fetch(
          `${API_BASE_URL}/api/referrals/me?page=${currentPage}&limit=20&timeRange=${timeRange}`,
          { ...createAuthFetchOptions(), signal }
        );
        if (referralsRes.ok) {
          const referralsData = await referralsRes.json();
          if (referralsData.success) {
            setReferrals(referralsData.data?.referrals || referralsData.referrals || []);
            if (referralsData.pagination) {
              setTotalPages(referralsData.pagination.pages || 1);
            }
          }
        }
      } catch {
        logger.debug('Referrals endpoint not available');
      }

      try {
        const linksRes = await fetch(
          `${API_BASE_URL}/api/referrals/links`,
          { ...createAuthFetchOptions(), signal }
        );
        if (linksRes.ok) {
          const linksData = await linksRes.json();
          if (linksData.success && linksData.data) {
            const apiData = linksData.data;
            // Map API response fields to our expected format
            setReferralLink({
              code: apiData.referralCode || apiData.code,
              url: apiData.referralLink || apiData.url,
              shortUrl: apiData.shortUrl,
              qrCode: apiData.qrCode,
              shareOptions: apiData.shareOptions
            });
            hasLinks = true;
          }
        }
      } catch {
        logger.debug('Links endpoint not available');
      }

      try {
        const leaderboardRes = await fetch(
          `${API_BASE_URL}/api/referrals/leaderboard?limit=10`,
          { ...createAuthFetchOptions(), signal }
        );
        if (leaderboardRes.ok) {
          const leaderboardData = await leaderboardRes.json();
          if (leaderboardData.success) {
            setLeaderboard(leaderboardData.data || leaderboardData.leaderboard || []);
          }
        }
      } catch {
        logger.debug('Leaderboard endpoint not available');
      }

      // Set default stats if not fetched
      if (!hasStats) {
        setStats({
          totalReferrals: 0,
          completedReferrals: 0,
          pendingReferrals: 0,
          totalEarnings: 0,
          pendingEarnings: 0,
          conversionRate: 0
        });
      }
      
      // Always generate referral link if not fetched from API
      if (!hasLinks) {
        const mockCode = generateMockReferralCode();
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://localpro.app';
        setReferralLink({
          code: mockCode,
          url: `${baseUrl}/join?ref=${mockCode}`,
          shortUrl: `localpro.app/r/${mockCode}`
        });
      }

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      logger.debug('Error fetching referral data, using defaults');
      
      // Set defaults on error
      setStats({
        totalReferrals: 0,
        completedReferrals: 0,
        pendingReferrals: 0,
        totalEarnings: 0,
        pendingEarnings: 0,
        conversionRate: 0
      });
      
      const mockCode = generateMockReferralCode();
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://localpro.app';
      setReferralLink({
        code: mockCode,
        url: `${baseUrl}/join?ref=${mockCode}`,
        shortUrl: `localpro.app/r/${mockCode}`
      });
      
      setReferrals([]);
      setLeaderboard([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, timeRange, generateMockReferralCode]);

  useEffect(() => {
    if (mounted) {
      fetchReferralData();
    }
  }, [mounted, fetchReferralData]);

  const handleRefresh = () => {
    fetchReferralData(true);
  };

  const copyReferralLink = async () => {
    if (referralLink?.url) {
      try {
        await navigator.clipboard.writeText(referralLink.url);
        toast.success('Referral link copied to clipboard!');
      } catch {
        toast.error('Failed to copy link');
      }
    }
  };

  const copyReferralCode = async () => {
    if (referralLink?.code) {
      try {
        await navigator.clipboard.writeText(referralLink.code);
        toast.success('Referral code copied!');
      } catch {
        toast.error('Failed to copy code');
      }
    }
  };

  const shareOnSocial = (platform: string) => {
    if (!referralLink?.url) return;
    
    const text = "Join LocalPro and get rewards! Use my referral link:";
    const url = encodeURIComponent(referralLink.url);
    const encodedText = encodeURIComponent(text);
    
    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${url}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodedText}%20${url}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  const handleSendInvites = async () => {
    setSendingInvites(true);
    try {
      const body: Record<string, unknown> = {
        method: inviteMethod,
        message: inviteMessage || undefined
      };
      
      if (inviteMethod === 'email') {
        body.emails = inviteEmails.split(',').map(e => e.trim()).filter(Boolean);
      } else {
        body.phoneNumbers = invitePhones.split(',').map(p => p.trim()).filter(Boolean);
      }

      const res = await fetch(`${API_BASE_URL}/api/referrals/invite`, {
        ...createAuthFetchOptions(),
        method: 'POST',
        body: JSON.stringify(body)
      });

      const data = await res.json();
      
      if (data.success) {
        toast.success('Invitations sent successfully!');
        setShowInviteModal(false);
        setInviteEmails("");
        setInvitePhones("");
        setInviteMessage("");
      } else {
        toast.error(data.message || 'Failed to send invitations');
      }
    } catch {
      toast.error('Failed to send invitations');
    } finally {
      setSendingInvites(false);
    }
  };

  const filteredReferrals = useMemo(() => {
    if (!Array.isArray(referrals)) return [];
    return referrals.filter(ref => {
      const refereeName = ref.referee?.name || 
        `${ref.referee?.firstName || ''} ${ref.referee?.lastName || ''}`.trim();
      
      const matchesSearch = !searchQuery || 
        refereeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ref.referralCode?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || ref.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [referrals, searchQuery, statusFilter]);

  const getStatusBadge = (status: string) => {
    const statusClasses: Record<string, string> = {
      completed: 'bg-green-100 text-green-700 border-green-200',
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      expired: 'bg-gray-100 text-gray-700 border-gray-200',
      cancelled: 'bg-red-100 text-red-700 border-red-200'
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

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Trophy className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Trophy className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-500">#{rank}</span>;
    }
  };

  if (!mounted || settingsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-200/30 to-amber-300/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-yellow-200/30 to-orange-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-gradient-to-br from-amber-100/20 to-yellow-200/10 rounded-full blur-2xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent">
                  Referral Program
                </h1>
                <p className="text-gray-600 text-sm">Invite friends & earn rewards together</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-white border-2 border-gray-200 hover:border-orange-300 hover:shadow-md transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl font-medium hover:from-orange-600 hover:to-amber-700 transition-all shadow-lg shadow-orange-500/25"
            >
              <Send className="w-4 h-4" />
              <span>Invite Friends</span>
            </button>
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-gray-200 p-2 mb-6 shadow-sm">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Link
              href="/referrals"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white font-medium shadow-md"
            >
              <Gift className="w-4 h-4" />
              <span>My Referrals</span>
            </Link>
            <Link
              href="/finance"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors font-medium"
            >
              <Coins className="w-4 h-4" />
              <span>Earnings</span>
            </Link>
            <Link
              href="/support"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors font-medium"
            >
              <Headphones className="w-4 h-4" />
              <span>Support</span>
            </Link>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 flex-1">{error}</p>
            <button
              onClick={() => fetchReferralData()}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && !stats && (
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border-2 border-gray-200 p-5 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-xl"></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!loading && (
          <>
            {/* Referral Link Card */}
            <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 rounded-2xl p-6 mb-6 text-white shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold mb-2">Your Referral Link</h2>
                  <p className="text-orange-100 text-sm mb-3">Share this link to invite friends and earn rewards</p>
                  <div className="flex items-center gap-2 bg-white/20 rounded-xl px-4 py-3">
                    <Link2 className="w-5 h-5 text-orange-100" />
                    <span className="text-sm font-mono truncate max-w-xs">
                      {referralLink?.shortUrl || referralLink?.url || 'Loading...'}
                    </span>
                    <button
                      onClick={copyReferralLink}
                      className="ml-2 p-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-orange-100">Code:</span>
                    <span className="font-mono font-bold text-lg">{referralLink?.code || '---'}</span>
                    <button
                      onClick={copyReferralCode}
                      className="p-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => shareOnSocial('facebook')}
                      className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                      title="Share on Facebook"
                    >
                      <Facebook className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => shareOnSocial('twitter')}
                      className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                      title="Share on Twitter"
                    >
                      <Twitter className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => shareOnSocial('linkedin')}
                      className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                      title="Share on LinkedIn"
                    >
                      <Linkedin className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => shareOnSocial('whatsapp')}
                      className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                      title="Share on WhatsApp"
                    >
                      <MessageSquare className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-2xl border-2 border-gray-200 p-5 hover:border-orange-300 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-600 text-sm font-medium">Total Referrals</p>
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-orange-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalReferrals || 0}</p>
                <p className="text-gray-500 text-xs mt-1">{stats?.pendingReferrals || 0} pending</p>
              </div>

              <div className="bg-white rounded-2xl border-2 border-gray-200 p-5 hover:border-green-300 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-600 text-sm font-medium">Completed</p>
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-green-600">{stats?.completedReferrals || 0}</p>
                <p className="text-gray-500 text-xs mt-1">{stats?.conversionRate ? `${(stats.conversionRate * 100).toFixed(1)}%` : '0%'} conversion</p>
              </div>

              <div className="bg-white rounded-2xl border-2 border-gray-200 p-5 hover:border-amber-300 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-600 text-sm font-medium">Total Earnings</p>
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Coins className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.totalEarnings || 0)}</p>
                <p className="text-gray-500 text-xs mt-1">Lifetime earnings</p>
              </div>

              <div className="bg-white rounded-2xl border-2 border-gray-200 p-5 hover:border-yellow-300 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-600 text-sm font-medium">Pending Rewards</p>
                  <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.pendingEarnings || 0)}</p>
                <p className="text-gray-500 text-xs mt-1">Awaiting completion</p>
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 mb-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">How It Works</h3>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <Share2 className="w-7 h-7 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">1. Share</h4>
                  <p className="text-sm text-gray-600">Share your unique referral link with friends</p>
                </div>
                <div className="text-center">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">2. Sign Up</h4>
                  <p className="text-sm text-gray-600">Friends sign up using your link</p>
                </div>
                <div className="text-center">
                  <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <Target className="w-7 h-7 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">3. Complete</h4>
                  <p className="text-sm text-gray-600">They complete their first action</p>
                </div>
                <div className="text-center">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <Gift className="w-7 h-7 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">4. Earn</h4>
                  <p className="text-sm text-gray-600">Both of you receive rewards!</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 bg-white/80 backdrop-blur-sm p-2 rounded-xl border-2 border-gray-200">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                  activeTab === 'overview'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('referrals')}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                  activeTab === 'referrals'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                My Referrals
              </button>
              <button
                onClick={() => setActiveTab('leaderboard')}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                  activeTab === 'leaderboard'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Leaderboard
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Recent Referrals */}
                <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Recent Referrals</h3>
                    <button
                      onClick={() => setActiveTab('referrals')}
                      className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                    >
                      View All
                    </button>
                  </div>
                  {!Array.isArray(referrals) || referrals.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Users className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 mb-2">No referrals yet</p>
                      <p className="text-sm text-gray-400">Start inviting friends to earn rewards!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {referrals.slice(0, 5).map((ref) => {
                        const refereeName = ref.referee?.name || 
                          `${ref.referee?.firstName || ''} ${ref.referee?.lastName || ''}`.trim() || 'Anonymous';
                        
                        return (
                          <div
                            key={ref._id || ref.id}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                          >
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center text-white font-semibold">
                              {refereeName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{refereeName}</p>
                              <p className="text-xs text-gray-500">{formatDate(ref.timeline?.referredAt)}</p>
                            </div>
                            <div className="text-right">
                              {getStatusBadge(ref.status)}
                              {ref.rewardDistribution?.referrerReward && (
                                <p className="text-sm font-semibold text-green-600 mt-1">
                                  +{formatCurrency(ref.rewardDistribution.referrerReward.amount)}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Reward Types */}
                <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Reward Types</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <Coins className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Wallet Credit</p>
                        <p className="text-sm text-gray-600">Earn ₱50-₱500 per successful referral</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border border-purple-200">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Discount Codes</p>
                        <p className="text-sm text-gray-600">Get exclusive discounts on services</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Star className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Plus Subscription Days</p>
                        <p className="text-sm text-gray-600">Get free days of LocalPro Plus</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'referrals' && (
              <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
                {/* Search & Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search referrals..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="expired">Expired</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <select
                      value={timeRange}
                      onChange={(e) => setTimeRange(e.target.value)}
                      className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    >
                      <option value="all">All Time</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                      <option value="year">This Year</option>
                    </select>
                  </div>
                </div>

                {/* Referral List */}
                {filteredReferrals.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Referrals Found</h3>
                    <p className="text-gray-500 mb-4">
                      {searchQuery ? 'Try adjusting your search or filters' : 'Start inviting friends to see your referrals here'}
                    </p>
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl font-medium hover:from-orange-600 hover:to-amber-700 transition-all shadow-lg shadow-orange-500/25"
                    >
                      Invite Friends
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredReferrals.map((ref) => {
                      const refereeName = ref.referee?.name || 
                        `${ref.referee?.firstName || ''} ${ref.referee?.lastName || ''}`.trim() || 'Anonymous';
                      
                      return (
                        <div
                          key={ref._id || ref.id}
                          className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                            {refereeName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-gray-900">{refereeName}</p>
                              {getStatusBadge(ref.status)}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-500">
                              <span>Referred: {formatDate(ref.timeline?.referredAt)}</span>
                              {ref.referralType && (
                                <>
                                  <span>•</span>
                                  <span className="capitalize">{ref.referralType.replace(/_/g, ' ')}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {ref.rewardDistribution?.referrerReward ? (
                              <p className={`text-lg font-bold ${
                                ref.rewardDistribution.referrerReward.status === 'processed' || ref.rewardDistribution.referrerReward.status === 'paid'
                                  ? 'text-green-600' : 'text-yellow-600'
                              }`}>
                                +{formatCurrency(ref.rewardDistribution.referrerReward.amount)}
                              </p>
                            ) : ref.reward?.amount ? (
                              <p className="text-lg font-bold text-gray-400">
                                +{formatCurrency(ref.reward.amount)}
                              </p>
                            ) : null}
                            {ref.timeline?.expiresAt && ref.status === 'pending' && (
                              <p className="text-xs text-gray-500">
                                Expires: {formatDate(ref.timeline.expiresAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded-lg border-2 border-gray-200 hover:border-orange-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 rounded-lg border-2 border-gray-200 hover:border-orange-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'leaderboard' && (
              <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Top Referrers</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span>This Month</span>
                  </div>
                </div>

                {!Array.isArray(leaderboard) || leaderboard.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Trophy className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Leaderboard Coming Soon</h3>
                    <p className="text-gray-500">Be among the first to climb the ranks!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaderboard.map((entry, index) => {
                      const userName = entry.user?.name || 
                        `${entry.user?.firstName || ''} ${entry.user?.lastName || ''}`.trim() || 'Anonymous';
                      const rank = entry.rank || index + 1;
                      
                      return (
                        <div
                          key={entry._id || entry.id || index}
                          className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${
                            rank <= 3 
                              ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200' 
                              : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <div className="w-10 flex items-center justify-center">
                            {getRankIcon(rank)}
                          </div>
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center text-white font-bold">
                            {userName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900">{userName}</p>
                            <p className="text-sm text-gray-500">{entry.referralCount} referrals</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">{formatCurrency(entry.totalEarnings)}</p>
                            <p className="text-xs text-gray-500">earned</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Help Section */}
            <div className="mt-8 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 rounded-2xl p-6 text-white">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                    <HelpCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Need Help with Referrals?</h3>
                    <p className="text-orange-100">Learn how to maximize your referral earnings</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Link
                    href="/support"
                    className="flex items-center gap-2 px-5 py-2.5 bg-white text-orange-600 rounded-xl font-medium hover:bg-orange-50 transition-colors"
                  >
                    <Headphones className="w-4 h-4" />
                    Contact Support
                  </Link>
                  <Link
                    href="/support#faq"
                    className="flex items-center gap-2 px-5 py-2.5 bg-white/20 text-white rounded-xl font-medium hover:bg-white/30 transition-colors"
                  >
                    <HelpCircle className="w-4 h-4" />
                    FAQs
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Invite Friends</h3>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Method Toggle */}
              <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl">
                <button
                  onClick={() => setInviteMethod('email')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                    inviteMethod === 'email'
                      ? 'bg-white text-orange-600 shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  Email
                </button>
                <button
                  onClick={() => setInviteMethod('sms')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                    inviteMethod === 'sms'
                      ? 'bg-white text-orange-600 shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  SMS
                </button>
              </div>

              {/* Input Fields */}
              {inviteMethod === 'email' ? (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Addresses
                  </label>
                  <textarea
                    value={inviteEmails}
                    onChange={(e) => setInviteEmails(e.target.value)}
                    placeholder="Enter emails separated by commas..."
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
                  />
                </div>
              ) : (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Numbers
                  </label>
                  <textarea
                    value={invitePhones}
                    onChange={(e) => setInvitePhones(e.target.value)}
                    placeholder="Enter phone numbers separated by commas..."
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
                  />
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Personal Message (Optional)
                </label>
                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  placeholder="Add a personal message..."
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
                />
              </div>

              <button
                onClick={handleSendInvites}
                disabled={sendingInvites || (inviteMethod === 'email' ? !inviteEmails.trim() : !invitePhones.trim())}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl font-medium hover:from-orange-600 hover:to-amber-700 transition-all shadow-lg shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingInvites ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Invitations
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

