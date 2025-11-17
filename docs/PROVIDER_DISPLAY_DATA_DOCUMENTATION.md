# Provider Display Data Documentation

## Overview
This document analyzes the provider API response structure and identifies what data/entities should be displayed to create a complete provider profile view in the marketplace.

## API Response Structure

The provider API returns a nested structure with the following main entities:

```json
{
  "success": true,
  "data": [Provider[]],
  "pagination": {...}
}
```

---

## Core Provider Data Entities

### 1. **Basic Provider Information** (`_id`, `status`, `providerType`)
**Location:** Root level of provider object

| Field | Type | Description | Display Priority |
|-------|------|-------------|------------------|
| `_id` | string | Unique provider identifier | **Critical** - Used for routing |
| `status` | string | Provider status (active, pending, verified) | **High** - Filter/display status |
| `providerType` | string | Type: "individual", "business", "agency" | **High** - Currently displayed as badge |
| `metadata.featured` | boolean | Featured provider flag | **Medium** - Show featured badge |
| `metadata.promoted` | boolean | Promoted provider flag | **Medium** - Show promoted indicator |
| `metadata.tags` | string[] | Provider tags | **Low** - Optional display |

**Currently Displayed:** ✅ `providerType` (as badge)

**Recommended Additions:**
- Featured/Promoted badges
- Status indicator (if not active)

---

### 2. **User Profile Information** (`userId` object)
**Location:** `provider.userId`

| Field | Type | Description | Display Priority |
|-------|------|-------------|------------------|
| `firstName` | string | Provider's first name | **Critical** - Fallback for name |
| `lastName` | string | Provider's last name | **Critical** - Fallback for name |
| `email` | string | Contact email | **Medium** - Contact info (if allowed) |
| `phone` / `phoneNumber` | string | Contact phone | **Medium** - Contact info (if allowed) |
| `profile.avatar.url` | string | Profile image URL | **High** - Currently displayed |
| `profile.avatar.thumbnail` | string | Thumbnail image URL | **High** - Fallback for avatar |
| `profile.bio` | string | User bio | **Medium** - Personal description |
| `profile.address.city` | string | City location | **Critical** - Currently displayed |
| `profile.address.state` | string | State location | **Critical** - Currently displayed |
| `profile.address.coordinates.lat` | number | Latitude | **Medium** - For distance calculation |
| `profile.address.coordinates.lng` | number | Longitude | **Medium** - For distance calculation |
| `trust.trustScore` | number | Trust score (0-100) | **High** - Trust indicator |
| `trust.badges` | array | Trust badges | **Medium** - Display badges |

**Currently Displayed:** ✅ Avatar, Name (firstName/lastName), Location (city, state)

**Recommended Additions:**
- Trust score indicator
- Trust badges
- Bio (if available)

---

### 3. **Professional Information** (`professionalInfo`)
**Location:** `provider.professionalInfo`

| Field | Type | Description | Display Priority |
|-------|------|-------------|------------------|
| `specialties[].category` | string | Service category | **Critical** - Filtering/display |
| `specialties[].description` | string | Specialty description | **High** - Service description |
| `specialties[].yearsOfExperience` | number | Years of experience | **High** - Experience indicator |
| `specialties[].skills[]` | array | Skills array | **Critical** - Currently used for filtering |
| `specialties[].skills[]._id` | string | Skill ID | **Critical** - Skill filtering |
| `specialties[].skills[].name` | string | Skill name | **High** - Display skill names |
| `specialties[].skills[].description` | string | Skill description | **Medium** - Tooltip/expandable |
| `specialties[].pricing.hourlyRate` | number | Hourly rate | **High** - Pricing display |
| `specialties[].pricing.minimumCharge` | number | Minimum charge | **Medium** - Pricing info |
| `specialties[].pricing.currency` | string | Currency code | **High** - Pricing context |
| `specialties[].serviceAreas[].city` | string | Service area city | **High** - Coverage area |
| `specialties[].serviceAreas[].state` | string | Service area state | **High** - Coverage area |
| `specialties[].serviceAreas[].radius` | number | Service radius (miles) | **Medium** - Coverage radius |
| `languages[]` | string[] | Spoken languages | **Medium** - Language indicator |
| `availability` | object | Weekly availability | **High** - Availability status |
| `emergencyServices` | boolean | Emergency service flag | **Medium** - Emergency badge |
| `travelDistance` | number | Max travel distance | **Medium** - Service range |
| `minimumJobValue` | number | Minimum job value | **Low** - Advanced filter |
| `maximumJobValue` | number | Maximum job value | **Low** - Advanced filter |

**Currently Displayed:** ❌ Not displayed in grid view

**Recommended Additions:**
- Primary specialty/category
- Key skills (first 3-5)
- Hourly rate or "Starting at $X"
- Years of experience
- Service areas
- Availability status (Available Now / Available Soon)
- Emergency services badge
- Languages spoken

---

### 4. **Business Information** (`businessInfo`)
**Location:** `provider.businessInfo`

| Field | Type | Description | Display Priority |
|-------|------|-------------|------------------|
| `businessName` | string | Business name | **Critical** - Currently displayed (if exists) |
| `businessDescription` | string | Business description | **High** - Currently displayed |
| `businessAddress.city` | string | Business city | **Critical** - Currently displayed (if exists) |
| `businessAddress.state` | string | Business state | **Critical** - Currently displayed (if exists) |

**Currently Displayed:** ✅ Business name (as primary name), Business description, Business address

**Note:** Only present for `providerType: "business"` or `"agency"`

---

### 5. **Verification & Trust** (`verification`)
**Location:** `provider.verification`

| Field | Type | Description | Display Priority |
|-------|------|-------------|------------------|
| `identityVerified` | boolean | Identity verified | **High** - Currently displayed (CheckCircle icon) |
| `identityVerifiedAt` | date | Verification date | **Low** - Optional detail |
| `businessVerified` | boolean | Business verified | **High** - Show for business/agency |
| `backgroundCheck.status` | string | Background check status | **High** - Trust indicator |
| `backgroundCheck.completedAt` | date | Check completion date | **Medium** - Trust detail |
| `insurance.liability.active` | boolean | Liability insurance active | **High** - Trust indicator |
| `insurance.liability.amount` | number | Coverage amount | **Medium** - Trust detail |
| `insurance.workersComp.active` | boolean | Workers comp active | **High** - Trust indicator |
| `licenses[]` | array | Professional licenses | **High** - Credibility |
| `licenses[].type` | string | License type | **Medium** - License info |
| `licenses[].state` | string | License state | **Medium** - License info |
| `certifications[]` | array | Professional certifications | **High** - Credibility |
| `certifications[].name` | string | Certification name | **Medium** - Certification info |

**Currently Displayed:** ✅ `identityVerified` (CheckCircle icon)

**Recommended Additions:**
- Business verified badge (if applicable)
- Background check badge
- Insurance verified badge
- Licensed badge (if licenses exist)
- Certified badge (if certifications exist)

---

### 6. **Performance Metrics** (`performance`)
**Location:** `provider.performance`

| Field | Type | Description | Display Priority |
|-------|------|-------------|------------------|
| `rating` | number | Average rating (0-5) | **Critical** - Currently displayed |
| `totalReviews` | number | Total review count | **Critical** - Currently displayed |
| `totalJobs` | number | Total jobs completed | **High** - Experience indicator |
| `completedJobs` | number | Successfully completed | **High** - Success rate |
| `completionRate` | number | Completion percentage | **High** - Reliability indicator |
| `cancellationRate` | number | Cancellation percentage | **Medium** - Reliability indicator |
| `averageResponseTime` | number | Response time (hours) | **High** - Responsiveness |
| `totalEarnings` | number | Total earnings | **Low** - Not for public display |
| `averageJobValue` | number | Average job value | **Low** - Optional metric |

**Currently Displayed:** ✅ `rating`, `totalReviews`

**Recommended Additions:**
- Total jobs completed (e.g., "450+ jobs")
- Completion rate (e.g., "97% completion rate")
- Response time (e.g., "Responds within 2 hours")
- Success rate badge

---

### 7. **Onboarding Status** (`onboarding`)
**Location:** `provider.onboarding`

| Field | Type | Description | Display Priority |
|-------|------|-------------|------------------|
| `completed` | boolean | Onboarding complete | **Medium** - Filter incomplete providers |
| `progress` | number | Onboarding progress % | **Low** - Internal use only |

**Currently Displayed:** ❌ Not displayed

**Recommended:** Filter out providers with `completed: false` from public marketplace

---

### 8. **Metadata** (`metadata`)
**Location:** `provider.metadata`

| Field | Type | Description | Display Priority |
|-------|------|-------------|------------------|
| `featured` | boolean | Featured provider | **High** - Featured badge |
| `promoted` | boolean | Promoted provider | **Medium** - Promoted indicator |
| `profileViews` | number | Profile view count | **Low** - Optional popularity metric |
| `searchRanking` | number | Search ranking score | **Low** - Internal sorting |
| `lastActive` | date | Last active timestamp | **Medium** - "Active recently" indicator |
| `tags` | string[] | Provider tags | **Low** - Optional tags display |

**Currently Displayed:** ❌ Not displayed

**Recommended Additions:**
- Featured badge (if `featured: true`)
- "Active recently" indicator (if `lastActive` is recent)
- Promoted indicator (if `promoted: true`)

---

## Currently Displayed in Provider Grid

### ✅ **Currently Shown:**
1. **Name** - From `businessInfo.businessName` or `firstName + lastName`
2. **Location** - From `businessInfo.businessAddress` or `profile.address` (city, state)
3. **Avatar/Image** - From `profile.avatar.url` or `profile.avatar.thumbnail`
4. **Rating** - From `performance.rating`
5. **Review Count** - From `performance.totalReviews`
6. **Verification Badge** - From `verification.identityVerified` (CheckCircle icon)
7. **Provider Type Badge** - From `providerType` (Individual/Business/Agency)
8. **Business Description** - From `businessInfo.businessDescription` (if available)

---

## Recommended Additions for Complete Provider Display

### **High Priority Additions:**

1. **Skills Display**
   - Show primary skills from `professionalInfo.specialties[].skills[]`
   - Display as tags/badges (first 3-5 skills)
   - Link to skill filtering

2. **Pricing Information**
   - Display `professionalInfo.specialties[].pricing.hourlyRate`
   - Format: "Starting at $75/hr" or "From $100"
   - Show currency from `pricing.currency`

3. **Experience Indicator**
   - Display `professionalInfo.specialties[].yearsOfExperience`
   - Format: "10+ years experience" or "Expert"

4. **Service Category**
   - Display primary `professionalInfo.specialties[].category`
   - Link to category filtering

5. **Additional Verification Badges**
   - Background check badge (if `verification.backgroundCheck.status === "passed"`)
   - Insurance verified badge (if `verification.insurance.liability.active`)
   - Licensed badge (if `verification.licenses.length > 0`)
   - Certified badge (if `verification.certifications.length > 0`)

6. **Performance Metrics**
   - Total jobs: "450+ jobs completed"
   - Completion rate: "97% completion rate"
   - Response time: "Responds within 2.5 hours"

7. **Featured/Promoted Indicators**
   - Featured badge (if `metadata.featured === true`)
   - Promoted indicator (if `metadata.promoted === true`)

8. **Availability Status**
   - "Available Now" / "Available Soon" based on `professionalInfo.availability`
   - Emergency services badge (if `professionalInfo.emergencyServices === true`)

9. **Service Areas**
   - Display service areas from `professionalInfo.specialties[].serviceAreas[]`
   - Show coverage radius if available

10. **Trust Score**
    - Display `userId.trust.trustScore` (if available)
    - Show trust badges from `userId.trust.badges[]`

---

## Data Mapping for Provider Card

### **Grid View (Compact)**
```
┌─────────────────────────────┐
│ [Avatar Image]              │
│                             │
├─────────────────────────────┤
│ Name [✓] [Type Badge]      │
│ [Featured Badge]            │
│ 📍 Location                 │
│ ⭐ Rating (Reviews)        │
│                             │
│ [Skill] [Skill] [Skill]     │
│                             │
│ 💰 Starting at $75/hr      │
│ 🏆 10+ years experience    │
│ ✅ Verified | Insured      │
│                             │
│ [View Profile Button]      │
└─────────────────────────────┘
```

### **List View (Expanded)**
```
┌─────────────────────────────────────────────────────┐
│ [Avatar] Name [✓] [Type] [Featured]                │
│ 📍 Location                                         │
│ ⭐ 4.8 (125 reviews) | 450+ jobs | 97% completion  │
│                                                     │
│ Skills: [Skill1] [Skill2] [Skill3] [More...]      │
│ 💰 Starting at $75/hr | 🏆 10+ years              │
│ ✅ Verified | ✓ Background Check | ✓ Insured      │
│ Available Now | Emergency Services Available      │
│                                                     │
│ [View Profile Button]                              │
└─────────────────────────────────────────────────────┘
```

---

## Entity Relationships

```
Provider
├── userId (User)
│   ├── profile
│   │   ├── avatar
│   │   └── address
│   └── trust
├── professionalInfo
│   ├── specialties[]
│   │   ├── skills[]
│   │   ├── pricing
│   │   └── serviceAreas[]
│   ├── availability
│   └── languages[]
├── businessInfo (optional)
│   ├── businessName
│   ├── businessDescription
│   └── businessAddress
├── verification
│   ├── backgroundCheck
│   ├── insurance
│   ├── licenses[]
│   └── certifications[]
├── performance
│   ├── rating
│   ├── totalReviews
│   └── completionRate
└── metadata
    ├── featured
    └── promoted
```

---

## Filtering & Sorting Considerations

### **Available Filter Fields:**
- `status` - Filter by active/pending/verified
- `providerType` - Filter by individual/business/agency
- `category` - Filter by service category
- `skills` - Filter by skill IDs
- `city` / `state` - Location filtering
- `minRating` - Minimum rating filter
- `lat` / `lng` / `maxDistance` - Proximity filtering
- `featured` - Show only featured providers
- `promoted` - Show only promoted providers

### **Sorting Options:**
- `rating` (default) - Sort by performance rating
- `totalReviews` - Sort by review count
- `createdAt` - Sort by newest
- `performance.completionRate` - Sort by reliability
- `performance.averageResponseTime` - Sort by responsiveness
- `metadata.searchRanking` - Sort by relevance

---

## Implementation Recommendations

### **Phase 1: Essential Additions**
1. Add skills display (first 3-5 skills as badges)
2. Add pricing information (hourly rate)
3. Add experience indicator (years of experience)
4. Add service category display
5. Add additional verification badges

### **Phase 2: Enhanced Metrics**
1. Add performance metrics (jobs completed, completion rate)
2. Add availability status
3. Add featured/promoted indicators
4. Add service areas display

### **Phase 3: Advanced Features**
1. Add trust score display
2. Add languages spoken
3. Add emergency services indicator
4. Add last active timestamp

---

## Data Validation & Fallbacks

### **Name Fallback Chain:**
```
businessInfo.businessName 
  → firstName + lastName 
  → "Unknown Provider"
```

### **Location Fallback Chain:**
```
businessInfo.businessAddress (city, state)
  → profile.address (city, state)
  → "" (empty)
```

### **Avatar Fallback Chain:**
```
profile.avatar.url
  → profile.avatar.thumbnail
  → Initials avatar (generated)
```

### **Rating Fallback Chain:**
```
performance.rating
  → rating.average
  → 0 (no rating)
```

---

## Notes

- All financial information (`financialInfo`, `totalEarnings`) should **NOT** be displayed publicly
- Personal contact information (`email`, `phone`) should only be shown if `settings.showContactInfo === true`
- Filter out providers with `onboarding.completed === false` from public marketplace
- Handle null/undefined values gracefully with fallbacks
- Consider lazy loading for images and heavy data
- Implement proper error boundaries for missing data

---

## Related Files

- `src/components/marketplace/provider-grid.tsx` - Current implementation
- `src/hooks/useProviders.ts` - Provider data fetching
- `src/hooks/useProviderFilters.ts` - Filter management
- `PROVIDER_RESPONSE_EXAMPLE.json` - API response structure

