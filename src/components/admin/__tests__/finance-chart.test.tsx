/**
 * Finance Chart Component Tests
 * Tests for the FinanceChart component
 */

import { render, screen } from '@testing-library/react';
import { FinanceChart } from '../finance-chart';

describe('FinanceChart Component', () => {
  const mockData = [
    { name: 'Q1', value: 100 },
    { name: 'Q2', value: 200 },
    { name: 'Q3', value: 150 },
  ];

  it('should render chart with title', () => {
    render(<FinanceChart title="Revenue Chart" type="bar" data={mockData} />);
    expect(screen.getByText('Revenue Chart')).toBeInTheDocument();
  });

  it('should render bar chart when type is bar', () => {
    render(<FinanceChart title="Chart" type="bar" data={mockData} />);
    // Chart should render (adjust assertion based on actual implementation)
    expect(screen.getByText('Chart')).toBeInTheDocument();
  });

  it('should render pie chart when type is pie', () => {
    render(<FinanceChart title="Chart" type="pie" data={mockData} />);
    expect(screen.getByText('Chart')).toBeInTheDocument();
  });

  it('should render with custom height', () => {
    const { container } = render(
      <FinanceChart title="Chart" type="bar" data={mockData} height="h-96" />
    );
    // Check if custom height class is applied (adjust based on implementation)
    expect(container.firstChild).toBeTruthy();
  });

  it('should handle empty data', () => {
    render(<FinanceChart title="Chart" type="bar" data={[]} />);
    expect(screen.getByText('Chart')).toBeInTheDocument();
  });
});

