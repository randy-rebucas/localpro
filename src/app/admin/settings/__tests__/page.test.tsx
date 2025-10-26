import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminSettings from '../page';

// Mock the fetch function
global.fetch = jest.fn();

// Mock the useSession hook
jest.mock('@/hooks/useAuth', () => ({
  useSession: () => ({
    data: {
      user: {
        id: '1',
        role: 'admin',
        email: 'admin@localpro.com'
      }
    },
    status: 'authenticated'
  })
}));

// Mock the Loading component
jest.mock('@/components/ui/loading', () => ({
  Loading: ({ text }: { text: string }) => (
    <div data-testid="loading">{text}</div>
  )
}));

// Mock the AdminErrorState component
jest.mock('@/components/admin/admin-error-state', () => ({
  AdminErrorState: ({ error, onRetry, retryText }: { error: string; onRetry: () => void; retryText: string }) => (
    <div data-testid="error-state">
      <p>{error}</p>
      <button onClick={onRetry}>{retryText}</button>
    </div>
  )
}));

describe('AdminSettings', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('renders loading state initially', () => {
    (fetch as jest.Mock).mockImplementation(() => 
      new Promise(() => {}) // Never resolves to keep loading state
    );

    render(<AdminSettings />);
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('renders error state when API fails', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'API Error' })
    });

    render(<AdminSettings />);
    
    await waitFor(() => {
      expect(screen.getByTestId('error-state')).toBeInTheDocument();
    });
  });

  it('renders settings form when data loads successfully', async () => {
    const mockSettings = {
      general: {
        siteName: 'LocalPro',
        siteDescription: 'Professional services marketplace',
        siteUrl: 'https://localpro.com',
        adminEmail: 'admin@localpro.com',
        supportEmail: 'support@localpro.com',
        timezone: 'UTC',
        language: 'en',
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h'
      },
      features: {
        marketplace: true,
        academy: true,
        supplies: true,
        rentals: true,
        jobs: true,
        ads: true,
        communication: true,
        analytics: true,
        referrals: true,
        trustVerification: true,
        localProPlus: true,
        facilityCare: true
      },
      security: {
        twoFactorAuth: true,
        emailVerification: true,
        phoneVerification: false,
        passwordMinLength: 8,
        passwordRequireSpecial: true,
        passwordRequireNumbers: true,
        passwordRequireUppercase: true,
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        lockoutDuration: 15
      },
      api: {
        rateLimit: 1000,
        timeout: 30,
        maxFileSize: 10485760,
        allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
        corsOrigins: ['https://localpro.com', 'https://admin.localpro.com'],
        apiVersion: 'v1',
        debugMode: false,
        loggingLevel: 'info'
      },
      notifications: {
        emailEnabled: true,
        smsEnabled: false,
        pushEnabled: true,
        emailProvider: 'smtp',
        smsProvider: 'twilio',
        pushProvider: 'firebase',
        emailTemplates: true,
        notificationChannels: ['email', 'push']
      },
      payment: {
        paypalEnabled: true,
        paymayaEnabled: true,
        stripeEnabled: false,
        paypalClientId: '***',
        paymayaPublicKey: '***',
        stripePublishableKey: '***',
        currency: 'USD',
        taxRate: 8.25,
        commissionRate: 5.0
      },
      storage: {
        provider: 'aws-s3',
        bucketName: 'localpro-storage',
        region: 'us-east-1',
        accessKey: '***',
        secretKey: '***',
        cdnUrl: 'https://cdn.localpro.com',
        maxFileSize: 52428800,
        allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'mp4', 'mov']
      },
      monitoring: {
        errorTracking: true,
        performanceMonitoring: true,
        uptimeMonitoring: true,
        logRetention: 90,
        alertThresholds: {
          errorRate: 5.0,
          responseTime: 2.0,
          uptime: 99.5
        }
      }
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockSettings })
    });

    render(<AdminSettings />);
    
    await waitFor(() => {
      expect(screen.getByText('System Settings')).toBeInTheDocument();
      expect(screen.getByText('General Settings')).toBeInTheDocument();
      expect(screen.getByText('Feature Flags')).toBeInTheDocument();
      expect(screen.getByText('Security Settings')).toBeInTheDocument();
    });
  });

  it('allows switching between settings categories', async () => {
    const mockSettings = {
      general: { siteName: 'LocalPro' },
      features: { marketplace: true },
      security: { twoFactorAuth: true },
      api: { rateLimit: 1000 },
      notifications: { emailEnabled: true },
      payment: { paypalEnabled: true },
      storage: { provider: 'aws-s3' },
      monitoring: { errorTracking: true }
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockSettings })
    });

    render(<AdminSettings />);
    
    await waitFor(() => {
      expect(screen.getByText('General Settings')).toBeInTheDocument();
    });

    // Click on Feature Flags category
    fireEvent.click(screen.getByText('Feature Flags'));
    
    await waitFor(() => {
      expect(screen.getByText('Feature Flags')).toBeInTheDocument();
    });
  });

  it('handles save functionality', async () => {
    const mockSettings = {
      general: { siteName: 'LocalPro' },
      features: { marketplace: true },
      security: { twoFactorAuth: true },
      api: { rateLimit: 1000 },
      notifications: { emailEnabled: true },
      payment: { paypalEnabled: true },
      storage: { provider: 'aws-s3' },
      monitoring: { errorTracking: true }
    };

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockSettings })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, message: 'Settings saved' })
      });

    render(<AdminSettings />);
    
    await waitFor(() => {
      expect(screen.getByText('System Settings')).toBeInTheDocument();
    });

    // Click save button
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2); // Initial load + save
    });
  });
});
