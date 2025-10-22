"use client";

import { useState, useEffect } from "react";
import {
  Megaphone,
  Search,
  X,
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle,
  ExternalLink
} from "lucide-react";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import { Skeleton, ListSkeleton } from "@/components/ui/loading";

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'feature';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  startDate: string;
  endDate?: string;
  isActive: boolean;
  isDismissible: boolean;
  actionUrl?: string;
  actionText?: string;
  targetAudience?: string[];
  createdAt: string;
  updatedAt: string;
}

const getAnnouncementIcon = (type: Announcement['type']) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="w-6 h-6 text-green-600" />;
    case 'warning':
      return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
    case 'error':
      return <AlertCircle className="w-6 h-6 text-red-600" />;
    case 'feature':
      return <Megaphone className="w-6 h-6 text-blue-600" />;
    default:
      return <Info className="w-6 h-6 text-blue-600" />;
  }
};

const getAnnouncementStyles = (type: Announcement['type']) => {
  const styles = {
    info: "bg-blue-50",
    success: "bg-green-50",
    warning: "bg-yellow-50",
    error: "bg-red-50",
    feature: "bg-purple-50"
  };
  return `rounded-lg p-4 ${styles[type]}`;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/announcements');

        if (!response.ok) {
          throw new Error('Failed to fetch announcements');
        }

        const data = await response.json();
        setAnnouncements(data.announcements || []);
      } catch {
        // Fallback to mock data
        setAnnouncements([
          {
            id: '1',
            title: 'Welcome to LocalPro!',
            message: 'Explore our marketplace to find local services and connect with professionals.',
            type: 'feature',
            priority: 'high',
            startDate: new Date().toISOString(),
            isActive: true,
            isDismissible: true,
            actionUrl: '/marketplace',
            actionText: 'Explore',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '2',
            title: 'Complete Your Profile',
            message: 'Add your skills and experience to get better matches.',
            type: 'warning',
            priority: 'medium',
            startDate: new Date().toISOString(),
            isActive: true,
            isDismissible: true,
            actionUrl: '/profile/edit',
            actionText: 'Complete',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '3',
            title: 'New Features Coming',
            message: 'Academy courses, Supplies marketplace, and Financial services coming soon.',
            type: 'info',
            priority: 'low',
            startDate: new Date().toISOString(),
            isActive: true,
            isDismissible: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      announcement.message.toLowerCase().includes(searchQuery.toLowerCase());
    const notDismissed = !dismissedIds.has(announcement.id);

    return matchesSearch && notDismissed && announcement.isActive;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          className="text-sm text-gray-500 mb-4"
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Announcements" },
          ]}
        />

        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>

        {/* Announcements List Skeleton */}
        <div className="space-y-4">
          <ListSkeleton count={5} />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumbs */}
      <Breadcrumbs
        className="text-sm text-gray-500 mb-4"
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Announcements" },
        ]}
      />

      {/* Simple Header */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-3">
          <Megaphone className="w-5 h-5 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-800">Announcements</h1>
          
        </div>

        {/* Simple Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search announcements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-0 shadow-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:shadow-md transition-shadow"
          />
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-3">
        {filteredAnnouncements.length === 0 ? (
          <div className="text-center py-8">
            <Megaphone className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-800 mb-1">No Announcements</h3>
            <p className="text-gray-600">
              {searchQuery ? "No announcements match your search." : "No announcements available."}
            </p>
          </div>
        ) : (
          filteredAnnouncements.map((announcement) => (
            <div
              key={announcement.id}
              className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow ${getAnnouncementStyles(announcement.type)}`}
            >
              <div className="flex items-start gap-3 p-3">
                <div className="flex-shrink-0 mt-1">
                  {getAnnouncementIcon(announcement.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-800 mb-1">{announcement.title}</h3>
                      <p className="text-gray-600 text-sm mb-2">{announcement.message}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{formatDate(announcement.createdAt)}</span>
                        <span className="capitalize">{announcement.type}</span>
                      </div>
                    </div>

                    {announcement.isDismissible && (
                      <button
                        onClick={() => handleDismiss(announcement.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
                        title="Dismiss"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {announcement.actionUrl && announcement.actionText && (
                    <div className="pt-2 border-t border-gray-200">
                      <a
                        href={announcement.actionUrl}
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {announcement.actionText}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
