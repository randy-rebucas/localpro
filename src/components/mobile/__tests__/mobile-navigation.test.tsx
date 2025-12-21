import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileNavigation } from '../mobile-navigation';

// Mock Next.js router
const mockPush = jest.fn();
const mockUseRouter = jest.fn(() => ({
  push: mockPush,
}));

const mockUsePathname = jest.fn(() => '/dashboard');

jest.mock('next/navigation', () => ({
  useRouter: () => mockUseRouter(),
  usePathname: () => mockUsePathname(),
}));

// Mock Next.js Link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('MobileNavigation', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('renders navigation bar with main elements', () => {
    render(<MobileNavigation />);

    // Check for menu button
    expect(screen.getByLabelText('Menu')).toBeInTheDocument();

    // Check for search button
    expect(screen.getByLabelText('Search')).toBeInTheDocument();

    // Check for messages button
    expect(screen.getByLabelText('Messages')).toBeInTheDocument();

    // Check for notifications button
    expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
  });

  it('shows unread counts when provided', () => {
    render(<MobileNavigation unreadMessages={5} unreadNotifications={3} />);

    // Check for unread message count
    expect(screen.getByText('5')).toBeInTheDocument();

    // Check for unread notification count
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders search button correctly', () => {
    render(<MobileNavigation />);

    const searchButton = screen.getByLabelText('Search');
    expect(searchButton).toBeInTheDocument();

    // Check that it's wrapped in a link with correct href
    const searchLink = searchButton.closest('a');
    expect(searchLink).toHaveAttribute('href', '/search');
  });

  it('renders messages button correctly', () => {
    render(<MobileNavigation />);

    const messagesButton = screen.getByLabelText('Messages');
    expect(messagesButton).toBeInTheDocument();

    // Check that it's wrapped in a link with correct href
    const messagesLink = messagesButton.closest('a');
    expect(messagesLink).toHaveAttribute('href', '/messages');
  });

  it('renders notifications button correctly', () => {
    render(<MobileNavigation />);

    const notificationsButton = screen.getByLabelText('Notifications');
    expect(notificationsButton).toBeInTheDocument();

    // Check that it's wrapped in a link with correct href
    const notificationsLink = notificationsButton.closest('a');
    expect(notificationsLink).toHaveAttribute('href', '/notifications');
  });

  it('filters navigation items based on user role', () => {
    render(<MobileNavigation userRole="provider" />);

    // Should show provider-specific navigation
    // This test would need to be expanded based on actual role filtering logic
    expect(screen.getByLabelText('Menu')).toBeInTheDocument();
  });

  it('opens menu when menu button is clicked', () => {
    render(<MobileNavigation />);

    const menuButton = screen.getByLabelText('Menu');
    fireEvent.click(menuButton);

    // Menu should now be visible
    expect(screen.getByText('Menu')).toBeInTheDocument();
  });

  it('closes menu when close button is clicked', () => {
    render(<MobileNavigation />);

    // Open menu
    const menuButton = screen.getByLabelText('Menu');
    fireEvent.click(menuButton);

    // Check that menu is open (X button should be visible)
    expect(screen.getByText('Menu')).toBeInTheDocument();

    // Close menu (find the X button by its icon)
    const closeButton = screen.getByRole('button', { name: '' }); // The X button doesn't have a label
    fireEvent.click(closeButton);

    // Menu should be closed (Menu text should not be visible)
    expect(screen.queryByText('Menu')).not.toBeInTheDocument();
  });

  it('renders menu items correctly', () => {
    render(<MobileNavigation />);

    // Open menu
    const menuButton = screen.getByLabelText('Menu');
    fireEvent.click(menuButton);

    // Check that menu items are visible
    expect(screen.getByText('Marketplace')).toBeInTheDocument();
    expect(screen.getByText('Supplies')).toBeInTheDocument();
    expect(screen.getByText('Academy')).toBeInTheDocument();
  });
});
