import { NextRequest } from 'next/server';
import { GET } from '../../users/stats/route';

// Mock dependencies
jest.mock('@/lib/server-session');

describe('/api/admin/users/stats', () => {
  const mockGetServerSession = require('@/lib/server-session').getServerSession;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 for unauthorized requests', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/admin/users/stats');
    const response = await GET(request);
    
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 403 for non-admin users', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: '1', role: 'client' }
    });

    const request = new NextRequest('http://localhost:3000/api/admin/users/stats');
    const response = await GET(request);
    
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe('Admin access required');
  });

  it('should return user statistics for admin users', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: '1', role: 'admin' }
    });

    const request = new NextRequest('http://localhost:3000/api/admin/users/stats');
    const response = await GET(request);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.totalUsers).toBe(150);
    expect(data.data.activeUsers).toBe(120);
    expect(data.data.pendingUsers).toBe(15);
    expect(data.data.suspendedUsers).toBe(5);
  });

  it('should handle different period parameters', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: '1', role: 'admin' }
    });

    const request = new NextRequest('http://localhost:3000/api/admin/users/stats?period=month');
    const response = await GET(request);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('should handle errors gracefully', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: '1', role: 'admin' }
    });

    // Mock console.error to avoid noise in tests
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Simulate an error by making getServerSession throw
    mockGetServerSession.mockRejectedValue(new Error('Database connection failed'));

    const request = new NextRequest('http://localhost:3000/api/admin/users/stats');
    const response = await GET(request);
    
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Internal server error');

    consoleSpy.mockRestore();
  });

  it('should return mock data structure', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: '1', role: 'admin' }
    });

    const request = new NextRequest('http://localhost:3000/api/admin/users/stats');
    const response = await GET(request);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    
    expect(data.data).toHaveProperty('totalUsers');
    expect(data.data).toHaveProperty('activeUsers');
    expect(data.data).toHaveProperty('pendingUsers');
    expect(data.data).toHaveProperty('suspendedUsers');
    expect(data.data).toHaveProperty('newUsersToday');
    expect(data.data).toHaveProperty('trends');
    expect(data.data).toHaveProperty('topRoles');
    expect(data.data).toHaveProperty('statusStats');
    expect(data.data).toHaveProperty('performanceMetrics');
    
    expect(data.data.trends).toHaveProperty('daily');
    expect(data.data.trends).toHaveProperty('weekly');
    expect(data.data.trends).toHaveProperty('monthly');
    
    expect(data.data.performanceMetrics).toHaveProperty('averageRegistrationTime');
    expect(data.data.performanceMetrics).toHaveProperty('medianRegistrationTime');
    expect(data.data.performanceMetrics).toHaveProperty('p95RegistrationTime');
  });
});
