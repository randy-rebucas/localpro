/**
 * GlobalHeader Component Tests
 * Tests for the GlobalHeader component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GlobalHeader } from '../global-header';
import { useSession } from '@/hooks/useAuth';
import { useRoleAccess } from '@/components/role-guard';

// Mock dependencies
jest.mock('@/hooks/useAuth');
jest.mock('@/components/role-guard');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  usePathname: () => '/dashboard',
}));

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockUseRoleAccess = useRoleAccess as jest.MockedFunction<typeof useRoleAccess>;

describe('GlobalHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mocks
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated' as const,
    });
    
    mockUseRoleAccess.mockReturnValue({
      isAdmin: false,
      isServiceProvider: false,
      isSupplier: false,
      isInstructor: false,
      isAgencyOwner: false,
      isAgencyAdmin: false,
      isAdministrative: false,
    });
  });

  it('should render logo', () => {
    render(<GlobalHeader />);
    // Logo should be present - check for LocalPro logo image
    expect(screen.getByAltText('LocalPro logo')).toBeInTheDocument();
    // Logo link should be present
    expect(screen.getByRole('link', { name: /localpro logo/i })).toBeInTheDocument();
  });

  it('should show sign in button when not authenticated', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated' as const,
    });

    render(<GlobalHeader />);
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should show user menu when authenticated', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
        },
      },
      status: 'authenticated' as const,
    });

    render(<GlobalHeader />);
    // User menu should be present - find button by aria-label or user name
    expect(screen.getByRole('button', { name: /user menu for test user/i })).toBeInTheDocument();
  });

  it('should show search bar on desktop', () => {
    render(<GlobalHeader />);
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it('should show notifications when authenticated', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          email: 'test@example.com',
        },
      },
      status: 'authenticated' as const,
    });

    render(<GlobalHeader notificationsDropdown={true} />);
    // Notification button should be present with aria-label
    expect(screen.getByRole('button', { name: /view notifications/i })).toBeInTheDocument();
  });

  it('should show role navigation icons when enabled', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          email: 'test@example.com',
        },
      },
      status: 'authenticated' as const,
    });

    mockUseRoleAccess.mockReturnValue({
      isServiceProvider: true,
      isSupplier: false,
      isInstructor: false,
      isAgencyOwner: false,
      isAgencyAdmin: false,
      isAdmin: false,
      isAdministrative: false,
    });

    render(<GlobalHeader showRoleNavigation={true} />);
    expect(screen.getByLabelText(/navigate to marketplace/i)).toBeInTheDocument();
  });

  it('should handle search input changes', async () => {
    render(<GlobalHeader />);
    const searchInput = screen.getByPlaceholderText(/search/i) as HTMLInputElement;
    
    fireEvent.change(searchInput, { target: { value: 'test query' } });
    
    await waitFor(() => {
      expect(searchInput.value).toBe('test query');
    });
  });
});

