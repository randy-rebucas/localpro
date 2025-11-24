"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  AlertCircle, 
  Info, 
  CheckCircle, 
  AlertTriangle,
  Radio,
  ExternalLink,
  Gift
} from "lucide-react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { Broadcaster as BroadcasterType } from "@/types/broadcaster";
import { useRoleAccess } from "@/components/role-guard";

interface BroadcasterProps {
  className?: string;
  maxHeight?: string;
}

export function Broadcaster({ className = "", maxHeight = "400px" }: BroadcasterProps) {
  const { isClient } = useRoleAccess();
  const [broadcasts, setBroadcasts] = useState<BroadcasterType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Load dismissed IDs from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = JSON.parse(localStorage.getItem('dismissedBroadcasts') || '[]');
      setDismissedIds(new Set(dismissed));
    }
  }, []);

  useEffect(() => {
    // Only fetch broadcasts for clients
    if (!isClient) {
      setLoading(false);
      return;
    }

    const fetchBroadcasts = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${API_BASE_URL}${API_ENDPOINTS.broadcasterActive}`,
          createAuthFetchOptions({ method: 'GET' })
        );

        if (response.ok) {
          const result = await response.json();
          const allBroadcasts = result.data || result || [];
          
          // Get current dismissed IDs from localStorage
          const dismissed = typeof window !== 'undefined' 
            ? JSON.parse(localStorage.getItem('dismissedBroadcasts') || '[]')
            : [];
          const dismissedSet = new Set(dismissed);
          
          const activeBroadcasts = allBroadcasts.filter(
            (b: BroadcasterType) => {
              const isActiveStatus = b.status === 'active' || b.status === 'published';
              const notDismissed = !dismissedSet.has(b._id);
              const notExpired = !b.endDate || new Date(b.endDate) > new Date();
              const hasStarted = !b.startDate || new Date(b.startDate) <= new Date();
              return isActiveStatus && notDismissed && notExpired && hasStarted;
            }
          );
          
          // Sort by priority and sticky status
          activeBroadcasts.sort((a: BroadcasterType, b: BroadcasterType) => {
            if (a.isSticky && !b.isSticky) return -1;
            if (!a.isSticky && b.isSticky) return 1;
            
            const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          });
          
          setBroadcasts(activeBroadcasts);
          
          // Track views for each broadcast
          activeBroadcasts.forEach((broadcast: BroadcasterType) => {
            trackView(broadcast._id);
          });
        }
      } catch (error) {
        logger.error('Error fetching broadcasts', error instanceof Error ? error : new Error(String(error)));
      } finally {
        setLoading(false);
      }
    };

    fetchBroadcasts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient]);

  const trackView = async (broadcastId: string) => {
    try {
      await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.broadcasterView}/${broadcastId}/view`,
        createAuthFetchOptions({ method: 'POST' })
      );
    } catch (error) {
      // Silently fail - view tracking is not critical
      const err = error instanceof Error ? error : new Error(String(error));
      logger.warn('Failed to track broadcast view', {
        error: err.message,
        errorName: err.name
      });
    }
  };

  const trackClick = async (broadcastId: string) => {
    try {
      await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.broadcasterClick}/${broadcastId}/click`,
        createAuthFetchOptions({ method: 'POST' })
      );
    } catch (error) {
      // Silently fail - click tracking is not critical
      const err = error instanceof Error ? error : new Error(String(error));
      logger.warn('Failed to track broadcast click', {
        error: err.message,
        errorName: err.name
      });
    }
  };

  const handleDismiss = (broadcastId: string) => {
    setDismissedIds(prev => new Set([...prev, broadcastId]));
    setBroadcasts(prev => prev.filter(b => b._id !== broadcastId));
    
    // Store dismissed ID in localStorage to persist across sessions
    if (typeof window !== 'undefined') {
      const dismissed = JSON.parse(localStorage.getItem('dismissedBroadcasts') || '[]');
      if (!dismissed.includes(broadcastId)) {
        dismissed.push(broadcastId);
        localStorage.setItem('dismissedBroadcasts', JSON.stringify(dismissed));
      }
    }
  };

  // Don't render if not a client or no broadcasts
  if (!isClient || loading || broadcasts.length === 0) {
    return null;
  }

  const getIcon = (type: BroadcasterType['type']) => {
    switch (type) {
      case 'promotion':
        return Gift;
      case 'update':
        return AlertTriangle;
      case 'announcement':
      case 'news':
      case 'event':
      case 'general':
      default:
        return Info;
    }
  };

  const getTypeStyles = (type: BroadcasterType['type']) => {
    switch (type) {
      case 'promotion':
        return 'bg-purple-50 border-purple-300 text-purple-900';
      case 'update':
        return 'bg-yellow-50 border-yellow-300 text-yellow-900';
      case 'announcement':
      case 'news':
      case 'event':
      case 'general':
      default:
        return 'bg-blue-50 border-blue-300 text-blue-900';
    }
  };

  return (
    <div className={`broadcaster-container ${className}`}>
      {broadcasts.map((broadcast) => {
        const Icon = getIcon(broadcast.type);
        const typeStyles = getTypeStyles(broadcast.type);
        
        return (
          <div
            key={broadcast._id}
            className={`relative rounded-md border-2 p-3 mb-3 shadow-sm ${typeStyles} ${broadcast.isSticky ? 'ring-1 ring-offset-1 ring-opacity-50' : ''}`}
          >
            <div className="flex items-start gap-2.5">
              <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h3 className="font-semibold text-sm leading-tight">{broadcast.title}</h3>
                  <button
                    onClick={() => handleDismiss(broadcast._id)}
                    className="flex-shrink-0 p-1 hover:bg-black/10 rounded transition-colors"
                    aria-label="Dismiss broadcast"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm leading-snug mb-2 whitespace-pre-wrap break-words">
                  {broadcast.message || broadcast.description || broadcast.content || 'No message provided'}
                </p>
                {(broadcast.actionUrl || broadcast.link?.url) && (broadcast.actionText || broadcast.link?.text) && (
                  <a
                    href={broadcast.actionUrl || broadcast.link?.url}
                    target={broadcast.link?.openInNewTab !== false ? "_blank" : undefined}
                    rel={broadcast.link?.openInNewTab !== false ? "noopener noreferrer" : undefined}
                    onClick={() => trackClick(broadcast._id)}
                    className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-800 underline hover:no-underline transition-colors"
                  >
                    {broadcast.actionText || broadcast.link?.text}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {(broadcast.images && broadcast.images.length > 0) || broadcast.imageUrl ? (
                  <div className="mt-2.5">
                    <img
                      src={broadcast.images && broadcast.images.length > 0 ? broadcast.images[0].url : broadcast.imageUrl}
                      alt={broadcast.images && broadcast.images.length > 0 ? broadcast.images[0].alt || broadcast.title : broadcast.title}
                      className="rounded-md max-w-full h-auto shadow-sm"
                    />
                  </div>
                ) : null}
              </div>
            </div>
            {broadcast.isSticky && (
              <div className="absolute top-2 right-2">
                <Radio className="w-4 h-4 opacity-60" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

