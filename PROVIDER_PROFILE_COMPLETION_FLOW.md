# Provider Profile Completion Flow

## Overview
This document outlines the complete flow for completing a provider profile in the LocalPro Super App, organized by role usage. It includes all related collections, relationships, and API endpoints grouped by who uses them.

---

## Table of Contents
1. [For Providers](#for-providers)
   - [Profile Management](#profile-management)
   - [Onboarding Flow](#onboarding-flow)
   - [API Endpoints](#provider-api-endpoints)
2. [For Clients](#for-clients)
   - [Searching & Viewing Providers](#searching--viewing-providers)
   - [API Endpoints](#client-api-endpoints)
3. [For Admins](#for-admins)
   - [Review & Verification](#review--verification)
   - [Management Actions](#management-actions)
4. [General Reference](#general-reference)
   - [Data Models & Relationships](#data-models--relationships)
   - [Reference Collections](#reference-collections)
   - [Technical Details](#technical-details)

---

## For Providers

### Profile Management

#### Creating a Provider Profile
**When:** User with `client` role decides to become a provider

**Process:**
1. User must have `client` role
2. Provider profile must not already exist
3. System automatically:
   - Creates Provider document with default values
   - Sets status to `'pending'`
   - Initializes onboarding with `profile_setup` step completed (10% progress)
   - Auto-creates related documents:
     - ProviderVerification
     - ProviderProfessionalInfo
     - ProviderPreferences
     - ProviderFinancialInfo
     - ProviderPerformance
     - ProviderBusinessInfo (if business/agency type)
   - Adds `'provider'` role to User
   - If provider profile was soft-deleted, it's restored

#### Updating Provider Profile
Providers can update their profile information at any time, including:
- Provider type
- Business information (for business/agency types)
- Professional information (specialties, service areas, rates)
- Verification information
- Preferences and settings

---

### Onboarding Flow

The onboarding process consists of 8 steps that providers must complete:

#### Step 1: Profile Setup (`profile_setup`)
**Status:** ✅ Completed automatically when provider profile is created  
**Progress:** 10%  
**Requirements:**
- Provider type selection (`individual`, `business`, `agency`)
- Basic provider settings

#### Step 2: Business Info (`business_info`)
**Status:** Required for `business` and `agency` types only  
**Progress:** 25% (when completed)  
**Requirements:**
- Business name (required)
- Business type
- Business address (city, state required)
- Business phone
- Optional: Registration, tax ID, website, description

**Validation:**
- Business name must be provided
- Business address (city, state) must be provided

#### Step 3: Professional Info (`professional_info`)
**Status:** Required for all provider types  
**Progress:** 40% (when completed)  
**Requirements:**
- At least one specialty with:
  - Category (ServiceCategory reference)
  - Service areas (at least one: city, state, radius)
  - Optional: Experience, certifications, skills, hourly rate
- Languages spoken
- Availability schedule
- Optional: Emergency services, travel distance, job value range

**Validation:**
- At least one specialty required
- Each specialty must have category and at least one service area

#### Step 4: Verification (`verification`)
**Status:** Required for all provider types  
**Progress:** 55% (when completed)  
**Requirements:**
- Identity verification (admin-controlled)
- Business verification (for business/agency types)
- Background check status
- Insurance information
- Optional: Licenses, references

**Validation:**
- Identity verification must be true
- Business verification must be true (for business/agency)
- Insurance must be provided

#### Step 5: Documents (`documents`)
**Status:** Required for all provider types  
**Progress:** 70% (when completed)  
**Requirements:**
- Identity documents
- Business documents (for business/agency)
- Insurance documents
- Background check documents
- Optional: License documents, tax documents

**Validation:**
- Required documents must be uploaded based on provider type

#### Step 6: Portfolio (`portfolio`)
**Status:** Optional but recommended  
**Progress:** 85% (when completed)  
**Requirements:**
- Portfolio images
- Optional: Videos, descriptions, before/after photos

#### Step 7: Preferences (`preferences`)
**Status:** Required for all provider types  
**Progress:** 95% (when completed)  
**Requirements:**
- Notification settings
- Job preferences
- Communication preferences

**Validation:**
- All preference categories must be configured

#### Step 8: Review (`review`)
**Status:** Final step before submission  
**Progress:** 100% (when completed)  
**Requirements:**
- All previous steps completed
- Profile validation passes
- Ready for admin review

**Validation:**
- All required steps must be completed
- Provider-specific requirements must be met
- Professional info must have at least one specialty
- Business info required for business/agency types
- Identity verification must be true

**Result:** Provider status automatically set to `'pending'` for admin review

---

### Provider API Endpoints

#### 1. Get My Provider Profile
```
GET /api/providers/profile/me
```
**Authentication:** Required (Provider role)  
**Description:** Get current user's provider profile with all populated data  
**Response:** Full provider object with all referenced collections

#### 2. Create Provider Profile
```
POST /api/providers/profile
```
**Authentication:** Required (Client role)  
**Description:** Create provider profile (upgrade from client)  
**Requirements:**
- User must have `client` role
- Provider profile must not already exist

**Request Body:**
```json
{
  "providerType": "individual" | "business" | "agency",
  "businessInfo": { /* optional, required for business/agency */ },
  "professionalInfo": { /* optional */ },
  "verification": { /* optional */ },
  "preferences": { /* optional */ },
  "settings": { /* optional */ }
}
```

**Response:** Created provider object

#### 3. Update Provider Profile
```
PUT /api/providers/profile
```
**Authentication:** Required (Provider role)  
**Description:** Update provider profile (supports partial updates)  
**Request Body:** Any provider fields (all optional)

**Example:**
```json
{
  "providerType": "business",
  "settings": {
    "profileVisibility": "public",
    "showPricing": true
  },
  "businessInfo": {
    "businessName": "My Business",
    "businessType": "small_business",
    "businessAddress": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001"
    }
  },
  "professionalInfo": {
    "specialties": [{
      "category": "plumbing",
      "hourlyRate": 90,
      "serviceAreas": [{
        "city": "New York",
        "state": "NY",
        "radius": 35
      }]
    }]
  }
}
```

#### 4. Update Onboarding Step
```
PUT /api/providers/onboarding/step
```
**Authentication:** Required (Provider role)  
**Description:** Mark an onboarding step as complete  
**Request Body:**
```json
{
  "step": "profile_setup" | "business_info" | "professional_info" | "verification" | "documents" | "portfolio" | "preferences" | "review",
  "data": { /* optional step data */ }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "step": "professional_info",
    "progress": 40,
    "completed": false
  }
}
```

#### 5. Upload Documents
```
POST /api/providers/documents/upload
```
**Authentication:** Required (Provider role)  
**Content-Type:** `multipart/form-data`  
**Description:** Upload provider documents  
**Request:**
- `documentType`: `'insurance' | 'license' | 'portfolio'`
- `category`: License category (required for license type)
- `documents`: Files (max 5 files, 10MB each, images or PDFs)

**Response:**
```json
{
  "success": true,
  "data": {
    "documentType": "insurance",
    "fileUrls": ["url1", "url2"],
    "fileCount": 2
  }
}
```

#### 6. Get Provider Dashboard
```
GET /api/providers/dashboard/overview
```
**Authentication:** Required (Provider role)  
**Description:** Get provider dashboard data

#### 7. Get Provider Analytics
```
GET /api/providers/analytics/performance?timeframe=30d
```
**Authentication:** Required (Provider role)  
**Description:** Get provider performance analytics

---

## For Clients

### Searching & Viewing Providers

Clients can search for and view provider profiles to find services they need. Providers must have `status: 'active'` to appear in search results.

**Search Capabilities:**
- Filter by provider type (individual, business, agency)
- Filter by service category
- Filter by location (city, state)
- Filter by minimum rating
- Filter by availability
- Filter by price range

**Viewable Information:**
- Provider profile information
- Business information (if applicable)
- Professional specialties and service areas
- Ratings and reviews
- Portfolio images
- Verification badges
- Availability schedule
- Pricing information (if provider has enabled it)

---

### Client API Endpoints

#### 1. Get Providers (Search)
```
GET /api/providers?status=active&providerType=individual&category=plumbing&city=New York&state=NY&minRating=4.5
```
**Authentication:** Optional  
**Description:** Get list of providers with filtering  
**Query Parameters:**
- `status`: Filter by provider status (default: `active`)
- `providerType`: Filter by type (`individual`, `business`, `agency`)
- `category`: Filter by service category
- `city`: Filter by city
- `state`: Filter by state
- `minRating`: Minimum rating (0-5)
- `maxPrice`: Maximum hourly rate
- `minPrice`: Minimum hourly rate
- `available`: Filter by availability

#### 2. Get Provider by ID
```
GET /api/providers/:id
```
**Authentication:** Optional  
**Description:** Get single provider profile (accepts User ID or Provider ID)  
**Response:** Provider object with populated data (limited based on provider's visibility settings)

#### 3. Get Provider Skills
```
GET /api/providers/skills?category=plumbing
```
**Authentication:** Not required  
**Description:** Get available provider skills for a given category  
**Query Parameters:**
- `category`: Service category to get skills for

---

## For Admins

### Review & Verification

Admins are responsible for reviewing and verifying provider applications after providers complete their onboarding.

**Admin Review Process:**
1. Provider completes all onboarding steps
2. Provider status is set to `'pending'`
3. Admin reviews the application
4. Admin can:
   - **Approve** → Status set to `'active'` (provider can accept jobs)
   - **Reject** → Status set to `'rejected'` (provider cannot accept jobs)
   - **Request Info** → Status remains `'pending'` (provider must provide additional information)

**Verification Controls:**
- **Identity Verification**: Admin-controlled boolean flag
- **Business Verification**: Admin-controlled boolean flag (for business/agency types)
- **Background Check**: Admin reviews and updates status
- **Document Review**: Admin reviews uploaded documents

**Admin Actions:**
- View all provider applications (pending, active, rejected, suspended)
- Approve or reject provider applications
- Update verification status
- Suspend active providers
- Request additional information
- View provider analytics and performance metrics

---

### Management Actions

**Provider Status Management:**
- `pending` → Initial state, after onboarding complete (awaiting admin review)
- `active` → Approved by admin, can accept jobs
- `suspended` → Temporarily suspended (cannot accept new jobs)
- `inactive` → Inactive provider (voluntarily inactive)
- `rejected` → Application rejected (cannot accept jobs)

**Admin Capabilities:**
- Change provider status
- Update verification flags
- View complete provider profiles (including sensitive information)
- Access provider financial information
- Review provider documents
- Monitor provider performance
- Manage provider subscriptions

---

## General Reference

### Data Models & Relationships

#### User Model (`User`)
The User model is the base entity that can have multiple roles including `provider`. Key fields:
- `roles`: Array of roles (e.g., `['client', 'provider']`)
- `phoneNumber`: Required, unique
- `email`: Optional, unique
- `firstName`, `lastName`: Profile information
- `profile`: Contains avatar, bio, address
- `localProPlusSubscription`: Reference to subscription
- `wallet`: Reference to UserWallet
- `trust`: Reference to UserTrust
- `referral`: Reference to UserReferral
- `settings`: Reference to UserSettings
- `management`: Reference to UserManagement
- `activity`: Reference to UserActivity
- `agency`: Reference to UserAgency

#### Provider Model (`Provider`)
The Provider model is linked to User via `userId` (one-to-one relationship):
- `userId`: Reference to User (required, unique)
- `providerType`: `'individual' | 'business' | 'agency'`
- `status`: `'pending' | 'active' | 'suspended' | 'inactive' | 'rejected'`
- `onboarding`: Progress tracking object
- `settings`: Provider-specific settings

**Core Provider Document:**
Located in: `src/models/Provider.js`

**Direct Fields:**
- `userId`: Reference to User
- `providerType`: Type of provider
- `status`: Current status
- `onboarding`: Progress tracking
- `settings`: Profile visibility, booking settings
- `metadata`: Profile views, featured status, etc.

**Referenced Collections (via ObjectId):**
1. `businessInfo` → `ProviderBusinessInfo`
2. `professionalInfo` → `ProviderProfessionalInfo`
3. `verification` → `ProviderVerification`
4. `financialInfo` → `ProviderFinancialInfo`
5. `preferences` → `ProviderPreferences`
6. `performance` → `ProviderPerformance`

---

### Reference Collections

#### 1. ProviderBusinessInfo
**Model:** `src/models/ProviderBusinessInfo.js`  
**Required for:** `business` and `agency` provider types  
**Key Fields:**
- `businessName`: Required
- `businessType`: Type of business
- `businessRegistration`: Registration number
- `taxId`: Tax identification
- `businessAddress`: Full address with coordinates
- `businessPhone`, `businessEmail`: Contact info
- `website`: Business website
- `businessDescription`: Description
- `yearEstablished`: Year business started
- `numberOfEmployees`: Employee count

**Auto-created:** Yes, when provider type is `business` or `agency`

#### 2. ProviderProfessionalInfo
**Model:** `src/models/ProviderProfessionalInfo.js`  
**Required for:** All provider types  
**Key Fields:**
- `specialties`: Array of specialty objects
  - `category`: Reference to ServiceCategory
  - `experience`: Years of experience
  - `certifications`: Array of certifications
  - `skills`: Array of ProviderSkill references
  - `hourlyRate`: Rate for this specialty
  - `serviceAreas`: Array of service areas (city, state, radius)
- `languages`: Array of languages spoken
- `availability`: Weekly schedule (Monday-Sunday)
- `emergencyServices`: Boolean
- `travelDistance`: Maximum travel distance
- `minimumJobValue`, `maximumJobValue`: Job value range

**Auto-created:** Yes, for all providers

#### 3. ProviderVerification
**Model:** `src/models/ProviderVerification.js`  
**Required for:** All provider types  
**Key Fields:**
- `identityVerified`: Boolean (admin-controlled)
- `businessVerified`: Boolean (admin-controlled, for business/agency)
- `backgroundCheck`: Status, date, report ID
- `insurance`: Insurance details and documents
- `licenses`: Array of professional licenses
- `references`: Array of professional references
- `portfolio`: Images, videos, before/after photos

**Auto-created:** Yes, for all providers

#### 4. ProviderFinancialInfo
**Model:** `src/models/ProviderFinancialInfo.js`  
**Required for:** Payment processing  
**Key Fields:**
- `bankAccount`: Bank account details
- `taxInfo`: Tax information
- `paymentMethods`: Available payment methods
- `commissionRate`: Platform commission rate
- `minimumPayout`: Minimum payout amount

**Auto-created:** Yes, for all providers

#### 5. ProviderPreferences
**Model:** `src/models/ProviderPreferences.js`  
**Required for:** Provider settings  
**Key Fields:**
- `notificationSettings`: Email, SMS, push preferences
- `jobPreferences`: Job type preferences, auto-accept settings
- `communicationPreferences`: Preferred communication methods

**Auto-created:** Yes, for all providers

#### 6. ProviderPerformance
**Model:** `src/models/ProviderPerformance.js`  
**Auto-calculated metrics**  
**Key Fields:**
- `rating`: Average rating
- `totalReviews`: Review count
- `totalJobs`: Total jobs count
- `completedJobs`: Completed jobs
- `cancelledJobs`: Cancelled jobs
- `responseTime`: Average response time
- `completionRate`: Job completion percentage
- `repeatCustomerRate`: Repeat customer percentage
- `earnings`: Earnings breakdown (total, thisMonth, lastMonth)
- `badges`: Achievement badges

**Auto-created:** Yes, for all providers

---

### Validation Requirements by Provider Type

#### Individual Provider
**Required:**
- ✅ Profile setup
- ✅ Professional info (specialties, service areas)
- ✅ Verification (identity, insurance, background check)
- ✅ Documents (identity, insurance, background check)
- ✅ Preferences

**Optional:**
- Portfolio
- Business info (not required)

#### Business Provider
**Required:**
- ✅ Profile setup
- ✅ Business info (businessName, businessType, address, phone)
- ✅ Professional info (specialties, service areas)
- ✅ Verification (identity, business, insurance, background check)
- ✅ Documents (identity, business, insurance, background check)
- ✅ Preferences

**Optional:**
- Portfolio
- Licenses
- References

#### Agency Provider
**Required:**
- ✅ Profile setup
- ✅ Business info (businessName, businessType, address, phone)
- ✅ Professional info (specialties, service areas)
- ✅ Verification (identity, business, insurance, background check, agency license)
- ✅ Documents (identity, business, insurance, background check, agency license)
- ✅ Preferences

**Optional:**
- Portfolio
- Additional licenses
- References
- Bonding documents

---

### Related Collections Reference

#### Collections that Reference User:
1. **Provider** - `userId` (one-to-one)
2. **UserReferral** - `user` (one-to-one)
3. **UserActivity** - `user` (one-to-one)
4. **UserWallet** - `user` (one-to-one)
5. **UserTrust** - `user` (one-to-one)
6. **UserSettings** - `user` (one-to-one)
7. **UserManagement** - `user` (one-to-one)
8. **UserAgency** - `user` (one-to-one)
9. **UserSubscription** - `user` (one-to-many)
10. **AccessToken** - `user` (one-to-many)
11. **ApiKey** - `user` (one-to-many)
12. **Job** - `client`, `provider` (many-to-one)
13. **Marketplace** - `provider` (many-to-one)
14. **Escrow** - `client`, `provider` (many-to-one)
15. **Payout** - `user` (many-to-one)
16. **Communication** - `sender`, `recipient` (many-to-one)
17. **Activity** - `user` (many-to-one)
18. **Favorite** - `user` (many-to-one)
19. **Academy** - `instructor`, `student` (many-to-one)
20. **Agency** - `owner`, `admins`, `providers.user` (many-to-one)
21. **LiveChat** - `user`, `agent` (many-to-one)
22. **TrustVerification** - `user` (many-to-one)
23. **Finance** - `user` (many-to-many)
24. **EmailSubscriber** - `user` (one-to-one)
25. **EmailCampaign** - `createdBy`, `sentTo` (many-to-one)
26. **Broadcaster** - `user` (many-to-one)
27. **Partner** - `user` (many-to-one)
28. **Referral** - `referrer`, `referee` (many-to-one)

#### Collections that Reference Provider:
1. **ProviderBusinessInfo** - `provider` (one-to-one)
2. **ProviderProfessionalInfo** - `provider` (one-to-one)
3. **ProviderVerification** - `provider` (one-to-one)
4. **ProviderFinancialInfo** - `provider` (one-to-one)
5. **ProviderPreferences** - `provider` (one-to-one)
6. **ProviderPerformance** - `provider` (one-to-one)
7. **Job** - `provider` (many-to-one)
8. **Marketplace** - `provider` (many-to-one)
9. **Escrow** - `provider` (many-to-one)

---

### Key Methods and Helpers

#### Provider Model Methods:
- `ensureBusinessInfo()` - Get or create business info
- `ensureProfessionalInfo()` - Get or create professional info
- `ensureVerification()` - Get or create verification
- `ensurePreferences()` - Get or create preferences
- `ensureFinancialInfo()` - Get or create financial info
- `ensurePerformance()` - Get or create performance
- `isVerified()` - Check if provider is verified
- `canAcceptJobs()` - Check if provider can accept jobs
- `getServiceAreas()` - Get all service areas

#### ProviderVerificationService Methods:
- `getOnboardingProgress(userId)` - Get onboarding status
- `validateOnboardingStep(userId, step, data)` - Validate step data
- `validateCompleteProfile(provider)` - Validate full profile
- `submitForReview(userId)` - Submit for admin review
- `getVerificationStatus(userId)` - Get verification status
- `canAcceptJobs(userId)` - Check job acceptance capability

---

### Technical Details

#### Automatic Creation
When a Provider is created, all related documents (verification, professionalInfo, etc.) are automatically created via post-save hooks.

#### Soft Delete
Provider profiles are soft-deleted (not hard-deleted) when user loses provider role. They can be restored if user regains provider role.

#### Progress Calculation
Onboarding progress is calculated as: `(completedSteps / 8) * 100`

#### Status Flow
- `pending` → Initial state, after onboarding complete
- `active` → Approved by admin, can accept jobs
- `suspended` → Temporarily suspended
- `inactive` → Inactive provider
- `rejected` → Application rejected

#### Subscription
Provider subscription is managed through User model (`localProPlusSubscription`), not Provider model.

#### Multi-Role Support
Users can have multiple roles simultaneously (e.g., `['client', 'provider']`).

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROVIDER PROFILE COMPLETION FLOW             │
└─────────────────────────────────────────────────────────────────┘

1. USER REGISTRATION/LOGIN
   └─> User has 'client' role
   └─> User decides to become provider

2. CREATE PROVIDER PROFILE (Provider Action)
   POST /api/providers/profile
   ├─> Validates user has 'client' role
   ├─> Creates Provider document
   ├─> Sets status: 'pending'
   ├─> Initializes onboarding:
   │   ├─> completed: false
   │   ├─> currentStep: 'profile_setup'
   │   ├─> progress: 10%
   │   └─> steps: [{ step: 'profile_setup', completed: true }]
   ├─> Auto-creates related documents:
   │   ├─> ProviderVerification
   │   ├─> ProviderProfessionalInfo
   │   ├─> ProviderPreferences
   │   ├─> ProviderFinancialInfo
   │   ├─> ProviderPerformance
   │   └─> ProviderBusinessInfo (if business/agency)
   └─> Adds 'provider' role to User

3. STEP 1: PROFILE SETUP (Auto-completed)
   └─> Provider type selected
   └─> Basic settings configured

4. STEP 2: BUSINESS INFO (Provider Action - Required for business/agency)
   PUT /api/providers/profile
   ├─> Update businessInfo object
   ├─> Required fields:
   │   ├─> businessName
   │   ├─> businessType
   │   ├─> businessAddress (city, state)
   │   └─> businessPhone
   └─> PUT /api/providers/onboarding/step
       └─> Mark 'business_info' as complete
       └─> Progress: 25%

5. STEP 3: PROFESSIONAL INFO (Provider Action - Required)
   PUT /api/providers/profile
   ├─> Update professionalInfo object
   ├─> Required:
   │   ├─> specialties (at least one)
   │   │   ├─> category (ServiceCategory)
   │   │   └─> serviceAreas (at least one)
   │   └─> languages
   └─> PUT /api/providers/onboarding/step
       └─> Mark 'professional_info' as complete
       └─> Progress: 40%

6. STEP 4: VERIFICATION (Provider Action - Required)
   PUT /api/providers/profile
   ├─> Update verification object
   ├─> Required:
   │   ├─> identityVerified (admin-controlled)
   │   ├─> businessVerified (for business/agency)
   │   ├─> insurance.hasInsurance
   │   └─> backgroundCheck.status
   └─> PUT /api/providers/onboarding/step
       └─> Mark 'verification' as complete
       └─> Progress: 55%

7. STEP 5: DOCUMENTS (Provider Action - Required)
   POST /api/providers/documents/upload
   ├─> Upload identity documents
   ├─> Upload business documents (if business/agency)
   ├─> Upload insurance documents
   ├─> Upload background check documents
   └─> PUT /api/providers/onboarding/step
       └─> Mark 'documents' as complete
       └─> Progress: 70%

8. STEP 6: PORTFOLIO (Provider Action - Optional)
   POST /api/providers/documents/upload
   ├─> Upload portfolio images
   ├─> Optional: Videos, before/after photos
   └─> PUT /api/providers/onboarding/step
       └─> Mark 'portfolio' as complete
       └─> Progress: 85%

9. STEP 7: PREFERENCES (Provider Action - Required)
   PUT /api/providers/profile
   ├─> Update preferences object
   ├─> Required:
   │   ├─> notificationSettings
   │   ├─> jobPreferences
   │   └─> communicationPreferences
   └─> PUT /api/providers/onboarding/step
       └─> Mark 'preferences' as complete
       └─> Progress: 95%

10. STEP 8: REVIEW (Provider Action - Final)
    PUT /api/providers/onboarding/step
    ├─> Validate complete profile
    ├─> Check all requirements met
    ├─> Mark 'review' as complete
    ├─> Progress: 100%
    ├─> onboarding.completed: true
    └─> status: 'pending' (ready for admin review)

11. ADMIN REVIEW (Admin Action)
    └─> Admin reviews provider application
    └─> Admin can:
        ├─> Approve → status: 'active'
        ├─> Reject → status: 'rejected'
        └─> Request info → status: 'pending'

12. PROVIDER ACTIVE
    └─> Provider can now accept jobs
    └─> Profile visible in marketplace (Client can search/view)
    └─> Can receive bookings
```

---

## Testing the Flow

### Provider Testing

#### 1. Create Provider Profile
```bash
POST /api/providers/profile
Authorization: Bearer <token>
{
  "providerType": "individual"
}
```

#### 2. Update Business Info (if business/agency)
```bash
PUT /api/providers/profile
Authorization: Bearer <token>
{
  "businessInfo": {
    "businessName": "My Business",
    "businessType": "small_business",
    "businessAddress": {
      "city": "New York",
      "state": "NY"
    },
    "businessPhone": "+1234567890"
  }
}
```

#### 3. Update Professional Info
```bash
PUT /api/providers/profile
Authorization: Bearer <token>
{
  "professionalInfo": {
    "specialties": [{
      "category": "plumbing",
      "hourlyRate": 90,
      "serviceAreas": [{
        "city": "New York",
        "state": "NY",
        "radius": 35
      }]
    }],
    "languages": ["English", "Spanish"]
  }
}
```

#### 4. Mark Steps Complete
```bash
PUT /api/providers/onboarding/step
Authorization: Bearer <token>
{
  "step": "professional_info",
  "data": {}
}
```

#### 5. Upload Documents
```bash
POST /api/providers/documents/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
documentType: insurance
documents: <file1>, <file2>
```

#### 6. Check Progress
```bash
GET /api/providers/profile/me
Authorization: Bearer <token>
```

### Client Testing

#### 1. Search Providers
```bash
GET /api/providers?status=active&category=plumbing&city=New York&state=NY&minRating=4.5
```

#### 2. Get Provider Details
```bash
GET /api/providers/:id
```

#### 3. Get Provider Skills
```bash
GET /api/providers/skills?category=plumbing
```

---

## Summary

The provider profile completion flow is a structured 8-step onboarding process organized by role:

**For Providers:**
- Create and manage their profile
- Complete onboarding steps
- Upload documents and portfolio
- View dashboard and analytics

**For Clients:**
- Search and filter providers
- View provider profiles
- Access provider skills and categories

**For Admins:**
- Review provider applications
- Verify provider information
- Manage provider status
- Control verification flags

**General:**
- All related collections are automatically created and managed
- Data models and relationships ensure consistency
- Multi-role support allows users to be both client and provider

All related collections are automatically created and managed through helper methods, ensuring data consistency and completeness.
