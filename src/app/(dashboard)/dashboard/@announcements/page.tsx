"use client";

import { useState, useEffect } from "react";
import { makeClientAuthenticatedRequestWithEndpointSafe, makeClientAuthenticatedRequestWithPathSafe } from "@/lib/client-api-utils";
import { API_ENDPOINTS } from "@/lib/api";
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

export interface Attachment {
  filename: string;
  url: string;
  type: 'image' | 'document' | 'video' | 'audio';
  size: number;
}

export interface Acknowledgment {
  user: string; // ObjectId(User)
  acknowledgedAt: string;
}

export interface CommentReply {
  user: string; // ObjectId(User)
  userName: string;
  content: string; // <=500
  createdAt: string;
  isEdited: boolean;
  editedAt?: string;
  likes: string[]; // Array of UserId
}

export interface Comment {
  user: string; // ObjectId(User)
  userName: string;
  content: string; // <=1000
  createdAt: string;
  isEdited: boolean;
  editedAt?: string;
  likes: string[]; // Array of UserId
  replies?: CommentReply[];
}

export interface AnnouncementAnalytics {
  totalViews: number;
  uniqueViews: number;
  totalAcknowledged: number;
  totalComments: number;
  engagementRate: number;
}

export interface AnnouncementMetadata {
  lastModifiedBy?: string; // UserId
  lastModifiedAt?: string;
  version?: number;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string; // UserId
}

export interface Announcement {
  _id: string;
  id?: string; // Alias for _id for convenience
  title: string; // required, <=200
  content: string; // required, <=5000
  summary: string; // required, <=500
  type: 'system' | 'maintenance' | 'feature' | 'security' | 'promotion' | 'policy' | 'event' | 'emergency' | 'update' | 'general'; // default 'general'
  priority: 'low' | 'medium' | 'high' | 'urgent'; // default 'medium'
  status: 'draft' | 'scheduled' | 'published' | 'archived'; // default 'draft'
  targetAudience: 'all' | 'providers' | 'clients' | 'agencies' | 'premium' | 'verified' | 'specific_roles'; // default 'all'
  targetRoles?: string[]; // ['admin','provider','client','agency_admin','agency_owner','instructor','supplier','advertiser']
  targetLocations?: string[];
  targetCategories?: string[]; // service category enum list
  scheduledAt?: string | null; // Date ISO8601
  publishedAt?: string | null; // Date ISO8601
  expiresAt?: string | null; // Date ISO8601
  isSticky: boolean; // default false
  allowComments: boolean; // default true
  requireAcknowledgment: boolean; // default false
  attachments?: Attachment[];
  tags?: string[]; // string<=50 each
  author: string; // ObjectId(User, required)
  authorName: string; // required
  authorRole: string; // required
  views?: number;
  acknowledgments?: Acknowledgment[];
  comments?: Comment[];
  analytics?: AnnouncementAnalytics;
  metadata?: AnnouncementMetadata;
  createdAt: string;
  updatedAt: string;
  // Virtual fields (computed)
  isActive?: boolean; // status==='published' && !expired && !future
  isExpired?: boolean; // expiresAt <= now
  isScheduled?: boolean; // status==='scheduled' && scheduledAt>now
  // Additional fields from API response
  isAcknowledged?: boolean; // user-specific
  canComment?: boolean; // user-specific
  canAcknowledge?: boolean; // user-specific
}

const getAnnouncementIcon = (type: Announcement['type']) => {
  switch (type) {
    case 'maintenance':
      return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    case 'security':
    case 'emergency':
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    case 'feature':
      return <Megaphone className="w-4 h-4 text-purple-600" />;
    case 'promotion':
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'system':
    case 'update':
      return <Info className="w-4 h-4 text-blue-600" />;
    case 'event':
    case 'policy':
    case 'general':
    default:
      return <Info className="w-4 h-4 text-gray-600" />;
  }
};

const getAnnouncementStyles = (type: Announcement['type'], priority: Announcement['priority']) => {
  const baseStyles = "border-l-4 rounded-lg p-3 shadow-sm";
  
  const typeStyles: Record<Announcement['type'], string> = {
    system: "bg-blue-50 border-blue-500 text-blue-900",
    maintenance: "bg-yellow-50 border-yellow-500 text-yellow-900",
    feature: "bg-purple-50 border-purple-500 text-purple-900",
    security: "bg-red-50 border-red-500 text-red-900",
    promotion: "bg-green-50 border-green-500 text-green-900",
    policy: "bg-indigo-50 border-indigo-500 text-indigo-900",
    event: "bg-pink-50 border-pink-500 text-pink-900",
    emergency: "bg-red-50 border-red-600 text-red-900",
    update: "bg-blue-50 border-blue-500 text-blue-900",
    general: "bg-gray-50 border-gray-500 text-gray-900"
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

export default function AnnouncementsPage() {
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
        const response = await makeClientAuthenticatedRequestWithEndpointSafe(
          "announcements" as keyof typeof API_ENDPOINTS,
          { method: 'GET' }
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch announcements');
        }
        
        const responseData = await response.json();
        // Handle API response structure: { success, data: { announcements: [...], pagination:{...} } }
        const announcements = responseData?.data?.announcements || responseData?.announcements || responseData?.data || [];
        
        // Normalize IDs: ensure both _id and id are present
        const normalizedAnnouncements = announcements.map((announcement: any) => ({
          ...announcement,
          _id: announcement._id || announcement.id,
          id: announcement.id || announcement._id,
          // Ensure virtual fields are computed if not present
          isActive: announcement.isActive ?? (
            announcement.status === 'published' &&
            (!announcement.expiresAt || new Date(announcement.expiresAt) > new Date()) &&
            (!announcement.publishedAt || new Date(announcement.publishedAt) <= new Date())
          ),
          isExpired: announcement.isExpired ?? (
            announcement.expiresAt ? new Date(announcement.expiresAt) <= new Date() : false
          ),
          isScheduled: announcement.isScheduled ?? (
            announcement.status === 'scheduled' &&
            announcement.scheduledAt &&
            new Date(announcement.scheduledAt) > new Date()
          )
        }));
        
        setAnnouncements(normalizedAnnouncements);
      } catch (err) {
        console.error('Error fetching announcements:', err);
        setError('Failed to load announcements');
        
        // Fallback to mock data for development
        const mockAnnouncements: Announcement[] = [
          {
            _id: '1',
            id: '1',
            title: 'Welcome to LocalPro!',
            content: 'We\'re excited to have you on board. Explore our marketplace to find local services and connect with professionals in your area.',
            summary: 'Welcome to LocalPro marketplace',
            type: 'feature',
            priority: 'high',
            status: 'published',
            targetAudience: 'all',
            publishedAt: new Date().toISOString(),
            isSticky: false,
            allowComments: true,
            requireAcknowledgment: false,
            author: 'system',
            authorName: 'LocalPro Team',
            authorRole: 'admin',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            _id: '2',
            id: '2',
            title: 'New Features Coming Soon',
            content: 'We\'re working on exciting new features including Academy courses, Supplies marketplace, and Financial services. Stay tuned!',
            summary: 'Exciting new features coming soon',
            type: 'update',
            priority: 'medium',
            status: 'published',
            targetAudience: 'all',
            publishedAt: new Date().toISOString(),
            isSticky: false,
            allowComments: true,
            requireAcknowledgment: false,
            author: 'system',
            authorName: 'LocalPro Team',
            authorRole: 'admin',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            _id: '3',
            id: '3',
            title: 'Profile Completion',
            content: 'Complete your profile to get better matches and increase your visibility to potential clients.',
            summary: 'Complete your profile for better visibility',
            type: 'general',
            priority: 'medium',
            status: 'published',
            targetAudience: 'all',
            publishedAt: new Date().toISOString(),
            isSticky: false,
            allowComments: true,
            requireAcknowledgment: false,
            author: 'system',
            authorName: 'LocalPro Team',
            authorRole: 'admin',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            _id: '4',
            id: '4',
            title: 'System Maintenance',
            content: 'Scheduled maintenance will occur tonight from 2 AM to 4 AM. Some features may be temporarily unavailable.',
            summary: 'Scheduled maintenance tonight',
            type: 'maintenance',
            priority: 'low',
            status: 'published',
            targetAudience: 'all',
            publishedAt: new Date().toISOString(),
            isSticky: false,
            allowComments: true,
            requireAcknowledgment: false,
            author: 'system',
            authorName: 'LocalPro Team',
            authorRole: 'admin',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        setAnnouncements(mockAnnouncements);
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
      
      // Call API to acknowledge/dismiss announcement
      await makeClientAuthenticatedRequestWithPathSafe(
        "announcementsAcknowledge" as keyof typeof API_ENDPOINTS,
        [id],
        {},
        { method: 'POST' }
      );
    } catch (error) {
      console.error('Error acknowledging announcement:', error);
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
    .filter(announcement => {
      const announcementId = announcement.id || announcement._id;
      // Filter by active status and not dismissed
      return (
        announcement.isActive !== false &&
        announcement.status === 'published' &&
        !dismissedIds.has(announcementId) &&
        !announcement.isExpired &&
        (!announcement.publishedAt || new Date(announcement.publishedAt) <= new Date()) &&
        (!announcement.expiresAt || new Date(announcement.expiresAt) >= new Date())
      );
    })
    .sort((a, b) => {
      // Sort sticky announcements first
      if (a.isSticky !== b.isSticky) {
        return a.isSticky ? -1 : 1;
      }
      
      // Sort by priority first, then by published date or creation date
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      // Use publishedAt if available, otherwise createdAt
      const aDate = a.publishedAt || a.createdAt;
      const bDate = b.publishedAt || b.createdAt;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

  // Debug logging
  console.log('Announcements state:', { 
    announcements: announcements.length, 
    visibleAnnouncements: visibleAnnouncements.length,
    loading, 
    error 
  });

  const displayAnnouncements = isCollapsed ? visibleAnnouncements.slice(0, 2) : visibleAnnouncements;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 text-center">
          <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (visibleAnnouncements.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 text-center">
          <Megaphone className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No announcements at the moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center">
            <Megaphone className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Announcements</h3>
            <p className="text-xs text-gray-500">Important updates and notifications</p>
          </div>
          {visibleAnnouncements.length > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
              {visibleAnnouncements.length}
            </span>
          )}
        </div>
        {visibleAnnouncements.length > 2 && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Announcements List */}
      <div className="max-h-96 overflow-y-auto">
        {displayAnnouncements.map((announcement) => {
          const announcementId = announcement.id || announcement._id;
          const isExpanded = expandedId === announcementId;
          const isLongContent = announcement.content.length > 100;
          const displayDate = announcement.publishedAt || announcement.createdAt;
          
          return (
            <div
              key={announcementId}
              className={`border-b border-gray-100 last:border-b-0 ${getAnnouncementStyles(announcement.type, announcement.priority)}`}
            >
              <div className="flex items-start gap-2">
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
                        {formatDate(displayDate)}
                      </span>
                      {(announcement.requireAcknowledgment || !announcement.isAcknowledged) && (
                        <button
                          onClick={() => handleDismiss(announcementId)}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          title={announcement.requireAcknowledgment ? "Acknowledge" : "Dismiss"}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Show summary if available, otherwise use content */}
                  {announcement.summary && (
                    <p className="text-xs mt-1 font-medium text-gray-700">
                      {announcement.summary}
                    </p>
                  )}
                  
                  <p className={`text-xs mt-1 leading-relaxed ${
                    isLongContent && !isExpanded ? 'line-clamp-2' : ''
                  }`}>
                    {announcement.content}
                  </p>
                  
                  {isLongContent && (
                    <button
                      onClick={() => toggleExpanded(announcementId)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-1 transition-colors"
                    >
                      {isExpanded ? 'Show less' : 'Read more'}
                    </button>
                  )}
                  
                  {/* Tags */}
                  {announcement.tags && announcement.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {announcement.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Attachments */}
                  {announcement.attachments && announcement.attachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {announcement.attachments.map((attachment, idx) => (
                        <a
                          key={idx}
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          {attachment.filename}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ))}
                    </div>
                  )}
                  
                  {/* Author info */}
                  {announcement.authorName && (
                    <div className="mt-2 text-xs text-gray-500">
                      By {announcement.authorName}
                      {announcement.authorRole && ` • ${announcement.authorRole}`}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {visibleAnnouncements.length > 2 && (
        <div className="p-3 border-t border-gray-100 bg-gray-50">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            {isCollapsed ? `Show ${visibleAnnouncements.length - 2} more announcements` : 'Show less'}
          </button>
        </div>
      )}
    </div>
  );
}
