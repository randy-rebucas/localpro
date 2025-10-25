import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';

interface DashboardSummary {
  totalErrors: number;
  criticalErrors: number;
  unresolvedErrors: number;
  todayErrors: number;
  weekErrors: number;
  errorRate: number;
  avgResolutionTime: number;
  topErrorTypes: Array<{ type: string; count: number }>;
  recentErrors: Array<{
    id: string;
    message: string;
    level: string;
    timestamp: string;
    resolved: boolean;
  }>;
  systemHealth: 'healthy' | 'warning' | 'critical';
  alerts: Array<{
    type: 'critical' | 'warning' | 'info';
    message: string;
    count: number;
  }>;
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

    // Calculate basic metrics
    const totalErrors = mockErrors.length;
    const criticalErrors = mockErrors.filter(e => e.level === 'critical').length;
    const unresolvedErrors = mockErrors.filter(e => !e.resolved).length;

    // Time-based calculations
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const todayErrors = mockErrors.filter(e => {
      const errorDate = new Date(e.timestamp);
      return errorDate >= today;
    }).length;

    const weekErrors = mockErrors.filter(e => {
      const errorDate = new Date(e.timestamp);
      return errorDate >= weekAgo;
    }).length;

    // Calculate error rate (errors per hour)
    const errorRate = weekErrors / (7 * 24); // errors per hour

    // Calculate average resolution time (mock data)
    const avgResolutionTime = 15; // minutes

    // Top error types
    const errorCounts: { [key: string]: number } = {};
    mockErrors.forEach(error => {
      errorCounts[error.message] = (errorCounts[error.message] || 0) + 1;
    });
    const topErrorTypes = Object.entries(errorCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Recent errors (last 5)
    const recentErrors = mockErrors
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5)
      .map(error => ({
        id: error.id,
        message: error.message,
        level: error.level,
        timestamp: error.timestamp,
        resolved: error.resolved
      }));

    // Determine system health
    let systemHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (criticalErrors > 0) {
      systemHealth = 'critical';
    } else if (unresolvedErrors > 3) {
      systemHealth = 'warning';
    }

    // Generate alerts
    const alerts = [];
    if (criticalErrors > 0) {
      alerts.push({
        type: 'critical' as const,
        message: `${criticalErrors} critical error${criticalErrors > 1 ? 's' : ''} require${criticalErrors === 1 ? 's' : ''} immediate attention`,
        count: criticalErrors
      });
    }
    if (unresolvedErrors > 5) {
      alerts.push({
        type: 'warning' as const,
        message: `${unresolvedErrors} unresolved errors need attention`,
        count: unresolvedErrors
      });
    }
    if (todayErrors > 10) {
      alerts.push({
        type: 'info' as const,
        message: `${todayErrors} errors occurred today`,
        count: todayErrors
      });
    }

    const summary: DashboardSummary = {
      totalErrors,
      criticalErrors,
      unresolvedErrors,
      todayErrors,
      weekErrors,
      errorRate: Math.round(errorRate * 100) / 100,
      avgResolutionTime,
      topErrorTypes,
      recentErrors,
      systemHealth,
      alerts
    };

    return NextResponse.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
