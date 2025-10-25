import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import UsersPage from '../users/page';
import * as apiUsers from '@/lib/api-users';

// Mock the API functions
jest.mock('@/lib/api-users');

describe('UsersPage', () => {
  const mockUsersData = [
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
    },
    { 
      id: '2', 
      name: 'Jane Smith', 
      email: 'jane@example.com',
      role: 'client',
      status: 'pending',
      createdAt: '2024-01-02',
      lastLogin: '2024-01-02',
      location: 'Los Angeles',
      phone: '+1987654321'
    }
  ];

  const mockStats = {
    totalUsers: 150,
    activeUsers: 120,
    pendingUsers: 15,
    suspendedUsers: 5,
    newUsersToday: 3,
    newUsersWeek: 25,
    newUsersMonth: 85,
    trends: { daily: [], weekly: [], monthly: [] },
    topRoles: [],
    statusStats: [],
    performanceMetrics: { averageRegistrationTime: 2.5, medianRegistrationTime: 2.0, p95RegistrationTime: 5.0 }
  };

  beforeEach(() => {
    (apiUsers.fetchUsersData as jest.Mock).mockResolvedValue({
      data: mockUsersData,
      total: 2,
      page: 1,
      limit: 10
    });

    (apiUsers.fetchUsersStats as jest.Mock).mockResolvedValue(mockStats);
  });

  it('should render the page header', async () => {
    render(<UsersPage />);
    
    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument();
      expect(screen.getByText('Manage user accounts, roles, and permissions')).toBeInTheDocument();
    });
  });

  it('should display stats cards', async () => {
    render(<UsersPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('Active Users')).toBeInTheDocument();
      expect(screen.getByText('120')).toBeInTheDocument();
      expect(screen.getByText('Pending Users')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('Suspended')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  it('should display users data in table', async () => {
    render(<UsersPage />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });
  });

  it('should handle refresh action', async () => {
    render(<UsersPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);
    
    await waitFor(() => {
      expect(apiUsers.fetchUsersData).toHaveBeenCalledTimes(2);
      expect(apiUsers.fetchUsersStats).toHaveBeenCalledTimes(2);
    });
  });

  it('should handle search functionality', async () => {
    render(<UsersPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Show Filters')).toBeInTheDocument();
    });

    const showFiltersButton = screen.getByText('Show Filters');
    fireEvent.click(showFiltersButton);

    const searchInput = screen.getByPlaceholderText('Search users...');
    fireEvent.change(searchInput, { target: { value: 'john' } });

    await waitFor(() => {
      expect(apiUsers.fetchUsersData).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'john'
        })
      );
    });
  });

  it('should handle role filtering', async () => {
    render(<UsersPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Show Filters')).toBeInTheDocument();
    });

    const showFiltersButton = screen.getByText('Show Filters');
    fireEvent.click(showFiltersButton);

    const roleSelect = screen.getByDisplayValue('All Roles');
    fireEvent.change(roleSelect, { target: { value: 'provider' } });

    await waitFor(() => {
      expect(apiUsers.fetchUsersData).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'provider'
        })
      );
    });
  });

  it('should handle status filtering', async () => {
    render(<UsersPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Show Filters')).toBeInTheDocument();
    });

    const showFiltersButton = screen.getByText('Show Filters');
    fireEvent.click(showFiltersButton);

    const statusSelect = screen.getByDisplayValue('All Status');
    fireEvent.change(statusSelect, { target: { value: 'active' } });

    await waitFor(() => {
      expect(apiUsers.fetchUsersData).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'active'
        })
      );
    });
  });

  it('should handle sorting', async () => {
    render(<UsersPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Name')).toBeInTheDocument();
    });

    const nameSortButton = screen.getByText('Name');
    fireEvent.click(nameSortButton);

    await waitFor(() => {
      expect(apiUsers.fetchUsersData).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'name',
          sortOrder: 'desc'
        })
      );
    });
  });

  it('should handle API errors gracefully', async () => {
    (apiUsers.fetchUsersData as jest.Mock).mockRejectedValue(new Error('API Error'));
    
    render(<UsersPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  it('should show loading state initially', () => {
    render(<UsersPage />);
    
    expect(screen.getByText('Loading users data...')).toBeInTheDocument();
  });

  it('should display empty state when no users found', async () => {
    (apiUsers.fetchUsersData as jest.Mock).mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 10
    });

    render(<UsersPage />);
    
    await waitFor(() => {
      expect(screen.getByText('No users found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your filters or search criteria.')).toBeInTheDocument();
    });
  });

  it('should clear filters when clear button is clicked', async () => {
    render(<UsersPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Show Filters')).toBeInTheDocument();
    });

    const showFiltersButton = screen.getByText('Show Filters');
    fireEvent.click(showFiltersButton);

    const clearButton = screen.getByText('Clear all filters');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(apiUsers.fetchUsersData).toHaveBeenCalledWith(
        expect.objectContaining({
          search: undefined,
          role: undefined,
          status: undefined
        })
      );
    });
  });
});
