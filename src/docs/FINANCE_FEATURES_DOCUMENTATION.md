# Finance Management System Documentation

## Overview

The Finance Management System provides comprehensive financial tracking, reporting, and management capabilities for the LocalPro platform. It includes revenue tracking, expense management, withdrawal processing, and financial analytics.

## Features

### 1. Financial Overview Dashboard
- **Total Revenue**: Displays current revenue with growth indicators
- **Total Expenses**: Shows expense tracking with trend analysis
- **Net Profit**: Calculates and displays profit margins
- **Profit Margin**: Percentage-based profit analysis
- **Interactive Charts**: Revenue trends and expense breakdowns

### 2. Transaction Management
- **Transaction History**: Complete transaction log with filtering
- **Transaction Types**: Revenue, expenses, and withdrawals
- **Status Tracking**: Completed, pending, and failed transactions
- **Search & Filter**: Advanced filtering by type, status, date, and category
- **Export Capabilities**: Data export for external analysis

### 3. Expense Management
- **Add Expenses**: Create and categorize business expenses
- **Receipt Upload**: Attach receipts and supporting documents
- **Category Management**: Organize expenses by business categories
- **Expense Tracking**: Monitor spending patterns and trends

### 4. Withdrawal System
- **Withdrawal Requests**: Submit withdrawal requests with account details
- **Multiple Methods**: Bank transfer and PayPal support
- **Admin Processing**: Admin approval workflow for withdrawals
- **Balance Management**: Real-time balance tracking

### 5. Wallet Settings
- **Currency Configuration**: Multi-currency support
- **Auto-Withdrawal**: Automated withdrawal settings
- **Notification Preferences**: Customizable financial alerts
- **Security Settings**: Enhanced financial security options

## API Endpoints

### Finance Overview
```
GET /api/finance/overview
```
Returns financial overview data including revenue, expenses, profit, and growth metrics.

**Query Parameters:**
- `period`: Time period in days (default: 30)
- `startDate`: Start date for custom range
- `endDate`: End date for custom range

### Transactions
```
GET /api/finance/transactions
```
Retrieves paginated transaction list with filtering options.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)
- `type`: Transaction type (revenue, expense, withdrawal)
- `status`: Transaction status (completed, pending, failed)
- `startDate`: Filter start date
- `endDate`: Filter end date
- `search`: Search term
- `sortBy`: Sort field (default: createdAt)
- `sortOrder`: Sort direction (asc, desc)

### Earnings
```
GET /api/finance/earnings
```
Retrieves earnings data with filtering and pagination.

### Expenses
```
GET /api/finance/expenses
POST /api/finance/expenses
```
- GET: Retrieve expense list
- POST: Create new expense

**POST Body:**
```json
{
  "amount": 100.00,
  "description": "Office supplies",
  "category": "operations",
  "date": "2024-01-15",
  "receipt": "file_upload"
}
```

### Withdrawals
```
POST /api/finance/withdraw
PUT /api/finance/withdrawals/:withdrawalId/process
```
- POST: Request withdrawal
- PUT: Process withdrawal (Admin only)

**POST Body:**
```json
{
  "amount": 500.00,
  "method": "bank",
  "accountDetails": {
    "bankName": "Example Bank",
    "accountNumber": "123456789",
    "swiftCode": "EXMPUS33"
  },
  "notes": "Monthly withdrawal"
}
```

### Tax Documents
```
GET /api/finance/tax-documents
```
Retrieves tax documents with filtering by year and type.

### Financial Reports
```
GET /api/finance/reports
```
Generates financial reports in various formats.

**Query Parameters:**
- `type`: Report type (summary, detailed, tax)
- `format`: Output format (json, pdf, csv)
- `startDate`: Report start date
- `endDate`: Report end date

### Wallet Settings
```
GET /api/finance/wallet/settings
PUT /api/finance/wallet/settings
```
- GET: Retrieve current wallet settings
- PUT: Update wallet settings

## Components

### FinanceStatsCard
Displays financial metrics with icons, values, and trend indicators.

**Props:**
- `title`: Card title
- `value`: Display value
- `change`: Change indicator text
- `changeType`: Change type (positive, negative, neutral)
- `icon`: Lucide icon component
- `iconColor`: Icon color class
- `iconBg`: Icon background class

### FinanceChart
Renders financial charts with placeholder for future chart library integration.

**Props:**
- `title`: Chart title
- `type`: Chart type (bar, pie, line)
- `data`: Chart data array
- `height`: Chart height class

### FinanceFilters
Provides filtering controls for transaction data.

**Props:**
- `onFiltersChange`: Callback for filter changes
- `className`: Additional CSS classes

### AddExpenseModal
Modal for adding new expenses with form validation.

**Props:**
- `isOpen`: Modal visibility state
- `onClose`: Close callback
- `onSubmit`: Submit callback with expense data

### WithdrawalRequestModal
Modal for requesting withdrawals with account details.

**Props:**
- `isOpen`: Modal visibility state
- `onClose`: Close callback
- `onSubmit`: Submit callback with withdrawal data
- `availableBalance`: Current available balance

### FinanceTransactionsTable
Table component for displaying transaction data.

**Props:**
- `transactions`: Transaction array
- `loading`: Loading state
- `onViewTransaction`: View transaction callback
- `onDownloadReceipt`: Download receipt callback

### FinanceWalletSettings
Settings form for wallet configuration.

**Props:**
- `onSave`: Save callback with settings data

## Data Models

### FinanceOverview
```typescript
interface FinanceOverview {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  revenueGrowth: number;
  expenseGrowth: number;
  profitGrowth: number;
  marginGrowth: number;
}
```

### Transaction
```typescript
interface Transaction {
  id: string;
  description: string;
  reference: string;
  type: 'revenue' | 'expense' | 'withdrawal';
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  category?: string;
}
```

### ExpenseData
```typescript
interface ExpenseData {
  amount: number;
  description: string;
  category: string;
  date: string;
  receipt?: File;
}
```

### WithdrawalData
```typescript
interface WithdrawalData {
  amount: number;
  method: string;
  accountDetails: {
    accountNumber?: string;
    bankName?: string;
    paypalEmail?: string;
    swiftCode?: string;
  };
  notes?: string;
}
```

## Security Features

### Authentication
- All finance endpoints require admin authentication
- Session-based authentication with role verification
- API token validation for external requests

### Authorization
- Admin role required for all finance operations
- User-specific data access controls
- Secure withdrawal processing with admin approval

### Data Protection
- Encrypted financial data transmission
- Secure file upload for receipts
- Audit trail for all financial operations

## Testing

### Unit Tests
- Component rendering and interaction tests
- Form validation and submission tests
- API endpoint testing with mocked responses

### Integration Tests
- End-to-end workflow testing
- Data flow validation
- Error handling scenarios

### Test Files
- `src/app/admin/__tests__/finance.test.tsx`
- `src/components/admin/__tests__/finance-components.test.tsx`

## Usage Examples

### Adding an Expense
```typescript
const expenseData = {
  amount: 150.00,
  description: "Office supplies",
  category: "operations",
  date: "2024-01-15"
};

const response = await fetch('/api/finance/expenses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(expenseData)
});
```

### Requesting a Withdrawal
```typescript
const withdrawalData = {
  amount: 1000.00,
  method: "bank",
  accountDetails: {
    bankName: "Example Bank",
    accountNumber: "123456789",
    swiftCode: "EXMPUS33"
  }
};

const response = await fetch('/api/finance/withdraw', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(withdrawalData)
});
```

### Filtering Transactions
```typescript
const filters = {
  type: 'expense',
  status: 'completed',
  startDate: '2024-01-01',
  endDate: '2024-01-31'
};

const queryString = new URLSearchParams(filters).toString();
const response = await fetch(`/api/finance/transactions?${queryString}`);
```

## Future Enhancements

### Chart Integration
- Integration with Chart.js or Recharts for interactive visualizations
- Real-time data updates
- Customizable chart types and configurations

### Advanced Analytics
- Predictive analytics for financial forecasting
- Machine learning-based expense categorization
- Automated financial insights and recommendations

### Multi-Currency Support
- Real-time currency conversion
- Multi-currency transaction support
- Currency-specific reporting

### Integration Features
- Third-party accounting software integration
- Bank API connections for automatic transaction import
- Tax preparation software integration

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify admin role permissions
   - Check session validity
   - Ensure proper API token configuration

2. **Data Loading Issues**
   - Check API endpoint availability
   - Verify network connectivity
   - Review error logs for specific issues

3. **Form Submission Errors**
   - Validate required fields
   - Check file upload limits
   - Verify data format requirements

### Error Handling
- Comprehensive error messages for user feedback
- Detailed logging for debugging
- Graceful fallbacks for failed operations

## Support

For technical support or feature requests, please contact the development team or create an issue in the project repository.
