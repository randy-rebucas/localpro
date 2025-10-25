import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import MarketplacePage from '../marketplace/page';
import * as apiMarketplace from '@/lib/api-marketplace';

// Mock the API functions
jest.mock('@/lib/api-marketplace');

describe('MarketplacePage', () => {
  const apiMarketplaceData = [
    { 
      id: '1', 
      name: 'Test Service 1', 
      description: 'Test description 1',
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
    },
    { 
      id: '2', 
      name: 'Test Service 2', 
      description: 'Test description 2',
      category: 'PLUMBING',
      price: 150,
      rating: 4.8,
      reviewCount: 15,
      provider: { name: 'Jane Smith', id: 'provider-2' },
      status: 'pending', 
      createdAt: '2024-01-02', 
      updatedAt: '2024-01-02',
      bookings: 20,
      revenue: 3000
    }
  ];

  const apiStatsResponse = {
    totalServices: 2,
    activeServices: 1,
    pendingServices: 1,
    rejectedServices: 0,
    totalBookings: 70,
    totalRevenue: 8000,
    averageRating: 4.65,
    topCategory: 'CLEANING',
    growthRate: 15.5,
    todayCount: 1,
    weekCount: 2,
    monthCount: 2,
    trends: { daily: [], weekly: [], monthly: [] },
    topServices: [],
    categoryStats: [],
    performanceMetrics: { averageBookings: 35, averageRevenue: 4000, conversionRate: 0.8 }
  };

  beforeEach(() => {
    (apiMarketplace.fetchMarketplaceData as jest.Mock).mockResolvedValue({
      data: apiMarketplaceData,
      total: 2,
      page: 1,
      limit: 10
    });

    (apiMarketplace.fetchMarketplaceStats as jest.Mock).mockResolvedValue(apiStatsResponse);
  });

  it('should render the page header', async () => {
    render(<MarketplacePage />);
    
    await waitFor(() => {
      expect(screen.getByText('Marketplace Management')).toBeInTheDocument();
      expect(screen.getByText('Manage services, bookings, and reviews')).toBeInTheDocument();
    });
  });

  it('should display stats cards', async () => {
    render(<MarketplacePage />);
    
    await waitFor(() => {
      expect(screen.getByText('Total Services')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('Active Services')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('should display marketplace data in table', async () => {
    render(<MarketplacePage />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Service 1')).toBeInTheDocument();
      expect(screen.getByText('Test Service 2')).toBeInTheDocument();
    });
  });

  it('should handle refresh action', async () => {
    render(<MarketplacePage />);
    
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);
    
    await waitFor(() => {
      expect(apiMarketplace.fetchMarketplaceData).toHaveBeenCalledTimes(2);
      expect(apiMarketplace.fetchMarketplaceStats).toHaveBeenCalledTimes(2);
    });
  });

  it('should handle search functionality', async () => {
    render(<MarketplacePage />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Service 1')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search services...');
    fireEvent.change(searchInput, { target: { value: 'Test Service 1' } });

    await waitFor(() => {
      expect(apiMarketplace.fetchMarketplaceData).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'Test Service 1'
        })
      );
    });
  });

  it('should handle category filter', async () => {
    render(<MarketplacePage />);
    
    // Open filters
    const showFiltersButton = screen.getByText('Show Filters');
    fireEvent.click(showFiltersButton);

    await waitFor(() => {
      expect(screen.getByText('Category')).toBeInTheDocument();
    });

    const categorySelect = screen.getByDisplayValue('All Categories');
    fireEvent.change(categorySelect, { target: { value: 'CLEANING' } });

    await waitFor(() => {
      expect(apiMarketplace.fetchMarketplaceData).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'CLEANING'
        })
      );
    });
  });

  it('should handle status filter', async () => {
    render(<MarketplacePage />);
    
    // Open filters
    const showFiltersButton = screen.getByText('Show Filters');
    fireEvent.click(showFiltersButton);

    await waitFor(() => {
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    const statusSelect = screen.getByDisplayValue('All Status');
    fireEvent.change(statusSelect, { target: { value: 'active' } });

    await waitFor(() => {
      expect(apiMarketplace.fetchMarketplaceData).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'active'
        })
      );
    });
  });

  it('should handle sorting', async () => {
    render(<MarketplacePage />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Service 1')).toBeInTheDocument();
    });

    const nameSortButton = screen.getByText('Name');
    fireEvent.click(nameSortButton);

    await waitFor(() => {
      expect(apiMarketplace.fetchMarketplaceData).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'name',
          sortOrder: 'desc'
        })
      );
    });
  });

  it('should handle API errors gracefully', async () => {
    (apiMarketplace.fetchMarketplaceData as jest.Mock).mockRejectedValue(new Error('API request failed'));
    
    render(<MarketplacePage />);
    
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('API request failed')).toBeInTheDocument();
    });
  });

  it('should handle API response validation errors', async () => {
    (apiMarketplace.fetchMarketplaceData as jest.Mock).mockRejectedValue(new Error('Invalid response format from API'));
    
    render(<MarketplacePage />);
    
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Invalid response format from API')).toBeInTheDocument();
    });
  });

  it('should display empty state when no services found', async () => {
    (apiMarketplace.fetchMarketplaceData as jest.Mock).mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 10
    });

    render(<MarketplacePage />);
    
    await waitFor(() => {
      expect(screen.getByText('No services found')).toBeInTheDocument();
      expect(screen.getByText('No marketplace services have been created yet.')).toBeInTheDocument();
    });
  });

  it('should display filtered empty state', async () => {
    (apiMarketplace.fetchMarketplaceData as jest.Mock).mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 10
    });

    render(<MarketplacePage />);
    
    // Open filters and set a search term
    const showFiltersButton = screen.getByText('Show Filters');
    fireEvent.click(showFiltersButton);

    const searchInput = screen.getByPlaceholderText('Search services...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    await waitFor(() => {
      expect(screen.getByText('No services found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your filters or search criteria.')).toBeInTheDocument();
    });
  });

  it('should clear all filters', async () => {
    render(<MarketplacePage />);
    
    // Open filters
    const showFiltersButton = screen.getByText('Show Filters');
    fireEvent.click(showFiltersButton);

    await waitFor(() => {
      expect(screen.getByText('Clear all filters')).toBeInTheDocument();
    });

    const clearFiltersButton = screen.getByText('Clear all filters');
    fireEvent.click(clearFiltersButton);

    await waitFor(() => {
      expect(apiMarketplace.fetchMarketplaceData).toHaveBeenCalledWith(
        expect.objectContaining({
          search: undefined,
          category: undefined,
          status: undefined
        })
      );
    });
  });
});
