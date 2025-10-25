import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import FinanceAdmin from '../finance/page';

// Mock the useSession hook
jest.mock('@/hooks/useAuth', () => ({
  useSession: () => ({
    data: {
      user: {
        id: '1',
        role: 'admin',
        name: 'Test Admin',
        email: 'admin@test.com'
      }
    },
    status: 'authenticated'
  })
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn()
  })
}));

// Mock fetch
global.fetch = jest.fn();

describe('FinanceAdmin', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('renders finance management page', () => {
    render(<FinanceAdmin />);
    
    expect(screen.getByText('Finance Management')).toBeInTheDocument();
    expect(screen.getByText('Monitor revenue, expenses, and financial performance')).toBeInTheDocument();
  });

  it('displays overview tab by default', () => {
    render(<FinanceAdmin />);
    
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('Total Expenses')).toBeInTheDocument();
    expect(screen.getByText('Net Profit')).toBeInTheDocument();
    expect(screen.getByText('Profit Margin')).toBeInTheDocument();
  });

  it('switches to transactions tab', async () => {
    render(<FinanceAdmin />);
    
    const transactionsTab = screen.getByText('Transactions');
    fireEvent.click(transactionsTab);
    
    await waitFor(() => {
      expect(screen.getByText('Recent Transactions')).toBeInTheDocument();
    });
  });

  it('switches to settings tab', async () => {
    render(<FinanceAdmin />);
    
    const settingsTab = screen.getByText('Settings');
    fireEvent.click(settingsTab);
    
    await waitFor(() => {
      expect(screen.getByText('Wallet Settings')).toBeInTheDocument();
    });
  });

  it('opens add expense modal', async () => {
    render(<FinanceAdmin />);
    
    const addExpenseButton = screen.getByText('Add Expense');
    fireEvent.click(addExpenseButton);
    
    await waitFor(() => {
      expect(screen.getByText('Add Expense')).toBeInTheDocument();
      expect(screen.getByLabelText('Amount')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
    });
  });

  it('opens withdrawal request modal', async () => {
    render(<FinanceAdmin />);
    
    const withdrawButton = screen.getByText('Withdraw');
    fireEvent.click(withdrawButton);
    
    await waitFor(() => {
      expect(screen.getByText('Request Withdrawal')).toBeInTheDocument();
      expect(screen.getByLabelText('Amount')).toBeInTheDocument();
    });
  });

  it('handles expense form submission', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });

    render(<FinanceAdmin />);
    
    // Open add expense modal
    fireEvent.click(screen.getByText('Add Expense'));
    
    await waitFor(() => {
      expect(screen.getByText('Add Expense')).toBeInTheDocument();
    });

    // Fill form
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Test expense' } });
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'marketing' } });

    // Submit form
    fireEvent.click(screen.getByText('Add Expense'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/finance/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 100,
          description: 'Test expense',
          category: 'marketing',
          date: expect.any(String)
        })
      });
    });
  });

  it('handles withdrawal form submission', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });

    render(<FinanceAdmin />);
    
    // Open withdrawal modal
    fireEvent.click(screen.getByText('Withdraw'));
    
    await waitFor(() => {
      expect(screen.getByText('Request Withdrawal')).toBeInTheDocument();
    });

    // Fill form
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '500' } });
    fireEvent.change(screen.getByLabelText('Withdrawal Method'), { target: { value: 'bank' } });
    fireEvent.change(screen.getByLabelText('Bank Name'), { target: { value: 'Test Bank' } });
    fireEvent.change(screen.getByLabelText('Account Number'), { target: { value: '123456789' } });

    // Submit form
    fireEvent.click(screen.getByText('Request Withdrawal'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/finance/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 500,
          method: 'bank',
          accountDetails: {
            bankName: 'Test Bank',
            accountNumber: '123456789',
            swiftCode: ''
          },
          notes: ''
        })
      });
    });
  });

  it('handles wallet settings save', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });

    render(<FinanceAdmin />);
    
    // Switch to settings tab
    fireEvent.click(screen.getByText('Settings'));
    
    await waitFor(() => {
      expect(screen.getByText('Wallet Settings')).toBeInTheDocument();
    });

    // Change currency
    fireEvent.change(screen.getByLabelText('Default Currency'), { target: { value: 'EUR' } });

    // Save settings
    fireEvent.click(screen.getByText('Save Settings'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/finance/wallet/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currency: 'EUR',
          autoWithdraw: false,
          withdrawThreshold: 1000,
          withdrawMethod: 'bank',
          notifications: {
            lowBalance: true,
            withdrawalComplete: true,
            monthlyReport: true
          }
        })
      });
    });
  });

  it('displays loading state', () => {
    // Mock loading state
    jest.spyOn(require('@/hooks/useAuth'), 'useSession').mockReturnValue({
      data: null,
      status: 'loading'
    });

    render(<FinanceAdmin />);
    
    expect(screen.getByText('Loading finance')).toBeInTheDocument();
  });

  it('redirects unauthenticated users', () => {
    const mockPush = jest.fn();
    jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue({
      push: mockPush
    });

    jest.spyOn(require('@/hooks/useAuth'), 'useSession').mockReturnValue({
      data: null,
      status: 'unauthenticated'
    });

    render(<FinanceAdmin />);
    
    expect(mockPush).toHaveBeenCalledWith('/auth/signin');
  });
});
