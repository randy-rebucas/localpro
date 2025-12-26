"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Mail,
  Send,
  Users,
  BarChart3,
  Plus,
  Search,
  Filter,
  RefreshCw,
  MoreVertical,
  Play,
  Pause,
  Copy,
  Trash2,
  Edit,
  Clock,
  TrendingUp,
  MousePointerClick,
  MailOpen,
  UserX,
  AlertCircle,
  Download,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Loader2,
  Target,
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { Modal } from "@/components/ui/modal";
import toast from "react-hot-toast";
import {
  useCampaigns,
  useCampaignCRUD,
  useCampaignActions,
  useSubscribers,
  useSubscriberStats,
  useSubscriberCRUD,
  useEmailAnalytics,
  useTopCampaigns,
  useDailyStats,
  useAudienceEstimate,
  type EmailCampaign,
  type Subscriber,
  type CampaignStatus,
  type CampaignType,
  type TargetAudience,
  type SubscriberStatus,
  type CreateCampaignPayload,
  type UpdateCampaignPayload,
  type CampaignFilters,
  type SubscriberFilters,
} from "@/hooks/useEmailMarketing";

// Tab types
type TabType = "campaigns" | "subscribers" | "analytics";

// Status badge colors
const statusColors: Record<CampaignStatus, string> = {
  draft: "bg-gray-100 text-gray-800",
  scheduled: "bg-primary/10 text-primary",
  sending: "bg-yellow-100 text-yellow-800",
  paused: "bg-orange-100 text-orange-800",
  sent: "bg-accent/10 text-accent",
  cancelled: "bg-red-100 text-red-800",
};

const subscriberStatusColors: Record<SubscriberStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-accent/10 text-accent",
  unsubscribed: "bg-gray-100 text-gray-800",
  bounced: "bg-red-100 text-red-800",
  complained: "bg-purple-100 text-purple-800",
};

const campaignTypeLabels: Record<CampaignType, string> = {
  newsletter: "Newsletter",
  promotional: "Promotional",
  transactional: "Transactional",
  announcement: "Announcement",
  welcome: "Welcome",
  retention: "Retention",
  reengagement: "Re-engagement",
};

const audienceLabels: Record<TargetAudience, string> = {
  all: "All Users",
  providers: "Providers",
  clients: "Clients",
  agencies: "Agencies",
  premium: "Premium Users",
  verified: "Verified Users",
  inactive: "Inactive Users",
  custom: "Custom Segment",
};

export default function EmailMarketingPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>("campaigns");
  
  // Filters state
  const [campaignFilters, setCampaignFilters] = useState<CampaignFilters>({
    page: 1,
    limit: 20,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [subscriberFilters, setSubscriberFilters] = useState<SubscriberFilters>({
    page: 1,
    limit: 20,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTestEmailModal, setShowTestEmailModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<CreateCampaignPayload>({
    name: "",
    subject: "",
    preheader: "",
    content: "",
    type: "newsletter",
    targetAudience: "all",
    tags: [],
  });
  const [testEmails, setTestEmails] = useState("");
  
  // Data hooks
  const { campaigns, loading: campaignsLoading, pagination: campaignsPagination, refetch: refetchCampaigns } = useCampaigns(campaignFilters);
  const { subscribers, loading: subscribersLoading, pagination: subscribersPagination, refetch: refetchSubscribers } = useSubscribers(subscriberFilters);
  const { stats: subscriberStats, loading: statsLoading, refetch: refetchStats } = useSubscriberStats();
  const { analytics, loading: analyticsLoading, refetch: refetchAnalytics } = useEmailAnalytics();
  const { campaigns: topCampaigns, loading: topCampaignsLoading } = useTopCampaigns(5);
  const { stats: dailyStats, loading: dailyStatsLoading } = useDailyStats(30);
  
  // CRUD hooks
  const { createCampaign, updateCampaign, deleteCampaign, duplicateCampaign, loading: crudLoading } = useCampaignCRUD();
  const { sendCampaign, pauseCampaign, resumeCampaign, cancelCampaign, sendTestEmail, loading: actionLoading } = useCampaignActions();
  const { deleteSubscriber, exportSubscribers, loading: subscriberCrudLoading } = useSubscriberCRUD();
  const { estimateAudience } = useAudienceEstimate();
  
  // Audience estimate state
  const [audienceEstimate, setAudienceEstimate] = useState<number | null>(null);
  
  // Handle search
  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    if (activeTab === "campaigns") {
      setCampaignFilters(prev => ({ ...prev, search: value, page: 1 }));
    } else if (activeTab === "subscribers") {
      setSubscriberFilters(prev => ({ ...prev, search: value, page: 1 }));
    }
  }, [activeTab]);
  
  // Handle filter changes
  const handleCampaignFilterChange = useCallback((key: keyof CampaignFilters, value: string | number) => {
    setCampaignFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  }, []);
  
  const handleSubscriberFilterChange = useCallback((key: keyof SubscriberFilters, value: string | number) => {
    setSubscriberFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  }, []);
  
  // Handle pagination
  const handleCampaignPageChange = useCallback((page: number) => {
    setCampaignFilters(prev => ({ ...prev, page }));
  }, []);
  
  const handleSubscriberPageChange = useCallback((page: number) => {
    setSubscriberFilters(prev => ({ ...prev, page }));
  }, []);
  
  // Handle form changes
  const handleFormChange = useCallback((key: keyof CreateCampaignPayload, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    
    // Estimate audience when target changes
    if (key === "targetAudience") {
      estimateAudience(value as TargetAudience).then(result => {
        setAudienceEstimate(result?.count || null);
      });
    }
  }, [estimateAudience]);
  
  // Handle create campaign
  const handleCreateCampaign = useCallback(async () => {
    if (!formData.name || !formData.subject || !formData.content) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    const result = await createCampaign(formData);
    if (result) {
      toast.success("Campaign created successfully");
      setShowCreateModal(false);
      setFormData({
        name: "",
        subject: "",
        preheader: "",
        content: "",
        type: "newsletter",
        targetAudience: "all",
        tags: [],
      });
      refetchCampaigns();
    } else {
      toast.error("Failed to create campaign");
    }
  }, [formData, createCampaign, refetchCampaigns]);
  
  // Handle update campaign
  const handleUpdateCampaign = useCallback(async () => {
    if (!selectedCampaign) return;
    
    const payload: UpdateCampaignPayload = {
      name: formData.name,
      subject: formData.subject,
      preheader: formData.preheader,
      content: formData.content,
      type: formData.type,
      targetAudience: formData.targetAudience,
      tags: formData.tags,
    };
    
    const result = await updateCampaign(selectedCampaign._id || selectedCampaign.id || "", payload);
    if (result) {
      toast.success("Campaign updated successfully");
      setShowEditModal(false);
      setSelectedCampaign(null);
      refetchCampaigns();
    } else {
      toast.error("Failed to update campaign");
    }
  }, [selectedCampaign, formData, updateCampaign, refetchCampaigns]);
  
  // Handle delete campaign
  const handleDeleteCampaign = useCallback(async () => {
    if (!selectedCampaign) return;
    
    const result = await deleteCampaign(selectedCampaign._id || selectedCampaign.id || "");
    if (result) {
      toast.success("Campaign deleted successfully");
      setShowDeleteModal(false);
      setSelectedCampaign(null);
      refetchCampaigns();
    } else {
      toast.error("Failed to delete campaign");
    }
  }, [selectedCampaign, deleteCampaign, refetchCampaigns]);
  
  // Handle duplicate campaign
  const handleDuplicateCampaign = useCallback(async (campaign: EmailCampaign) => {
    const result = await duplicateCampaign(campaign._id || campaign.id || "");
    if (result) {
      toast.success("Campaign duplicated successfully");
      refetchCampaigns();
    } else {
      toast.error("Failed to duplicate campaign");
    }
    setActionMenuOpen(null);
  }, [duplicateCampaign, refetchCampaigns]);
  
  // Handle campaign actions
  const handleSendCampaign = useCallback(async (campaign: EmailCampaign) => {
    const result = await sendCampaign(campaign._id || campaign.id || "");
    if (result) {
      toast.success("Campaign sent successfully");
      refetchCampaigns();
    } else {
      toast.error("Failed to send campaign");
    }
    setActionMenuOpen(null);
  }, [sendCampaign, refetchCampaigns]);
  
  const handlePauseCampaign = useCallback(async (campaign: EmailCampaign) => {
    const result = await pauseCampaign(campaign._id || campaign.id || "");
    if (result) {
      toast.success("Campaign paused");
      refetchCampaigns();
    } else {
      toast.error("Failed to pause campaign");
    }
    setActionMenuOpen(null);
  }, [pauseCampaign, refetchCampaigns]);
  
  const handleResumeCampaign = useCallback(async (campaign: EmailCampaign) => {
    const result = await resumeCampaign(campaign._id || campaign.id || "");
    if (result) {
      toast.success("Campaign resumed");
      refetchCampaigns();
    } else {
      toast.error("Failed to resume campaign");
    }
    setActionMenuOpen(null);
  }, [resumeCampaign, refetchCampaigns]);
  
  const handleCancelCampaign = useCallback(async (campaign: EmailCampaign) => {
    const result = await cancelCampaign(campaign._id || campaign.id || "");
    if (result) {
      toast.success("Campaign cancelled");
      refetchCampaigns();
    } else {
      toast.error("Failed to cancel campaign");
    }
    setActionMenuOpen(null);
  }, [cancelCampaign, refetchCampaigns]);
  
  // Handle test email
  const handleSendTestEmail = useCallback(async () => {
    if (!selectedCampaign || !testEmails.trim()) {
      toast.error("Please enter test email addresses");
      return;
    }
    
    const emails = testEmails.split(",").map(e => e.trim()).filter(Boolean);
    const result = await sendTestEmail(selectedCampaign._id || selectedCampaign.id || "", { emails });
    if (result) {
      toast.success("Test email sent successfully");
      setShowTestEmailModal(false);
      setTestEmails("");
      setSelectedCampaign(null);
    } else {
      toast.error("Failed to send test email");
    }
  }, [selectedCampaign, testEmails, sendTestEmail]);
  
  // Handle delete subscriber
  const handleDeleteSubscriber = useCallback(async (subscriber: Subscriber) => {
    const result = await deleteSubscriber(subscriber._id || subscriber.id || "");
    if (result) {
      toast.success("Subscriber deleted successfully");
      refetchSubscribers();
    } else {
      toast.error("Failed to delete subscriber");
    }
  }, [deleteSubscriber, refetchSubscribers]);
  
  // Handle export subscribers
  const handleExportSubscribers = useCallback(async () => {
    const blob = await exportSubscribers(subscriberFilters);
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `subscribers-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Subscribers exported successfully");
    } else {
      toast.error("Failed to export subscribers");
    }
  }, [exportSubscribers, subscriberFilters]);
  
  // Open edit modal
  const openEditModal = useCallback((campaign: EmailCampaign) => {
    setSelectedCampaign(campaign);
    setFormData({
      name: campaign.name,
      subject: campaign.subject,
      preheader: campaign.preheader || "",
      content: campaign.content,
      type: campaign.type,
      targetAudience: campaign.targetAudience,
      tags: campaign.tags || [],
    });
    setShowEditModal(true);
    setActionMenuOpen(null);
  }, []);
  
  // Open delete modal
  const openDeleteModal = useCallback((campaign: EmailCampaign) => {
    setSelectedCampaign(campaign);
    setShowDeleteModal(true);
    setActionMenuOpen(null);
  }, []);
  
  // Open test email modal
  const openTestEmailModal = useCallback((campaign: EmailCampaign) => {
    setSelectedCampaign(campaign);
    setShowTestEmailModal(true);
    setActionMenuOpen(null);
  }, []);
  
  // Refresh all data
  const refreshData = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchCampaigns(),
        refetchSubscribers(),
        refetchStats(),
        refetchAnalytics(),
      ]);
      setLastUpdated(new Date());
      toast.success("Data refreshed");
    } catch {
      toast.error("Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  }, [refetchCampaigns, refetchSubscribers, refetchStats, refetchAnalytics]);
  
  // Format date
  const formatDate = useCallback((date: Date | string | undefined) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  // Tabs configuration
  const tabs = useMemo(() => [
    { id: "campaigns" as TabType, label: "Campaigns", count: campaignsPagination?.totalItems },
    { id: "subscribers" as TabType, label: "Subscribers", count: subscribersPagination?.totalItems },
    { id: "analytics" as TabType, label: "Analytics" },
  ], [campaignsPagination?.totalItems, subscribersPagination?.totalItems]);

  // Loading state
  if (campaignsLoading && campaigns.length === 0 && activeTab === "campaigns") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="xl" text="Loading email marketing..." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Marketing</h1>
          <p className="text-gray-600 text-sm">Manage campaigns and subscribers</p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center space-x-2">
          <p className="text-xs text-gray-500">
            Updated: {lastUpdated.toLocaleTimeString()}
          </p>
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {activeTab === "campaigns" && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-3 py-1 bg-primary text-white text-xs font-medium rounded hover:bg-primary/90"
            >
              <Plus className="w-3 h-3 mr-1" />
              Create Campaign
            </button>
          )}
          {activeTab === "subscribers" && (
            <button
              onClick={handleExportSubscribers}
              disabled={subscriberCrudLoading}
              className="inline-flex items-center px-3 py-1 bg-accent text-white text-xs font-medium rounded hover:bg-accent/90 disabled:opacity-50"
            >
              <Download className="w-3 h-3 mr-1" />
              Export
            </button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      {(activeTab === "campaigns" || activeTab === "analytics") && analytics && !analyticsLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-primary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total Sent</p>
                <p className="text-xl font-bold text-gray-900">{analytics.totalSent?.toLocaleString() || 0}</p>
                <p className="text-xs text-gray-500">{analytics.averageOpenRate?.toFixed(1) || 0}% open rate</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Send className="w-5 h-5 text-primary" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-accent">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Opens</p>
                <p className="text-xl font-bold text-gray-900">{analytics.totalOpened?.toLocaleString() || 0}</p>
                <p className="text-xs text-gray-500">{analytics.averageClickRate?.toFixed(1) || 0}% click rate</p>
              </div>
              <div className="p-2 bg-accent/10 rounded-lg">
                <MailOpen className="w-5 h-5 text-accent" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Clicks</p>
                <p className="text-xl font-bold text-gray-900">{analytics.totalClicked?.toLocaleString() || 0}</p>
                <p className="text-xs text-gray-500">{analytics.totalCampaigns || 0} campaigns</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <MousePointerClick className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Unsubscribed</p>
                <p className="text-xl font-bold text-gray-900">{analytics.totalUnsubscribed?.toLocaleString() || 0}</p>
                <p className="text-xs text-gray-500">{analytics.averageUnsubscribeRate?.toFixed(2) || 0}% rate</p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <UserX className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === "subscribers" && subscriberStats && !statsLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-primary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-xl font-bold text-gray-900">{subscriberStats.total?.toLocaleString() || 0}</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="w-5 h-5 text-primary" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-accent">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Confirmed</p>
                <p className="text-xl font-bold text-accent">{subscriberStats.confirmed?.toLocaleString() || 0}</p>
              </div>
              <div className="p-2 bg-accent/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-accent" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Pending</p>
                <p className="text-xl font-bold text-yellow-600">{subscriberStats.pending?.toLocaleString() || 0}</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Unsubscribed</p>
                <p className="text-xl font-bold text-red-600">{subscriberStats.unsubscribed?.toLocaleString() || 0}</p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <UserX className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                    activeTab === tab.id ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-600"
                  }`}>
                    {tab.count ? tab.count.toLocaleString() : 0}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Filters */}
        {(activeTab === "campaigns" || activeTab === "subscribers") && (
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">Filters & Search</h3>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
              >
                <Filter className="w-3 h-3 mr-1" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </button>
            </div>
          </div>
        )}

        {showFilters && (activeTab === "campaigns" || activeTab === "subscribers") && (
          <div className="p-4 border-b border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>
              
              {activeTab === "campaigns" && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={campaignFilters.status || ""}
                      onChange={(e) => handleCampaignFilterChange("status", e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="">All Statuses</option>
                      <option value="draft">Draft</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="sending">Sending</option>
                      <option value="paused">Paused</option>
                      <option value="sent">Sent</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={campaignFilters.type || ""}
                      onChange={(e) => handleCampaignFilterChange("type", e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="">All Types</option>
                      {Object.entries(campaignTypeLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Audience</label>
                    <select
                      value={campaignFilters.targetAudience || ""}
                      onChange={(e) => handleCampaignFilterChange("targetAudience", e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="">All Audiences</option>
                      {Object.entries(audienceLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              
              {activeTab === "subscribers" && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={subscriberFilters.status || ""}
                      onChange={(e) => handleSubscriberFilterChange("status", e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="unsubscribed">Unsubscribed</option>
                      <option value="bounced">Bounced</option>
                      <option value="complained">Complained</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Source</label>
                    <input
                      type="text"
                      placeholder="Filter by source"
                      value={subscriberFilters.source || ""}
                      onChange={(e) => handleSubscriberFilterChange("source", e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Campaigns Tab Content */}
        {activeTab === "campaigns" && (
          <div>
            {campaignsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loading size="lg" text="Loading campaigns..." />
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
                <p className="text-gray-500 mb-4">Create your first email campaign to get started.</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Campaign
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Campaign</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Audience</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Performance</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Created</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {campaigns.map((campaign) => (
                        <tr key={campaign._id || campaign.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{campaign.name}</p>
                              <p className="text-xs text-gray-500 truncate max-w-xs">{campaign.subject}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${statusColors[campaign.status]}`}>
                              {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-600">{campaignTypeLabels[campaign.type]}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-600">{audienceLabels[campaign.targetAudience]}</span>
                          </td>
                          <td className="px-4 py-3">
                            {campaign.analytics ? (
                              <div className="flex items-center space-x-3 text-xs">
                                <span className="text-accent">
                                  <MailOpen className="w-3 h-3 inline mr-1" />
                                  {campaign.analytics.openRate.toFixed(1)}%
                                </span>
                                <span className="text-primary">
                                  <MousePointerClick className="w-3 h-3 inline mr-1" />
                                  {campaign.analytics.clickRate.toFixed(1)}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-500">{formatDate(campaign.createdAt)}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="relative inline-block text-left">
                              <button
                                onClick={() => setActionMenuOpen(actionMenuOpen === (campaign._id || campaign.id) ? null : (campaign._id || campaign.id || ""))}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                <MoreVertical className="w-4 h-4 text-gray-500" />
                              </button>
                              
                              {actionMenuOpen === (campaign._id || campaign.id) && (
                                <div className="absolute right-0 mt-2 w-40 bg-white rounded shadow-lg border border-gray-200 py-1 z-50">
                                  {campaign.status === "draft" && (
                                    <>
                                      <button
                                        onClick={() => openEditModal(campaign)}
                                        className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center"
                                      >
                                        <Edit className="w-3 h-3 mr-2" />
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => openTestEmailModal(campaign)}
                                        className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center"
                                      >
                                        <Send className="w-3 h-3 mr-2" />
                                        Send Test
                                      </button>
                                      <button
                                        onClick={() => handleSendCampaign(campaign)}
                                        className="w-full text-left px-3 py-1.5 text-xs text-accent hover:bg-accent/5 flex items-center"
                                      >
                                        <Play className="w-3 h-3 mr-2" />
                                        Send Now
                                      </button>
                                    </>
                                  )}
                                  {campaign.status === "sending" && (
                                    <button
                                      onClick={() => handlePauseCampaign(campaign)}
                                      className="w-full text-left px-3 py-1.5 text-xs text-yellow-700 hover:bg-yellow-50 flex items-center"
                                    >
                                      <Pause className="w-3 h-3 mr-2" />
                                      Pause
                                    </button>
                                  )}
                                  {campaign.status === "paused" && (
                                    <>
                                      <button
                                        onClick={() => handleResumeCampaign(campaign)}
                                        className="w-full text-left px-3 py-1.5 text-xs text-accent hover:bg-accent/5 flex items-center"
                                      >
                                        <Play className="w-3 h-3 mr-2" />
                                        Resume
                                      </button>
                                      <button
                                        onClick={() => handleCancelCampaign(campaign)}
                                        className="w-full text-left px-3 py-1.5 text-xs text-red-700 hover:bg-red-50 flex items-center"
                                      >
                                        <XCircle className="w-3 h-3 mr-2" />
                                        Cancel
                                      </button>
                                    </>
                                  )}
                                  <button
                                    onClick={() => handleDuplicateCampaign(campaign)}
                                    className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center"
                                  >
                                    <Copy className="w-3 h-3 mr-2" />
                                    Duplicate
                                  </button>
                                  {(campaign.status === "draft" || campaign.status === "cancelled") && (
                                    <button
                                      onClick={() => openDeleteModal(campaign)}
                                      className="w-full text-left px-3 py-1.5 text-xs text-red-700 hover:bg-red-50 flex items-center"
                                    >
                                      <Trash2 className="w-3 h-3 mr-2" />
                                      Delete
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                {campaignsPagination && campaignsPagination.totalPages && campaignsPagination.totalPages > 1 && (
                  <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      Showing {((campaignsPagination.currentPage || 1) - 1) * (campaignFilters.limit || 20) + 1} to{" "}
                      {Math.min((campaignsPagination.currentPage || 1) * (campaignFilters.limit || 20), campaignsPagination.totalItems || 0)} of{" "}
                      {campaignsPagination.totalItems} campaigns
                    </p>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleCampaignPageChange((campaignsPagination.currentPage || 1) - 1)}
                        disabled={!campaignsPagination.hasPrev}
                        className="p-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs text-gray-600">
                        Page {campaignsPagination.currentPage} of {campaignsPagination.totalPages}
                      </span>
                      <button
                        onClick={() => handleCampaignPageChange((campaignsPagination.currentPage || 1) + 1)}
                        disabled={!campaignsPagination.hasNext}
                        className="p-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        
        {/* Subscribers Tab Content */}
        {activeTab === "subscribers" && (
          <div>
            {subscribersLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loading size="lg" text="Loading subscribers..." />
              </div>
            ) : subscribers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No subscribers yet</h3>
                <p className="text-gray-500">Subscribers will appear here when users sign up for your newsletter.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Subscriber</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Source</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Engagement</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Subscribed</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {subscribers.map((subscriber) => (
                        <tr key={subscriber._id || subscriber.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {subscriber.fullName || `${subscriber.firstName || ""} ${subscriber.lastName || ""}`.trim() || "—"}
                              </p>
                              <p className="text-xs text-gray-500">{subscriber.email}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${subscriberStatusColors[subscriber.status]}`}>
                              {subscriber.status.charAt(0).toUpperCase() + subscriber.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-600">{subscriber.source || "—"}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-3 text-xs text-gray-500">
                              <span>{subscriber.emailsReceived || 0} received</span>
                              <span>{subscriber.emailsOpened || 0} opened</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-500">{formatDate(subscriber.createdAt)}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleDeleteSubscriber(subscriber)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Delete subscriber"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                {subscribersPagination && subscribersPagination.totalPages && subscribersPagination.totalPages > 1 && (
                  <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      Showing {((subscribersPagination.currentPage || 1) - 1) * (subscriberFilters.limit || 20) + 1} to{" "}
                      {Math.min((subscribersPagination.currentPage || 1) * (subscriberFilters.limit || 20), subscribersPagination.totalItems || 0)} of{" "}
                      {subscribersPagination.totalItems} subscribers
                    </p>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleSubscriberPageChange((subscribersPagination.currentPage || 1) - 1)}
                        disabled={!subscribersPagination.hasPrev}
                        className="p-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs text-gray-600">
                        Page {subscribersPagination.currentPage} of {subscribersPagination.totalPages}
                      </span>
                      <button
                        onClick={() => handleSubscriberPageChange((subscribersPagination.currentPage || 1) + 1)}
                        disabled={!subscribersPagination.hasNext}
                        className="p-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        
        {/* Analytics Tab Content */}
        {activeTab === "analytics" && (
          <div className="p-4 space-y-4">
            {/* Top Campaigns */}
            <div className="bg-white rounded shadow">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900">Top Performing Campaigns</h3>
              </div>
              {topCampaignsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loading size="md" />
                </div>
              ) : topCampaigns.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No campaign data available yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Campaign</th>
                        <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Sent</th>
                        <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Recipients</th>
                        <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Open Rate</th>
                        <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Click Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {topCampaigns.map((campaign, idx) => (
                        <tr key={campaign._id} className="hover:bg-gray-50">
                          <td className="px-4 py-2">
                            <div className="flex items-center space-x-2">
                              <span className="w-5 h-5 flex items-center justify-center bg-primary/10 text-primary text-xs font-bold rounded-full">
                                {idx + 1}
                              </span>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{campaign.name}</p>
                                <p className="text-xs text-gray-500 truncate max-w-xs">{campaign.subject}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm text-gray-600">{campaignTypeLabels[campaign.type]}</span>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm text-gray-500">{formatDate(campaign.sentAt)}</span>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm text-gray-600">{campaign.totalRecipients.toLocaleString()}</span>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center">
                              <div className="w-12 h-1.5 bg-gray-200 rounded-full mr-2">
                                <div
                                  className="h-full bg-accent rounded-full"
                                  style={{ width: `${Math.min(campaign.openRate, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-accent">{campaign.openRate.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center">
                              <div className="w-12 h-1.5 bg-gray-200 rounded-full mr-2">
                                <div
                                  className="h-full bg-primary rounded-full"
                                  style={{ width: `${Math.min(campaign.clickRate, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-primary">{campaign.clickRate.toFixed(1)}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            {/* Daily Stats */}
            <div className="bg-white rounded shadow">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900">Daily Email Statistics (Last 7 Days)</h3>
              </div>
              {dailyStatsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loading size="md" />
                </div>
              ) : dailyStats.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No daily statistics available yet</p>
                </div>
              ) : (
                <div className="p-4">
                  <div className="grid grid-cols-7 gap-2">
                    {dailyStats.slice(-7).map((stat) => {
                      const maxSent = Math.max(...dailyStats.slice(-7).map(s => s.sent));
                      const height = maxSent > 0 ? (stat.sent / maxSent) * 100 : 0;
                      return (
                        <div key={stat.date} className="flex flex-col items-center">
                          <div className="w-full h-24 flex items-end justify-center mb-1">
                            <div
                              className="w-6 bg-primary rounded-t"
                              style={{ height: `${Math.max(height, 5)}%` }}
                              title={`${stat.sent} sent`}
                            />
                          </div>
                          <p className="text-xs text-gray-600 font-medium">{stat.sent}</p>
                          <p className="text-xs text-gray-400">{new Date(stat.date).toLocaleDateString("en-US", { weekday: "short" })}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Create Campaign Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Campaign"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleFormChange("name", e.target.value)}
              placeholder="e.g., Monthly Newsletter - January 2025"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Subject *</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => handleFormChange("subject", e.target.value)}
              placeholder="e.g., Your January Newsletter is Here!"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preheader (Preview Text)</label>
            <input
              type="text"
              value={formData.preheader}
              onChange={(e) => handleFormChange("preheader", e.target.value)}
              placeholder="e.g., Discover what's new this month..."
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Type</label>
              <select
                value={formData.type}
                onChange={(e) => handleFormChange("type", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {Object.entries(campaignTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
              <select
                value={formData.targetAudience}
                onChange={(e) => handleFormChange("targetAudience", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {Object.entries(audienceLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              {audienceEstimate !== null && (
                <p className="text-xs text-gray-500 mt-1">
                  <Target className="w-3 h-3 inline mr-1" />
                  Estimated recipients: {audienceEstimate.toLocaleString()}
                </p>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Content *</label>
            <textarea
              value={formData.content}
              onChange={(e) => handleFormChange("content", e.target.value)}
              placeholder="Write your email content here..."
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={formData.tags?.join(", ") || ""}
              onChange={(e) => handleFormChange("tags", e.target.value.split(",").map(t => t.trim()).filter(Boolean))}
              placeholder="e.g., newsletter, monthly, updates"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          
          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateCampaign}
              disabled={crudLoading || !formData.name || !formData.subject || !formData.content}
              className="px-4 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {crudLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Campaign
            </button>
          </div>
        </div>
      </Modal>
      
      {/* Edit Campaign Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCampaign(null);
        }}
        title="Edit Campaign"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleFormChange("name", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Subject *</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => handleFormChange("subject", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preheader</label>
            <input
              type="text"
              value={formData.preheader}
              onChange={(e) => handleFormChange("preheader", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Type</label>
              <select
                value={formData.type}
                onChange={(e) => handleFormChange("type", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {Object.entries(campaignTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
              <select
                value={formData.targetAudience}
                onChange={(e) => handleFormChange("targetAudience", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {Object.entries(audienceLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Content *</label>
            <textarea
              value={formData.content}
              onChange={(e) => handleFormChange("content", e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <input
              type="text"
              value={formData.tags?.join(", ") || ""}
              onChange={(e) => handleFormChange("tags", e.target.value.split(",").map(t => t.trim()).filter(Boolean))}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          
          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <button
              onClick={() => {
                setShowEditModal(false);
                setSelectedCampaign(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateCampaign}
              disabled={crudLoading || !formData.name || !formData.subject || !formData.content}
              className="px-4 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {crudLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedCampaign(null);
        }}
        title="Delete Campaign"
        size="sm"
      >
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete &quot;{selectedCampaign?.name}&quot;? This action cannot be undone.
          </p>
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedCampaign(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteCampaign}
              disabled={crudLoading}
              className="px-4 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {crudLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </button>
          </div>
        </div>
      </Modal>
      
      {/* Test Email Modal */}
      <Modal
        isOpen={showTestEmailModal}
        onClose={() => {
          setShowTestEmailModal(false);
          setSelectedCampaign(null);
          setTestEmails("");
        }}
        title="Send Test Email"
        size="sm"
      >
        <div>
          <p className="text-sm text-gray-500 mb-4">
            Send a test email of &quot;{selectedCampaign?.name}&quot; to preview how it will look.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Addresses</label>
            <input
              type="text"
              value={testEmails}
              onChange={(e) => setTestEmails(e.target.value)}
              placeholder="email1@example.com, email2@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <p className="text-xs text-gray-400 mt-1">Separate multiple emails with commas</p>
          </div>
          <div className="flex items-center justify-end space-x-3 mt-6">
            <button
              onClick={() => {
                setShowTestEmailModal(false);
                setSelectedCampaign(null);
                setTestEmails("");
              }}
              className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSendTestEmail}
              disabled={actionLoading || !testEmails.trim()}
              className="px-4 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Send Test
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
