import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';

interface ErrorStats {
  total: number;
  critical: number;
  errors: number;
  warnings: number;
  resolved: number;
  unresolved: number;
  todayCount: number;
  weekCount: number;
  monthCount: number;
  trends: {
    daily: Array<{ date: string; count: number }>;
    weekly: Array<{ week: string; count: number }>;
    monthly: Array<{ month: string; count: number }>;
  };
  topErrors: Array<{ message: string; count: number }>;
  environmentStats: Array<{ environment: string; count: number }>;
  levelDistribution: Array<{ level: string; count: number; percentage: number }>;
  resolutionTime: {
    average: number;
    median: number;
    p95: number;
  };
}

// Mock data - in production, this would come from a database
const mockErrors = [
  {
    id: "1",
    timestamp: "2024-01-15T10:30:00Z",
    level: "critical",
    message: "Database connection failed",
    resolved: false,
    environment: "production"
  },
  {
    id: "2",
    timestamp: "2024-01-15T09:15:00Z",
    level: "error",
    message: "Invalid authentication token",
    resolved: true,
    resolvedAt: "2024-01-15T09:20:00Z",
    environment: "production"
  },
  {
    id: "3",
    timestamp: "2024-01-15T08:45:00Z",
    level: "warning",
    message: "High memory usage detected",
    resolved: false,
    environment: "production"
  },
  {
    id: "4",
    timestamp: "2024-01-14T15:30:00Z",
    level: "error",
    message: "Payment processing failed",
    resolved: true,
    resolvedAt: "2024-01-14T15:35:00Z",
    environment: "production"
  },
  {
    id: "5",
    timestamp: "2024-01-14T12:15:00Z",
    level: "info",
    message: "User session expired",
    resolved: true,
    resolvedAt: "2024-01-14T12:16:00Z",
    environment: "staging"
  },
  {
    id: "6",
    timestamp: "2024-01-13T18:45:00Z",
    level: "error",
    message: "Database connection failed",
    resolved: true,
    resolvedAt: "2024-01-13T18:50:00Z",
    environment: "production"
  },
  {
    id: "7",
    timestamp: "2024-01-13T14:20:00Z",
    level: "warning",
    message: "High memory usage detected",
    resolved: false,
    environment: "staging"
  },
  {
    id: "8",
    timestamp: "2024-01-12T11:30:00Z",
    level: "critical",
    message: "Service unavailable",
    resolved: true,
    resolvedAt: "2024-01-12T11:45:00Z",
    environment: "production"
  }
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Note: period parameter could be used for filtering data in the future
    // const { searchParams } = new URL(request.url);
    // const period = searchParams.get('period') || 'week'; // day, week, month, year

    // Calculate basic stats
    const total = mockErrors.length;
    const critical = mockErrors.filter(e => e.level === 'critical').length;
    const errors = mockErrors.filter(e => e.level === 'error').length;
    const warnings = mockErrors.filter(e => e.level === 'warning').length;
    const resolved = mockErrors.filter(e => e.resolved).length;
    const unresolved = mockErrors.filter(e => !e.resolved).length;

    // Calculate time-based counts
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const todayCount = mockErrors.filter(e => {
      const errorDate = new Date(e.timestamp);
      return errorDate >= today;
    }).length;

    const weekCount = mockErrors.filter(e => {
      const errorDate = new Date(e.timestamp);
      return errorDate >= weekAgo;
    }).length;

    const monthCount = mockErrors.filter(e => {
      const errorDate = new Date(e.timestamp);
      return errorDate >= monthAgo;
    }).length;

    // Calculate trends
    const dailyTrends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const count = mockErrors.filter(e => {
        const errorDate = new Date(e.timestamp);
        return errorDate.toISOString().split('T')[0] === dateStr;
      }).length;
      dailyTrends.push({ date: dateStr, count });
    }

    // Top errors by frequency
    const errorCounts: { [key: string]: number } = {};
    mockErrors.forEach(error => {
      errorCounts[error.message] = (errorCounts[error.message] || 0) + 1;
    });
    const topErrors = Object.entries(errorCounts)
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Environment stats
    const envCounts: { [key: string]: number } = {};
    mockErrors.forEach(error => {
      envCounts[error.environment] = (envCounts[error.environment] || 0) + 1;
    });
    const environmentStats = Object.entries(envCounts)
      .map(([environment, count]) => ({ environment, count }));

    // Level distribution
    const levelCounts: { [key: string]: number } = {};
    mockErrors.forEach(error => {
      levelCounts[error.level] = (levelCounts[error.level] || 0) + 1;
    });
    const levelDistribution = Object.entries(levelCounts)
      .map(([level, count]) => ({
        level,
        count,
        percentage: Math.round((count / total) * 100)
      }));

    // Resolution time (mock data)
    const resolutionTime = {
      average: 15, // minutes
      median: 12,
      p95: 45
    };

    const stats: ErrorStats = {
      total,
      critical,
      errors,
      warnings,
      resolved,
      unresolved,
      todayCount,
      weekCount,
      monthCount,
      trends: {
        daily: dailyTrends,
        weekly: [], // Would be calculated for weekly trends
        monthly: [] // Would be calculated for monthly trends
      },
      topErrors,
      environmentStats,
      levelDistribution,
      resolutionTime
    };

    return NextResponse.json({ stats });

  } catch (error) {
    console.error('Error fetching error statistics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
