"use client";

import { useState, useEffect } from "react";
import { 
  Megaphone, 
  Filter, 
  Search, 
  Calendar, 
  Clock, 
  X, 
  AlertCircle, 
  Info, 
  CheckCircle, 
  AlertTriangle, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Bell,
  BellOff
} from "lucide-react";
import ErrorBoundary from "@/components/error-boundary";
import { Loading } from "@/components/ui/loading";

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

const getAnnouncementStyles = (type: Announcement['type'], priority: Announcement['priority']) => {
  const baseStyles = "border-l-4 rounded-lg p-6 shadow-sm";
  
  const typeStyles = {
    info: "bg-blue-50 border-blue-500 text-blue-900",
    success: "bg-green-50 border-green-500 text-green-900",
    warning: "bg-yellow-50 border-yellow-500 text-yellow-900",
    error: "bg-red-50 border-red-500 text-red-900",
    feature: "bg-purple-50 border-purple-500 text-purple-900"
  };

  const priorityStyles = {
    low: "opacity-75",
    medium: "",
    high: "ring-2 ring-opacity-50",
    urgent: "ring-2 ring-red-500 ring-opacity-50"
  };

  return `${baseStyles} ${typeStyles[type]} ${priorityStyles[priority]}`;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getPriorityBadge = (priority: Announcement['priority']) => {
  const styles = {
    low: "bg-gray-100 text-gray-800",
    medium: "bg-blue-100 text-blue-800",
    high: "bg-orange-100 text-orange-800",
    urgent: "bg-red-100 text-red-800"
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[priority]}`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
};

const getTypeBadge = (type: Announcement['type']) => {
  const styles = {
    info: "bg-blue-100 text-blue-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    error: "bg-red-100 text-red-800",
    feature: "bg-purple-100 text-purple-800"
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[type]}`}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
  );
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [showDismissed, setShowDismissed] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
      } catch (err) {
        console.error('Error fetching announcements:', err);
        setError('Failed to load announcements');
        
        // Fallback to mock data for development
        setAnnouncements([
          {
            id: '1',
            title: 'Welcome to LocalPro!',
            message: 'We\'re excited to have you on board. Explore our marketplace to find local services and connect with professionals in your area. Start by completing your profile to get better matches and increase your visibility to potential clients.',
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
            message: 'We\'re working on exciting new features including Academy courses for skill development, Supplies marketplace for tools and materials, and Financial services for salary advances and micro-loans. Stay tuned for updates!',
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
            title: 'Complete Your Profile',
            message: 'Complete your profile to get better matches and increase your visibility to potential clients. Add your skills, experience, and portfolio to stand out from the competition.',
            type: 'warning',
            priority: 'medium',
            startDate: new Date().toISOString(),
            isActive: true,
            isDismissible: true,
            actionUrl: '/profile/edit',
            actionText: 'Complete Profile',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '4',
            title: 'LocalPro Plus Available',
            message: 'Upgrade to LocalPro Plus for premium features including priority listing, advanced analytics, and exclusive tools to grow your business.',
            type: 'feature',
            priority: 'low',
            startDate: new Date().toISOString(),
            isActive: true,
            isDismissible: true,
            actionUrl: '/plus',
            actionText: 'Learn More',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '5',
            title: 'System Maintenance',
            message: 'We\'ll be performing scheduled maintenance on Sunday, 2:00 AM - 4:00 AM PST. Some features may be temporarily unavailable during this time.',
            type: 'info',
            priority: 'medium',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            isActive: true,
            isDismissible: false,
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
      setDismissedIds(prev => new Set([...prev, id]));
      
      await fetch(`/api/announcements/${id}/dismiss`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Error dismissing announcement:', error);
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

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         announcement.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || announcement.type === typeFilter;
    const matchesPriority = priorityFilter === "all" || announcement.priority === priorityFilter;
    const matchesDismissed = showDismissed || !dismissedIds.has(announcement.id);
    
    return matchesSearch && matchesType && matchesPriority && matchesDismissed;
  });

  const activeAnnouncements = filteredAnnouncements.filter(announcement => 
    announcement.isActive && 
    new Date(announcement.startDate) <= new Date() &&
    (!announcement.endDate || new Date(announcement.endDate) >= new Date())
  );

  if (loading) {
    return (
      <div className="w-full">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
        </div>
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-gray-200 rounded"></div>
                  <div className="h-6 bg-gray-200 rounded w-48"></div>
                </div>
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && announcements.length === 0) {
    return (
      <div className="w-full">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Failed to Load Announcements</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Enhanced Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-lg">
                <Megaphone className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Announcements
                </h1>
                <p className="text-gray-600 text-lg mt-1">
                  Stay updated with the latest news, features, and important updates
                </p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{announcements.length}</div>
                <div className="text-sm text-gray-500">Total</div>
              </div>
              <div className="w-px h-12 bg-gray-300"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{activeAnnouncements.length}</div>
                <div className="text-sm text-gray-500">Active</div>
              </div>
              <div className="w-px h-12 bg-gray-300"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {announcements.filter(a => a.priority === 'urgent').length}
                </div>
                <div className="text-sm text-gray-500">Urgent</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">Filter & Search</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search announcements by title or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
          
          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="all">All Types</option>
              <option value="info">ℹ️ Info</option>
              <option value="success">✅ Success</option>
              <option value="warning">⚠️ Warning</option>
              <option value="error">❌ Error</option>
              <option value="feature">🚀 Feature</option>
            </select>
          </div>
          
          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="all">All Priorities</option>
              <option value="low">🟢 Low</option>
              <option value="medium">🟡 Medium</option>
              <option value="high">🟠 High</option>
              <option value="urgent">🔴 Urgent</option>
            </select>
          </div>
        </div>
        
        {/* Additional Options */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showDismissed"
              checked={showDismissed}
              onChange={(e) => setShowDismissed(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="showDismissed" className="text-sm text-gray-600">
              Show dismissed announcements
            </label>
          </div>
          
          <div className="text-sm text-gray-500">
            Showing {activeAnnouncements.length} of {announcements.length} announcements
          </div>
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-6">
        {activeAnnouncements.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Megaphone className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">No Announcements Found</h3>
            <p className="text-gray-600 text-lg mb-6 max-w-md mx-auto">
              {searchQuery || typeFilter !== "all" || priorityFilter !== "all" 
                ? "Try adjusting your filters to see more announcements."
                : "No announcements available at the moment. Check back later for updates!"}
            </p>
            {(searchQuery || typeFilter !== "all" || priorityFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setTypeFilter("all");
                  setPriorityFilter("all");
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          activeAnnouncements.map((announcement) => {
            const isExpanded = expandedId === announcement.id;
            const isLongMessage = announcement.message.length > 200;
            
            return (
              <div
                key={announcement.id}
                className={`bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 ${getAnnouncementStyles(announcement.type, announcement.priority)}`}
              >
                <div className="flex items-start gap-6 p-6">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white shadow-sm">
                      {getAnnouncementIcon(announcement.type)}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-3 text-gray-800">{announcement.title}</h3>
                        <div className="flex items-center gap-3 mb-4">
                          {getTypeBadge(announcement.type)}
                          {getPriorityBadge(announcement.priority)}
                          <span className="text-sm text-gray-500 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {formatDate(announcement.createdAt)}
                          </span>
                        </div>
                      </div>
                      
                      {announcement.isDismissible && (
                        <button
                          onClick={() => handleDismiss(announcement.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                          title="Dismiss announcement"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    
                    <p className={`text-gray-700 leading-relaxed mb-4 ${
                      isLongMessage && !isExpanded ? 'line-clamp-3' : ''
                    }`}>
                      {announcement.message}
                    </p>
                    
                    {isLongMessage && (
                      <button
                        onClick={() => toggleExpanded(announcement.id)}
                        className="text-blue-600 hover:text-blue-800 font-medium mb-4 transition-colors flex items-center gap-1"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-4 h-4" />
                            Show less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            Read more
                          </>
                        )}
                      </button>
                    )}
                    
                    {announcement.actionUrl && announcement.actionText && (
                      <div className="pt-4 border-t border-gray-200">
                        <a
                          href={announcement.actionUrl}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          {announcement.actionText}
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
