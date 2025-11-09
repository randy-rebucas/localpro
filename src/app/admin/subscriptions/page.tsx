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
import { Card } from "@/components/ui/card";
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
        return <CheckCircle2 className="w-4 h-4" />;
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      case "expired":
        return <Clock className="w-4 h-4" />;
      case "suspended":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
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
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Manual Subscriptions</h1>
          <p className="text-gray-600">Manage LocalPro Plus manual subscriptions</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Manual Subscription
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by user email, name, or subscription ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value, page: 1 })}
              options={[
                { value: "", label: "All Statuses" },
                { value: "active", label: "Active" },
                { value: "cancelled", label: "Cancelled" },
                { value: "expired", label: "Expired" },
                { value: "suspended", label: "Suspended" },
                { value: "pending", label: "Pending" },
              ]}
            />
          </div>
          <div>
            <Select
              value={filters.isManual}
              onValueChange={(value) => setFilters({ ...filters, isManual: value, page: 1 })}
              options={[
                { value: "", label: "All Types" },
                { value: "true", label: "Manual Only" },
                { value: "false", label: "Regular Only" },
              ]}
            />
          </div>
          <div>
            <Button
              variant="outline"
              onClick={() => fetchSubscriptions(convertFilters(filters))}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Subscriptions Table */}
      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Billing Cycle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No subscriptions found
                  </td>
                </tr>
              ) : (
                filteredSubscriptions.map((subscription) => {
                  const user = typeof subscription.user === "object" ? subscription.user : null;
                  const plan = typeof subscription.plan === "object" ? subscription.plan : null;
                  
                  return (
                    <tr key={subscription._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-5 h-5 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user?.firstName && user?.lastName
                                ? `${user.firstName} ${user.lastName}`
                                : user?.email || "Unknown User"}
                            </div>
                            <div className="text-sm text-gray-500">{user?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {plan?.name || "Unknown Plan"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            subscription.status
                          )}`}
                        >
                          {getStatusIcon(subscription.status)}
                          {subscription.status || "Unknown"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {subscription.billingCycle || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {subscription.startDate
                          ? new Date(subscription.startDate).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {subscription.endDate
                          ? new Date(subscription.endDate).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {subscription.isManual ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            Manual
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                            Regular
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openViewModal(subscription)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {subscription.isManual && (
                            <>
                              <button
                                onClick={() => openEditModal(subscription)}
                                className="text-green-600 hover:text-green-900"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openCancelModal(subscription)}
                                className="text-red-600 hover:text-red-900"
                                title="Cancel"
                              >
                                <Trash2 className="w-4 h-4" />
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
          <div className="px-6 py-4 border-t">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              onPageChange={(page) => setFilters({ ...filters, page })}
            />
          </div>
        )}
      </Card>

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
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">User ID *</label>
            <Input
              value={createForm.userId}
              onChange={(e) => setCreateForm({ ...createForm, userId: e.target.value })}
              placeholder="Enter user ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Plan *</label>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Billing Cycle</label>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <DatePicker
                value={createForm.startDate}
                onChange={(date) => date && setCreateForm({ ...createForm, startDate: date })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <DatePicker
                value={createForm.endDate}
                onChange={(date) => date && setCreateForm({ ...createForm, endDate: date })}
                minDate={createForm.startDate}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Reason</label>
            <Input
              value={createForm.reason}
              onChange={(e) => setCreateForm({ ...createForm, reason: e.target.value })}
              placeholder="e.g., Free trial for new user"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
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
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Plan</label>
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
            <label className="block text-sm font-medium mb-2">Status</label>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Billing Cycle</label>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <DatePicker
                value={editForm.startDate}
                onChange={(date) => date && setEditForm({ ...editForm, startDate: date })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <DatePicker
                value={editForm.endDate}
                onChange={(date) => date && setEditForm({ ...editForm, endDate: date })}
                minDate={editForm.startDate}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Reason</label>
            <Input
              value={editForm.reason}
              onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
              placeholder="e.g., Plan upgrade"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
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
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to cancel this manual subscription? This action cannot be undone.
          </p>
          <div>
            <label className="block text-sm font-medium mb-2">Cancellation Reason</label>
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

