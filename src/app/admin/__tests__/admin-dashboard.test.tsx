import { render, screen, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import AdminDashboard from '../page';

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

describe('AdminDashboard', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it('renders loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(() => {}) // Never resolves to keep loading state
    );

    render(<AdminDashboard />);
    expect(screen.getByText('Loading admin dashboard...')).toBeInTheDocument();
  });

  it('renders dashboard with stats when data loads successfully', async () => {
    const mockStatsData = {
      totalUsers: 1000,
      activeServices: 500,
      totalRevenue: 50000,
      growthRate: 12.5,
      pendingApprovals: 25,
      systemHealth: 'Good'
    };

    const mockActivityData = {
      recentActivity: [
        {
          id: '1',
          type: 'user_registration',
          description: 'New user registered',
          timestamp: '2024-01-01T00:00:00Z',
          user: 'System'
        }
      ]
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatsData)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockActivityData)
      });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      expect(screen.getByText('1,000')).toBeInTheDocument(); // Total users
      expect(screen.getByText('500')).toBeInTheDocument(); // Active services
      expect(screen.getByText('$50,000')).toBeInTheDocument(); // Total revenue
    });
  });

  it('renders error state when API calls fail', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  it('displays admin modules correctly', async () => {
    const mockStatsData = {
      totalUsers: 1000,
      activeServices: 500,
      totalRevenue: 50000,
      growthRate: 12.5,
      pendingApprovals: 25,
      systemHealth: 'Good'
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatsData)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ recentActivity: [] })
      });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument();
      expect(screen.getByText('Marketplace')).toBeInTheDocument();
      expect(screen.getByText('Supplies')).toBeInTheDocument();
      expect(screen.getByText('Academy')).toBeInTheDocument();
      expect(screen.getByText('Finance')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
    });
  });

  it('shows recent activity when available', async () => {
    const mockStatsData = {
      totalUsers: 1000,
      activeServices: 500,
      totalRevenue: 50000,
      growthRate: 12.5,
      pendingApprovals: 25,
      systemHealth: 'Good'
    };

    const mockActivityData = {
      recentActivity: [
        {
          id: '1',
          type: 'user_registration',
          description: 'New user registered',
          timestamp: '2024-01-01T00:00:00Z',
          user: 'System'
        },
        {
          id: '2',
          type: 'service_created',
          description: 'New service created',
          timestamp: '2024-01-01T01:00:00Z',
          user: 'Provider'
        }
      ]
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatsData)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockActivityData)
      });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(screen.getByText('New user registered')).toBeInTheDocument();
      expect(screen.getByText('New service created')).toBeInTheDocument();
    });
  });

  it('shows no recent activity message when empty', async () => {
    const mockStatsData = {
      totalUsers: 1000,
      activeServices: 500,
      totalRevenue: 50000,
      growthRate: 12.5,
      pendingApprovals: 25,
      systemHealth: 'Good'
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatsData)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ recentActivity: [] })
      });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('No recent activity')).toBeInTheDocument();
    });
  });
});
