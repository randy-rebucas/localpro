import { 
  fetchUsersData, 
  fetchUsersStats, 
  createUser, 
  updateUser, 
  deleteUser,
  suspendUser,
  activateUser
} from '../api-users';

// Mock fetch
global.fetch = jest.fn();

describe('Users API', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  describe('fetchUsersData', () => {
    it('should fetch users data with correct parameters', async () => {
      const mockData = {
        data: [
          { 
            id: '1', 
            name: 'John Doe', 
            email: 'john@example.com',
            role: 'provider',
            status: 'active',
            createdAt: '2024-01-01',
            lastLogin: '2024-01-15',
            location: 'New York',
            phone: '+1234567890'
          }
        ],
        total: 1,
        page: 1,
        limit: 10
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      const result = await fetchUsersData({ page: 1, limit: 10 });

      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/users?page=1&limit=10',
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        })
      );

      expect(result).toEqual(mockData);
    });

    it('should handle API errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Test error' })
      });

      await expect(fetchUsersData({})).rejects.toThrow('Test error');
    });

    it('should include search and filter parameters', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [], total: 0, page: 1, limit: 10 })
      });

      await fetchUsersData({
        search: 'john',
        role: 'provider',
        status: 'active',
        sortBy: 'name',
        sortOrder: 'asc'
      });

      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/users?search=john&role=provider&status=active&sortBy=name&sortOrder=asc',
        expect.any(Object)
      );
    });
  });

  describe('fetchUsersStats', () => {
    it('should fetch user statistics', async () => {
      const mockStats = {
        totalUsers: 100,
        activeUsers: 80,
        pendingUsers: 15,
        suspendedUsers: 5,
        newUsersToday: 10,
        newUsersWeek: 50,
        newUsersMonth: 100,
        trends: { daily: [], weekly: [], monthly: [] },
        topRoles: [],
        statusStats: [],
        performanceMetrics: { averageRegistrationTime: 2.5, medianRegistrationTime: 2.0, p95RegistrationTime: 5.0 }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockStats })
      });

      const result = await fetchUsersStats({ period: 'week' });

      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/users/stats?period=week',
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        })
      );

      expect(result).toEqual(mockStats);
    });

    it('should handle API errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Stats error' })
      });

      await expect(fetchUsersStats({})).rejects.toThrow('Stats error');
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const newUser = { 
        name: 'New User', 
        email: 'new@example.com',
        role: 'client',
        status: 'pending' as const
      };
      const createdUser = { 
        id: '1', 
        ...newUser, 
        createdAt: '2024-01-01', 
        lastLogin: '',
        updatedAt: '2024-01-01' 
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createdUser)
      });

      const result = await createUser(newUser);

      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/users',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(newUser)
        })
      );

      expect(result).toEqual(createdUser);
    });

    it('should handle creation errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Creation failed' })
      });

      await expect(createUser({ name: 'Test' })).rejects.toThrow('Creation failed');
    });
  });

  describe('updateUser', () => {
    it('should update an existing user', async () => {
      const updateData = { name: 'Updated Name' };
      const updatedUser = { 
        id: '1', 
        name: 'Updated Name',
        email: 'test@example.com',
        role: 'provider',
        status: 'active',
        createdAt: '2024-01-01',
        lastLogin: '2024-01-15',
        updatedAt: '2024-01-15'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(updatedUser)
      });

      const result = await updateUser('1', updateData);

      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/users/1',
        expect.objectContaining({
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(updateData)
        })
      );

      expect(result).toEqual(updatedUser);
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      });

      await deleteUser('1');

      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/users/1',
        expect.objectContaining({
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        })
      );
    });

    it('should handle deletion errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Deletion failed' })
      });

      await expect(deleteUser('1')).rejects.toThrow('Deletion failed');
    });
  });

  describe('suspendUser', () => {
    it('should suspend a user', async () => {
      const suspendedUser = { 
        id: '1', 
        name: 'Test User',
        email: 'test@example.com',
        role: 'client',
        status: 'suspended',
        createdAt: '2024-01-01',
        lastLogin: '2024-01-15',
        updatedAt: '2024-01-15'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(suspendedUser)
      });

      const result = await suspendUser('1');

      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/users/1/suspend',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        })
      );

      expect(result).toEqual(suspendedUser);
    });
  });

  describe('activateUser', () => {
    it('should activate a user', async () => {
      const activatedUser = { 
        id: '1', 
        name: 'Test User',
        email: 'test@example.com',
        role: 'client',
        status: 'active',
        createdAt: '2024-01-01',
        lastLogin: '2024-01-15',
        updatedAt: '2024-01-15'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(activatedUser)
      });

      const result = await activateUser('1');

      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/users/1/activate',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        })
      );

      expect(result).toEqual(activatedUser);
    });
  });
});
