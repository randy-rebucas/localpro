"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { useSession } from "@/hooks/useAuth";
import { API_ENDPOINTS } from "@/lib/api";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  href?: string | null;
};

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<"all" | "unread">("all");
  const router = useRouter();
  const { status } = useSession();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(API_ENDPOINTS.communicationNotifications);
      if (!res.ok) throw new Error("Failed to load notifications");
      const data = await res.json();
      setItems(data.notifications || data.items || data || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth");
      return;
    }
    if (status === "authenticated") {
      load();
    }
  }, [status, router, load]);

  const markAllRead = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.communicationNotificationsReadAll, { method: "PUT" });
      if (res.ok) {
        setItems(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch {}
  };

  const markOneRead = async (id: string) => {
    // optimistic update
    setItems(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    try {
      await fetch(`${API_ENDPOINTS.communicationNotifications}/${id}/read`, { method: "PUT" });
    } catch {
      // best-effort; keep optimistic state
    }
  };

  const deleteOne = async (id: string) => {
    const previous = items;
    setItems(prev => prev.filter(n => n.id !== id));
    try {
      const res = await fetch(`${API_ENDPOINTS.communicationNotifications}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    } catch {
      // rollback
      setItems(previous);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch(API_ENDPOINTS.communicationNotifications, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to refresh notifications");
      const data = await res.json();
      setItems(data.notifications || data.items || data || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to refresh notifications");
    } finally {
      setRefreshing(false);
    }
  };

  const formatRelativeTime = (iso: string) => {
    const date = new Date(iso);
    const diff = Date.now() - date.getTime();
    const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
    const minutes = Math.round(diff / 60000);
    if (Math.abs(minutes) < 60) return rtf.format(-minutes, "minute");
    const hours = Math.round(minutes / 60);
    if (Math.abs(hours) < 24) return rtf.format(-hours, "hour");
    const days = Math.round(hours / 24);
    if (Math.abs(days) < 7) return rtf.format(-days, "day");
    return date.toLocaleDateString();
  };

  if (status === "loading") {
    return null;
  }

  const visibleItems = tab === "all" ? items : items.filter(n => !n.read);

  return (
    <div>
      {/* Breadcrumbs */}
      <Breadcrumbs
        className="text-sm text-gray-500 mb-4"
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Notifications" },
        ]}
      />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-50 text-green-700 flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refresh}
            disabled={refreshing}
            className="text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
          {items.length > 0 && (
            <button onClick={markAllRead} className="text-sm text-green-700 hover:text-green-800">
              Mark all as read
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setTab("all")}
          className={`px-3 py-1.5 text-sm rounded-lg border ${tab === "all" ? "bg-green-50 text-green-700 border-green-200" : "bg-white text-gray-600 border-gray-200"}`}
        >
          All
        </button>
        <button
          onClick={() => setTab("unread")}
          className={`px-3 py-1.5 text-sm rounded-lg border ${tab === "unread" ? "bg-green-50 text-green-700 border-green-200" : "bg-white text-gray-600 border-gray-200"}`}
        >
          Unread
        </button>
      </div>

      {loading && (
        <ul className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="bg-white border rounded-lg p-4 animate-pulse">
              <div className="flex items-start justify-between">
                <div className="space-y-2 w-3/4">
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
                <div className="h-3 bg-gray-200 rounded w-16" />
              </div>
            </li>
          ))}
        </ul>
      )}
      {error && (
        <div className="text-red-600 flex items-center justify-between bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <span>{error}</span>
          <button onClick={load} className="text-sm underline">Retry</button>
        </div>
      )}

      {!loading && visibleItems.length === 0 && (
        <p className="text-gray-500">You have no notifications.</p>
      )}

      <ul className="space-y-3">
        {visibleItems.map((n) => (
          <li key={n.id} className={`bg-white border rounded-lg p-4 ${n.read ? "opacity-80" : ""}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium text-gray-900 truncate">{n.title || "Notification"}</p>
                <p className="text-sm text-gray-600 break-words">{n.message}</p>
                <div className="mt-2 flex items-center gap-3">
                  {n.href && (
                    <Link href={n.href} onClick={() => !n.read && markOneRead(n.id)} className="text-sm text-green-700 hover:text-green-800">
                      View details
                    </Link>
                  )}
                  {!n.read && (
                    <button onClick={() => markOneRead(n.id)} className="text-sm text-gray-600 hover:text-gray-800">
                      Mark as read
                    </button>
                  )}
                  <button onClick={() => deleteOne(n.id)} className="text-sm text-gray-500 hover:text-gray-800">
                    Delete
                  </button>
                </div>
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap">{formatRelativeTime(n.createdAt)}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}


