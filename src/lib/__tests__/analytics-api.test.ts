// Mock the API utilities
jest.mock('../api-auth-utils', () => ({
  makeAuthenticatedRequestWithPath: jest.fn(),
  makeAuthenticatedRequestWithEndpoint: jest.fn(),
  handleApiRoute: jest.fn(),
}));

jest.mock('../server-session', () => ({
  getServerSession: jest.fn(),
}));

describe('Analytics API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle GET request for analytics data', async () => {
    const { handleApiRoute } = await import('../api-auth-utils');
    const { getServerSession } = await import('../server-session');
    
    // Mock session
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { role: 'admin' },
      expires: new Date().toISOString()
    });

    // Mock API response
    const mockAnalyticsData = {
      overview: {
        totalUsers: 1000,
        activeUsers: 750,
        totalRevenue: 50000,
        conversionRate: 3.5
      }
    };

    (handleApiRoute as jest.Mock).mockResolvedValue({
      data: mockAnalyticsData,
      error: null
    });

    // Mock request
    const mockRequest = new Request('http://localhost:3000/api/admin/analytics?type=overview&period=7d');
    
    // Import and test the route handler
    const { GET } = await import('../../app/api/admin/analytics/route');
    const response = await GET(mockRequest);
    
    expect(response.status).toBe(200);
    
    const responseData = await response.json();
    expect(responseData.success).toBe(true);
    expect(responseData.data).toEqual(mockAnalyticsData);
    expect(responseData.type).toBe('overview');
    expect(responseData.period).toBe('7d');
  });

  it('should handle POST request for analytics actions', async () => {
    const { handleApiRoute } = await import('../api-auth-utils');
    const { getServerSession } = await import('../server-session');
    
    // Mock session
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { role: 'admin' },
      expires: new Date().toISOString()
    });

    // Mock API response
    const mockTrackResponse = { success: true, eventId: 'evt_123' };

    (handleApiRoute as jest.Mock).mockResolvedValue({
      data: mockTrackResponse,
      error: null
    });

    // Mock request
    const mockRequest = new Request('http://localhost:3000/api/admin/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'track_event',
        data: { event: 'page_view', page: '/admin/analytics' }
      })
    });
    
    // Import and test the route handler
    const { POST } = await import('../../app/api/admin/analytics/route');
    const response = await POST(mockRequest);
    
    expect(response.status).toBe(200);
    
    const responseData = await response.json();
    expect(responseData.success).toBe(true);
    expect(responseData.data).toEqual(mockTrackResponse);
  });

  it('should reject unauthorized requests', async () => {
    const { getServerSession } = await import('../server-session');
    
    // Mock no session
    (getServerSession as jest.Mock).mockResolvedValue(null);

    // Mock request
    const mockRequest = new Request('http://localhost:3000/api/admin/analytics');
    
    // Import and test the route handler
    const { GET } = await import('../../app/api/admin/analytics/route');
    const response = await GET(mockRequest);
    
    expect(response.status).toBe(401);
    
    const responseData = await response.json();
    expect(responseData.error).toBe('Unauthorized');
  });

  it('should reject non-admin users', async () => {
    const { getServerSession } = await import('../server-session');
    
    // Mock non-admin session
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { role: 'client' },
      expires: new Date().toISOString()
    });

    // Mock request
    const mockRequest = new Request('http://localhost:3000/api/admin/analytics');
    
    // Import and test the route handler
    const { GET } = await import('../../app/api/admin/analytics/route');
    const response = await GET(mockRequest);
    
    expect(response.status).toBe(401);
    
    const responseData = await response.json();
    expect(responseData.error).toBe('Unauthorized');
  });
});
