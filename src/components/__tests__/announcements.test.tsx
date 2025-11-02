/**
 * Announcements Component Tests
 * Tests for the Announcements component
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import Announcements from '../announcements';

// Mock fetch
global.fetch = jest.fn();

describe('Announcements Component', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('should render loading state initially', async () => {
    (fetch as jest.Mock).mockImplementation(() =>
      new Promise(() => {}) // Never resolves to keep in loading state
    );

    await act(async () => {
      render(<Announcements />);
    });
    
    // Check for loading indicator (adjust based on actual implementation)
    expect(screen.queryByText('Announcements')).not.toBeInTheDocument();
  });

  it('should render announcements after fetching', async () => {
    const mockAnnouncements = {
      announcements: [
        {
          id: '1',
          title: 'Test Announcement',
          message: 'Test message',
          type: 'info',
          priority: 'medium',
          startDate: new Date().toISOString(),
          isActive: true,
          isDismissible: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAnnouncements,
    });

    await act(async () => {
      render(<Announcements />);
    });

    await waitFor(() => {
      expect(screen.getByText('Announcements')).toBeInTheDocument();
    });
  });

  it('should handle fetch errors gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    await act(async () => {
      render(<Announcements />);
    });

    // Should show fallback announcements or error state
    await waitFor(() => {
      // Component should handle error and show fallback or error message
      expect(screen.getByText(/Welcome to LocalPro|Failed to load/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should render with custom className', async () => {
    const mockAnnouncements = {
      announcements: [
        {
          id: '1',
          title: 'Test Announcement',
          message: 'Test message',
          type: 'info',
          priority: 'medium',
          startDate: new Date().toISOString(),
          isActive: true,
          isDismissible: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAnnouncements,
    });

    let container: HTMLElement;
    await act(async () => {
      const result = render(<Announcements className="custom-class" />);
      container = result.container;
    });
    
    await waitFor(() => {
      const rootElement = container!.querySelector('.custom-class');
      expect(rootElement).toBeInTheDocument();
      expect(rootElement).toHaveClass('custom-class');
    });
  });
});

