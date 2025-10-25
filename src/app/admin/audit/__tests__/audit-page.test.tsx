import { render, screen, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import AdminAuditPage from '../page';

// Mock the hooks
jest.mock('@/components/role-guard', () => ({
  useRoleAccess: () => ({ isAdmin: true })
}));

jest.mock('@/hooks/useAuth', () => ({
  useSession: () => ({ 
    data: { 
      user: { 
        id: '1', 
        name: 'Test Admin', 
        email: 'admin@test.com', 
        role: 'admin' 
      } 
    } 
  })
}));

// Mock fetch
global.fetch = jest.fn();

describe('AdminAuditPage', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it('renders audit page with loading state', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ logs: [], stats: { totalLogs: 0, todayLogs: 0, criticalAlerts: 0, uniqueUsers: 0 } })
    });

    render(<AdminAuditPage />);
    
    expect(screen.getByText('Loading audit logs...')).toBeInTheDocument();
  });

  it('renders audit page with data', async () => {
    const mockLogs = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        user: { id: '1', name: 'Test User', email: 'user@test.com', role: 'client' },
        action: 'Login',
        resource: 'Authentication',
        details: 'User logged in successfully',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        status: 'success',
        severity: 'low',
        category: 'authentication',
        sessionId: 'session123'
      }
    ];

    const mockStats = {
      totalLogs: 100,
      todayLogs: 10,
      criticalAlerts: 2,
      uniqueUsers: 50,
      topActions: [{ action: 'Login', count: 20 }],
      categoryBreakdown: [{ category: 'authentication', count: 30 }],
      severityBreakdown: [{ severity: 'low', count: 80 }]
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ logs: mockLogs })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats
      });

    render(<AdminAuditPage />);

    await waitFor(() => {
      expect(screen.getByText('Audit Logs')).toBeInTheDocument();
      expect(screen.getByText('Monitor system activity and security events')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(<AdminAuditPage />);

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  it('displays filter controls', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ logs: [] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ totalLogs: 0, todayLogs: 0, criticalAlerts: 0, uniqueUsers: 0 })
      });

    render(<AdminAuditPage />);

    await waitFor(() => {
      expect(screen.getByText('Filters & Search')).toBeInTheDocument();
      expect(screen.getByText('Show Filters')).toBeInTheDocument();
    });
  });

  it('displays export buttons', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ logs: [] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ totalLogs: 0, todayLogs: 0, criticalAlerts: 0, uniqueUsers: 0 })
      });

    render(<AdminAuditPage />);

    await waitFor(() => {
      expect(screen.getByText('Export CSV')).toBeInTheDocument();
      expect(screen.getByText('Export JSON')).toBeInTheDocument();
    });
  });
});
