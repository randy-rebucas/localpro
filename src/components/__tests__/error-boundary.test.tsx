/**
 * Error Boundary Component Tests
 * Tests for the ErrorBoundary component
 */

import { render, screen } from '@testing-library/react';
import ErrorBoundary, { useErrorHandler } from '../error-boundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should render error UI when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should show error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Error Details:')).toBeInTheDocument();
    
    process.env.NODE_ENV = originalEnv;
  });

  it('should have retry button', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('should have go to dashboard link', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    const link = screen.getByText('Go to Dashboard').closest('a');
    expect(link).toHaveAttribute('href', '/dashboard');
  });
});

describe('useErrorHandler', () => {
  it('should return a function', () => {
    const errorHandler = useErrorHandler();
    expect(typeof errorHandler).toBe('function');
  });

  it('should handle errors when called', () => {
    const errorHandler = useErrorHandler();
    const error = new Error('Test error');
    
    // Should not throw
    expect(() => errorHandler(error)).not.toThrow();
  });
});

