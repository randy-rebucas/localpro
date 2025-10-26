import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminLogsPage from '../page';

// Mock the API calls
global.fetch = jest.fn();

// Mock the useSession hook
jest.mock('@/hooks/useAuth', () => ({
  useSession: () => ({
    data: {
      user: {
        id: '1',
        name: 'Test Admin',
        email: 'admin@test.com',
        role: 'admin'
      }
    },
    status: 'authenticated'
  })
}));

// Mock the role guard
jest.mock('@/components/role-guard', () => ({
  useRoleAccess: () => ({
    isAdmin: true
  })
}));

describe('AdminLogsPage', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it('renders the admin logs page with correct title', () => {
    render(<AdminLogsPage />);
    
    expect(screen.getByText('System Logs')).toBeInTheDocument();
    expect(screen.getByText('Monitor system activity and performance')).toBeInTheDocument();
  });

  it('displays stats overview cards', () => {
    render(<AdminLogsPage />);
    
    expect(screen.getByText('Total Logs')).toBeInTheDocument();
    expect(screen.getByText('Errors')).toBeInTheDocument();
    expect(screen.getByText('Active Users')).toBeInTheDocument();
    expect(screen.getByText('System Health')).toBeInTheDocument();
  });

  it('shows filters section when filter button is clicked', () => {
    render(<AdminLogsPage />);
    
    const filterButton = screen.getByText('Show Filters');
    fireEvent.click(filterButton);
    
    expect(screen.getByText('Date Range')).toBeInTheDocument();
    expect(screen.getByText('Level')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
  });

  it('handles export functionality', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(new Blob(['test data']))
    });

    render(<AdminLogsPage />);
    
    const csvButton = screen.getByText('CSV');
    fireEvent.click(csvButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('displays refresh button and handles refresh', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ logs: [], stats: {} })
    });

    render(<AdminLogsPage />);
    
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('handles error state correctly', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(<AdminLogsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  it('displays loading state initially', () => {
    render(<AdminLogsPage />);
    
    expect(screen.getByText('Loading system logs...')).toBeInTheDocument();
  });
});
