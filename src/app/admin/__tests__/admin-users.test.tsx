import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { jest } from '@jest/globals';
import UsersPage from '../users/page';

// Mock the useSession hook
jest.mock('@/hooks/useAuth', () => ({
  useSession: () => ({
    data: {
      user: {
        name: 'Admin User',
        email: 'admin@localpro.com',
        role: 'admin'
      }
    },
    status: 'authenticated'
  })
}));

// Mock fetch
global.fetch = jest.fn();

describe('UsersPage', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it('renders loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(() => {}) // Never resolves to keep loading state
    );

    render(<UsersPage />);
    expect(screen.getByText('Loading users...')).toBeInTheDocument();
  });

  it('renders users table when data loads successfully', async () => {
    const mockUsersData = {
      users: [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'provider',
          status: 'active',
          createdAt: '2024-01-01T00:00:00Z',
          lastLogin: '2024-01-15T00:00:00Z',
          location: 'New York',
          phone: '+1234567890'
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'client',
          status: 'pending',
          createdAt: '2024-01-02T00:00:00Z',
          lastLogin: null,
          location: 'Los Angeles',
          phone: '+1987654321'
        }
      ]
    };

    const mockStatsData = {
      totalUsers: 2,
      activeUsers: 1,
      pendingUsers: 1,
      suspendedUsers: 0,
      newUsersToday: 0
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUsersData)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatsData)
      });

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });
  });

  it('displays user statistics correctly', async () => {
    const mockUsersData = { users: [] };
    const mockStatsData = {
      totalUsers: 1000,
      activeUsers: 800,
      pendingUsers: 50,
      suspendedUsers: 10,
      newUsersToday: 5
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUsersData)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatsData)
      });

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('1,000')).toBeInTheDocument(); // Total users
      expect(screen.getByText('800')).toBeInTheDocument(); // Active users
      expect(screen.getByText('50')).toBeInTheDocument(); // Pending users
      expect(screen.getByText('10')).toBeInTheDocument(); // Suspended users
      expect(screen.getByText('5')).toBeInTheDocument(); // New today
    });
  });

  it('filters users by search term', async () => {
    const mockUsersData = {
      users: [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'provider',
          status: 'active',
          createdAt: '2024-01-01T00:00:00Z',
          lastLogin: '2024-01-15T00:00:00Z'
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'client',
          status: 'active',
          createdAt: '2024-01-02T00:00:00Z',
          lastLogin: '2024-01-15T00:00:00Z'
        }
      ]
    };

    const mockStatsData = {
      totalUsers: 2,
      activeUsers: 2,
      pendingUsers: 0,
      suspendedUsers: 0,
      newUsersToday: 0
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUsersData)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatsData)
      });

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Search for "John"
    const searchInput = screen.getByPlaceholderText('Search users...');
    fireEvent.change(searchInput, { target: { value: 'John' } });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });
  });

  it('filters users by role', async () => {
    const mockUsersData = {
      users: [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'provider',
          status: 'active',
          createdAt: '2024-01-01T00:00:00Z',
          lastLogin: '2024-01-15T00:00:00Z'
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'client',
          status: 'active',
          createdAt: '2024-01-02T00:00:00Z',
          lastLogin: '2024-01-15T00:00:00Z'
        }
      ]
    };

    const mockStatsData = {
      totalUsers: 2,
      activeUsers: 2,
      pendingUsers: 0,
      suspendedUsers: 0,
      newUsersToday: 0
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUsersData)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatsData)
      });

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Filter by provider role
    const roleFilter = screen.getByDisplayValue('All Roles');
    fireEvent.change(roleFilter, { target: { value: 'provider' } });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });
  });

  it('filters users by status', async () => {
    const mockUsersData = {
      users: [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'provider',
          status: 'active',
          createdAt: '2024-01-01T00:00:00Z',
          lastLogin: '2024-01-15T00:00:00Z'
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'client',
          status: 'pending',
          createdAt: '2024-01-02T00:00:00Z',
          lastLogin: null
        }
      ]
    };

    const mockStatsData = {
      totalUsers: 2,
      activeUsers: 1,
      pendingUsers: 1,
      suspendedUsers: 0,
      newUsersToday: 0
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUsersData)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatsData)
      });

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Filter by pending status
    const statusFilter = screen.getByDisplayValue('All Status');
    fireEvent.change(statusFilter, { target: { value: 'pending' } });

    await waitFor(() => {
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('shows no users message when filtered results are empty', async () => {
    const mockUsersData = {
      users: [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'provider',
          status: 'active',
          createdAt: '2024-01-01T00:00:00Z',
          lastLogin: '2024-01-15T00:00:00Z'
        }
      ]
    };

    const mockStatsData = {
      totalUsers: 1,
      activeUsers: 1,
      pendingUsers: 0,
      suspendedUsers: 0,
      newUsersToday: 0
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUsersData)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatsData)
      });

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Search for non-existent user
    const searchInput = screen.getByPlaceholderText('Search users...');
    fireEvent.change(searchInput, { target: { value: 'NonExistent' } });

    await waitFor(() => {
      expect(screen.getByText('No users found')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });

  it('renders error state when API calls fail', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });
});
