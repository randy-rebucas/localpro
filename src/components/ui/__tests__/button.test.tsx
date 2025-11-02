/**
 * Button Component Tests
 * Tests for the UI Button component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../button';

describe('Button Component', () => {
  it('should render button with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled button</Button>);
    const button = screen.getByRole('button', { name: /disabled button/i });
    expect(button).toBeDisabled();
  });

  it('should not call onClick when disabled', () => {
    const handleClick = jest.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    
    const button = screen.getByRole('button', { name: /disabled/i });
    fireEvent.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should apply variant classes', () => {
    const { rerender } = render(<Button variant="default">Button</Button>);
    let button = screen.getByRole('button');
    expect(button).toHaveClass('bg-blue-600'); // Default variant
    
    rerender(<Button variant="destructive">Button</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('bg-red-600'); // Destructive variant
  });

  it('should apply size classes', () => {
    const { rerender } = render(<Button size="sm">Button</Button>);
    let button = screen.getByRole('button');
    expect(button).toHaveClass('h-9'); // Small size
    
    rerender(<Button size="lg">Button</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('h-11'); // Large size
  });
});

