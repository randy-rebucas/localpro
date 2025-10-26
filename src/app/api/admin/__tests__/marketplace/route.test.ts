import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

// Mock dependencies
jest.mock('@/lib/server-session');
jest.mock('@/lib/api-auth-utils');

describe('/api/admin/marketplace', () => {
  it('should return 401 for unauthorized requests', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/marketplace');
    const response = await GET(request);
    
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 403 for non-admin users', async () => {
    // Mock session with non-admin user
    const { getServerSession } = await import('@/lib/server-session');
    const mockGetServerSession = jest.mocked(getServerSession);
    mockGetServerSession.mockResolvedValue({
      user: { id: '1', role: 'client' }
    });

    const request = new NextRequest('http://localhost:3000/api/admin/marketplace');
    const response = await GET(request);
    
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe('Admin access required');
  });

  it('should return marketplace data for admin users', async () => {
    // Mock session with admin user
    const { getServerSession } = await import('@/lib/server-session');
    const mockGetServerSession = jest.mocked(getServerSession);
    mockGetServerSession.mockResolvedValue({
      user: { id: '1', role: 'admin' }
    });

    // Mock API response with real data structure
    const { makeAuthenticatedRequestWithPath } = await import('@/lib/api-auth-utils');
    const mockMakeAuthenticatedRequestWithPath = jest.mocked(makeAuthenticatedRequestWithPath);
    mockMakeAuthenticatedRequestWithPath.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ 
        data: [
          { 
            id: '1', 
            name: 'Test Service', 
            description: 'Test description',
            category: 'CLEANING',
            price: 100,
            rating: 4.5,
            reviewCount: 10,
            provider: { name: 'John Doe', id: 'provider-1' },
            status: 'active', 
            createdAt: '2024-01-01', 
            updatedAt: '2024-01-01',
            bookings: 50,
            revenue: 5000
          }
        ],
        total: 1,
        page: 1,
        limit: 10
      })
    });

    const request = new NextRequest('http://localhost:3000/api/admin/marketplace');
    const response = await GET(request);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toBeDefined();
    expect(data.data).toBeDefined();
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('should handle external API errors', async () => {
    const { getServerSession } = await import('@/lib/server-session');
    const mockGetServerSession = jest.mocked(getServerSession);
    mockGetServerSession.mockResolvedValue({
      user: { id: '1', role: 'admin' }
    });

    const { makeAuthenticatedRequestWithPath } = await import('@/lib/api-auth-utils');
    const mockMakeAuthenticatedRequestWithPath = jest.mocked(makeAuthenticatedRequestWithPath);
    mockMakeAuthenticatedRequestWithPath.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'External API error' })
    });

    const request = new NextRequest('http://localhost:3000/api/admin/marketplace');
    const response = await GET(request);
    
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('External API error');
  });

  describe('POST /api/admin/marketplace', () => {
    it('should create a new marketplace service', async () => {
      const { getServerSession } = await import('@/lib/server-session');
      const mockGetServerSession = jest.mocked(getServerSession);
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', role: 'admin' }
      });

      const { makeAuthenticatedRequestWithPath } = await import('@/lib/api-auth-utils');
      const mockMakeAuthenticatedRequestWithPath = jest.mocked(makeAuthenticatedRequestWithPath);
      mockMakeAuthenticatedRequestWithPath.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ 
          id: '1', 
          name: 'New Service',
          description: 'New description',
          category: 'PLUMBING',
          price: 150,
          providerId: 'provider-1',
          status: 'pending',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01'
        })
      });

      const requestBody = {
        name: 'New Service',
        description: 'New description',
        category: 'PLUMBING',
        price: 150,
        providerId: 'provider-1'
      };

      const request = new NextRequest('http://localhost:3000/api/admin/marketplace', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.id).toBe('1');
      expect(data.name).toBe('New Service');
    });

    it('should return 400 for missing required fields', async () => {
      const { getServerSession } = await import('@/lib/server-session');
      const mockGetServerSession = jest.mocked(getServerSession);
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', role: 'admin' }
      });

      const requestBody = {
        name: 'New Service'
        // Missing required fields
      };

      const request = new NextRequest('http://localhost:3000/api/admin/marketplace', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('required');
    });

    it('should handle create API errors', async () => {
      const { getServerSession } = await import('@/lib/server-session');
      const mockGetServerSession = jest.mocked(getServerSession);
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', role: 'admin' }
      });

      const { makeAuthenticatedRequestWithPath } = await import('@/lib/api-auth-utils');
      const mockMakeAuthenticatedRequestWithPath = jest.mocked(makeAuthenticatedRequestWithPath);
      mockMakeAuthenticatedRequestWithPath.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Create failed' })
      });

      const requestBody = {
        name: 'New Service',
        description: 'New description',
        category: 'PLUMBING',
        price: 150,
        providerId: 'provider-1'
      };

      const request = new NextRequest('http://localhost:3000/api/admin/marketplace', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Create failed');
    });
  });
});
