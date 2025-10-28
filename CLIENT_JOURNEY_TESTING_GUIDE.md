# Client Journey Testing Guide

## 🚀 Quick Start

This guide provides step-by-step instructions for running and managing the LocalPro Super App client journey tests.

## 📋 Prerequisites

### Required Software
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Git** (for version control)

### Environment Setup
```bash
# Install dependencies
npm install

# Verify Jest installation
npx jest --version
# Should output: 30.1.3 or higher
```

## 🧪 Running Tests

### 1. Run All Client Journey Tests
```bash
# Run all client journey tests with coverage
npm test -- --testPathPatterns=client-journey --coverage

# Run without coverage (faster)
npm test -- --testPathPatterns=client-journey
```

### 2. Run Specific Test Phases
```bash
# Phase 1-3: Registration, Dashboard, Service Discovery
npm test -- --testPathPatterns=client-journey.test.ts

# Phase 4-6: Payment, Job Board, Academy
npm test -- --testPathPatterns=client-journey-payment-academy.test.ts

# Phase 7-9: Marketplace, Equipment Rental, Financial
npm test -- --testPathPatterns=client-journey-marketplace-financial.test.ts

# Phase 10-12: Subscription, Communication, Trust
npm test -- --testPathPatterns=client-journey-subscription-communication.test.ts

# Phase 13-18: Referral, Analytics, Activity, Settings, Profile, Maps
npm test -- --testPathPatterns=client-journey-final-phases.test.ts

# End-to-End Integration Tests
npm test -- --testPathPatterns=client-journey-e2e.test.ts
```

### 3. Run Tests in Watch Mode
```bash
# Watch mode for development
npm test -- --testPathPatterns=client-journey --watch

# Watch specific test file
npm test -- --testPathPatterns=client-journey-e2e --watch
```

### 4. Run Tests with Detailed Output
```bash
# Verbose output for debugging
npm test -- --testPathPatterns=client-journey --verbose

# Run specific test by name
npm test -- --testNamePattern="should complete full user onboarding flow"
```

## 📊 Coverage Reports

### Generate Coverage Reports
```bash
# Generate HTML and text coverage reports
npm test -- --testPathPatterns=client-journey --coverage --coverageReporters=text --coverageReporters=html --coverageDirectory=coverage/client-journey
```

### View Coverage Reports
- **HTML Report**: Open `coverage/client-journey/index.html` in your browser
- **Text Report**: Displayed in terminal after test completion
- **LCOV Report**: Available at `coverage/client-journey/lcov.info`

## 🔧 Test Configuration

### Jest Configuration
The tests use `jest.config.js` with the following key settings:
- **Test Environment**: jsdom (for React components)
- **TypeScript Support**: ts-jest transformer
- **Coverage Collection**: Excludes test files and type definitions
- **Module Mapping**: `@/` maps to `src/`

### Test Setup
Tests are configured with `src/lib/__tests__/setup.tsx` which includes:
- Global fetch mocking
- Next.js router mocking
- Image component mocking
- Browser API mocking

## 🎯 Test Scenarios

### Phase 1: Registration & Onboarding
**What it tests:**
- Phone number registration
- SMS verification
- User profile creation
- Profile completion validation

**Key API Endpoints:**
- `POST /api/auth/register`
- `POST /api/auth/verify-phone`
- `GET /api/auth/me`
- `PUT /api/auth/profile`

### Phase 2: Dashboard & Discovery
**What it tests:**
- User dashboard loading
- Analytics overview
- Activity feed
- User profile retrieval

**Key API Endpoints:**
- `GET /api/analytics/user`
- `GET /api/activities/feed`
- `GET /api/auth/me`

### Phase 3: Service Discovery & Booking
**What it tests:**
- Service browsing and search
- Service details viewing
- Booking creation
- Photo upload and reviews

**Key API Endpoints:**
- `GET /api/marketplace/services`
- `GET /api/marketplace/services/[id]`
- `POST /api/marketplace/bookings`
- `POST /api/marketplace/bookings/[id]/photos`

### Phase 4: Payment Processing
**What it tests:**
- PayPal payment approval
- PayMaya checkout creation
- Payment processing
- Invoice generation

**Key API Endpoints:**
- `POST /api/paypal/approve`
- `GET /api/paypal/order/[orderId]`
- `POST /api/paymaya/checkout`
- `POST /api/paymaya/process`

### Phase 5: Job Board Experience
**What it tests:**
- Job browsing and search
- Job application submission
- Application management
- Application status tracking

**Key API Endpoints:**
- `GET /api/jobs`
- `GET /api/jobs/[id]`
- `POST /api/jobs/[id]/apply`
- `GET /api/jobs/my-applications`

### Phase 6: Academy & Learning
**What it tests:**
- Course discovery
- Course enrollment
- Progress tracking
- Course reviews

**Key API Endpoints:**
- `GET /api/academy/courses`
- `POST /api/academy/courses/[id]/enroll`
- `GET /api/academy/courses/[id]/progress`
- `POST /api/academy/courses/[id]/reviews`

## 🐛 Debugging Tests

### Common Issues and Solutions

#### 1. Test Timeout Errors
```bash
# Increase timeout for slow tests
npm test -- --testPathPatterns=client-journey --testTimeout=30000
```

#### 2. Mock Data Issues
- Check that mock data matches API contracts
- Verify mock responses include all required fields
- Ensure mock data is consistent across test files

#### 3. Coverage Gaps
```bash
# Run tests with coverage to identify gaps
npm test -- --testPathPatterns=client-journey --coverage

# Focus on specific files
npm test -- --testPathPatterns=client-journey --coverage --collectCoverageFrom="src/app/api/**/*.ts"
```

#### 4. Flaky Tests
- Check for timing issues in async operations
- Ensure proper cleanup between tests
- Verify mock data is properly reset

### Debug Mode
```bash
# Run with debug output
npm test -- --testPathPatterns=client-journey --verbose --no-cache

# Run specific failing test
npm test -- --testNamePattern="should complete full user onboarding flow" --verbose
```

## 📈 Performance Testing

### Load Testing
```bash
# Run performance tests
npm test -- --testPathPatterns=client-journey-e2e --testNamePattern="Performance and Load Testing"
```

### Performance Requirements
- **Authentication endpoints**: < 200ms
- **Search endpoints**: < 500ms
- **Payment endpoints**: < 1000ms
- **Communication endpoints**: < 300ms
- **All other endpoints**: < 500ms

## 🔒 Security Testing

### Authentication & Authorization
- JWT token validation
- Role-based access control
- Session management
- Unauthorized access prevention

### Data Protection
- Input validation
- SQL injection prevention
- XSS protection
- CSRF protection

## 📝 Writing New Tests

### Test Structure
```typescript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup mocks and test data
  });

  afterEach(() => {
    // Cleanup
  });

  it('should perform specific action', async () => {
    // Arrange
    const mockData = createMockData();
    
    // Act
    const result = await performAction(mockData);
    
    // Assert
    expect(result).toBeDefined();
    expect(result.status).toBe('success');
  });
});
```

### Mock Data Creation
```typescript
const createMockUser = () => ({
  id: 'user-123',
  phone: '+1234567890',
  email: 'test@example.com',
  profile: {
    firstName: 'John',
    lastName: 'Doe'
  }
});
```

## 🚀 CI/CD Integration

### Pre-commit Hooks
```bash
# Run tests before commit
npm run test:client-journey

# Run linting and type checking
npm run lint
npm run type-check
```

### GitHub Actions Example
```yaml
name: Client Journey Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test -- --testPathPatterns=client-journey --coverage
```

## 📊 Monitoring and Reporting

### Test Metrics
- **Test Coverage**: Aim for 90%+ coverage
- **Test Execution Time**: Monitor for performance regressions
- **Test Reliability**: Track flaky test frequency
- **API Response Times**: Ensure performance requirements are met

### Reporting Tools
- **Jest Coverage Reports**: HTML and LCOV formats
- **Test Results**: JSON output for CI/CD integration
- **Performance Metrics**: Built-in timing measurements

## 🆘 Getting Help

### Documentation
- **API Documentation**: Check endpoint specifications
- **Test Documentation**: Review `CLIENT_JOURNEY_TEST_DOCUMENTATION.md`
- **Code Comments**: Inline documentation in test files

### Common Commands Reference
```bash
# Quick test run
npm test -- --testPathPatterns=client-journey

# Debug specific test
npm test -- --testNamePattern="test name" --verbose

# Coverage report
npm test -- --testPathPatterns=client-journey --coverage

# Watch mode
npm test -- --testPathPatterns=client-journey --watch

# Run all tests
npm test
```

### Troubleshooting Checklist
- [ ] Dependencies installed (`npm install`)
- [ ] Jest version compatible (30.1.3+)
- [ ] Test files in correct location
- [ ] Mock data matches API contracts
- [ ] Environment variables set correctly
- [ ] No port conflicts
- [ ] Sufficient system resources

---

## 🎯 Next Steps

1. **Run the tests** using the commands above
2. **Review coverage reports** to identify gaps
3. **Add new test cases** for missing scenarios
4. **Integrate with CI/CD** for automated testing
5. **Monitor performance** and optimize as needed

For more detailed information, refer to the `CLIENT_JOURNEY_TEST_DOCUMENTATION.md` file.
