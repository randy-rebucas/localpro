import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { jest } from '@jest/globals';
import MarketplacePage from '../marketplace/page';

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

describe('MarketplacePage', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it('renders loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(() => {}) // Never resolves to keep loading state
    );

    render(<MarketplacePage />);
    expect(screen.getByText('Loading marketplace data...')).toBeInTheDocument();
  });

  it('renders marketplace data when loaded successfully', async () => {
    const mockServicesData = {
      services: [
        {
          id: '1',
          name: 'House Cleaning',
          description: 'Professional house cleaning service',
          category: 'CLEANING',
          price: 100,
          rating: 4.5,
          reviewCount: 25,
          provider: {
            name: 'John Doe',
            id: 'provider-1'
          },
          status: 'active',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
          bookings: 50,
          revenue: 5000
        },
        {
          id: '2',
          name: 'Plumbing Repair',
          description: 'Expert plumbing services',
          category: 'PLUMBING',
          price: 150,
          rating: 4.8,
          reviewCount: 15,
          provider: {
            name: 'Jane Smith',
            id: 'provider-2'
          },
          status: 'pending',
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-16T00:00:00Z',
          bookings: 20,
          revenue: 3000
        }
      ]
    };

    const mockStatsData = {
      totalServices: 2,
      activeServices: 1,
      pendingServices: 1,
      totalBookings: 70,
      totalRevenue: 8000,
      averageRating: 4.65,
      topCategory: 'CLEANING',
      growthRate: 15.5
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockServicesData)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatsData)
      });

    render(<MarketplacePage />);

    await waitFor(() => {
      expect(screen.getByText('Marketplace Management')).toBeInTheDocument();
      expect(screen.getByText('House Cleaning')).toBeInTheDocument();
      expect(screen.getByText('Plumbing Repair')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('displays marketplace statistics correctly', async () => {
    const mockServicesData = { services: [] };
    const mockStatsData = {
      totalServices: 1000,
      activeServices: 800,
      pendingServices: 50,
      totalBookings: 5000,
      totalRevenue: 100000,
      averageRating: 4.5,
      topCategory: 'CLEANING',
      growthRate: 12.5
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockServicesData)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatsData)
      });

    render(<MarketplacePage />);

    await waitFor(() => {
      expect(screen.getByText('1,000')).toBeInTheDocument(); // Total services
      expect(screen.getByText('800')).toBeInTheDocument(); // Active services
      expect(screen.getByText('5,000')).toBeInTheDocument(); // Total bookings
      expect(screen.getByText('$100,000')).toBeInTheDocument(); // Total revenue
      expect(screen.getByText('4.5')).toBeInTheDocument(); // Average rating
      expect(screen.getByText('CLEANING')).toBeInTheDocument(); // Top category
      expect(screen.getByText('+12.5%')).toBeInTheDocument(); // Growth rate
    });
  });

  it('filters services by search term', async () => {
    const mockServicesData = {
      services: [
        {
          id: '1',
          name: 'House Cleaning',
          description: 'Professional house cleaning service',
          category: 'CLEANING',
          price: 100,
          rating: 4.5,
          reviewCount: 25,
          provider: { name: 'John Doe', id: 'provider-1' },
          status: 'active',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
          bookings: 50,
          revenue: 5000
        },
        {
          id: '2',
          name: 'Plumbing Repair',
          description: 'Expert plumbing services',
          category: 'PLUMBING',
          price: 150,
          rating: 4.8,
          reviewCount: 15,
          provider: { name: 'Jane Smith', id: 'provider-2' },
          status: 'active',
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-16T00:00:00Z',
          bookings: 20,
          revenue: 3000
        }
      ]
    };

    const mockStatsData = {
      totalServices: 2,
      activeServices: 2,
      pendingServices: 0,
      totalBookings: 70,
      totalRevenue: 8000,
      averageRating: 4.65,
      topCategory: 'CLEANING',
      growthRate: 15.5
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockServicesData)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatsData)
      });

    render(<MarketplacePage />);

    await waitFor(() => {
      expect(screen.getByText('House Cleaning')).toBeInTheDocument();
      expect(screen.getByText('Plumbing Repair')).toBeInTheDocument();
    });

    // Search for "Cleaning"
    const searchInput = screen.getByPlaceholderText('Search services...');
    fireEvent.change(searchInput, { target: { value: 'Cleaning' } });

    await waitFor(() => {
      expect(screen.getByText('House Cleaning')).toBeInTheDocument();
      expect(screen.queryByText('Plumbing Repair')).not.toBeInTheDocument();
    });
  });

  it('filters services by category', async () => {
    const mockServicesData = {
      services: [
        {
          id: '1',
          name: 'House Cleaning',
          description: 'Professional house cleaning service',
          category: 'CLEANING',
          price: 100,
          rating: 4.5,
          reviewCount: 25,
          provider: { name: 'John Doe', id: 'provider-1' },
          status: 'active',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
          bookings: 50,
          revenue: 5000
        },
        {
          id: '2',
          name: 'Plumbing Repair',
          description: 'Expert plumbing services',
          category: 'PLUMBING',
          price: 150,
          rating: 4.8,
          reviewCount: 15,
          provider: { name: 'Jane Smith', id: 'provider-2' },
          status: 'active',
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-16T00:00:00Z',
          bookings: 20,
          revenue: 3000
        }
      ]
    };

    const mockStatsData = {
      totalServices: 2,
      activeServices: 2,
      pendingServices: 0,
      totalBookings: 70,
      totalRevenue: 8000,
      averageRating: 4.65,
      topCategory: 'CLEANING',
      growthRate: 15.5
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockServicesData)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatsData)
      });

    render(<MarketplacePage />);

    await waitFor(() => {
      expect(screen.getByText('House Cleaning')).toBeInTheDocument();
      expect(screen.getByText('Plumbing Repair')).toBeInTheDocument();
    });

    // Filter by CLEANING category
    const categoryFilter = screen.getByDisplayValue('All Categories');
    fireEvent.change(categoryFilter, { target: { value: 'CLEANING' } });

    await waitFor(() => {
      expect(screen.getByText('House Cleaning')).toBeInTheDocument();
      expect(screen.queryByText('Plumbing Repair')).not.toBeInTheDocument();
    });
  });

  it('filters services by status', async () => {
    const mockServicesData = {
      services: [
        {
          id: '1',
          name: 'House Cleaning',
          description: 'Professional house cleaning service',
          category: 'CLEANING',
          price: 100,
          rating: 4.5,
          reviewCount: 25,
          provider: { name: 'John Doe', id: 'provider-1' },
          status: 'active',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
          bookings: 50,
          revenue: 5000
        },
        {
          id: '2',
          name: 'Plumbing Repair',
          description: 'Expert plumbing services',
          category: 'PLUMBING',
          price: 150,
          rating: 4.8,
          reviewCount: 15,
          provider: { name: 'Jane Smith', id: 'provider-2' },
          status: 'pending',
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-16T00:00:00Z',
          bookings: 20,
          revenue: 3000
        }
      ]
    };

    const mockStatsData = {
      totalServices: 2,
      activeServices: 1,
      pendingServices: 1,
      totalBookings: 70,
      totalRevenue: 8000,
      averageRating: 4.65,
      topCategory: 'CLEANING',
      growthRate: 15.5
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockServicesData)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatsData)
      });

    render(<MarketplacePage />);

    await waitFor(() => {
      expect(screen.getByText('House Cleaning')).toBeInTheDocument();
      expect(screen.getByText('Plumbing Repair')).toBeInTheDocument();
    });

    // Filter by pending status
    const statusFilter = screen.getByDisplayValue('All Status');
    fireEvent.change(statusFilter, { target: { value: 'pending' } });

    await waitFor(() => {
      expect(screen.queryByText('House Cleaning')).not.toBeInTheDocument();
      expect(screen.getByText('Plumbing Repair')).toBeInTheDocument();
    });
  });

  it('shows no services message when filtered results are empty', async () => {
    const mockServicesData = {
      services: [
        {
          id: '1',
          name: 'House Cleaning',
          description: 'Professional house cleaning service',
          category: 'CLEANING',
          price: 100,
          rating: 4.5,
          reviewCount: 25,
          provider: { name: 'John Doe', id: 'provider-1' },
          status: 'active',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
          bookings: 50,
          revenue: 5000
        }
      ]
    };

    const mockStatsData = {
      totalServices: 1,
      activeServices: 1,
      pendingServices: 0,
      totalBookings: 50,
      totalRevenue: 5000,
      averageRating: 4.5,
      topCategory: 'CLEANING',
      growthRate: 10.0
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockServicesData)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatsData)
      });

    render(<MarketplacePage />);

    await waitFor(() => {
      expect(screen.getByText('House Cleaning')).toBeInTheDocument();
    });

    // Search for non-existent service
    const searchInput = screen.getByPlaceholderText('Search services...');
    fireEvent.change(searchInput, { target: { value: 'NonExistent' } });

    await waitFor(() => {
      expect(screen.getByText('No services found')).toBeInTheDocument();
      expect(screen.queryByText('House Cleaning')).not.toBeInTheDocument();
    });
  });

  it('renders error state when API calls fail', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(<MarketplacePage />);

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });
});
