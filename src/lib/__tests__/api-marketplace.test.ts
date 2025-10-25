import { 
  fetchMarketplaceData, 
  fetchMarketplaceStats, 
  createMarketplaceService, 
  updateMarketplaceService, 
  deleteMarketplaceService 
} from '../api-marketplace';

// Mock fetch
global.fetch = jest.fn();

describe('Marketplace API', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  describe('fetchMarketplaceData', () => {
    it('should fetch marketplace data with correct parameters', async () => {
      const apiResponse = {
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
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(apiResponse)
      });

      const result = await fetchMarketplaceData({ page: 1, limit: 10 });

      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/marketplace?page=1&limit=10',
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        })
      );

      expect(result).toEqual(apiResponse);
    });

    it('should handle API errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'API request failed' })
      });

      await expect(fetchMarketplaceData({})).rejects.toThrow('API request failed');
    });

    it('should handle invalid response format', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ invalid: 'response' })
      });

      await expect(fetchMarketplaceData({})).rejects.toThrow('Invalid response format from API');
    });
  });

  describe('fetchMarketplaceStats', () => {
    it('should fetch marketplace statistics', async () => {
      const apiStatsResponse = {
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
          trends: { daily: [], weekly: [], monthly: [] },
          topServices: [],
          categoryStats: [],
          performanceMetrics: { averageBookings: 10, averageRevenue: 1000, conversionRate: 0.8 }
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(apiStatsResponse)
      });

      const result = await fetchMarketplaceStats({ period: 'week' });

      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/marketplace/stats?period=week',
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        })
      );

      expect(result).toEqual(apiStatsResponse.data);
    });

    it('should handle stats API errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Stats API failed' })
      });

      await expect(fetchMarketplaceStats({})).rejects.toThrow('Stats API failed');
    });

    it('should handle invalid stats response format', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: false })
      });

      await expect(fetchMarketplaceStats({})).rejects.toThrow('Invalid response format from stats API');
    });
  });

  describe('createMarketplaceService', () => {
    it('should create a new marketplace service', async () => {
      const newService = { 
        name: 'New Service', 
        description: 'New description',
        category: 'PLUMBING',
        price: 150,
        providerId: 'provider-1',
        status: 'active' as const 
      };
      const apiResponse = { 
        id: '1', 
        ...newService, 
        rating: 0,
        reviewCount: 0,
        provider: { name: 'John Doe', id: 'provider-1' },
        createdAt: '2024-01-01', 
        updatedAt: '2024-01-01',
        bookings: 0,
        revenue: 0
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(apiResponse)
      });

      const result = await createMarketplaceService(newService);

      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/marketplace',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(newService)
        })
      );

      expect(result).toEqual(apiResponse);
    });

    it('should handle create API errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Create failed' })
      });

      await expect(createMarketplaceService({ name: 'Test' })).rejects.toThrow('Create failed');
    });

    it('should handle invalid create response format', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ invalid: 'response' })
      });

      await expect(createMarketplaceService({ name: 'Test' })).rejects.toThrow('Invalid response format from create API');
    });
  });

  describe('updateMarketplaceService', () => {
    it('should update a marketplace service', async () => {
      const updateData = { name: 'Updated Service', price: 200 };
      const apiResponse = { 
        id: '1', 
        name: 'Updated Service',
        description: 'Test description',
        category: 'CLEANING',
        price: 200,
        rating: 4.5,
        reviewCount: 10,
        provider: { name: 'John Doe', id: 'provider-1' },
        status: 'active',
        createdAt: '2024-01-01', 
        updatedAt: '2024-01-02',
        bookings: 50,
        revenue: 5000
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(apiResponse)
      });

      const result = await updateMarketplaceService('1', updateData);

      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/marketplace/1',
        expect.objectContaining({
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(updateData)
        })
      );

      expect(result).toEqual(apiResponse);
    });

    it('should handle update API errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Update failed' })
      });

      await expect(updateMarketplaceService('1', { name: 'Test' })).rejects.toThrow('Update failed');
    });
  });

  describe('deleteMarketplaceService', () => {
    it('should delete a marketplace service', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      await deleteMarketplaceService('1');

      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/marketplace/1',
        expect.objectContaining({
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        })
      );
    });

    it('should handle delete API errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Delete failed' })
      });

      await expect(deleteMarketplaceService('1')).rejects.toThrow('Delete failed');
    });

    it('should handle delete failure response', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: false, error: 'Delete failed' })
      });

      await expect(deleteMarketplaceService('1')).rejects.toThrow('Delete failed');
    });
  });
});
