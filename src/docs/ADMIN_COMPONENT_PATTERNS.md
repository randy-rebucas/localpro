# Admin Panel Component Patterns

## Reusable Component Library

Based on the audit page styling, here are the key reusable component patterns that should be extracted and used consistently across all admin pages.

## 1. Page Header Component

### Pattern
```tsx
interface PageHeaderProps {
  title: string;
  description?: string;
  lastUpdated?: Date;
  onRefresh?: () => void;
  refreshing?: boolean;
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  lastUpdated,
  onRefresh,
  refreshing = false,
  actions
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          {title}
        </h1>
        {description && (
          <p className="text-gray-600 text-sm">{description}</p>
        )}
      </div>
      <div className="mt-2 sm:mt-0 flex items-center space-x-2">
        {lastUpdated && (
          <p className="text-xs text-gray-500">
            Updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        )}
        {actions}
      </div>
    </div>
  );
};
```

## 2. Stats Card Component

### Pattern
```tsx
interface StatsCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange' | 'cyan' | 'indigo';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  subtitle,
  icon: Icon,
  color,
  trend
}) => {
  const colorClasses = {
    blue: 'border-blue-500 text-blue-600 bg-blue-100',
    green: 'border-green-500 text-green-600 bg-green-100',
    red: 'border-red-500 text-red-600 bg-red-100',
    yellow: 'border-yellow-500 text-yellow-600 bg-yellow-100',
    purple: 'border-purple-500 text-purple-600 bg-purple-100',
    orange: 'border-orange-500 text-orange-600 bg-orange-100',
    cyan: 'border-cyan-500 text-cyan-600 bg-cyan-100',
    indigo: 'border-indigo-500 text-indigo-600 bg-indigo-100'
  };

  return (
    <div className={`bg-white rounded shadow p-3 border-l-4 border-${color}-500`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500">{label}</p>
          <p className="text-lg font-bold text-gray-900">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 bg-${color}-100 rounded-lg flex-shrink-0 ml-4`}>
          <Icon className={`w-5 h-5 text-${color}-600`} />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          {trend.isPositive ? (
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
          )}
          <span className={`font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
          <span className="text-gray-500 ml-2">from last period</span>
        </div>
      )}
    </div>
  );
};
```

## 3. Filter Section Component

### Pattern
```tsx
interface FilterSectionProps {
  title: string;
  showFilters: boolean;
  onToggleFilters: () => void;
  onClearFilters: () => void;
  children: React.ReactNode;
  resultCount?: number;
  actions?: React.ReactNode;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  title,
  showFilters,
  onToggleFilters,
  onClearFilters,
  children,
  resultCount,
  actions
}) => {
  return (
    <div className="bg-white rounded shadow">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={onToggleFilters}
              className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Filter className="w-3 h-3 mr-1" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </button>
            {actions}
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="p-4 border-b border-gray-200">
          {children}
          <div className="mt-3 flex items-center justify-between">
            <button
              onClick={onClearFilters}
              className="text-xs text-gray-600 hover:text-gray-800"
            >
              Clear all filters
            </button>
            {resultCount !== undefined && (
              <div className="text-xs text-gray-500">
                {resultCount} results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
```

## 4. Data Table Component

### Pattern
```tsx
interface DataTableProps {
  title: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  sortableFields?: Array<{ field: string; label: string }>;
  children: React.ReactNode;
  emptyState?: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
  };
}

const DataTable: React.FC<DataTableProps> = ({
  title,
  sortBy,
  sortOrder,
  onSort,
  sortableFields = [],
  children,
  emptyState
}) => {
  return (
    <div className="bg-white rounded shadow overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
          {sortableFields.length > 0 && (
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-500">Sort:</span>
              {sortableFields.map(({ field, label }) => (
                <button
                  key={field}
                  onClick={() => onSort?.(field)}
                  className={`inline-flex items-center px-1 py-0.5 text-xs font-medium rounded ${
                    sortBy === field ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {label}
                  {sortBy === field && (
                    sortOrder === 'asc' ? 
                      <ChevronUp className="w-2 h-2 ml-0.5" /> : 
                      <ChevronDown className="w-2 h-2 ml-0.5" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          {children}
        </table>
      </div>

      {emptyState && (
        <div className="text-center py-8">
          <emptyState.icon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <h3 className="text-sm font-medium text-gray-900 mb-1">{emptyState.title}</h3>
          <p className="text-xs text-gray-500">{emptyState.description}</p>
        </div>
      )}
    </div>
  );
};
```

## 5. Status Badge Component

### Pattern
```tsx
interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'active' | 'inactive' | 'pending' | 'suspended';
  children: React.ReactNode;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, children }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'warning':
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
      case 'suspended':
        return 'text-red-600 bg-red-100';
      case 'info':
      case 'inactive':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
      {children}
    </span>
  );
};
```

## 6. Action Button Component

### Pattern
```tsx
interface ActionButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  disabled = false,
  loading = false,
  onClick,
  children
}) => {
  const baseClasses = "inline-flex items-center font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-all duration-200";
  
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500"
  };

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-2 text-sm",
    lg: "px-4 py-3 text-base"
  };

  const iconSizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? (
        <RefreshCw className={`${iconSizeClasses[size]} mr-2 animate-spin`} />
      ) : Icon ? (
        <Icon className={`${iconSizeClasses[size]} mr-2`} />
      ) : null}
      {children}
    </button>
  );
};
```

## 7. Modal Component

### Pattern
```tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  actions?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  actions
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'w-11/12 md:w-1/3',
    md: 'w-11/12 md:w-3/4 lg:w-1/2',
    lg: 'w-11/12 md:w-4/5 lg:w-2/3',
    xl: 'w-11/12 md:w-5/6 lg:w-4/5'
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className={`relative top-10 mx-auto p-4 border ${sizeClasses[size]} shadow-lg rounded bg-white`}>
        <div className="mt-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-3">
            {children}
          </div>

          {actions && (
            <div className="mt-4 flex justify-end space-x-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

## 8. Form Input Component

### Pattern
```tsx
interface FormInputProps {
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'tel';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false
}) => {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
          error ? 'border-red-300' : 'border-gray-300'
        } ${disabled ? 'bg-gray-50' : ''}`}
      />
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
};
```

## 9. Loading State Component

### Pattern
```tsx
interface LoadingStateProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  fullScreen?: boolean;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  size = 'md',
  text = 'Loading...',
  fullScreen = false
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const containerClasses = fullScreen 
    ? 'min-h-screen flex items-center justify-center'
    : 'flex items-center justify-center py-8';

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <RefreshCw className={`${sizeClasses[size]} text-blue-600 animate-spin mx-auto mb-2`} />
        <p className="text-sm text-gray-600">{text}</p>
      </div>
    </div>
  );
};
```

## 10. Error State Component

### Pattern
```tsx
interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  fullScreen?: boolean;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Error',
  message,
  onRetry,
  fullScreen = false
}) => {
  const containerClasses = fullScreen 
    ? 'min-h-screen flex items-center justify-center'
    : 'flex items-center justify-center py-8';

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600 mb-4">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};
```

## Usage Examples

### Complete Page Implementation
```tsx
export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  if (loading) {
    return <LoadingState size="xl" text="Loading page..." fullScreen />;
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => {
          setError(null);
          setLoading(true);
          // Retry logic
        }}
        fullScreen
      />
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Page Title"
        description="Page description"
        lastUpdated={new Date()}
        onRefresh={() => {/* refresh logic */}}
        actions={
          <ActionButton variant="primary" icon={Download}>
            Export
          </ActionButton>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatsCard
          label="Total Items"
          value={data.length}
          subtitle="All items"
          icon={FileText}
          color="blue"
        />
        {/* More stats cards */}
      </div>

      <FilterSection
        title="Filters & Search"
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        onClearFilters={() => {/* clear filters */}}
        resultCount={data.length}
      >
        {/* Filter content */}
      </FilterSection>

      <DataTable
        title="Data Table"
        sortableFields={[
          { field: 'name', label: 'Name' },
          { field: 'date', label: 'Date' }
        ]}
        emptyState={{
          icon: FileText,
          title: 'No data found',
          description: 'Try adjusting your filters'
        }}
      >
        {/* Table content */}
      </DataTable>
    </div>
  );
}
```

These component patterns provide a consistent, reusable foundation for all admin pages while maintaining the professional styling established in the audit page.
