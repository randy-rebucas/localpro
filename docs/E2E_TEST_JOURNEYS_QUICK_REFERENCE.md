# E2E Test Journeys - Quick Reference

> Quick reference guide for all e2e test journeys

---

## Authentication Journeys

| Journey | ID | Description | Key Steps |
|---------|-----|-------------|-----------|
| Phone Login | 1 | Complete phone-based authentication | Send code → Verify → Dashboard |
| Registration | 2 | New user registration and onboarding | Verify → Onboarding → Dashboard |
| Session Management | 3 | Session persistence and expiration | Login → Navigate → Expire → Redirect |
| Logout | 4 | Complete logout flow | Login → Logout → Verify redirect |

---

## Client User Journeys

| Journey | ID | Description | Key Steps |
|---------|-----|-------------|-----------|
| Book Service | 5 | Browse and book marketplace service | Browse → Filter → View → Book → Confirm |
| Purchase Supplies | 6 | Complete e-commerce purchase | Browse → Add to Cart → Checkout → Pay → Confirm |
| Enroll Course | 7 | Enroll in academy course | Browse → View → Enroll → Pay → Access |
| Apply for Job | 8 | Apply for job posting | Browse → View → Apply → Upload Resume → Submit |
| Rent Equipment | 9 | Rent equipment from provider | Browse → Select Dates → Rent → Pay → Confirm |
| Manage Profile | 10 | Update profile and settings | View → Edit → Update → Save → Verify |

---

## Provider User Journeys

| Journey | ID | Description | Key Steps |
|---------|-----|-------------|-----------|
| Create Service | 11 | Create and manage service listing | Create → Fill Form → Submit → Edit → Update |
| Manage Bookings | 12 | Manage incoming bookings | View → Accept → Update Status → Complete |
| Create Job | 13 | Create job posting | Create → Fill Form → Submit → View Applications |
| Create Rental | 14 | Create rental listing | Create → Fill Form → Submit → Manage Availability |
| Analytics & Finance | 15 | View analytics and earnings | Dashboard → Analytics → Finance → Payout |

---

## Supplier User Journeys

| Journey | ID | Description | Key Steps |
|---------|-----|-------------|-----------|
| Create Supply | 16 | Create and manage supply listing | Create → Fill Form → Submit → Manage Stock |
| Process Orders | 17 | Process customer orders | View → Review → Process → Ship → Track |
| Manage Inventory | 18 | Manage inventory and stock | View → Update → Alerts → Analytics → Export |

---

## Instructor User Journeys

| Journey | ID | Description | Key Steps |
|---------|-----|-------------|-----------|
| Create Course | 19 | Create and manage course | Create → Fill Form → Add Modules → Submit → Manage |
| Manage Students | 20 | Manage students and certifications | View → Track Progress → Grade → Issue Certificate |

---

## Admin Journeys

| Journey | ID | Description | Key Steps |
|---------|-----|-------------|-----------|
| User Management | 21 | Manage users and accounts | View → Filter → Edit → Update Role → Verify |
| Marketplace Management | 22 | Manage marketplace services | View → Approve → Edit → Suspend → Analytics |
| Financial Management | 23 | Manage finances and payments | Dashboard → Transactions → Refunds → Reports |
| Analytics & Reporting | 24 | View analytics and generate reports | Dashboard → Filter → Generate → Export |
| System Settings | 25 | Manage system settings | View → Update → Save → Verify → Test |

---

## Cross-Feature Journeys

| Journey | ID | Description | Key Steps |
|---------|-----|-------------|-----------|
| Complete Transaction | 26 | End-to-end marketplace transaction | Book → Accept → Complete → Review → Pay |
| Multi-Role User | 27 | User with multiple roles | Login → Switch Roles → Access Features → Verify |
| Referral Program | 28 | Complete referral workflow | View Code → Share → Signup → Track → Reward |

---

## Error Handling Journeys

| Journey | ID | Description | Key Steps |
|---------|-----|-------------|-----------|
| Network Failures | 29 | Handle network failures gracefully | Simulate Failure → Attempt Actions → Verify Errors → Retry |
| Form Validation | 30 | Verify form validation | Submit Invalid Forms → Verify Errors → Correct → Submit |
| Access Control | 31 | Verify role-based access control | Login → Attempt Unauthorized Access → Verify Block |
| Data Integrity | 32 | Verify data consistency | Create → Update → Verify → Concurrent Operations |

---

## Performance Journeys

| Journey | ID | Description | Key Steps |
|---------|-----|-------------|-----------|
| Page Load | 33 | Verify page load performance | Measure Load Times → Verify Thresholds → Test Slow Network |
| Large Datasets | 34 | Handle large datasets | Load 1000+ Items → Paginate → Filter → Search |
| Concurrent Users | 35 | Handle concurrent operations | Multiple Users → Concurrent Actions → Verify Consistency |

---

## Test Priority Matrix

### Critical (P0) - Must Pass Before Release
- Journey 1: Phone Login
- Journey 5: Book Service
- Journey 11: Create Service
- Journey 21: User Management

### High (P1) - Should Pass Before Release
- Journey 2: Registration
- Journey 6: Purchase Supplies
- Journey 12: Manage Bookings
- Journey 22: Marketplace Management

### Medium (P2) - Nice to Have
- Journey 7: Enroll Course
- Journey 13: Create Job
- Journey 16: Create Supply
- Journey 23: Financial Management

### Low (P3) - Future Enhancements
- Journey 8: Apply for Job
- Journey 14: Create Rental
- Journey 19: Create Course
- Journey 24: Analytics & Reporting

---

## Test Execution Matrix

### Smoke Tests (Every Commit)
- Journey 1, 5, 11, 21

### Regression Tests (Before Release)
- All journeys

### Feature Tests (During Development)
- Feature-specific journeys

### Integration Tests (Daily)
- Cross-feature journeys (26, 27, 28)

### Performance Tests (Weekly)
- Performance journeys (33, 34, 35)

---

## Test Data Requirements

### Required Test Users
- CLIENT: `+1234567890`
- PROVIDER: `+1234567891`
- SUPPLIER: `+1234567892`
- INSTRUCTOR: `+1234567893`
- ADMIN: `+1234567895`

### Required Test Data
- Services (various categories)
- Supplies (various categories)
- Courses (various categories)
- Jobs (various types)
- Rentals (various equipment)

---

## Quick Commands

```bash
# Run all tests
pnpm test:e2e

# Run specific journey
pnpm test:e2e --grep "Journey 5"

# Run by role
pnpm test:e2e:client
pnpm test:e2e:provider
pnpm test:e2e:admin

# Run with UI
pnpm test:e2e:ui

# Debug test
pnpm test:e2e:debug
```

---

## Test Coverage Checklist

### Authentication ✅
- [ ] Phone login flow
- [ ] Registration flow
- [ ] Session management
- [ ] Logout flow

### Client Features ✅
- [ ] Service booking
- [ ] Supply purchase
- [ ] Course enrollment
- [ ] Job application
- [ ] Equipment rental
- [ ] Profile management

### Provider Features ✅
- [ ] Service creation
- [ ] Booking management
- [ ] Job posting
- [ ] Rental listing
- [ ] Analytics & finance

### Supplier Features ✅
- [ ] Supply creation
- [ ] Order processing
- [ ] Inventory management

### Instructor Features ✅
- [ ] Course creation
- [ ] Student management

### Admin Features ✅
- [ ] User management
- [ ] Marketplace management
- [ ] Financial management
- [ ] Analytics & reporting
- [ ] System settings

### Cross-Feature ✅
- [ ] Complete transactions
- [ ] Multi-role users
- [ ] Referral program

### Error Handling ✅
- [ ] Network failures
- [ ] Form validation
- [ ] Access control
- [ ] Data integrity

### Performance ✅
- [ ] Page load times
- [ ] Large datasets
- [ ] Concurrent operations

---

## Notes

- All journeys assume clean test environment
- Test data should be cleaned up after each test
- Use test IDs for reliable element selection
- Mock external services (SMS, payments)
- Use proper wait strategies, not arbitrary timeouts

