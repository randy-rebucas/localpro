import { NextRequest } from 'next/server';
import { GET } from '../route';

// Mock dependencies
jest.mock('@/lib/server-session');
jest.mock('@/lib/api-auth-utils');

describe('/api/admin/marketplace/stats', () => {
  it('should return 401 for unauthorized requests', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/marketplace/stats');
    const response = await GET(request);
    
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 403 for non-admin users', async () => {
    // Mock session with non-admin user
    const mockGetServerSession = require('@/lib/server-session').getServerSession;
    mockGetServerSession.mockResolvedValue({
      user: { id: '1', role: 'client' }
    });

    const request = new NextRequest('http://localhost:3000/api/admin/marketplace/stats');
    const response = await GET(request);
    
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe('Admin access required');
  });

  it('should return marketplace statistics for admin users', async () => {
    // Mock session with admin user
    const mockGetServerSession = require('@/lib/server-session').getServerSession;
    mockGetServerSession.mockResolvedValue({
      user: { id: '1', role: 'admin' }
    });

    // Mock API response with real data structure
    const mockMakeAuthenticatedRequestWithPath = require('@/lib/api-auth-utils').makeAuthenticatedRequestWithPath;
    mockMakeAuthenticatedRequestWithPath.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ 
        success: true,
        data: {
          totalServices: 100,
          activeServices: 80,
          pendingServices: 15,
          rejectedServices: 5,
          totalBookings: 1250,
          totalRevenue: 125000,
          averageRating: 4.6,
          topCategory: 'CLEANING',
          growthRate: 15.5,
          todayCount: 10,
          weekCount: 50,
          monthCount: 100,
          trends: { 
            daily: [], 
            weekly: [], 
            monthly: [] 
          },
          topServices: [],
          categoryStats: [],
          performanceMetrics: { 
            averageBookings: 10, 
            averageRevenue: 1000, 
            conversionRate: 0.8 
          }
        }
      })
    });

    const request = new NextRequest('http://localhost:3000/api/admin/marketplace/stats');
    const response = await GET(request);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toBeDefined();
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.totalServices).toBe(100);
  });

  it('should handle external API errors', async () => {
    const mockGetServerSession = require('@/lib/server-session').getServerSession;
    mockGetServerSession.mockResolvedValue({
      user: { id: '1', role: 'admin' }
    });

    const mockMakeAuthenticatedRequestWithPath = require('@/lib/api-auth-utils').makeAuthenticatedRequestWithPath;
    mockMakeAuthenticatedRequestWithPath.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'External API error' })
    });

    const request = new NextRequest('http://localhost:3000/api/admin/marketplace/stats');
    const response = await GET(request);
    
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('External API error');
  });

  it('should handle timeout errors', async () => {
    const mockGetServerSession = require('@/lib/server-session').getServerSession;
    mockGetServerSession.mockResolvedValue({
      user: { id: '1', role: 'admin' }
    });

    const mockMakeAuthenticatedRequestWithPath = require('@/lib/api-auth-utils').makeAuthenticatedRequestWithPath;
    mockMakeAuthenticatedRequestWithPath.mockRejectedValue(new Error('AbortError'));

    const request = new NextRequest('http://localhost:3000/api/admin/marketplace/stats');
    const response = await GET(request);
    
    expect(response.status).toBe(504);
    const data = await response.json();
    expect(data.error).toBe('Request timeout - the external service is taking too long to respond');
  });

  it('should handle connection errors', async () => {
    const mockGetServerSession = require('@/lib/server-session').getServerSession;
    mockGetServerSession.mockResolvedValue({
      user: { id: '1', role: 'admin' }
    });

    const mockMakeAuthenticatedRequestWithPath = require('@/lib/api-auth-utils').makeAuthenticatedRequestWithPath;
    mockMakeAuthenticatedRequestWithPath.mockRejectedValue(new Error('fetch failed'));

    const request = new NextRequest('http://localhost:3000/api/admin/marketplace/stats');
    const response = await GET(request);
    
    expect(response.status).toBe(503);
    const data = await response.json();
    expect(data.error).toBe('Unable to connect to external service - please try again later');
  });

  it('should include period parameter in request', async () => {
    const mockGetServerSession = require('@/lib/server-session').getServerSession;
    mockGetServerSession.mockResolvedValue({
      user: { id: '1', role: 'admin' }
    });

    const mockMakeAuthenticatedRequestWithPath = require('@/lib/api-auth-utils').makeAuthenticatedRequestWithPath;
    mockMakeAuthenticatedRequestWithPath.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: {} })
    });

    const request = new NextRequest('http://localhost:3000/api/admin/marketplace/stats?period=month');
    const response = await GET(request);
    
    expect(response.status).toBe(200);
    expect(mockMakeAuthenticatedRequestWithPath).toHaveBeenCalledWith(
      expect.any(Object),
      'analyticsMarketplace',
      [],
      { period: 'month' },
      { method: 'GET' }
    );
  });
});
