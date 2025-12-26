/**
 * @deprecated This file is maintained for backward compatibility.
 * Please import from '@/features/announcements/components/announcement-card' instead.
 */
export * from '@/features/announcements/components/announcement-card';

import { useMemo } from "react";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { 
  Megaphone, 
  AlertCircle, 
  AlertTriangle, 
  Shield, 
  Gift, 
  FileText, 
  Calendar, 
  Bell, 
  Wrench, 
  Star,
  Clock,
  ExternalLink
} from "lucide-react";
import { AnnouncementType, Priority } from "@/types/announcements";
import Link from "next/link";

// Helper function to get announcement icon based on type
function getAnnouncementIcon(type?: AnnouncementType) {
  switch (type) {
    case 'system':
      return <AlertCircle className="w-5 h-5 text-primary" />;
    case 'maintenance':
      return <Wrench className="w-5 h-5 text-orange-600" />;
    case 'feature':
      return <Star className="w-5 h-5 text-purple-600 fill-purple-600/20" />;
    case 'security':
      return <Shield className="w-5 h-5 text-red-600" />;
    case 'promotion':
      return <Gift className="w-5 h-5 text-yellow-600" />;
    case 'policy':
      return <FileText className="w-5 h-5 text-primary" />;
    case 'event':
      return <Calendar className="w-5 h-5 text-accent" />;
    case 'emergency':
      return <AlertTriangle className="w-5 h-5 text-red-600" />;
    case 'update':
      return <Bell className="w-5 h-5 text-primary" />;
    default:
      return <Megaphone className="w-5 h-5 text-gray-600" />;
  }
}

// Helper function to get announcement styles based on type and priority
function getAnnouncementStyles(type?: AnnouncementType, priority?: Priority) {
  const typeStyles: Record<AnnouncementType | 'general', string> = {
    system: "bg-gradient-to-br from-primary/10 to-primary/10/50 border border-primary/60",
    maintenance: "bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200/60",
    feature: "bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200/60",
    security: "bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200/60",
    promotion: "bg-gradient-to-br from-yellow-50 to-yellow-100/50 border border-yellow-200/60",
    policy: "bg-gradient-to-br from-primary/5 to-primary/50 border border-primary/60",
    event: "bg-gradient-to-br from-accent/10 to-accent/10/50 border border-accent/60",
    emergency: "bg-gradient-to-br from-red-100 to-red-200/50 border-2 border-red-400 ring-2 ring-red-200/50",
    update: "bg-gradient-to-br from-primary/10 to-primary/10/50 border border-primary/60",
    general: "bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200/60"
  };
  
  const priorityBorder: Record<Priority, string> = {
    urgent: "border-l-[5px] border-red-500",
    high: "border-l-[5px] border-orange-500",
    medium: "border-l-[5px] border-yellow-500",
    low: "border-l-[5px] border-primary"
  };
  
  return `${typeStyles[type || 'general']} ${priorityBorder[priority || 'medium']} rounded-lg`;
}

// Helper function to get priority badge
function getPriorityBadge(priority?: Priority) {
  switch (priority) {
    case 'urgent':
      return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-red-100 text-red-800 border border-red-200">Urgent</span>;
    case 'high':
      return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">High</span>;
    case 'medium':
      return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">Medium</span>;
    case 'low':
      return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary/20">Low</span>;
    default:
      return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">Medium</span>;
  }
}

// Helper function to format date
function formatDate(dateString?: string | Date | null) {
  if (!dateString) return 'N/A';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function AnnouncementCard() {
  // Memoize params to prevent unnecessary re-fetches
  const announcementParams = useMemo(() => ({
    status: 'published',
    limit: 1,
    sortBy: 'publishedAt',
    sortOrder: 'desc' as const
  }), []);

  const { announcements, loading, error } = useAnnouncements(announcementParams);

  // Get the latest announcement
  const latestAnnouncement = useMemo(() => {
    // Ensure announcements is an array before processing
    if (!announcements || !Array.isArray(announcements) || announcements.length === 0) return null;
    
    // Sort to get the latest: sticky first, then by priority, then by date
    const sorted = [...announcements].sort((a, b) => {
      // Sticky announcements first
      if (a.isSticky && !b.isSticky) return -1;
      if (!a.isSticky && b.isSticky) return 1;
      
      // Then by priority
      const priorityOrder: Record<Priority, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority || 'medium'] || 0;
      const bPriority = priorityOrder[b.priority || 'medium'] || 0;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      // Finally by published date
      const aDate = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const bDate = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return bDate - aDate;
    });
    
    return sorted[0]; // Return only the latest one
  }, [announcements]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-1.5 bg-gray-100 rounded-lg">
            <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-5 bg-gray-200 rounded w-40 animate-pulse"></div>
        </div>
        <div className="border-l-4 border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-lg p-5 animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-1.5 bg-red-50 rounded-lg">
            <Megaphone className="w-4 h-4 text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Announcements</h2>
        </div>
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          Failed to load announcements. Please try again later.
        </div>
      </div>
    );
  }

  if (!latestAnnouncement) {
    return null;
  }

  const announcementId = latestAnnouncement._id;
  if (!announcementId) return null;
  
  const publishedDate = latestAnnouncement.publishedAt || latestAnnouncement.createdAt;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
      <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-primary/5 rounded-lg">
            <Megaphone className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Latest Announcement</h2>
        </div>
        <Link 
          href="/announcements"
          className="text-sm font-medium text-primary hover:text-primary flex items-center gap-1.5 transition-colors duration-200"
        >
          View all
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
      
      <Link
        href={`/announcements/${announcementId}`}
        className="block"
      >
        <div
          className={`${getAnnouncementStyles(latestAnnouncement.type, latestAnnouncement.priority)} p-5 transition-all duration-200 hover:shadow-lg cursor-pointer`}
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-0.5 p-2 bg-white/60 rounded-lg backdrop-blur-sm">
              {getAnnouncementIcon(latestAnnouncement.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <h3 className="text-base font-semibold text-gray-900 leading-snug group-hover:text-gray-950 transition-colors">
                  {latestAnnouncement.title}
                </h3>
                {latestAnnouncement.isSticky && (
                  <span className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md">
                    <Star className="w-3 h-3 fill-amber-400" />
                    Pinned
                  </span>
                )}
              </div>
              
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-3.5">
                {latestAnnouncement.summary || latestAnnouncement.content}
              </p>
              
              <div className="flex items-center gap-3 flex-wrap">
                {getPriorityBadge(latestAnnouncement.priority)}
                <span className="text-xs text-gray-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDate(publishedDate)}
                </span>
                <span className="text-xs font-medium text-primary flex items-center gap-1 ml-auto">
                  Read more
                  <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

