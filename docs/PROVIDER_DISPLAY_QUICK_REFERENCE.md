# Provider Display Data - Quick Reference

## Currently Displayed ✅
- Name (business name or firstName + lastName)
- Location (city, state)
- Avatar/Profile Image
- Rating (0-5 stars)
- Review Count
- Verification Badge (identity verified)
- Provider Type Badge (Individual/Business/Agency)
- Business Description (if available)

## High Priority Additions 🎯

### 1. Skills Display
**Source:** `professionalInfo.specialties[].skills[]`
- Show first 3-5 skills as badges/tags
- Display skill names from `skills[].name`

### 2. Pricing Information
**Source:** `professionalInfo.specialties[].pricing.hourlyRate`
- Format: "Starting at $75/hr" or "From $100"
- Include currency from `pricing.currency`

### 3. Experience Indicator
**Source:** `professionalInfo.specialties[].yearsOfExperience`
- Format: "10+ years experience" or "Expert"

### 4. Service Category
**Source:** `professionalInfo.specialties[].category`
- Display primary category
- Link to category filtering

### 5. Additional Verification Badges
**Sources:**
- `verification.backgroundCheck.status === "passed"` → Background Check badge
- `verification.insurance.liability.active` → Insurance Verified badge
- `verification.licenses.length > 0` → Licensed badge
- `verification.certifications.length > 0` → Certified badge

### 6. Performance Metrics
**Sources:**
- `performance.totalJobs` → "450+ jobs completed"
- `performance.completionRate` → "97% completion rate"
- `performance.averageResponseTime` → "Responds within 2.5 hours"

### 7. Featured/Promoted Indicators
**Sources:**
- `metadata.featured === true` → Featured badge
- `metadata.promoted === true` → Promoted indicator

### 8. Availability Status
**Source:** `professionalInfo.availability`
- "Available Now" / "Available Soon"
- `professionalInfo.emergencyServices === true` → Emergency badge

## Data Paths Quick Reference

```javascript
// Name
provider.businessInfo?.businessName || 
`${user.firstName} ${user.lastName}`

// Location
provider.businessInfo?.businessAddress || 
user.profile?.address

// Avatar
user.profile?.avatar?.url || 
user.profile?.avatar?.thumbnail

// Rating
provider.performance?.rating || 0

// Reviews
provider.performance?.totalReviews || 0

// Skills
provider.professionalInfo?.specialties?.[0]?.skills || []

// Pricing
provider.professionalInfo?.specialties?.[0]?.pricing?.hourlyRate

// Experience
provider.professionalInfo?.specialties?.[0]?.yearsOfExperience

// Category
provider.professionalInfo?.specialties?.[0]?.category

// Verification
provider.verification?.identityVerified
provider.verification?.backgroundCheck?.status
provider.verification?.insurance?.liability?.active
provider.verification?.licenses?.length > 0
provider.verification?.certifications?.length > 0

// Performance
provider.performance?.totalJobs
provider.performance?.completionRate
provider.performance?.averageResponseTime

// Metadata
provider.metadata?.featured
provider.metadata?.promoted

// Availability
provider.professionalInfo?.availability
provider.professionalInfo?.emergencyServices
```

## Display Priority

| Priority | Data | Use Case |
|----------|------|----------|
| **Critical** | Name, Location, Avatar, Rating, Reviews | Essential for identification |
| **High** | Skills, Pricing, Experience, Verification Badges | Key decision factors |
| **Medium** | Performance Metrics, Availability, Featured | Trust & availability indicators |
| **Low** | Tags, Languages, Service Areas | Nice-to-have details |

## Filtering Fields Available

- `status` - active/pending/verified
- `providerType` - individual/business/agency
- `category` - service category
- `skills` - skill IDs (comma-separated)
- `skillsMatch` - 'any' or 'all'
- `city` / `state` - location
- `minRating` - minimum rating
- `lat` / `lng` / `maxDistance` - proximity
- `featured` - featured providers only
- `promoted` - promoted providers only

## Sorting Options

- `rating` (default) - by performance rating
- `totalReviews` - by review count
- `createdAt` - by newest
- `completionRate` - by reliability
- `averageResponseTime` - by responsiveness

