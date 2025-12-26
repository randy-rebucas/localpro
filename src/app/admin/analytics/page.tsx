'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Activity,
  RefreshCw,
  Download,
  Calendar,
  Search,
  Users,
  Coins,
  Briefcase,
  ShoppingBag,
  Gift,
  Building2,
  Zap,
  FileJson,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  Globe
} from 'lucide-react';
import {
  useAnalyticsDashboard,
  useAnalyticsRealtime,
  useAnalyticsTimeSeries,
  useAnalyticsComparison,
  useAnalyticsFinancial,
  useAnalyticsOverview,
  useAnalyticsUsers,
  useAnalyticsMarketplace,
  useAnalyticsJobs,
  useAnalyticsReferrals,
  useAnalyticsAgencies,
  useAnalyticsExport,
  type Timeframe,
  type MetricType,
  type Granularity,
  type ExportType,
} from "@/hooks/useAnalytics";
import { makeClientAuthenticatedRequestWithEndpointSafe } from "@/lib/client-api-utils";
import { API_ENDPOINTS } from "@/lib/api";
import { logger } from "@/lib/logger";
import { AnalyticsEvent, AnalyticsEventType } from "@/types/analytics";
import toast from "react-hot-toast";

// Extended AnalyticsEvent interface for admin page
interface AnalyticsEventWithUser extends Omit<AnalyticsEvent, 'userId' | 'timestamp'> {
  _id: string;
  userId: string | {
    _id: string;
    name?: string;
    email?: string;
  };
  eventType: AnalyticsEventType;
  timestamp: string | Date;
}

interface CustomAnalyticsResponse {
  success: boolean;
  count: number;
  data: AnalyticsEventWithUser[];
}

type TabType = 'dashboard' | 'realtime' | 'financial' | 'users' | 'marketplace' | 'jobs' | 'referrals' | 'agencies' | 'custom';

export default function AdminAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [timeframe, setTimeframe] = useState<Timeframe>('30d');
  const [chartMetric, setChartMetric] = useState<MetricType>('bookings');
  const [granularity, setGranularity] = useState<Granularity>('daily');
  
  // Dashboard hooks
  const { dashboard, loading: dashboardLoading, error: dashboardError, refetch: refetchDashboard } = useAnalyticsDashboard(timeframe);
  const { realtime, loading: realtimeLoading, refetch: refetchRealtime } = useAnalyticsRealtime(15000);
  const { timeSeries, loading: timeSeriesLoading, refetch: refetchTimeSeries } = useAnalyticsTimeSeries({ metric: chartMetric, timeframe, granularity });
  const { comparison, loading: comparisonLoading } = useAnalyticsComparison(timeframe);
  const { financial, loading: financialLoading, error: financialError, refetch: refetchFinancial } = useAnalyticsFinancial(timeframe);
  // Overview data available for additional dashboard features
  useAnalyticsOverview();
  const { users: userAnalytics, loading: usersLoading, refetch: refetchUsers } = useAnalyticsUsers();
  const { marketplace, loading: marketplaceLoading, refetch: refetchMarketplace } = useAnalyticsMarketplace();
  const { jobs, loading: jobsLoading, refetch: refetchJobs } = useAnalyticsJobs();
  const { referrals, loading: referralsLoading, refetch: refetchReferrals } = useAnalyticsReferrals();
  const { agencies, loading: agenciesLoading, refetch: refetchAgencies } = useAnalyticsAgencies();
  const { downloadExport, loading: exportLoading } = useAnalyticsExport();

  // Custom analytics state (existing functionality)
  const [customEvents, setCustomEvents] = useState<AnalyticsEventWithUser[]>([]);
  const [customLoading, setCustomLoading] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    summary: true,
    growth: true,
    topMetrics: false,
    chart: true,
  });

  const eventTypes: AnalyticsEventType[] = [
    'page_view', 'service_view', 'booking_created', 'booking_completed',
    'job_view', 'job_application', 'course_enrollment', 'product_purchase',
    'referral_click', 'referral_completed', 'subscription_upgrade',
    'payment_completed', 'search_performed', 'filter_applied',
    'user_registration', 'user_login', 'profile_update'
  ];

  const modules = [
    'marketplace', 'jobs', 'academy', 'supplies', 'rentals',
    'facility-care', 'referrals', 'agencies', 'ads', 'communication'
  ];

  const timeframeOptions: { value: Timeframe; label: string }[] = [
    { value: '1h', label: 'Last Hour' },
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' },
  ];

  const metricOptions: { value: MetricType; label: string }[] = [
    { value: 'users', label: 'Users' },
    { value: 'bookings', label: 'Bookings' },
    { value: 'revenue', label: 'Revenue' },
    { value: 'services', label: 'Services' },
    { value: 'jobs', label: 'Jobs' },
    { value: 'referrals', label: 'Referrals' },
  ];

  const granularityOptions: { value: Granularity; label: string }[] = [
    { value: 'hourly', label: 'Hourly' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
  ];

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'realtime', label: 'Real-time', icon: <Zap className="w-4 h-4" /> },
    { id: 'financial', label: 'Financial', icon: <Coins className="w-4 h-4" /> },
    { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
    { id: 'marketplace', label: 'Marketplace', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'jobs', label: 'Jobs', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'referrals', label: 'Referrals', icon: <Gift className="w-4 h-4" /> },
    { id: 'agencies', label: 'Agencies', icon: <Building2 className="w-4 h-4" /> },
    { id: 'custom', label: 'Custom Events', icon: <Activity className="w-4 h-4" /> },
  ];

  // Fetch custom analytics
  const fetchCustomAnalytics = useCallback(async () => {
    try {
      setCustomLoading(true);
      setCustomError(null);

      const queryParams: Record<string, string> = {};
      if (eventTypeFilter !== 'all') queryParams.eventType = eventTypeFilter;
      if (moduleFilter !== 'all') queryParams.module = moduleFilter;
      if (startDate) queryParams.startDate = new Date(startDate).toISOString();
      if (endDate) queryParams.endDate = new Date(endDate).toISOString();

      const response = await makeClientAuthenticatedRequestWithEndpointSafe(
        'analyticsCustom' as keyof typeof API_ENDPOINTS,
        { method: 'GET', query: queryParams }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Failed to fetch analytics (${response.status})`);
      }

      const result: CustomAnalyticsResponse = await response.json();
      if (result.success && result.data) {
        setCustomEvents(result.data || []);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Error fetching custom analytics', error);
      setCustomError(error.message);
      setCustomEvents([]);
    } finally {
      setCustomLoading(false);
    }
  }, [eventTypeFilter, moduleFilter, startDate, endDate]);

  useEffect(() => {
    if (activeTab === 'custom') {
      fetchCustomAnalytics();
    }
  }, [activeTab, fetchCustomAnalytics]);

  const handleExport = async (type: ExportType, format: 'json' | 'csv') => {
    const success = await downloadExport({ type, timeframe, format });
    if (success) {
      toast.success(`Analytics exported as ${format.toUpperCase()}`);
    } else {
      toast.error('Failed to export analytics');
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const formatNumber = (num: number | undefined) => {
    if (num === undefined) return '—';
    return num.toLocaleString();
  };

  const formatCurrency = (amount: number | undefined, currency: string = 'PHP') => {
    if (amount === undefined) return '—';
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency }).format(amount);
  };

  const formatGrowth = (growth: string | undefined) => {
    if (!growth) return null;
    const value = parseFloat(growth);
    const isPositive = value >= 0;
    return (
      <span className={`inline-flex items-center text-xs font-medium ${isPositive ? 'text-accent' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
        {Math.abs(value).toFixed(1)}%
      </span>
    );
  };

  const formatDate = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatEventType = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getUserDisplay = (userId: string | { _id: string; name?: string; email?: string }) => {
    if (typeof userId === 'string') return userId.substring(0, 8) + '...';
    return userId.name || userId.email || userId._id.substring(0, 8) + '...';
  };

  const filteredEvents = customEvents.filter(event => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const eventType = event.eventType.toLowerCase();
    const userId = typeof event.userId === 'string' ? event.userId : (event.userId.name || event.userId.email || event.userId._id || '').toLowerCase();
    return eventType.includes(searchLower) || userId.includes(searchLower);
  });

  // Stat Card Component
  const StatCard = ({ title, value, subtitle, icon, color, growth }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
    growth?: string;
  }) => (
    <div className={`bg-white rounded-lg shadow p-4 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500">{title}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
          <div className="flex items-center gap-2 mt-1">
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
            {growth && formatGrowth(growth)}
          </div>
        </div>
        <div className={`p-3 rounded-lg ${color.replace('border-', 'bg-').replace('-500', '-100')}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  // Section Header Component
  const SectionHeader = ({ title, section, children }: { title: string; section: string; children?: React.ReactNode }) => (
    <div 
      className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b cursor-pointer hover:bg-gray-100 transition-colors"
      onClick={() => toggleSection(section)}
    >
      <div className="flex items-center gap-2">
        {expandedSections[section] ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 text-xs">Comprehensive platform analytics and insights</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as Timeframe)}
            className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring"
          >
            {timeframeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          
          <div className="relative">
            <button
              onClick={() => document.getElementById('export-menu')?.classList.toggle('hidden')}
              disabled={exportLoading}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <Download className={`w-3.5 h-3.5 mr-1.5 ${exportLoading ? 'animate-spin' : ''}`} />
              Export
            </button>
            <div id="export-menu" className="hidden absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border z-10">
              <div className="p-2">
                <p className="text-xs font-medium text-gray-500 px-2 py-1">Export As</p>
                <button onClick={() => handleExport('overview', 'json')} className="flex items-center w-full px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-100 rounded">
                  <FileJson className="w-3.5 h-3.5 mr-2" /> Overview (JSON)
                </button>
                <button onClick={() => handleExport('users', 'csv')} className="flex items-center w-full px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-100 rounded">
                  <FileSpreadsheet className="w-3.5 h-3.5 mr-2" /> Users (CSV)
                </button>
                <button onClick={() => handleExport('revenue', 'csv')} className="flex items-center w-full px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-100 rounded">
                  <FileSpreadsheet className="w-3.5 h-3.5 mr-2" /> Revenue (CSV)
                </button>
                <button onClick={() => handleExport('bookings', 'csv')} className="flex items-center w-full px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-100 rounded">
                  <FileSpreadsheet className="w-3.5 h-3.5 mr-2" /> Bookings (CSV)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b overflow-x-auto">
          <nav className="flex -mb-px">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="p-4 space-y-4">
            {dashboardError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                <p className="font-medium">Error loading dashboard</p>
                <p className="text-xs mt-1">{dashboardError}</p>
                <button onClick={refetchDashboard} className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700">
                  Retry
                </button>
              </div>
            ) : (
              <>
                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <StatCard
                    title="Total Users"
                    value={dashboardLoading ? '...' : formatNumber(dashboard?.summary?.users?.total)}
                    subtitle={`+${formatNumber(dashboard?.summary?.users?.new)} new`}
                    icon={<Users className="w-5 h-5 text-primary" />}
                    color="border-primary"
                    growth={dashboard?.summary?.growth?.users}
                  />
                  <StatCard
                    title="Services"
                    value={dashboardLoading ? '...' : formatNumber(dashboard?.summary?.services?.total)}
                    subtitle={`+${formatNumber(dashboard?.summary?.services?.new)} new`}
                    icon={<ShoppingBag className="w-5 h-5 text-accent" />}
                    color="border-accent"
                    growth={dashboard?.summary?.growth?.services}
                  />
                  <StatCard
                    title="Bookings"
                    value={dashboardLoading ? '...' : formatNumber(dashboard?.summary?.bookings?.total)}
                    subtitle={`${dashboard?.summary?.bookings?.completionRate || 0}% completion`}
                    icon={<Calendar className="w-5 h-5 text-purple-600" />}
                    color="border-purple-500"
                    growth={dashboard?.summary?.growth?.bookings}
                  />
                  <StatCard
                    title="Revenue"
                    value={dashboardLoading ? '...' : formatCurrency(dashboard?.summary?.revenue?.total)}
                    subtitle={dashboard?.summary?.revenue?.currency || 'PHP'}
                    icon={<Coins className="w-5 h-5 text-yellow-600" />}
                    color="border-yellow-500"
                    growth={dashboard?.summary?.growth?.revenue}
                  />
                  <StatCard
                    title="Jobs"
                    value={dashboardLoading ? '...' : formatNumber(dashboard?.summary?.jobs?.total)}
                    subtitle={`${formatNumber(dashboard?.summary?.jobs?.applications)} applications`}
                    icon={<Briefcase className="w-5 h-5 text-orange-600" />}
                    color="border-orange-500"
                    growth={dashboard?.summary?.growth?.jobs}
                  />
                  <StatCard
                    title="Referrals"
                    value={dashboardLoading ? '...' : formatNumber(dashboard?.summary?.referrals?.total)}
                    subtitle="Total referrals"
                    icon={<Gift className="w-5 h-5 text-pink-600" />}
                    color="border-pink-500"
                    growth={dashboard?.summary?.growth?.referrals}
                  />
                </div>

                {/* Time Series Chart Controls */}
                <div className="bg-white rounded-lg border">
                  <SectionHeader title="Trends Chart" section="chart">
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <select value={chartMetric} onChange={e => setChartMetric(e.target.value as MetricType)} className="px-2 py-1 text-xs border rounded">
                        {metricOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                      <select value={granularity} onChange={e => setGranularity(e.target.value as Granularity)} className="px-2 py-1 text-xs border rounded">
                        {granularityOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                      <button onClick={refetchTimeSeries} className="p-1 hover:bg-gray-200 rounded">
                        <RefreshCw className={`w-3.5 h-3.5 ${timeSeriesLoading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </SectionHeader>
                  {expandedSections.chart && (
                    <div className="p-4">
                      {timeSeriesLoading ? (
                        <div className="h-48 flex items-center justify-center text-gray-500 text-sm">Loading chart data...</div>
                      ) : timeSeries?.series?.length ? (
                        <div className="h-48 flex items-end justify-between gap-1">
                          {timeSeries.series.slice(-30).map((point, idx) => {
                            const maxValue = Math.max(...timeSeries.series.map(p => chartMetric === 'revenue' ? (p.revenue || 0) : p.count));
                            const value = chartMetric === 'revenue' ? (point.revenue || 0) : point.count;
                            const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
                            return (
                              <div key={idx} className="flex-1 flex flex-col items-center group relative">
                                <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                                  {point.date}: {chartMetric === 'revenue' ? formatCurrency(point.revenue) : point.count}
                                </div>
                                <div className="w-full bg-primary rounded-t transition-all hover:bg-primary/90" style={{ height: `${height}%`, minHeight: value > 0 ? '4px' : '0' }} />
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="h-48 flex items-center justify-center text-gray-500 text-sm">No data available</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Comparison Stats */}
                {comparison && !comparisonLoading && (
                  <div className="bg-white rounded-lg border">
                    <SectionHeader title="Period Comparison" section="growth" />
                    {expandedSections.growth && (
                      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(comparison.growth || {}).map(([key, value]) => (
                          <div key={key} className="text-center p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500 capitalize">{key}</p>
                            <div className="mt-1">{formatGrowth(value)}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Real-time Tab */}
        {activeTab === 'realtime' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                <span className="text-xs text-gray-500">Live data • Auto-refreshing every 15s</span>
              </div>
              <button onClick={refetchRealtime} disabled={realtimeLoading} className="p-2 hover:bg-gray-100 rounded-lg">
                <RefreshCw className={`w-4 h-4 ${realtimeLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                title="Active Users (1h)"
                value={realtimeLoading ? '...' : formatNumber(realtime?.activeUsers?.lastHour)}
                subtitle={`${formatNumber(realtime?.activeUsers?.last15Minutes)} in last 15min`}
                icon={<Users className="w-5 h-5 text-primary" />}
                color="border-primary"
              />
              <StatCard
                title="Bookings (1h)"
                value={realtimeLoading ? '...' : formatNumber(realtime?.bookings?.lastHour)}
                subtitle="Last hour"
                icon={<Calendar className="w-5 h-5 text-accent" />}
                color="border-accent"
              />
              <StatCard
                title="Revenue (1h)"
                value={realtimeLoading ? '...' : formatCurrency(realtime?.revenue?.lastHour)}
                subtitle="Last hour"
                icon={<Coins className="w-5 h-5 text-yellow-600" />}
                color="border-yellow-500"
              />
              <StatCard
                title="New Users (1h)"
                value={realtimeLoading ? '...' : formatNumber(realtime?.newUsers?.lastHour)}
                subtitle="Last hour"
                icon={<TrendingUp className="w-5 h-5 text-purple-600" />}
                color="border-purple-500"
              />
            </div>

            {realtime?.timestamp && (
              <p className="text-xs text-gray-400 text-center">Last updated: {formatDate(realtime.timestamp)}</p>
            )}
          </div>
        )}

        {/* Financial Tab */}
        {activeTab === 'financial' && (
          <div className="p-4 space-y-4">
            {financialError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                <p>{financialError}</p>
                <button onClick={refetchFinancial} className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-xs">Retry</button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    title="Total Revenue"
                    value={financialLoading ? '...' : formatCurrency(financial?.summary?.totalRevenue)}
                    icon={<Coins className="w-5 h-5 text-accent" />}
                    color="border-accent"
                    growth={financial?.summary?.growth}
                  />
                  <StatCard
                    title="Transactions"
                    value={financialLoading ? '...' : formatNumber(financial?.summary?.transactionCount)}
                    icon={<Activity className="w-5 h-5 text-primary" />}
                    color="border-primary"
                  />
                  <StatCard
                    title="Avg Order Value"
                    value={financialLoading ? '...' : formatCurrency(parseFloat(financial?.summary?.averageOrderValue || '0'))}
                    icon={<BarChart3 className="w-5 h-5 text-purple-600" />}
                    color="border-purple-500"
                  />
                  <StatCard
                    title="Currency"
                    value={financial?.currency || 'PHP'}
                    icon={<Globe className="w-5 h-5 text-gray-600" />}
                    color="border-gray-500"
                  />
                </div>

                {financial?.revenueByCategory && financial.revenueByCategory.length > 0 && (
                  <div className="bg-white rounded-lg border">
                    <div className="px-4 py-3 border-b">
                      <h3 className="text-sm font-semibold">Revenue by Category</h3>
                    </div>
                    <div className="p-4">
                      <div className="space-y-2">
                        {financial.revenueByCategory.map((cat, idx) => (
                          <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                            <span className="text-sm capitalize">{cat._id}</span>
                            <div className="text-right">
                              <p className="text-sm font-medium">{formatCurrency(cat.revenue)}</p>
                              <p className="text-xs text-gray-500">{cat.bookings} bookings</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="p-4 space-y-4">
            <div className="flex justify-end">
              <button onClick={refetchUsers} disabled={usersLoading} className="p-2 hover:bg-gray-100 rounded-lg">
                <RefreshCw className={`w-4 h-4 ${usersLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            {usersLoading ? (
              <div className="text-center py-8 text-gray-500">Loading user analytics...</div>
            ) : userAnalytics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userAnalytics.usersByRole && (
                  <div className="bg-white rounded-lg border">
                    <div className="px-4 py-3 border-b"><h3 className="text-sm font-semibold">Users by Role</h3></div>
                    <div className="p-4 space-y-2">
                      {userAnalytics.usersByRole.map((item, idx) => (
                        <div key={idx} className="flex justify-between py-1">
                          <span className="text-sm capitalize">{item.role}</span>
                          <span className="text-sm font-medium">{formatNumber(item.count)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {userAnalytics.usersByLocation && (
                  <div className="bg-white rounded-lg border">
                    <div className="px-4 py-3 border-b"><h3 className="text-sm font-semibold">Users by Location</h3></div>
                    <div className="p-4 space-y-2">
                      {userAnalytics.usersByLocation.slice(0, 10).map((item, idx) => (
                        <div key={idx} className="flex justify-between py-1">
                          <span className="text-sm">{item.location}</span>
                          <span className="text-sm font-medium">{formatNumber(item.count)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No user analytics data available</div>
            )}
          </div>
        )}

        {/* Marketplace Tab */}
        {activeTab === 'marketplace' && (
          <div className="p-4 space-y-4">
            <div className="flex justify-end">
              <button onClick={refetchMarketplace} disabled={marketplaceLoading} className="p-2 hover:bg-gray-100 rounded-lg">
                <RefreshCw className={`w-4 h-4 ${marketplaceLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            {marketplaceLoading ? (
              <div className="text-center py-8 text-gray-500">Loading marketplace analytics...</div>
            ) : marketplace ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {marketplace.topServices && (
                  <div className="bg-white rounded-lg border">
                    <div className="px-4 py-3 border-b"><h3 className="text-sm font-semibold">Top Services</h3></div>
                    <div className="p-4 space-y-2">
                      {marketplace.topServices.slice(0, 10).map((item, idx) => (
                        <div key={idx} className="flex justify-between py-1">
                          <span className="text-sm truncate flex-1">{item.name}</span>
                          <span className="text-sm font-medium ml-2">{item.bookings} bookings</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {marketplace.bookingAnalytics && (
                  <div className="bg-white rounded-lg border">
                    <div className="px-4 py-3 border-b"><h3 className="text-sm font-semibold">Bookings by Status</h3></div>
                    <div className="p-4 space-y-2">
                      {marketplace.bookingAnalytics.map((item, idx) => (
                        <div key={idx} className="flex justify-between py-1">
                          <span className="text-sm capitalize">{item.status}</span>
                          <span className="text-sm font-medium">{formatNumber(item.count)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No marketplace analytics data available</div>
            )}
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <div className="p-4 space-y-4">
            <div className="flex justify-end">
              <button onClick={refetchJobs} disabled={jobsLoading} className="p-2 hover:bg-gray-100 rounded-lg">
                <RefreshCw className={`w-4 h-4 ${jobsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            {jobsLoading ? (
              <div className="text-center py-8 text-gray-500">Loading job analytics...</div>
            ) : jobs ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs.jobStatusAnalytics && (
                  <div className="bg-white rounded-lg border">
                    <div className="px-4 py-3 border-b"><h3 className="text-sm font-semibold">Jobs by Status</h3></div>
                    <div className="p-4 space-y-2">
                      {jobs.jobStatusAnalytics.map((item, idx) => (
                        <div key={idx} className="flex justify-between py-1">
                          <span className="text-sm capitalize">{item.status}</span>
                          <span className="text-sm font-medium">{formatNumber(item.count)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {jobs.topEmployers && (
                  <div className="bg-white rounded-lg border">
                    <div className="px-4 py-3 border-b"><h3 className="text-sm font-semibold">Top Employers</h3></div>
                    <div className="p-4 space-y-2">
                      {jobs.topEmployers.slice(0, 10).map((item, idx) => (
                        <div key={idx} className="flex justify-between py-1">
                          <span className="text-sm truncate flex-1">{item.name}</span>
                          <span className="text-sm font-medium ml-2">{item.jobs} jobs</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No job analytics data available</div>
            )}
          </div>
        )}

        {/* Referrals Tab */}
        {activeTab === 'referrals' && (
          <div className="p-4 space-y-4">
            <div className="flex justify-end">
              <button onClick={refetchReferrals} disabled={referralsLoading} className="p-2 hover:bg-gray-100 rounded-lg">
                <RefreshCw className={`w-4 h-4 ${referralsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            {referralsLoading ? (
              <div className="text-center py-8 text-gray-500">Loading referral analytics...</div>
            ) : referrals ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {referrals.referralStatusAnalytics && (
                  <div className="bg-white rounded-lg border">
                    <div className="px-4 py-3 border-b"><h3 className="text-sm font-semibold">Referrals by Status</h3></div>
                    <div className="p-4 space-y-2">
                      {referrals.referralStatusAnalytics.map((item, idx) => (
                        <div key={idx} className="flex justify-between py-1">
                          <span className="text-sm capitalize">{item.status}</span>
                          <span className="text-sm font-medium">{formatNumber(item.count)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {referrals.topReferrers && (
                  <div className="bg-white rounded-lg border">
                    <div className="px-4 py-3 border-b"><h3 className="text-sm font-semibold">Top Referrers</h3></div>
                    <div className="p-4 space-y-2">
                      {referrals.topReferrers.slice(0, 10).map((item, idx) => (
                        <div key={idx} className="flex justify-between py-1">
                          <span className="text-sm truncate flex-1">{item.name}</span>
                          <div className="text-right ml-2">
                            <span className="text-sm font-medium">{item.referrals} referrals</span>
                            <p className="text-xs text-gray-500">{formatCurrency(item.rewards)} earned</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No referral analytics data available</div>
            )}
          </div>
        )}

        {/* Agencies Tab */}
        {activeTab === 'agencies' && (
          <div className="p-4 space-y-4">
            <div className="flex justify-end">
              <button onClick={refetchAgencies} disabled={agenciesLoading} className="p-2 hover:bg-gray-100 rounded-lg">
                <RefreshCw className={`w-4 h-4 ${agenciesLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            {agenciesLoading ? (
              <div className="text-center py-8 text-gray-500">Loading agency analytics...</div>
            ) : agencies ? (
              <div className="grid grid-cols-1 gap-4">
                {agencies.agencyPerformance && (
                  <div className="bg-white rounded-lg border overflow-hidden">
                    <div className="px-4 py-3 border-b"><h3 className="text-sm font-semibold">Agency Performance</h3></div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Agency</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Providers</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Bookings</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Revenue</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {agencies.agencyPerformance.map((agency, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-sm">{agency.name}</td>
                              <td className="px-4 py-2 text-sm text-right">{agency.providers}</td>
                              <td className="px-4 py-2 text-sm text-right">{agency.bookings}</td>
                              <td className="px-4 py-2 text-sm text-right font-medium">{formatCurrency(agency.revenue)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No agency analytics data available</div>
            )}
          </div>
        )}

        {/* Custom Events Tab */}
        {activeTab === 'custom' && (
          <div className="p-4 space-y-4">
            {/* Filters */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium">Filters & Search</h3>
                <button onClick={() => setShowFilters(!showFilters)} className="text-xs text-primary hover:text-primary">
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </button>
              </div>
              
              {showFilters && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search..."
                        className="w-full pl-7 pr-2 py-1.5 text-xs border rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Event Type</label>
                    <select value={eventTypeFilter} onChange={(e) => setEventTypeFilter(e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded-lg">
                      <option value="all">All Types</option>
                      {eventTypes.map(type => <option key={type} value={type}>{formatEventType(type)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Module</label>
                    <select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded-lg">
                      <option value="all">All Modules</option>
                      {modules.map(m => <option key={m} value={m}>{m.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded-lg" />
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between mt-3">
                <button onClick={() => { setEventTypeFilter('all'); setModuleFilter('all'); setStartDate(''); setEndDate(''); setSearchTerm(''); }} className="text-xs text-gray-600 hover:text-gray-800">
                  Clear filters
                </button>
                <button onClick={fetchCustomAnalytics} disabled={customLoading} className="px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50">
                  {customLoading ? 'Loading...' : 'Apply Filters'}
                </button>
              </div>
            </div>

            {/* Events Table */}
            {customError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                <p>{customError}</p>
                <button onClick={fetchCustomAnalytics} className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-xs">Retry</button>
              </div>
            ) : (
              <div className="bg-white rounded-lg border overflow-hidden">
                <div className="px-4 py-3 border-b flex items-center justify-between">
                  <h3 className="text-sm font-medium">{filteredEvents.length} Events</h3>
                  <button
                    onClick={() => {
                      const dataBlob = new Blob([JSON.stringify(filteredEvents.slice(0, 100), null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(dataBlob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `custom-analytics-${new Date().toISOString().split('T')[0]}.json`;
                      link.click();
                    }}
                    className="inline-flex items-center px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                  >
                    <Download className="w-3 h-3 mr-1" /> Export
                  </button>
                </div>
                <div className="overflow-x-auto max-h-96">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Timestamp</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Event</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">User</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Device</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredEvents.length === 0 ? (
                        <tr><td colSpan={5} className="px-3 py-8 text-center text-sm text-gray-500">{customLoading ? 'Loading...' : 'No events found'}</td></tr>
                      ) : filteredEvents.slice(0, 100).map((event) => (
                        <tr key={event._id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-xs text-gray-600">{formatDate(event.timestamp)}</td>
                          <td className="px-3 py-2"><span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded">{formatEventType(event.eventType)}</span></td>
                          <td className="px-3 py-2 text-xs text-gray-600">{getUserDisplay(event.userId)}</td>
                          <td className="px-3 py-2 text-xs text-gray-600">{event.metadata?.deviceType || 'Unknown'}</td>
                          <td className="px-3 py-2 text-xs">
                            <details className="cursor-pointer">
                              <summary className="text-primary hover:text-primary">View</summary>
                              <pre className="mt-1 p-2 bg-gray-50 rounded text-[10px] overflow-auto max-h-24">{JSON.stringify({ eventData: event.eventData, metadata: event.metadata }, null, 2)}</pre>
                            </details>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
