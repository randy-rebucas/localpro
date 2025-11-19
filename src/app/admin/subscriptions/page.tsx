"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  X,
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { AdminErrorState } from "@/components/admin/admin-error-state";
import { Modal } from "@/components/ui/modal";
import { useToast, ToastContainer } from "@/components/ui/toast";
import { useAdminSubscriptions } from "@/hooks/useAdminSubscriptions";
import { useSubscriptionPlans } from "@/hooks/useSubscriptions";
import { UserSubscription } from "@/types/subscriptions";
import { Pagination } from "@/components/shared/pagination";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";

export default function AdminSubscriptionsPage() {
  const {
    subscriptions,
    loading,
    error,
    pagination,
    fetchSubscriptions,
    createManualSubscription,
    updateManualSubscription,
    cancelManualSubscription,
  } = useAdminSubscriptions();

  const { plans } = useSubscriptionPlans();
  const { toasts, success, error: showError, removeToast } = useToast();

  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: "",
    planId: "",
    isManual: "",
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<UserSubscription | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [createForm, setCreateForm] = useState({
    userId: "",
    planId: "",
    billingCycle: "monthly" as "monthly" | "yearly",
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    reason: "",
    notes: "",
  });

  const [editForm, setEditForm] = useState({
    planId: "",
    status: "active" as UserSubscription["status"],
    startDate: new Date(),
    endDate: new Date(),
    billingCycle: "monthly" as "monthly" | "yearly",
    reason: "",
    notes: "",
  });

  const [cancelReason, setCancelReason] = useState("");

  // User autosuggest state
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userSuggestions, setUserSuggestions] = useState<Array<{ _id: string; firstName: string; lastName: string; email: string }>>([]);
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ _id: string; firstName: string; lastName: string; email: string } | null>(null);
  const userAutosuggestRef = useRef<HTMLDivElement>(null);

  // Helper function to convert filters for API call
  const convertFilters = useCallback((f: typeof filters) => ({
    ...f,
    isManual: f.isManual === "" ? undefined : f.isManual === "true",
  }), []);

  useEffect(() => {
    fetchSubscriptions(convertFilters(filters));
  }, [filters, fetchSubscriptions, convertFilters]);

  // Fetch users for autosuggest
  const fetchUsers = useCallback(async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setUserSuggestions([]);
      setShowUserSuggestions(false);
      return;
    }

    try {
      setLoadingUsers(true);
      setShowUserSuggestions(true); // Show dropdown while loading
      if (!getApiToken()) {
        setLoadingUsers(false);
        return;
      }

      const queryParams = new URLSearchParams();
      queryParams.append('search', searchTerm);
      queryParams.append('limit', '10');

      const url = `${API_BASE_URL}${API_ENDPOINTS.users}?${queryParams.toString()}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));

      if (response.ok) {
        const result = await response.json();
        // Handle different response structures
        let users = [];
        if (result.data) {
          if (Array.isArray(result.data)) {
            users = result.data;
          } else if (result.data.users && Array.isArray(result.data.users)) {
            users = result.data.users;
          }
        } else if (result.users && Array.isArray(result.users)) {
          users = result.users;
        } else if (Array.isArray(result)) {
          users = result;
        }
        
        // Transform users to suggestions format
        const suggestions = users
          .filter((user: any) => user._id && (user.firstName || user.lastName || user.email))
          .map((user: any) => ({
            _id: user._id || user.id,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || ''
          }));
        
        setUserSuggestions(suggestions);
        setShowUserSuggestions(suggestions.length > 0 || searchTerm.length >= 2);
      } else {
        setUserSuggestions([]);
        setShowUserSuggestions(false);
      }
    } catch (err) {
      // Silently fail - don't show error for autosuggest
      setUserSuggestions([]);
      setShowUserSuggestions(false);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  // Debounced user search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (userSearchTerm && userSearchTerm.length >= 2) {
        fetchUsers(userSearchTerm);
      } else {
        setUserSuggestions([]);
        setShowUserSuggestions(false);
        setLoadingUsers(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [userSearchTerm, fetchUsers]);

  // Handle user selection
  const handleUserSelect = (user: { _id: string; firstName: string; lastName: string; email: string }) => {
    setSelectedUser(user);
    setCreateForm({ ...createForm, userId: user._id });
    setUserSearchTerm(`${user.firstName} ${user.lastName}`.trim() || user.email);
    setShowUserSuggestions(false);
  };

  // Clear user selection
  const handleUserClear = () => {
    setSelectedUser(null);
    setCreateForm({ ...createForm, userId: '' });
    setUserSearchTerm('');
    setShowUserSuggestions(false);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userAutosuggestRef.current && !userAutosuggestRef.current.contains(event.target as Node)) {
        setShowUserSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle closing create modal
  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    // Reset user autosuggest state
    setSelectedUser(null);
    setUserSearchTerm('');
    setUserSuggestions([]);
    setShowUserSuggestions(false);
    setCreateForm({
      userId: "",
      planId: "",
      billingCycle: "monthly",
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      reason: "",
      notes: "",
    });
  };

  const handleCreate = async () => {
    try {
      if (!createForm.userId || !createForm.planId) {
        showError("User ID and Plan ID are required");
        return;
      }

      const payload = {
        userId: createForm.userId,
        planId: createForm.planId,
        billingCycle: createForm.billingCycle,
        startDate: createForm.startDate.toISOString().split("T")[0],
        endDate: createForm.endDate.toISOString().split("T")[0],
        reason: createForm.reason || undefined,
        notes: createForm.notes || undefined,
      };

      await createManualSubscription(payload);
      success("Manual subscription created successfully");
      handleCloseCreateModal();
      fetchSubscriptions(convertFilters(filters));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      showError(errorMessage);
    }
  };

  const handleEdit = async () => {
    if (!selectedSubscription?._id) return;

    try {
      const payload: {
        planId?: string;
        status?: UserSubscription["status"];
        startDate?: string;
        endDate?: string;
        billingCycle?: "monthly" | "yearly";
        reason?: string;
        notes?: string;
      } = {};
      if (editForm.planId) payload.planId = editForm.planId;
      if (editForm.status) payload.status = editForm.status;
      if (editForm.startDate) payload.startDate = editForm.startDate.toISOString().split("T")[0];
      if (editForm.endDate) payload.endDate = editForm.endDate.toISOString().split("T")[0];
      if (editForm.billingCycle) payload.billingCycle = editForm.billingCycle;
      if (editForm.reason) payload.reason = editForm.reason;
      if (editForm.notes) payload.notes = editForm.notes;

      await updateManualSubscription(selectedSubscription._id, payload);
      success("Subscription updated successfully");
      setShowEditModal(false);
      setSelectedSubscription(null);
      fetchSubscriptions(convertFilters(filters));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      showError(errorMessage);
    }
  };

  const handleCancel = async () => {
    if (!selectedSubscription?._id) return;

    try {
      await cancelManualSubscription(selectedSubscription._id, cancelReason);
      success("Subscription cancelled successfully");
      setShowCancelModal(false);
      setSelectedSubscription(null);
      setCancelReason("");
      fetchSubscriptions(convertFilters(filters));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      showError(errorMessage);
    }
  };

  const openEditModal = (subscription: UserSubscription) => {
    setSelectedSubscription(subscription);
    setEditForm({
      planId: typeof subscription.plan === "string" ? subscription.plan : subscription.plan._id || "",
      status: subscription.status || "active",
      startDate: subscription.startDate ? new Date(subscription.startDate) : new Date(),
      endDate: subscription.endDate ? new Date(subscription.endDate) : new Date(),
      billingCycle: subscription.billingCycle || "monthly",
      reason: subscription.manualDetails?.reason || "",
      notes: subscription.manualDetails?.notes || "",
    });
    setShowEditModal(true);
  };

  const openViewModal = (subscription: UserSubscription) => {
    setSelectedSubscription(subscription);
    setShowViewModal(true);
  };

  const openCancelModal = (subscription: UserSubscription) => {
    setSelectedSubscription(subscription);
    setCancelReason("");
    setShowCancelModal(true);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "expired":
        return "bg-gray-100 text-gray-800";
      case "suspended":
        return "bg-yellow-100 text-yellow-800";
      case "pending":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="w-3 h-3" />;
      case "cancelled":
        return <XCircle className="w-3 h-3" />;
      case "expired":
        return <Clock className="w-3 h-3" />;
      case "suspended":
        return <AlertCircle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    if (!searchQuery) return true;
    const user = typeof sub.user === "object" ? sub.user : null;
    const searchLower = searchQuery.toLowerCase();
    return (
      (user?.email?.toLowerCase().includes(searchLower)) ||
      (user?.firstName?.toLowerCase().includes(searchLower)) ||
      (user?.lastName?.toLowerCase().includes(searchLower)) ||
      (sub._id?.toLowerCase().includes(searchLower))
    );
  });

  if (loading && subscriptions.length === 0) {
    return <Loading />;
  }

  if (error && subscriptions.length === 0) {
    return <AdminErrorState error={error} onRetry={() => fetchSubscriptions(convertFilters(filters))} />;
  }

  return (
    <div className="space-y-4">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manual Subscriptions</h1>
          <p className="text-gray-600 text-sm">Manage LocalPro Plus manual subscriptions</p>
        </div>
        <div className="mt-2 sm:mt-0">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
          >
            <Plus className="w-3 h-3 mr-1" />
            Create Manual Subscription
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded shadow">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900">Filters & Search</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by user email, name, or subscription ID..."
                  className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
                <option value="suspended">Suspended</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filters.isManual}
                onChange={(e) => setFilters({ ...filters, isManual: e.target.value, page: 1 })}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="true">Manual Only</option>
                <option value="false">Regular Only</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">&nbsp;</label>
              <button
                onClick={() => fetchSubscriptions(convertFilters(filters))}
                className="w-full inline-flex items-center justify-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900">Subscriptions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Billing Cycle
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Date
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-gray-500 text-xs">
                    No subscriptions found
                  </td>
                </tr>
              ) : (
                filteredSubscriptions.map((subscription) => {
                  const user = typeof subscription.user === "object" ? subscription.user : null;
                  const plan = typeof subscription.plan === "object" ? subscription.plan : null;
                  
                  return (
                    <tr key={subscription._id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-600" />
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-xs font-semibold text-gray-900">
                              {user?.firstName && user?.lastName
                                ? `${user.firstName} ${user.lastName}`
                                : user?.email || "Unknown User"}
                            </div>
                            <div className="text-xs text-gray-600">{user?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs font-medium text-gray-900">
                          {plan?.name || "Unknown Plan"}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            subscription.status
                          )}`}
                        >
                          {getStatusIcon(subscription.status)}
                          {subscription.status || "Unknown"}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                        {subscription.billingCycle || "N/A"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                        {subscription.startDate
                          ? new Date(subscription.startDate).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                        {subscription.endDate
                          ? new Date(subscription.endDate).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {subscription.isManual ? (
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            Manual
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                            Regular
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openViewModal(subscription)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                          {subscription.isManual && (
                            <>
                              <button
                                onClick={() => openEditModal(subscription)}
                                className="text-green-600 hover:text-green-900"
                                title="Edit"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => openCancelModal(subscription)}
                                className="text-red-600 hover:text-red-900"
                                title="Cancel"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-4 py-3 border-t">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              onPageChange={(page) => setFilters({ ...filters, page })}
            />
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={handleCloseCreateModal}
        title="Create Manual Subscription"
        size="lg"
        footer={
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={handleCloseCreateModal}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Subscription"}
            </button>
          </div>
        }
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto overscroll-contain scroll-smooth modal-content-scroll" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">User ID *</label>
              <div ref={userAutosuggestRef} className="relative">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                  <input
                    type="text"
                    value={userSearchTerm}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setUserSearchTerm(newValue);
                      if (newValue === '') {
                        handleUserClear();
                      } else if (selectedUser) {
                        // If user starts typing and it doesn't match the selected user, clear selection
                        const selectedName = `${selectedUser.firstName} ${selectedUser.lastName}`.trim();
                        const selectedEmail = selectedUser.email;
                        if (newValue !== selectedName && newValue !== selectedEmail && !newValue.startsWith(selectedName) && !newValue.startsWith(selectedEmail)) {
                          setSelectedUser(null);
                          setCreateForm({ ...createForm, userId: '' });
                        }
                      }
                    }}
                    onFocus={() => {
                      if (userSearchTerm && userSearchTerm.length >= 2) {
                        if (userSuggestions.length > 0) {
                          setShowUserSuggestions(true);
                        } else if (!loadingUsers) {
                          // Trigger search if we have a search term but no suggestions yet
                          fetchUsers(userSearchTerm);
                        }
                      }
                    }}
                    className="w-full pl-7 pr-7 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Search for user by name or email..."
                    required
                  />
                  {selectedUser && (
                    <button
                      type="button"
                      onClick={handleUserClear}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                
                {/* Suggestions Dropdown */}
                {showUserSuggestions && userSearchTerm.length >= 2 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {loadingUsers ? (
                      <div className="px-3 py-2 text-xs text-gray-500 text-center">
                        Searching...
                      </div>
                    ) : userSuggestions.length > 0 ? (
                      userSuggestions.map((user) => (
                        <div
                          key={user._id}
                          onClick={() => handleUserSelect(user)}
                          className="px-3 py-2 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-blue-50 transition-colors"
                        >
                          <div className="font-medium text-xs text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                          <div className="text-xs text-gray-400 mt-0.5">ID: {user._id}</div>
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-xs text-gray-500 text-center">
                        No users found
                      </div>
                    )}
                  </div>
                )}
                
                {selectedUser && (
                  <div className="mt-1.5 px-2 py-1.5 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="text-xs font-medium text-blue-900">
                      Selected: {selectedUser.firstName} {selectedUser.lastName}
                    </div>
                    <div className="text-xs text-blue-700">{selectedUser.email}</div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Plan *</label>
              <select
                value={createForm.planId}
                onChange={(e) => setCreateForm({ ...createForm, planId: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              >
                <option value="">Select a plan</option>
                {plans.map((plan) => (
                  <option key={plan._id} value={plan._id || ""}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Billing Cycle</label>
                <select
                  value={createForm.billingCycle}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      billingCycle: e.target.value as "monthly" | "yearly",
                    })
                  }
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Start Date</label>
                <input
                  type="date"
                  value={createForm.startDate.toISOString().split('T')[0]}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : new Date();
                    setCreateForm({ ...createForm, startDate: date });
                  }}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">End Date</label>
                <input
                  type="date"
                  value={createForm.endDate.toISOString().split('T')[0]}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : new Date();
                    setCreateForm({ ...createForm, endDate: date });
                  }}
                  min={createForm.startDate.toISOString().split('T')[0]}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Reason</label>
              <input
                type="text"
                value={createForm.reason}
                onChange={(e) => setCreateForm({ ...createForm, reason: e.target.value })}
                placeholder="e.g., Free trial for new user"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Notes</label>
              <textarea
                value={createForm.notes}
                onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                placeholder="Additional admin notes"
                rows={3}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Update Manual Subscription"
        size="lg"
        footer={
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleEdit}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Subscription"}
            </button>
          </div>
        }
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto overscroll-contain scroll-smooth modal-content-scroll" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Plan</label>
              <select
                value={editForm.planId}
                onChange={(e) => setEditForm({ ...editForm, planId: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Keep current plan</option>
                {plans.map((plan) => (
                  <option key={plan._id} value={plan._id || ""}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Status</label>
              <select
                value={editForm.status}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    status: e.target.value as UserSubscription["status"],
                  })
                }
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
                <option value="suspended">Suspended</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Billing Cycle</label>
                <select
                  value={editForm.billingCycle}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      billingCycle: e.target.value as "monthly" | "yearly",
                    })
                  }
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Start Date</label>
                <input
                  type="date"
                  value={editForm.startDate.toISOString().split('T')[0]}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : new Date();
                    setEditForm({ ...editForm, startDate: date });
                  }}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">End Date</label>
                <input
                  type="date"
                  value={editForm.endDate.toISOString().split('T')[0]}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : new Date();
                    setEditForm({ ...editForm, endDate: date });
                  }}
                  min={editForm.startDate.toISOString().split('T')[0]}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Reason</label>
              <input
                type="text"
                value={editForm.reason}
                onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                placeholder="e.g., Plan upgrade"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Notes</label>
              <textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Additional admin notes"
                rows={3}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Subscription Details"
        size="lg"
        footer={
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowViewModal(false)}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        }
      >
        {selectedSubscription && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto overscroll-contain scroll-smooth modal-content-scroll" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5">User</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {typeof selectedSubscription.user === "object"
                      ? `${selectedSubscription.user.firstName || ""} ${selectedSubscription.user.lastName || ""}`.trim() ||
                        selectedSubscription.user.email
                      : selectedSubscription.user}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5">Plan</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {typeof selectedSubscription.plan === "object"
                      ? selectedSubscription.plan.name
                      : selectedSubscription.plan}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5">Status</p>
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      selectedSubscription.status
                    )}`}
                  >
                    {getStatusIcon(selectedSubscription.status)}
                    {selectedSubscription.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5">Billing Cycle</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedSubscription.billingCycle || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5">Start Date</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedSubscription.startDate
                      ? new Date(selectedSubscription.startDate).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5">End Date</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedSubscription.endDate
                      ? new Date(selectedSubscription.endDate).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>
              {selectedSubscription.manualDetails && (
                <div className="pt-3 border-t border-gray-200">
                  <h3 className="text-xs font-semibold text-gray-700 mb-2">Manual Details</h3>
                  {selectedSubscription.manualDetails.reason && (
                    <div className="mb-2">
                      <p className="text-xs font-medium text-gray-500 mb-0.5">Reason</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedSubscription.manualDetails.reason}</p>
                    </div>
                  )}
                  {selectedSubscription.manualDetails.notes && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-0.5">Notes</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedSubscription.manualDetails.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Manual Subscription"
        size="md"
        footer={
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowCancelModal(false)}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? "Cancelling..." : "Confirm Cancellation"}
            </button>
          </div>
        }
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto overscroll-contain scroll-smooth modal-content-scroll" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Are you sure you want to cancel this manual subscription? This action cannot be undone.
            </p>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Cancellation Reason</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Enter reason for cancellation"
                rows={3}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

