"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  AlertCircle, 
  Info, 
  CheckCircle, 
  AlertTriangle, 
  Megaphone,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";

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

interface AnnouncementsProps {
  className?: string;
  maxHeight?: string;
  showAll?: boolean;
}

const getAnnouncementIcon = (type: Announcement['type']) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="w-5 h-5 text-accent" />;
    case 'warning':
      return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    case 'error':
      return <AlertCircle className="w-5 h-5 text-red-600" />;
    case 'feature':
      return <Megaphone className="w-5 h-5 text-primary" />;
    default:
      return <Info className="w-5 h-5 text-primary" />;
  }
};

const getAnnouncementStyles = (type: Announcement['type'], priority: Announcement['priority']) => {
  const baseStyles = "border-l-4 rounded-lg p-4 shadow-sm";
  
  const typeStyles = {
    info: "bg-primary/5 border-primary text-primary",
    success: "bg-accent/5 border-accent text-accent",
    warning: "bg-yellow-50 border-yellow-500 text-yellow-900",
    error: "bg-red-50 border-red-500 text-red-900",
    feature: "bg-purple-50 border-purple-500 text-purple-900"
  };

  const priorityStyles = {
    low: "opacity-75",
    medium: "",
    high: "ring-2 ring-opacity-50",
    urgent: "ring-2 ring-red-500 ring-opacity-50 animate-pulse"
  };

  return `${baseStyles} ${typeStyles[type]} ${priorityStyles[priority]}`;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return "Just now";
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
  return date.toLocaleDateString();
};

export default function Announcements({ 
  className = "", 
  maxHeight = "max-h-96",
  showAll = false 
}: AnnouncementsProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.announcements}`, createAuthFetchOptions());
        
        if (!response.ok) {
          throw new Error('Failed to fetch announcements');
        }
        
        const data = await response.json();
        setAnnouncements(data.announcements || []);
      } catch (err) {
        logger.error('Error fetching announcements', err instanceof Error ? err : new Error(String(err)));
        setError('Failed to load announcements');
        
        // Fallback to mock data for development
        setAnnouncements([
          {
            id: '1',
            title: 'Welcome to LocalPro!',
            message: 'We\'re excited to have you on board. Explore our marketplace to find local services and connect with professionals in your area.',
            type: 'feature',
            priority: 'high',
            startDate: new Date().toISOString(),
            isActive: true,
            isDismissible: true,
            actionUrl: '/marketplace',
            actionText: 'Explore Marketplace',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '2',
            title: 'New Features Coming Soon',
            message: 'We\'re working on exciting new features including Academy courses, Supplies marketplace, and Financial services. Stay tuned!',
            type: 'info',
            priority: 'medium',
            startDate: new Date().toISOString(),
            isActive: true,
            isDismissible: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '3',
            title: 'Profile Completion',
            message: 'Complete your profile to get better matches and increase your visibility to potential clients.',
            type: 'warning',
            priority: 'medium',
            startDate: new Date().toISOString(),
            isActive: true,
            isDismissible: true,
            actionUrl: '/profile/edit',
            actionText: 'Complete Profile',
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

  const handleDismiss = async (id: string) => {
    try {
      // Optimistically update UI
      setDismissedIds(prev => new Set([...prev, id]));
      
      // Call API to mark as dismissed
      await fetch(`${API_BASE_URL}${API_ENDPOINTS.announcementsAcknowledge}/${id}/dismiss`, createAuthFetchOptions({
        method: 'POST',
      }));
    } catch (error) {
      logger.error('Error dismissing announcement', error instanceof Error ? error : new Error(String(error)));
      // Revert optimistic update on error
      setDismissedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const visibleAnnouncements = announcements
    .filter(announcement => 
      announcement.isActive && 
      !dismissedIds.has(announcement.id) &&
      new Date(announcement.startDate) <= new Date() &&
      (!announcement.endDate || new Date(announcement.endDate) >= new Date())
    )
    .sort((a, b) => {
      // Sort by priority first, then by date
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const displayAnnouncements = showAll ? visibleAnnouncements : visibleAnnouncements.slice(0, 3);

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
        <div className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && announcements.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
        <div className="p-4 text-center">
          <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (visibleAnnouncements.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">Announcements</h3>
          {visibleAnnouncements.length > 0 && (
            <span className="bg-accent/10 text-accent text-xs font-medium px-2 py-1 rounded-full">
              {visibleAnnouncements.length}
            </span>
          )}
        </div>
        {visibleAnnouncements.length > 3 && !showAll && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Announcements List */}
      {!isCollapsed && (
        <div className={`overflow-y-auto ${maxHeight}`}>
          {displayAnnouncements.map((announcement) => {
            const isExpanded = expandedId === announcement.id;
            const isLongMessage = announcement.message.length > 150;
            
            return (
              <div
                key={announcement.id}
                className={`border-b border-gray-100 last:border-b-0 ${getAnnouncementStyles(announcement.type, announcement.priority)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getAnnouncementIcon(announcement.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold leading-tight">
                        {announcement.title}
                      </h4>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(announcement.createdAt)}
                        </span>
                        {announcement.isDismissible && (
                          <button
                            onClick={() => handleDismiss(announcement.id)}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Dismiss"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <p className={`text-sm mt-1 leading-relaxed ${
                      isLongMessage && !isExpanded ? 'line-clamp-2' : ''
                    }`}>
                      {announcement.message}
                    </p>
                    
                    {isLongMessage && (
                      <button
                        onClick={() => toggleExpanded(announcement.id)}
                        className="text-xs text-primary hover:text-primary font-medium mt-1 transition-colors"
                      >
                        {isExpanded ? 'Show less' : 'Read more'}
                      </button>
                    )}
                    
                    {announcement.actionUrl && announcement.actionText && (
                      <div className="mt-3">
                        <a
                          href={announcement.actionUrl}
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary transition-colors"
                        >
                          {announcement.actionText}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      {visibleAnnouncements.length > 3 && !showAll && (
        <div className="p-3 border-t border-gray-100 bg-gray-50">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            {isCollapsed ? `Show ${visibleAnnouncements.length - 3} more announcements` : 'Show less'}
          </button>
        </div>
      )}
    </div>
  );
}
