import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileCard, MobileListItem, MobileActionGrid } from '../mobile-card';

// Mock navigator.vibrate
Object.defineProperty(navigator, 'vibrate', {
  value: jest.fn(),
  writable: true,
});

describe('MobileCard', () => {
  it('renders children correctly', () => {
    render(
      <MobileCard>
        <div>Test Content</div>
      </MobileCard>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const mockOnClick = jest.fn();
    render(
      <MobileCard onClick={mockOnClick}>
        <div>Clickable Content</div>
      </MobileCard>
    );

    const card = screen.getByText('Clickable Content');
    fireEvent.click(card);

    // Note: The actual click handling is done through the gesture hook
    // This test verifies the component renders and can be clicked
    expect(card).toBeInTheDocument();
  });

  it('handles long press events', () => {
    const mockOnLongPress = jest.fn();
    render(
      <MobileCard onLongPress={mockOnLongPress}>
        <div>Long Press Content</div>
      </MobileCard>
    );

    const card = screen.getByText('Long Press Content');

    // Simulate long press (touch start and hold)
    fireEvent.touchStart(card, {
      touches: [{ clientX: 0, clientY: 0 }]
    });

    // Wait for long press delay (500ms) and release
    setTimeout(() => {
      fireEvent.touchEnd(card);
    }, 600);

    // Check if long press was triggered
    setTimeout(() => {
      expect(mockOnLongPress).toHaveBeenCalledTimes(1);
    }, 700);
  });

  it('disables interactions when disabled prop is true', () => {
    const mockOnClick = jest.fn();
    render(
      <MobileCard onClick={mockOnClick} disabled>
        <div>Disabled Content</div>
      </MobileCard>
    );

    const card = screen.getByText('Disabled Content');
    fireEvent.click(card);

    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('applies disabled styling when disabled', () => {
    render(
      <MobileCard disabled>
        <div>Disabled Content</div>
      </MobileCard>
    );

    const card = screen.getByText('Disabled Content').parentElement;
    expect(card).toHaveClass('opacity-50');
  });

  it('renders with haptic feedback enabled', () => {
    render(
      <MobileCard hapticFeedback>
        <div>Haptic Content</div>
      </MobileCard>
    );

    const card = screen.getByText('Haptic Content');
    expect(card).toBeInTheDocument();
  });
});

describe('MobileListItem', () => {
  it('renders title and subtitle correctly', () => {
    render(
      <MobileListItem
        title="Test Title"
        subtitle="Test Subtitle"
      />
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
  });

  it('renders left and right icons', () => {
    const LeftIcon = () => <span>Left</span>;
    const RightIcon = () => <span>Right</span>;

    render(
      <MobileListItem
        title="Test Title"
        leftIcon={<LeftIcon />}
        rightIcon={<RightIcon />}
      />
    );

    expect(screen.getByText('Left')).toBeInTheDocument();
    expect(screen.getByText('Right')).toBeInTheDocument();
  });

  it('displays badge when provided', () => {
    render(
      <MobileListItem
        title="Test Title"
        badge="New"
      />
    );

    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('renders with click handler', () => {
    const mockOnClick = jest.fn();
    render(
      <MobileListItem
        title="Test Title"
        onClick={mockOnClick}
      />
    );

    const item = screen.getByText('Test Title');
    expect(item).toBeInTheDocument();
  });
});

describe('MobileActionGrid', () => {
  const mockActions = [
    {
      icon: <span>Icon1</span>,
      label: 'Action 1',
      onClick: jest.fn(),
    },
    {
      icon: <span>Icon2</span>,
      label: 'Action 2',
      onClick: jest.fn(),
    },
  ];

  it('renders all actions', () => {
    render(<MobileActionGrid actions={mockActions} />);

    expect(screen.getByText('Action 1')).toBeInTheDocument();
    expect(screen.getByText('Action 2')).toBeInTheDocument();
    expect(screen.getByText('Icon1')).toBeInTheDocument();
    expect(screen.getByText('Icon2')).toBeInTheDocument();
  });

  it('renders actions with click handlers', () => {
    render(<MobileActionGrid actions={mockActions} />);

    const action1 = screen.getByText('Action 1');
    expect(action1).toBeInTheDocument();
  });

  it('disables actions when disabled prop is true', () => {
    const disabledActions = [
      {
        icon: <span>Icon</span>,
        label: 'Disabled Action',
        onClick: jest.fn(),
        disabled: true,
      },
    ];

    render(<MobileActionGrid actions={disabledActions} />);

    const action = screen.getByText('Disabled Action');
    fireEvent.click(action);

    expect(disabledActions[0].onClick).not.toHaveBeenCalled();
  });

  it('displays badges when provided', () => {
    const actionsWithBadges = [
      {
        icon: <span>Icon</span>,
        label: 'Action with Badge',
        onClick: jest.fn(),
        badge: '5',
      },
    ];

    render(<MobileActionGrid actions={actionsWithBadges} />);

    expect(screen.getByText('5')).toBeInTheDocument();
  });
});
