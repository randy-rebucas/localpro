import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FinanceStatsCard } from '../finance-stats-card';
import { FinanceChart } from '../finance-chart';
import { FinanceFilters } from '../finance-filters';
import { AddExpenseModal } from '../add-expense-modal';
import { WithdrawalRequestModal } from '../withdrawal-request-modal';
import { FinanceWalletSettings } from '../finance-wallet-settings';
import { TrendingUp, DollarSign } from 'lucide-react';

describe('FinanceStatsCard', () => {
  it('renders stats card with correct data', () => {
    render(
      <FinanceStatsCard
        title="Total Revenue"
        value="$45,678"
        change="+12.5% from last month"
        changeType="positive"
        icon={TrendingUp}
        iconColor="text-green-600"
        iconBg="bg-green-100"
      />
    );

    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('$45,678')).toBeInTheDocument();
    expect(screen.getByText('+12.5% from last month')).toBeInTheDocument();
  });

  it('applies correct colors for positive change', () => {
    render(
      <FinanceStatsCard
        title="Test"
        value="$100"
        change="+5%"
        changeType="positive"
        icon={TrendingUp}
        iconColor="text-green-600"
        iconBg="bg-green-100"
      />
    );

    const changeElement = screen.getByText('+5%');
    expect(changeElement).toHaveClass('text-green-600');
  });

  it('applies correct colors for negative change', () => {
    render(
      <FinanceStatsCard
        title="Test"
        value="$100"
        change="-5%"
        changeType="negative"
        icon={TrendingUp}
        iconColor="text-red-600"
        iconBg="bg-red-100"
      />
    );

    const changeElement = screen.getByText('-5%');
    expect(changeElement).toHaveClass('text-red-600');
  });
});

describe('FinanceChart', () => {
  it('renders bar chart', () => {
    render(
      <FinanceChart
        title="Revenue Trend"
        type="bar"
        data={[]}
      />
    );

    expect(screen.getByText('Revenue Trend')).toBeInTheDocument();
    expect(screen.getByText('Bar chart will be displayed here')).toBeInTheDocument();
  });

  it('renders pie chart', () => {
    render(
      <FinanceChart
        title="Expense Breakdown"
        type="pie"
        data={[]}
      />
    );

    expect(screen.getByText('Expense Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Pie chart will be displayed here')).toBeInTheDocument();
  });

  it('renders line chart', () => {
    render(
      <FinanceChart
        title="Growth Trend"
        type="line"
        data={[]}
      />
    );

    expect(screen.getByText('Growth Trend')).toBeInTheDocument();
    expect(screen.getByText('Line chart will be displayed here')).toBeInTheDocument();
  });
});

describe('FinanceFilters', () => {
  it('renders filter controls', () => {
    const mockOnFiltersChange = jest.fn();
    
    render(
      <FinanceFilters onFiltersChange={mockOnFiltersChange} />
    );

    expect(screen.getByPlaceholderText('Search transactions...')).toBeInTheDocument();
    expect(screen.getByDisplayValue('All Types')).toBeInTheDocument();
    expect(screen.getByDisplayValue('All Status')).toBeInTheDocument();
    expect(screen.getByDisplayValue('All Categories')).toBeInTheDocument();
  });

  it('calls onFiltersChange when search input changes', () => {
    const mockOnFiltersChange = jest.fn();
    
    render(
      <FinanceFilters onFiltersChange={mockOnFiltersChange} />
    );

    const searchInput = screen.getByPlaceholderText('Search transactions...');
    fireEvent.change(searchInput, { target: { value: 'test search' } });

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'test search'
      })
    );
  });

  it('calls onFiltersChange when type filter changes', () => {
    const mockOnFiltersChange = jest.fn();
    
    render(
      <FinanceFilters onFiltersChange={mockOnFiltersChange} />
    );

    const typeSelect = screen.getByDisplayValue('All Types');
    fireEvent.change(typeSelect, { target: { value: 'revenue' } });

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'revenue'
      })
    );
  });

  it('clears filters when clear button is clicked', () => {
    const mockOnFiltersChange = jest.fn();
    
    render(
      <FinanceFilters onFiltersChange={mockOnFiltersChange} />
    );

    const clearButton = screen.getByText('Clear');
    fireEvent.click(clearButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      search: '',
      type: 'all',
      status: 'all',
      startDate: '',
      endDate: '',
      category: 'all'
    });
  });
});

describe('AddExpenseModal', () => {
  it('renders modal when open', () => {
    const mockOnClose = jest.fn();
    const mockOnSubmit = jest.fn();

    render(
      <AddExpenseModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('Add Expense')).toBeInTheDocument();
    expect(screen.getByLabelText('Amount')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Category')).toBeInTheDocument();
    expect(screen.getByLabelText('Date')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <AddExpenseModal
        isOpen={false}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
      />
    );

    expect(screen.queryByText('Add Expense')).not.toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', () => {
    const mockOnClose = jest.fn();
    const mockOnSubmit = jest.fn();

    render(
      <AddExpenseModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('submits form with correct data', async () => {
    const mockOnClose = jest.fn();
    const mockOnSubmit = jest.fn().mockResolvedValue(undefined);

    render(
      <AddExpenseModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // Fill form
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Test expense' } });
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'marketing' } });

    // Submit form
    const submitButton = screen.getByText('Add Expense');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        amount: 100,
        description: 'Test expense',
        category: 'marketing',
        date: expect.any(String),
        receipt: undefined
      });
    });
  });
});

describe('WithdrawalRequestModal', () => {
  it('renders modal when open', () => {
    const mockOnClose = jest.fn();
    const mockOnSubmit = jest.fn();

    render(
      <WithdrawalRequestModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        availableBalance={1000}
      />
    );

    expect(screen.getByText('Request Withdrawal')).toBeInTheDocument();
    expect(screen.getByText('Available Balance: $1,000.00')).toBeInTheDocument();
    expect(screen.getByLabelText('Amount')).toBeInTheDocument();
    expect(screen.getByLabelText('Withdrawal Method')).toBeInTheDocument();
  });

  it('shows bank account fields when bank method is selected', () => {
    const mockOnClose = jest.fn();
    const mockOnSubmit = jest.fn();

    render(
      <WithdrawalRequestModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        availableBalance={1000}
      />
    );

    const methodSelect = screen.getByLabelText('Withdrawal Method');
    fireEvent.change(methodSelect, { target: { value: 'bank' } });

    expect(screen.getByLabelText('Bank Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Account Number')).toBeInTheDocument();
    expect(screen.getByLabelText('SWIFT Code')).toBeInTheDocument();
  });

  it('shows PayPal email field when PayPal method is selected', () => {
    const mockOnClose = jest.fn();
    const mockOnSubmit = jest.fn();

    render(
      <WithdrawalRequestModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        availableBalance={1000}
      />
    );

    const methodSelect = screen.getByLabelText('Withdrawal Method');
    fireEvent.change(methodSelect, { target: { value: 'paypal' } });

    expect(screen.getByLabelText('PayPal Email')).toBeInTheDocument();
  });
});

describe('FinanceWalletSettings', () => {
  it('renders wallet settings form', () => {
    const mockOnSave = jest.fn();

    render(
      <FinanceWalletSettings onSave={mockOnSave} />
    );

    expect(screen.getByText('Wallet Settings')).toBeInTheDocument();
    expect(screen.getByLabelText('Default Currency')).toBeInTheDocument();
    expect(screen.getByLabelText('Withdrawal Method')).toBeInTheDocument();
    expect(screen.getByText('Enable automatic withdrawals')).toBeInTheDocument();
  });

  it('shows withdrawal threshold when auto-withdraw is enabled', () => {
    const mockOnSave = jest.fn();

    render(
      <FinanceWalletSettings onSave={mockOnSave} />
    );

    const autoWithdrawCheckbox = screen.getByLabelText('Enable automatic withdrawals');
    fireEvent.click(autoWithdrawCheckbox);

    expect(screen.getByLabelText('Withdrawal Threshold')).toBeInTheDocument();
  });

  it('calls onSave when save button is clicked', async () => {
    const mockOnSave = jest.fn().mockResolvedValue(undefined);

    render(
      <FinanceWalletSettings onSave={mockOnSave} />
    );

    const saveButton = screen.getByText('Save Settings');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        currency: 'USD',
        autoWithdraw: false,
        withdrawThreshold: 1000,
        withdrawMethod: 'bank',
        notifications: {
          lowBalance: true,
          withdrawalComplete: true,
          monthlyReport: true
        }
      });
    });
  });
});
