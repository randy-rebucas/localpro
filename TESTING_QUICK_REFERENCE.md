# 🚀 Client Journey Testing - Quick Reference

## ⚡ Quick Commands

### Run All Tests
```bash
# All client journey tests with coverage
npm run test:client-journey:coverage

# All tests in watch mode
npm run test:client-journey:watch

# All tests (basic)
npm run test:client-journey
```

### Run Specific Phases
```bash
# Phase 1-3: Registration, Dashboard, Service Discovery
npm run test:client-journey -- --phase 1-3

# Phase 4-6: Payment, Job Board, Academy
npm run test:client-journey -- --phase 4-6

# Phase 7-9: Marketplace, Equipment Rental, Financial
npm run test:client-journey -- --phase 7-9

# Phase 10-12: Subscription, Communication, Trust
npm run test:client-journey -- --phase 10-12

# Phase 13-18: Referral, Analytics, Activity, Settings, Profile, Maps
npm run test:client-journey -- --phase 13-18

# End-to-End Integration Tests
npm run test:client-journey:e2e
```

### Specialized Tests
```bash
# Performance tests only
npm run test:client-journey:performance

# Security tests only
npm run test:client-journey:security

# Debug mode with verbose output
npm run test:client-journey -- --debug
```

## 🎯 Test Phases Overview

| Phase | Name | What It Tests |
|-------|------|---------------|
| 1-3 | Registration, Dashboard, Service Discovery | User onboarding, basic functionality |
| 4-6 | Payment, Job Board, Academy | Payment processing, job applications, learning |
| 7-9 | Marketplace, Equipment Rental, Financial | Shopping, rentals, financial management |
| 10-12 | Subscription, Communication, Trust | Premium features, messaging, verification |
| 13-18 | Referral, Analytics, Activity, Settings, Profile, Maps | Advanced features, analytics, location services |
| E2E | End-to-End Integration | Complete user journey simulation |

## 🔧 Troubleshooting

### Common Issues
```bash
# If tests fail, try:
npm install                    # Reinstall dependencies
npm run test:client-journey -- --debug  # Debug mode
npm run test:client-journey -- --verbose  # Verbose output
```

### Performance Issues
```bash
# Increase timeout for slow tests
npm test -- --testPathPatterns=client-journey --testTimeout=30000
```

### Coverage Issues
```bash
# Generate detailed coverage report
npm run test:client-journey:coverage

# View HTML coverage report
open coverage/client-journey/index.html
```

## 📊 Expected Results

### Test Counts
- **Total Tests**: 175
- **Test Suites**: 6
- **Coverage Target**: 90%+

### Performance Targets
- Authentication: < 200ms
- Search: < 500ms
- Payment: < 1000ms
- Communication: < 300ms
- Other endpoints: < 500ms

## 🚨 Emergency Commands

### Reset Everything
```bash
# Clean and reinstall
npm run clean
rm -rf node_modules
npm install
npm run test:client-journey
```

### Debug Specific Test
```bash
# Run specific test by name
npm test -- --testNamePattern="should complete full user onboarding flow" --verbose
```

### Check System
```bash
# Verify Jest installation
npx jest --version

# Check Node version
node --version

# Verify dependencies
npm list jest
```

## 📝 Quick Test Writing

### Basic Test Structure
```typescript
describe('Feature Name', () => {
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

### Mock Data Helper
```typescript
const createMockUser = () => ({
  id: 'user-123',
  phone: '+1234567890',
  email: 'test@example.com',
  profile: { firstName: 'John', lastName: 'Doe' }
});
```

## 🎉 Success Indicators

✅ **All tests passing** (175/175)  
✅ **Coverage > 90%**  
✅ **No console errors**  
✅ **Performance targets met**  
✅ **Security tests passing**  

---

**Need more help?** Check `CLIENT_JOURNEY_TESTING_GUIDE.md` for detailed instructions.
