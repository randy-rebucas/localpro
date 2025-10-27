import { NextRequest } from 'next/server';
import { GET, POST } from '../../users/route';

// Mock dependencies
jest.mock('@/lib/server-session');
jest.mock('@/lib/api-auth-utils');

describe('/api/admin/users', () => {
  const mockGetServerSession = jest.mocked((await import('@/lib/server-session')).getServerSession);
  const mockMakeAuthenticatedRequestWithPath = jest.mocked((await import('@/lib/api-auth-utils')).makeAuthenticatedRequestWithPath);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/users', () => {
    it('should return 401 for unauthorized requests', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/users');
      const response = await GET(request);
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 403 for non-admin users', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', role: 'client' }
      });

      const request = new NextRequest('http://localhost:3000/api/admin/users');
      const response = await GET(request);
      
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('Admin access required');
    });

    it('should return users data for admin users', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', role: 'admin' }
      });

      mockMakeAuthenticatedRequestWithPath.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] })
      });

      const request = new NextRequest('http://localhost:3000/api/admin/users');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toBeDefined();
    });

    it('should handle API errors', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', role: 'admin' }
      });

      mockMakeAuthenticatedRequestWithPath.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'External API error' })
      });

      const request = new NextRequest('http://localhost:3000/api/admin/users');
      const response = await GET(request);
      
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('External API error');
    });

    it('should handle network errors', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', role: 'admin' }
      });

      mockMakeAuthenticatedRequestWithPath.mockRejectedValue(new Error('fetch failed'));

      const request = new NextRequest('http://localhost:3000/api/admin/users');
      const response = await GET(request);
      
      expect(response.status).toBe(503);
      const data = await response.json();
      expect(data.error).toBe('Unable to connect to external service - please try again later');
    });

    it('should handle timeout errors', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', role: 'admin' }
      });

      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'AbortError';
      mockMakeAuthenticatedRequestWithPath.mockRejectedValue(timeoutError);

      const request = new NextRequest('http://localhost:3000/api/admin/users');
      const response = await GET(request);
      
      expect(response.status).toBe(504);
      const data = await response.json();
      expect(data.error).toBe('Request timeout - the external service is taking too long to respond');
    });
  });

  describe('POST /api/admin/users', () => {
    it('should return 401 for unauthorized requests', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test User' })
      });
      const response = await POST(request);
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 403 for non-admin users', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', role: 'client' }
      });

      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test User' })
      });
      const response = await POST(request);
      
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('Admin access required');
    });

    it('should create user for admin users', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', role: 'admin' }
      });

      mockMakeAuthenticatedRequestWithPath.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: '1', name: 'Test User' })
      });

      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test User' })
      });
      const response = await POST(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe('1');
      expect(data.name).toBe('Test User');
    });

    it('should handle creation errors', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', role: 'admin' }
      });

      mockMakeAuthenticatedRequestWithPath.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid user data' })
      });

      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test User' })
      });
      const response = await POST(request);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid user data');
    });
  });
});
