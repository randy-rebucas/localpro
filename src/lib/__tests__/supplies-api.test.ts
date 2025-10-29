import { NextRequest } from 'next/server';
import { GET as getSupplies, POST as createSupply } from '@/app/api/supplies/route';
import { PUT as updateSupply, DELETE as deleteSupply } from '@/app/api/supplies/[id]/route';
import { POST as orderSupply } from '@/app/api/supplies/[id]/order/route';
import { GET as getCategories } from '@/app/api/supplies/categories/route';
import { GET as getFeatured } from '@/app/api/supplies/featured/route';
import { GET as getNearby } from '@/app/api/supplies/nearby/route';
import { GET as getMySupplies } from '@/app/api/supplies/my-supplies/route';
import { GET as getMyOrders } from '@/app/api/supplies/my-orders/route';

// Mock the authentication and API utilities
jest.mock('@/lib/server-session', () => ({
  getServerSession: jest.fn()
}));

jest.mock('@/lib/api-auth-utils', () => ({
  makeAuthenticatedRequestWithPath: jest.fn(),
  makeAuthenticatedRequestWithEndpoint: jest.fn()
}));

jest.mock('@/lib/role-utils', () => ({
  canPerformAction: jest.fn()
}));

import { getServerSession } from '@/lib/server-session';
import { makeAuthenticatedRequestWithPath, makeAuthenticatedRequestWithEndpoint } from '@/lib/api-auth-utils';
import { canPerformAction } from '@/lib/role-utils';

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockMakeAuthenticatedRequestWithPath = makeAuthenticatedRequestWithPath as jest.MockedFunction<typeof makeAuthenticatedRequestWithPath>;
const mockMakeAuthenticatedRequestWithEndpoint = makeAuthenticatedRequestWithEndpoint as jest.MockedFunction<typeof makeAuthenticatedRequestWithEndpoint>;
const mockCanPerformAction = canPerformAction as jest.MockedFunction<typeof canPerformAction>;

describe('Supplies API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/supplies', () => {
    it('should fetch supplies successfully', async () => {
      const mockSession = { user: { id: 'user-123' }, role: 'client' };
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          supplies: [
            {
              id: 'supply-1',
              name: 'Cleaning Kit',
              description: 'Complete cleaning supplies',
              category: 'cleaning',
              type: 'equipment',
              price: 25.99,
              stock: 100
            }
          ],
          pagination: { page: 1, pages: 1, total: 1 }
        })
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      mockMakeAuthenticatedRequestWithPath.mockResolvedValue(mockResponse);

      const request = new NextRequest('http://localhost:3000/api/supplies');
      const response = await getSupplies(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.supplies).toHaveLength(1);
      expect(data.supplies[0].name).toBe('Cleaning Kit');
    });

    it('should return 401 for unauthorized users', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/supplies');
      const response = await getSupplies(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/supplies', () => {
    it('should create supply successfully for suppliers', async () => {
      const mockSession = { user: { id: 'user-123' }, role: 'supplier' };
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          id: 'supply-1',
          name: 'New Supply',
          description: 'Test supply',
          category: 'cleaning',
          type: 'equipment'
        })
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      mockCanPerformAction.mockReturnValue(true);
      mockMakeAuthenticatedRequestWithPath.mockResolvedValue(mockResponse);

      const request = new NextRequest('http://localhost:3000/api/supplies', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Supply',
          description: 'Test supply',
          category: 'cleaning',
          type: 'equipment',
          price: 25.99
        })
      });

      const response = await createSupply(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe('New Supply');
    });

    it('should return 403 for users without create permissions', async () => {
      const mockSession = { user: { id: 'user-123' }, role: 'client' };

      mockGetServerSession.mockResolvedValue(mockSession);
      mockCanPerformAction.mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/supplies', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Supply',
          description: 'Test supply',
          category: 'cleaning',
          type: 'equipment'
        })
      });

      const response = await createSupply(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Insufficient permissions to create supplies');
    });

    it('should return 400 for missing required fields', async () => {
      const mockSession = { user: { id: 'user-123' }, role: 'supplier' };

      mockGetServerSession.mockResolvedValue(mockSession);
      mockCanPerformAction.mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/supplies', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Supply'
          // Missing required fields
        })
      });

      const response = await createSupply(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Name, description, category, and type are required');
    });
  });

  describe('GET /api/supplies/categories', () => {
    it('should fetch categories successfully', async () => {
      const mockSession = { user: { id: 'user-123' }, role: 'client' };
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          categories: ['cleaning', 'tools', 'materials', 'equipment']
        })
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      mockMakeAuthenticatedRequestWithPath.mockResolvedValue(mockResponse);

      const request = new NextRequest('http://localhost:3000/api/supplies/categories');
      const response = await getCategories(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.categories).toHaveLength(4);
    });
  });

  describe('GET /api/supplies/featured', () => {
    it('should fetch featured supplies successfully', async () => {
      const mockSession = { user: { id: 'user-123' }, role: 'client' };
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          supplies: [
            {
              id: 'featured-1',
              name: 'Featured Supply',
              isFeatured: true
            }
          ]
        })
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      mockMakeAuthenticatedRequestWithPath.mockResolvedValue(mockResponse);

      const request = new NextRequest('http://localhost:3000/api/supplies/featured');
      const response = await getFeatured(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.supplies).toHaveLength(1);
      expect(data.supplies[0].isFeatured).toBe(true);
    });
  });

  describe('GET /api/supplies/nearby', () => {
    it('should fetch nearby supplies successfully', async () => {
      const mockSession = { user: { id: 'user-123' }, role: 'client' };
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          supplies: [
            {
              id: 'nearby-1',
              name: 'Nearby Supply',
              location: { city: 'New York', state: 'NY' }
            }
          ]
        })
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      mockMakeAuthenticatedRequestWithPath.mockResolvedValue(mockResponse);

      const request = new NextRequest('http://localhost:3000/api/supplies/nearby?lat=40.7128&lng=-74.0060');
      const response = await getNearby(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.supplies).toHaveLength(1);
    });

    it('should return 400 for missing location parameters', async () => {
      const mockSession = { user: { id: 'user-123' }, role: 'client' };

      mockGetServerSession.mockResolvedValue(mockSession);

      const request = new NextRequest('http://localhost:3000/api/supplies/nearby');
      const response = await getNearby(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Latitude and longitude are required for nearby search');
    });
  });

  describe('POST /api/supplies/:id/order', () => {
    it('should create order successfully', async () => {
      const mockSession = { user: { id: 'user-123' }, role: 'client' };
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          id: 'order-1',
          supplyId: 'supply-1',
          quantity: 2,
          status: 'pending'
        })
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      mockMakeAuthenticatedRequestWithPath.mockResolvedValue(mockResponse);

      const request = new NextRequest('http://localhost:3000/api/supplies/supply-1/order', {
        method: 'POST',
        body: JSON.stringify({
          quantity: 2,
          shippingAddress: '123 Main St, New York, NY'
        })
      });

      const response = await orderSupply(request, { params: Promise.resolve({ id: 'supply-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe('order-1');
      expect(data.quantity).toBe(2);
    });

    it('should return 400 for invalid order data', async () => {
      const mockSession = { user: { id: 'user-123' }, role: 'client' };

      mockGetServerSession.mockResolvedValue(mockSession);

      const request = new NextRequest('http://localhost:3000/api/supplies/supply-1/order', {
        method: 'POST',
        body: JSON.stringify({
          quantity: 0, // Invalid quantity
          shippingAddress: '123 Main St, New York, NY'
        })
      });

      const response = await orderSupply(request, { params: Promise.resolve({ id: 'supply-1' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Quantity is required and must be greater than 0');
    });
  });

  describe('GET /api/supplies/my-supplies', () => {
    it('should fetch user supplies successfully', async () => {
      const mockSession = { user: { id: 'user-123' }, role: 'supplier' };
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          supplies: [
            {
              id: 'my-supply-1',
              name: 'My Supply',
              supplier: { id: 'user-123' }
            }
          ]
        })
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      mockMakeAuthenticatedRequestWithEndpoint.mockResolvedValue(mockResponse);

      const request = new NextRequest('http://localhost:3000/api/supplies/my-supplies');
      const response = await getMySupplies(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.supplies).toHaveLength(1);
      expect(data.supplies[0].supplier.id).toBe('user-123');
    });
  });

  describe('GET /api/supplies/my-orders', () => {
    it('should fetch user orders successfully', async () => {
      const mockSession = { user: { id: 'user-123' }, role: 'client' };
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          orders: [
            {
              id: 'order-1',
              supplyId: 'supply-1',
              clientId: 'user-123',
              status: 'pending'
            }
          ]
        })
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      mockMakeAuthenticatedRequestWithEndpoint.mockResolvedValue(mockResponse);

      const request = new NextRequest('http://localhost:3000/api/supplies/my-orders');
      const response = await getMyOrders(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.orders).toHaveLength(1);
      expect(data.orders[0].clientId).toBe('user-123');
    });
  });

  describe('PUT /api/supplies/:id', () => {
    it('should update supply successfully for authorized users', async () => {
      const mockSession = { user: { id: 'user-123' }, role: 'supplier' };
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          id: 'supply-1',
          name: 'Updated Supply',
          updated: true
        })
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      mockCanPerformAction.mockReturnValue(true);
      mockMakeAuthenticatedRequestWithPath.mockResolvedValue(mockResponse);

      const request = new NextRequest('http://localhost:3000/api/supplies/supply-1', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Updated Supply',
          price: 30.99
        })
      });

      const response = await updateSupply(request, { params: Promise.resolve({ id: 'supply-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe('Updated Supply');
    });

    it('should return 403 for users without update permissions', async () => {
      const mockSession = { user: { id: 'user-123' }, role: 'client' };

      mockGetServerSession.mockResolvedValue(mockSession);
      mockCanPerformAction.mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/supplies/supply-1', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Updated Supply'
        })
      });

      const response = await updateSupply(request, { params: Promise.resolve({ id: 'supply-1' }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Insufficient permissions to update supplies');
    });
  });

  describe('DELETE /api/supplies/:id', () => {
    it('should delete supply successfully for authorized users', async () => {
      const mockSession = { user: { id: 'user-123' }, role: 'supplier' };
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          id: 'supply-1',
          deleted: true
        })
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      mockCanPerformAction.mockReturnValue(true);
      mockMakeAuthenticatedRequestWithPath.mockResolvedValue(mockResponse);

      const request = new NextRequest('http://localhost:3000/api/supplies/supply-1', {
        method: 'DELETE'
      });

      const response = await deleteSupply(request, { params: Promise.resolve({ id: 'supply-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.deleted).toBe(true);
    });

    it('should return 403 for users without delete permissions', async () => {
      const mockSession = { user: { id: 'user-123' }, role: 'client' };

      mockGetServerSession.mockResolvedValue(mockSession);
      mockCanPerformAction.mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/supplies/supply-1', {
        method: 'DELETE'
      });

      const response = await deleteSupply(request, { params: Promise.resolve({ id: 'supply-1' }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Insufficient permissions to delete supplies');
    });
  });
});
