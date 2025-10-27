import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { makeAuthenticatedRequestWithEndpoint, makeAuthenticatedRequestWithPath, handleApiRoute } from '@/lib/api-auth-utils';
import { API_ENDPOINTS } from '@/lib/api';

// Cache for analytics data
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds cache for real-time data

// Helper function to get cached data or fetch fresh data
async function getCachedOrFetch<T>(
  cacheKey: string, 
  fetchFn: () => Promise<T>,
  cacheDuration: number = CACHE_DURATION
): Promise<T> {
  const cached = cache.get(cacheKey);
  const now = Date.now();
  
  if (cached && (now - cached.timestamp) < cacheDuration) {
    return cached.data as T;
  }
  
  try {
    const data = await fetchFn();
    cache.set(cacheKey, { data, timestamp: now });
    return data;
  } catch (error) {
    // If fetch fails but we have cached data, return it even if expired
    if (cached) {
      console.warn('Analytics API request failed, returning stale cache:', error);
      return cached.data as T;
    }
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';
    const period = searchParams.get('period') || '7d';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const granularity = searchParams.get('granularity') || 'hour';

    // Create cache key based on request parameters
    const cacheKey = `analytics-${type}-${period}-${startDate || 'none'}-${endDate || 'none'}-${granularity}`;
    
    // Fetch analytics data from external API with caching
    const result = await handleApiRoute(async () => {
      return await getCachedOrFetch(cacheKey, async () => {
        const queryParams: Record<string, string> = {};
        if (period) queryParams.period = period;
        if (startDate) queryParams.startDate = startDate;
        if (endDate) queryParams.endDate = endDate;
        if (granularity) queryParams.granularity = granularity;

        let endpoint: keyof typeof API_ENDPOINTS;
        
        switch (type) {
          case 'realtime':
            endpoint = 'analyticsRealTime';
            break;
          case 'performance':
            endpoint = 'analyticsPerformance';
            break;
          case 'user-behavior':
            endpoint = 'analyticsUserBehavior';
            break;
          case 'revenue':
            endpoint = 'analyticsRevenue';
            break;
          case 'conversion':
            endpoint = 'analyticsConversion';
            break;
          case 'dashboard':
            endpoint = 'analyticsDashboard';
            break;
          default:
            endpoint = 'analyticsOverview';
        }

        const response = await makeAuthenticatedRequestWithPath(
          request,
          endpoint,
          [],
          queryParams,
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch ${type} analytics: ${response.status}`);
        }

        const analyticsData = await response.json();
        return analyticsData.data || analyticsData;
      }, type === 'realtime' ? 10000 : 30000); // Shorter cache for real-time data
    }, "Analytics data");

    if (result.error) {
      console.error('Analytics admin API error:', result.error);
      
      // Provide more specific error messages
      let errorMessage = result.error;
      let statusCode = 500;
      
      if (result.error.includes('Failed to fetch') && result.error.includes('analytics')) {
        errorMessage = 'Unable to fetch analytics data. The external API may be experiencing issues.';
        statusCode = 503; // Service Unavailable
      } else if (result.error.includes('timed out')) {
        errorMessage = 'Analytics request timed out. Please try again.';
        statusCode = 504; // Gateway Timeout
      } else if (result.error.includes('Unauthorized')) {
        errorMessage = 'Authentication required to access analytics data.';
        statusCode = 401;
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          success: false,
          timestamp: new Date().toISOString()
        },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      type,
      period,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analytics admin API error:', error);
    
    let errorMessage = 'Failed to fetch analytics data';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('timed out')) {
        errorMessage = 'Analytics request timed out. Please try again.';
        statusCode = 504;
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, data } = body;

    // Handle different analytics actions
    const result = await handleApiRoute(async () => {
      switch (action) {
        case 'track_event':
          const trackResponse = await makeAuthenticatedRequestWithEndpoint(
            request,
            'analyticsTrack',
            {
              method: 'POST',
              body: JSON.stringify(data)
            }
          );

          if (!trackResponse.ok) {
            throw new Error(`Failed to track event: ${trackResponse.status}`);
          }

          return await trackResponse.json();

        case 'export_data':
          const exportResponse = await makeAuthenticatedRequestWithPath(
            request,
            'analyticsDashboard',
            [],
            { format: data.format || 'json', ...data.filters },
            { method: 'GET' }
          );

          if (!exportResponse.ok) {
            throw new Error(`Failed to export data: ${exportResponse.status}`);
          }

          return await exportResponse.json();

        default:
          throw new Error(`Unknown action: ${action}`);
      }
    }, "Analytics action");

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Analytics admin POST API error:', error);
    return NextResponse.json(
      { error: 'Failed to process analytics action' },
      { status: 500 }
    );
  }
}