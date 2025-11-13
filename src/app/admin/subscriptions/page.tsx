"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { AdminErrorState } from "@/components/admin/admin-error-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { useToast, ToastContainer } from "@/components/ui/toast";
import { useAdminSubscriptions } from "@/hooks/useAdminSubscriptions";
import { useSubscriptionPlans } from "@/hooks/useSubscriptions";
import { UserSubscription } from "@/types/subscriptions";
import { DatePicker } from "@/components/ui/date-picker";
import { Textarea } from "@/components/ui/textarea";
import { Pagination } from "@/components/shared/pagination";

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

  // Helper function to convert filters for API call
  const convertFilters = useCallback((f: typeof filters) => ({
    ...f,
    isManual: f.isManual === "" ? undefined : f.isManual === "true",
  }), []);

  useEffect(() => {
    fetchSubscriptions(convertFilters(filters));
  }, [filters, fetchSubscriptions, convertFilters]);

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
      setShowCreateModal(false);
      setCreateForm({
        userId: "",
        planId: "",
        billingCycle: "monthly",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        reason: "",
        notes: "",
      });
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
        onClose={() => setShowCreateModal(false)}
        title="Create Manual Subscription"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? "Creating..." : "Create Subscription"}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1">User ID *</label>
            <Input
              value={createForm.userId}
              onChange={(e) => setCreateForm({ ...createForm, userId: e.target.value })}
              placeholder="Enter user ID"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Plan *</label>
            <Select
              value={createForm.planId}
              onValueChange={(value) => setCreateForm({ ...createForm, planId: value })}
              options={[
                { value: "", label: "Select a plan" },
                ...(plans.map((plan) => ({
                  value: plan._id || "",
                  label: plan.name,
                }))),
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Billing Cycle</label>
              <Select
                value={createForm.billingCycle}
                onValueChange={(value) =>
                  setCreateForm({
                    ...createForm,
                    billingCycle: value as "monthly" | "yearly",
                  })
                }
                options={[
                  { value: "monthly", label: "Monthly" },
                  { value: "yearly", label: "Yearly" },
                ]}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Start Date</label>
              <DatePicker
                value={createForm.startDate}
                onChange={(date) => date && setCreateForm({ ...createForm, startDate: date })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">End Date</label>
              <DatePicker
                value={createForm.endDate}
                onChange={(date) => date && setCreateForm({ ...createForm, endDate: date })}
                minDate={createForm.startDate}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Reason</label>
            <Input
              value={createForm.reason}
              onChange={(e) => setCreateForm({ ...createForm, reason: e.target.value })}
              placeholder="e.g., Free trial for new user"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Notes</label>
            <Textarea
              value={createForm.notes}
              onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
              placeholder="Additional admin notes"
              rows={3}
            />
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
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={loading}>
              {loading ? "Updating..." : "Update Subscription"}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1">Plan</label>
            <Select
              value={editForm.planId}
              onValueChange={(value) => setEditForm({ ...editForm, planId: value })}
              options={[
                { value: "", label: "Keep current plan" },
                ...(plans.map((plan) => ({
                  value: plan._id || "",
                  label: plan.name,
                }))),
              ]}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Status</label>
            <Select
              value={editForm.status}
              onValueChange={(value) =>
                setEditForm({
                  ...editForm,
                  status: value as UserSubscription["status"],
                })
              }
              options={[
                { value: "active", label: "Active" },
                { value: "cancelled", label: "Cancelled" },
                { value: "expired", label: "Expired" },
                { value: "suspended", label: "Suspended" },
                { value: "pending", label: "Pending" },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Billing Cycle</label>
              <Select
                value={editForm.billingCycle}
                onValueChange={(value) =>
                  setEditForm({
                    ...editForm,
                    billingCycle: value as "monthly" | "yearly",
                  })
                }
                options={[
                  { value: "monthly", label: "Monthly" },
                  { value: "yearly", label: "Yearly" },
                ]}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Start Date</label>
              <DatePicker
                value={editForm.startDate}
                onChange={(date) => date && setEditForm({ ...editForm, startDate: date })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">End Date</label>
              <DatePicker
                value={editForm.endDate}
                onChange={(date) => date && setEditForm({ ...editForm, endDate: date })}
                minDate={editForm.startDate}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Reason</label>
            <Input
              value={editForm.reason}
              onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
              placeholder="e.g., Plan upgrade"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Notes</label>
            <Textarea
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              placeholder="Additional admin notes"
              rows={3}
            />
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
            <Button variant="outline" onClick={() => setShowViewModal(false)}>
              Close
            </Button>
          </div>
        }
      >
        {selectedSubscription && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-gray-600">User</p>
                <p className="font-semibold">
                  {typeof selectedSubscription.user === "object"
                    ? `${selectedSubscription.user.firstName || ""} ${selectedSubscription.user.lastName || ""}`.trim() ||
                      selectedSubscription.user.email
                    : selectedSubscription.user}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Plan</p>
                <p className="font-semibold">
                  {typeof selectedSubscription.plan === "object"
                    ? selectedSubscription.plan.name
                    : selectedSubscription.plan}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    selectedSubscription.status
                  )}`}
                >
                  {getStatusIcon(selectedSubscription.status)}
                  {selectedSubscription.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Billing Cycle</p>
                <p className="font-semibold">{selectedSubscription.billingCycle || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Start Date</p>
                <p className="font-semibold">
                  {selectedSubscription.startDate
                    ? new Date(selectedSubscription.startDate).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">End Date</p>
                <p className="font-semibold">
                  {selectedSubscription.endDate
                    ? new Date(selectedSubscription.endDate).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
            {selectedSubscription.manualDetails && (
              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2">Manual Details</h3>
                {selectedSubscription.manualDetails.reason && (
                  <div className="mb-2">
                    <p className="text-sm text-gray-600">Reason</p>
                    <p className="font-semibold">{selectedSubscription.manualDetails.reason}</p>
                  </div>
                )}
                {selectedSubscription.manualDetails.notes && (
                  <div>
                    <p className="text-sm text-gray-600">Notes</p>
                    <p className="font-semibold">{selectedSubscription.manualDetails.notes}</p>
                  </div>
                )}
              </div>
            )}
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
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCancelModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCancel}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? "Cancelling..." : "Confirm Cancellation"}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-gray-600">
            Are you sure you want to cancel this manual subscription? This action cannot be undone.
          </p>
          <div>
            <label className="block text-xs font-medium mb-1">Cancellation Reason</label>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Enter reason for cancellation"
              rows={3}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

