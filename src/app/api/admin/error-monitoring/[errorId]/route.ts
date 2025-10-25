import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';

interface ErrorLog {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info' | 'critical';
  message: string;
  stack?: string;
  userId?: string;
  userEmail?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  userAgent?: string;
  ip?: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  tags: string[];
  environment: 'development' | 'staging' | 'production';
}

// Mock data - in production, this would come from a database
const mockErrors: ErrorLog[] = [
  {
    id: "1",
    timestamp: "2024-01-15T10:30:00Z",
    level: "critical",
    message: "Database connection failed",
    stack: "Error: Connection timeout\n    at Database.connect (/app/lib/db.js:45:12)\n    at async UserService.getUser (/app/services/user.js:23:8)",
    userId: "user123",
    userEmail: "user@example.com",
    endpoint: "/api/users",
    method: "GET",
    statusCode: 500,
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    ip: "192.168.1.1",
    resolved: false,
    tags: ["database", "connection"],
    environment: "production"
  },
  {
    id: "2",
    timestamp: "2024-01-15T09:15:00Z",
    level: "error",
    message: "Invalid authentication token",
    stack: "Error: Invalid token\n    at AuthService.verifyToken (/app/lib/auth.js:67:15)\n    at async AuthMiddleware.authenticate (/app/middleware/auth.js:12:8)",
    userId: "user456",
    userEmail: "user2@example.com",
    endpoint: "/api/auth/verify",
    method: "POST",
    statusCode: 401,
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    ip: "192.168.1.2",
    resolved: true,
    resolvedAt: "2024-01-15T09:20:00Z",
    resolvedBy: "admin@localpro.com",
    tags: ["auth", "security"],
    environment: "production"
  },
  {
    id: "3",
    timestamp: "2024-01-15T08:45:00Z",
    level: "warning",
    message: "High memory usage detected",
    stack: "Warning: Memory usage at 85%\n    at SystemMonitor.check (/app/monitor.js:23:8)\n    at async HealthCheck.run (/app/health.js:45:12)",
    resolved: false,
    tags: ["performance", "memory"],
    environment: "production"
  },
  {
    id: "4",
    timestamp: "2024-01-15T07:30:00Z",
    level: "error",
    message: "Payment processing failed",
    stack: "Error: Payment gateway timeout\n    at PaymentService.processPayment (/app/services/payment.js:89:12)\n    at async PaymentController.create (/app/controllers/payment.js:34:8)",
    userId: "user789",
    userEmail: "user3@example.com",
    endpoint: "/api/payments",
    method: "POST",
    statusCode: 500,
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15",
    ip: "192.168.1.3",
    resolved: false,
    tags: ["payment", "gateway"],
    environment: "production"
  },
  {
    id: "5",
    timestamp: "2024-01-15T06:15:00Z",
    level: "info",
    message: "User session expired",
    userId: "user101",
    userEmail: "user4@example.com",
    endpoint: "/api/auth/refresh",
    method: "POST",
    statusCode: 401,
    resolved: true,
    resolvedAt: "2024-01-15T06:16:00Z",
    resolvedBy: "system",
    tags: ["auth", "session"],
    environment: "production"
  }
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ errorId: string }> }
) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { errorId } = await params;
    const error = mockErrors.find(e => e.id === errorId);

    if (!error) {
      return NextResponse.json({ 
        success: false,
        error: 'Error not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      data: error 
    });

  } catch (error) {
    console.error('Error fetching error details:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
