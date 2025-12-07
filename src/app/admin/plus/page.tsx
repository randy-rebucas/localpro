"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  BarChart3,
  Package,
  Users,
  TrendingUp,
  Coins,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { AdminErrorState } from "@/components/admin/admin-error-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { useToast, ToastContainer } from "@/components/ui/toast";
import { useAdminSubscriptionPlans, useSubscriptionAnalytics } from "@/hooks/useSubscriptions";
import { useAdminSubscriptions } from "@/hooks/useAdminSubscriptions";
import { SubscriptionPlan, UserSubscription, FeatureLimit } from "@/types/subscriptions";
import { DatePicker } from "@/components/ui/date-picker";
import { Textarea } from "@/components/ui/textarea";
import { Pagination } from "@/components/shared/pagination";
import { formatCurrency } from "@/lib/currency-utils";
import { getDefaultCurrency } from "@/lib/settings-utils";
import { useAppSettings } from "@/hooks/useAppSettings";

type TabType = "plans" | "subscriptions" | "analytics";

export default function AdminPlusPage() {
  const [activeTab, setActiveTab] = useState<TabType>("plans");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">LocalPro Plus Management</h1>
          <p className="text-gray-600 text-sm">Manage subscription plans, subscriptions, and view analytics</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("plans")}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${activeTab === "plans"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              <Package className="w-3 h-3 inline mr-1" />
              Plans
            </button>
            <button
              onClick={() => setActiveTab("subscriptions")}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${activeTab === "subscriptions"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              <Users className="w-3 h-3 inline mr-1" />
              Subscriptions
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${activeTab === "analytics"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              <BarChart3 className="w-3 h-3 inline mr-1" />
              Analytics
            </button>
          </nav>
        </div>

        <div className="p-4">
          {activeTab === "plans" && <PlansTab />}
          {activeTab === "subscriptions" && <SubscriptionsTab />}
          {activeTab === "analytics" && <AnalyticsTab />}
        </div>
      </div>
    </div>
  );
}

function PlansTab() {
  const { settings: appSettings } = useAppSettings();
  const {
    plans,
    loading,
    error,
    refetch,
    createPlan,
    updatePlan,
    deletePlan,
  } = useAdminSubscriptionPlans();
  const { toasts, success, error: showError, removeToast } = useToast();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  const [createForm, setCreateForm] = useState<Partial<SubscriptionPlan>>({
    name: "",
    description: "",
    price: {
      monthly: 0,
      yearly: 0,
      currency: getDefaultCurrency(appSettings),
    },
    features: [],
    limits: {},
    benefits: [],
    isActive: true,
    isPopular: false,
    sortOrder: 0,
  });

  const [editForm, setEditForm] = useState<Partial<SubscriptionPlan>>({});

  const openEditModal = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setEditForm({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      features: plan.features || [],
      limits: plan.limits || {},
      benefits: plan.benefits || [],
      isActive: plan.isActive,
      isPopular: plan.isPopular,
      sortOrder: plan.sortOrder,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowDeleteModal(true);
  };

  const handleCreate = async () => {
    try {
      if (!createForm.name || !createForm.description) {
        showError("Name and description are required");
        return;
      }

      await createPlan(createForm);
      success("Plan created successfully");
      setShowCreateModal(false);
      setCreateForm({
        name: "",
        description: "",
        price: { monthly: 0, yearly: 0, currency: getDefaultCurrency(appSettings) },
        features: [],
        limits: {},
        benefits: [],
        isActive: true,
        isPopular: false,
        sortOrder: 0,
      });
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to create plan");
    }
  };

  const handleUpdate = async () => {
    try {
      if (!selectedPlan?._id) return;
      await updatePlan(selectedPlan._id, editForm);
      success("Plan updated successfully");
      setShowEditModal(false);
      setSelectedPlan(null);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to update plan");
    }
  };

  const handleDelete = async () => {
    try {
      if (!selectedPlan?._id) return;
      await deletePlan(selectedPlan._id);
      success("Plan deleted successfully");
      setShowDeleteModal(false);
      setSelectedPlan(null);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to delete plan");
    }
  };

  const addFeature = (formType: "create" | "edit") => {
    const newFeature: FeatureLimit = {
      name: "",
      description: "",
      included: true,
      limit: null,
      unit: "per_month",
    };
    if (formType === "create") {
      setCreateForm({
        ...createForm,
        features: [...(createForm.features || []), newFeature],
      });
    } else {
      setEditForm({
        ...editForm,
        features: [...(editForm.features || []), newFeature],
      });
    }
  };

  const removeFeature = (index: number, formType: "create" | "edit") => {
    if (formType === "create") {
      const features = [...(createForm.features || [])];
      features.splice(index, 1);
      setCreateForm({ ...createForm, features });
    } else {
      const features = [...(editForm.features || [])];
      features.splice(index, 1);
      setEditForm({ ...editForm, features });
    }
  };

  if (loading && plans.length === 0) {
    return <Loading />;
  }

  if (error && plans.length === 0) {
    return <AdminErrorState error={error} onRetry={refetch} />;
  }

  return (
    <div className="space-y-4">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <div className="flex justify-between items-center">
        <h2 className="text-sm font-medium text-gray-900">Subscription Plans</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
        >
          <Plus className="w-3 h-3 mr-1" />
          Create Plan
        </button>
      </div>

      <div className="bg-white rounded shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900">Plans</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Price</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Yearly Price</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {plans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-2 text-center text-xs text-gray-500">
                    No plans found
                  </td>
                </tr>
              ) : (
                plans.map((plan) => (
                  <tr key={plan._id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs font-semibold text-gray-900">{plan.name}</div>
                      {plan.isPopular && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          Popular
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-xs text-gray-600 max-w-xs truncate">{plan.description}</div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs text-gray-900">
                        {formatCurrency(
                          plan.price?.monthly || 0,
                          plan.price?.currency || getDefaultCurrency(appSettings),
                          { appSettings }
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs text-gray-900">
                        {formatCurrency(
                          plan.price?.yearly || 0,
                          plan.price?.currency || getDefaultCurrency(appSettings),
                          { appSettings }
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${plan.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                          }`}
                      >
                        {plan.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openEditModal(plan)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(plan)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Plan Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Subscription Plan"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create Plan</Button>
          </div>
        }
      >
        <PlanForm form={createForm} setForm={setCreateForm} addFeature={addFeature} removeFeature={removeFeature} />
      </Modal>

      {/* Edit Plan Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Subscription Plan"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Update Plan</Button>
          </div>
        }
      >
        <PlanForm form={editForm} setForm={setEditForm} addFeature={addFeature} removeFeature={removeFeature} />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Plan"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-gray-700">
          Are you sure you want to delete the plan <strong>{selectedPlan?.name}</strong>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}

function PlanForm({
  form,
  setForm,
  addFeature,
  removeFeature,
}: {
  form: Partial<SubscriptionPlan>;
  setForm: (form: Partial<SubscriptionPlan>) => void;
  addFeature: (formType: "create" | "edit") => void;
  removeFeature: (index: number, formType: "create" | "edit") => void;
}) {
  const { settings: appSettings } = useAppSettings();
  const formType = form._id ? "edit" : "create";

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
        <Input
          value={form.name || ""}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Plan name"
          className="text-xs !px-3 !py-2"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Description *</label>
        <Textarea
          value={form.description || ""}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Plan description"
          rows={3}
          className="text-xs !px-3 !py-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Monthly Price *</label>
          <Input
            type="number"
            value={form.price?.monthly || 0}
            onChange={(e) =>
              setForm({
                ...form,
                price: {
                  monthly: parseFloat(e.target.value) || 0,
                  yearly: form.price?.yearly || 0,
                  currency: form.price?.currency || getDefaultCurrency(appSettings)
                },
              })
            }
            min="0"
            step="0.01"
            className="text-xs !px-3 !py-2"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Yearly Price *</label>
          <Input
            type="number"
            value={form.price?.yearly || 0}
            onChange={(e) =>
              setForm({
                ...form,
                price: {
                  monthly: form.price?.monthly || 0,
                  yearly: parseFloat(e.target.value) || 0,
                  currency: form.price?.currency || getDefaultCurrency(appSettings)
                },
              })
            }
            min="0"
            step="0.01"
            className="text-xs !px-3 !py-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Currency</label>
        <Input
          value={form.price?.currency || getDefaultCurrency(appSettings)}
          onChange={(e) =>
            setForm({
              ...form,
              price: {
                monthly: form.price?.monthly || 0,
                yearly: form.price?.yearly || 0,
                currency: e.target.value
              },
            })
          }
          placeholder={getDefaultCurrency(appSettings)}
          className="text-xs !px-3 !py-2"
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-xs font-medium text-gray-700">Features</label>
          <button
            type="button"
            onClick={() => addFeature(formType)}
            className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Feature
          </button>
        </div>
        <div className="space-y-2">
          {(form.features || []).map((feature, index) => (
            <div key={index} className="flex gap-2 items-start p-2 rounded">
              <div className="flex-1 space-y-2">
                <Input
                  placeholder="Feature name"
                  value={feature.name || ""}
                  onChange={(e) => {
                    const features = [...(form.features || [])];
                    features[index] = { ...feature, name: e.target.value };
                    setForm({ ...form, features });
                  }}
                  className="text-xs !px-3 !py-2"
                />
                <Input
                  placeholder="Description"
                  value={feature.description || ""}
                  onChange={(e) => {
                    const features = [...(form.features || [])];
                    features[index] = { ...feature, description: e.target.value };
                    setForm({ ...form, features });
                  }}
                  className="text-xs !px-3 !py-2"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Limit (null for unlimited)"
                    value={feature.limit ?? ""}
                    onChange={(e) => {
                      const features = [...(form.features || [])];
                      features[index] = {
                        ...feature,
                        limit: e.target.value === "" ? null : parseFloat(e.target.value) || null,
                      };
                      setForm({ ...form, features });
                    }}
                    className="text-xs !px-3 !py-2"
                  />
                  <Select
                    value={feature.unit || "per_month"}
                    onValueChange={(value) => {
                      const features = [...(form.features || [])];
                      features[index] = { ...feature, unit: value as FeatureLimit['unit'] };
                      setForm({ ...form, features });
                    }}
                    options={[
                      { value: "per_month", label: "Per Month" },
                      { value: "per_booking", label: "Per Booking" },
                      { value: "per_user", label: "Per User" },
                      { value: "per_gb", label: "Per GB" },
                      { value: "per_call", label: "Per Call" },
                      { value: "unlimited", label: "Unlimited" },
                    ]}
                    className="!pl-3 !pr-10 !py-2"
                  />
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={feature.included !== false}
                    onChange={(e) => {
                      const features = [...(form.features || [])];
                      features[index] = { ...feature, included: e.target.checked };
                      setForm({ ...form, features });
                    }}
                    className="mr-2"
                  />
                  <span className="text-xs text-gray-700">Included</span>
                </label>
              </div>
              <button
                type="button"
                onClick={() => removeFeature(index, formType)}
                className="text-red-600 hover:text-red-900"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Benefits (one per line)</label>
        <Textarea
          value={(form.benefits || []).join("\n")}
          onChange={(e) =>
            setForm({
              ...form,
              benefits: e.target.value.split("\n").filter((b) => b.trim()),
            })
          }
          placeholder="Enter benefits, one per line"
          rows={4}
          className="text-xs !px-3 !py-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Sort Order</label>
          <Input
            type="number"
            value={form.sortOrder || 0}
            onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
            className="text-xs !px-3 !py-2"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={form.isActive !== false}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            className="mr-2"
          />
          <span className="text-xs text-gray-700">Active</span>
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={form.isPopular === true}
            onChange={(e) => setForm({ ...form, isPopular: e.target.checked })}
            className="mr-2"
          />
          <span className="text-xs text-gray-700">Popular</span>
        </label>
      </div>
    </div>
  );
}

function SubscriptionsTab() {
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

  const convertFilters = useCallback((f: typeof filters) => ({
    ...f,
    isManual: f.isManual === "" ? undefined : f.isManual === "true",
  }), []);

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
        startDate: createForm.startDate.toISOString(),
        endDate: createForm.endDate.toISOString(),
        reason: createForm.reason,
        notes: createForm.notes,
      };

      await createManualSubscription(payload);
      success("Subscription created successfully");
      setShowCreateModal(false);
      fetchSubscriptions(convertFilters(filters));
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to create subscription");
    }
  };

  const handleUpdate = async () => {
    try {
      if (!selectedSubscription?._id) return;

      const payload = {
        planId: editForm.planId || undefined,
        status: editForm.status,
        startDate: editForm.startDate.toISOString(),
        endDate: editForm.endDate.toISOString(),
        billingCycle: editForm.billingCycle,
        reason: editForm.reason,
        notes: editForm.notes,
      };

      await updateManualSubscription(selectedSubscription._id, payload);
      success("Subscription updated successfully");
      setShowEditModal(false);
      fetchSubscriptions(convertFilters(filters));
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to update subscription");
    }
  };

  const handleCancel = async () => {
    try {
      if (!selectedSubscription?._id) return;
      await cancelManualSubscription(selectedSubscription._id, cancelReason);
      success("Subscription cancelled successfully");
      setShowCancelModal(false);
      fetchSubscriptions(convertFilters(filters));
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to cancel subscription");
    }
  };

  const openEditModal = (subscription: UserSubscription) => {
    setSelectedSubscription(subscription);
    setEditForm({
      planId: typeof subscription.plan === "object" ? subscription.plan._id || "" : subscription.plan || "",
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

  useEffect(() => {
    fetchSubscriptions(convertFilters(filters));
  }, [filters, fetchSubscriptions, convertFilters]);

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

      <div className="flex justify-between items-center">
        <h2 className="text-sm font-medium text-gray-900">Subscriptions</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
        >
          <Plus className="w-3 h-3 mr-1" />
          Create Subscription
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded shadow">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900">Filters & Search</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
              <Input
                type="text"
                placeholder="Search by user email, name, or subscription ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs !px-2 !py-1 !rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Status</option>
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
                <option value="true">Manual</option>
                <option value="false">Regular</option>
              </select>
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
                  Billing
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
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-4 text-center text-xs text-gray-500">
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
                        <div className="text-xs font-medium text-gray-900">
                          {user?.firstName && user?.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user?.email || "Unknown"}
                        </div>
                        <div className="text-xs text-gray-500">{user?.email}</div>
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
                      <td className="px-3 py-2 whitespace-nowrap text-right text-xs font-medium">
                        <div className="flex items-center justify-end space-x-2">
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
          <div className="px-3 py-2 border-t">
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
            <Button onClick={handleCreate}>Create</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">User ID *</label>
            <Input
              value={createForm.userId}
              onChange={(e) => setCreateForm({ ...createForm, userId: e.target.value })}
              placeholder="User ID"
              className="text-xs !px-3 !py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Plan ID *</label>
            <Input
              value={createForm.planId}
              onChange={(e) => setCreateForm({ ...createForm, planId: e.target.value })}
              placeholder="Plan ID"
              className="text-xs !px-3 !py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Billing Cycle</label>
            <Select
              value={createForm.billingCycle}
              onValueChange={(value) =>
                setCreateForm({ ...createForm, billingCycle: value as "monthly" | "yearly" })
              }
              options={[
                { value: "monthly", label: "Monthly" },
                { value: "yearly", label: "Yearly" },
              ]}
              className="!pl-3 !pr-10 !py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
              <DatePicker
                value={createForm.startDate}
                onChange={(date: Date | null) => date && setCreateForm({ ...createForm, startDate: date })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
              <DatePicker
                value={createForm.endDate}
                onChange={(date: Date | null) => date && setCreateForm({ ...createForm, endDate: date })}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Reason</label>
            <Input
              value={createForm.reason}
              onChange={(e) => setCreateForm({ ...createForm, reason: e.target.value })}
              placeholder="Reason for manual subscription"
              className="text-xs !px-3 !py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
            <Textarea
              value={createForm.notes}
              onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
              placeholder="Additional notes"
              rows={3}
              className="text-xs !px-3 !py-2"
            />
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Manual Subscription"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Update</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Plan ID</label>
            <Input
              value={editForm.planId}
              onChange={(e) => setEditForm({ ...editForm, planId: e.target.value })}
              placeholder="Plan ID"
              className="text-xs !px-3 !py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <Select
              value={editForm.status}
              onValueChange={(value) => setEditForm({ ...editForm, status: value as UserSubscription["status"] })}
              options={[
                { value: "active", label: "Active" },
                { value: "cancelled", label: "Cancelled" },
                { value: "expired", label: "Expired" },
                { value: "suspended", label: "Suspended" },
                { value: "pending", label: "Pending" },
              ]}
              className="!pl-3 !pr-10 !py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Billing Cycle</label>
            <Select
              value={editForm.billingCycle}
              onValueChange={(value) =>
                setEditForm({ ...editForm, billingCycle: value as "monthly" | "yearly" })
              }
              options={[
                { value: "monthly", label: "Monthly" },
                { value: "yearly", label: "Yearly" },
              ]}
              className="!pl-3 !pr-10 !py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
              <DatePicker
                value={editForm.startDate}
                onChange={(date: Date | null) => date && setEditForm({ ...editForm, startDate: date })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
              <DatePicker
                value={editForm.endDate}
                onChange={(date: Date | null) => date && setEditForm({ ...editForm, endDate: date })}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Reason</label>
            <Input
              value={editForm.reason}
              onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
              placeholder="Reason"
              className="text-xs !px-3 !py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
            <Textarea
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              placeholder="Additional notes"
              rows={3}
              className="text-xs !px-3 !py-2"
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500">Status</label>
                <p className="text-sm text-gray-900">{selectedSubscription.status}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">Billing Cycle</label>
                <p className="text-sm text-gray-900">{selectedSubscription.billingCycle}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">Start Date</label>
                <p className="text-sm text-gray-900">
                  {selectedSubscription.startDate
                    ? new Date(selectedSubscription.startDate).toLocaleString()
                    : "N/A"}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">End Date</label>
                <p className="text-sm text-gray-900">
                  {selectedSubscription.endDate
                    ? new Date(selectedSubscription.endDate).toLocaleString()
                    : "N/A"}
                </p>
              </div>
            </div>
            {selectedSubscription.manualDetails && (
              <div>
                <label className="block text-xs font-medium text-gray-500">Manual Details</label>
                <div className="mt-1 space-y-1">
                  {selectedSubscription.manualDetails.reason && (
                    <p className="text-sm text-gray-900">
                      <strong>Reason:</strong> {selectedSubscription.manualDetails.reason}
                    </p>
                  )}
                  {selectedSubscription.manualDetails.notes && (
                    <p className="text-sm text-gray-900">
                      <strong>Notes:</strong> {selectedSubscription.manualDetails.notes}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Cancel Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Subscription"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCancelModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleCancel}>
              Confirm Cancel
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-gray-700">
            Are you sure you want to cancel this subscription? This action cannot be undone.
          </p>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Cancellation Reason</label>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation"
              rows={3}
              className="text-xs !px-3 !py-2"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

function AnalyticsTab() {
  const { settings: appSettings } = useAppSettings();
  const { analytics, loading, error, refetch } = useSubscriptionAnalytics();
  const { toasts, removeToast } = useToast();

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <AdminErrorState error={error} onRetry={refetch} />;
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <div className="flex justify-between items-center">
        <h2 className="text-sm font-medium text-gray-900">Subscription Analytics</h2>
        <button
          onClick={refetch}
          className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded shadow p-3 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Total Subscriptions</p>
              <p className="text-lg font-bold text-gray-900">{analytics.totalSubscriptions || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0 ml-4">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded shadow p-3 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Active Subscriptions</p>
              <p className="text-lg font-bold text-gray-900">{analytics.activeSubscriptions || 0}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg flex-shrink-0 ml-4">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded shadow p-3 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Total Revenue</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(
                  analytics.totalRevenue || 0,
                  getDefaultCurrency(appSettings),
                  { appSettings }
                )}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg flex-shrink-0 ml-4">
              <Coins className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded shadow p-3 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Monthly Revenue</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(
                  analytics.monthlyRevenue || 0,
                  getDefaultCurrency(appSettings),
                  { appSettings }
                )}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0 ml-4">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Subscriptions by Plan */}
        {analytics.subscriptionsByPlan && analytics.subscriptionsByPlan.length > 0 && (
          <div className="bg-white rounded shadow p-4">
            <h3 className="text-xs font-semibold text-gray-900 mb-3">Subscriptions by Plan</h3>
            <div className="space-y-2">
              {analytics.subscriptionsByPlan.map((item, index) => (
                <div key={item.planId || `plan-${index}`} className="flex items-center justify-between">
                  <span className="text-xs text-gray-700">{item.planName}</span>
                  <span className="text-xs font-medium text-gray-900">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subscriptions by Status */}
        {analytics.subscriptionsByStatus && analytics.subscriptionsByStatus.length > 0 && (
          <div className="bg-white rounded shadow p-4">
            <h3 className="text-xs font-semibold text-gray-900 mb-3">Subscriptions by Status</h3>
            <div className="space-y-2">
              {analytics.subscriptionsByStatus.map((item, index) => (
                <div key={item.status || `status-${index}`} className="flex items-center justify-between">
                  <span className="text-xs text-gray-700 capitalize">{item.status}</span>
                  <span className="text-xs font-medium text-gray-900">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Subscriptions */}
      {analytics.recentSubscriptions && analytics.recentSubscriptions.length > 0 && (
        <div className="bg-white rounded shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-xs font-semibold text-gray-900">Recent Subscriptions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.recentSubscriptions.slice(0, 5).map((sub, index) => {
                  const user = typeof sub.user === "object" ? sub.user : null;
                  const plan = typeof sub.plan === "object" ? sub.plan : null;
                  return (
                    <tr key={sub._id || `subscription-${index}`} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-xs text-gray-900">
                        {user?.email || "Unknown"}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900">{plan?.name || "Unknown"}</td>
                      <td className="px-3 py-2 text-xs text-gray-900">{sub.status || "N/A"}</td>
                      <td className="px-3 py-2 text-xs text-gray-500">
                        {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : "N/A"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

