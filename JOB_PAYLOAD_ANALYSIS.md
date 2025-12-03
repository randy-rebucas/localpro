# Job Creation Payload Analysis

## Payload Structure Overview

The provided payload shows a comprehensive job posting structure with the following main sections:

### 1. **Basic Information** ✅ (Partially Implemented)
- `title` ✅ - Currently implemented
- `description` ✅ - Currently implemented
- `category` ⚠️ - Currently using enum values, but payload expects ID string
- `subcategory` ❌ - Missing (payload shows string, not enum)

### 2. **Company Information** ❌ (Missing)
```json
{
  "company": {
    "name": "ABC Plumbing Services",          // REQUIRED
    "website": "https://abcplumbing.com",     // Optional
    "size": "medium",                         // Optional: startup|small|medium|large|enterprise
    "industry": "Construction",               // Optional
    "location": {                             // Nested location object
      "address": "123 Main Street...",
      "city": "Manila",
      "state": "Metro Manila",
      "country": "Philippines",
      "coordinates": { "lat": 14.5995, "lng": 120.9842 },
      "isRemote": false,
      "remoteType": "on_site"                 // fully_remote|hybrid|on_site
    }
  }
}
```
**Current Form**: Only has basic location fields, missing company object entirely.

### 3. **Job Type & Experience** ⚠️ (Incorrect Implementation)
- `jobType` ❌ - Current form uses `projectType` (ONE_TIME|ONGOING|HOURLY) which is wrong
  - **Should be**: `full_time|part_time|contract|freelance|internship|temporary`
- `experienceLevel` ⚠️ - Current form uses `BEGINNER|INTERMEDIATE|EXPERT`
  - **Should be**: `entry|junior|mid|senior|lead|executive`

### 4. **Salary Structure** ❌ (Completely Different)
**Payload Structure:**
```json
{
  "salary": {
    "min": 30000,
    "max": 40000,
    "currency": "PHP",
    "period": "monthly",              // hourly|daily|weekly|monthly|yearly
    "isNegotiable": true,
    "isConfidential": false
  }
}
```
**Current Form**: Uses single `budget` field (incorrect)

### 5. **Benefits** ❌ (Missing)
```json
"benefits": [
  "health_insurance",
  "paid_time_off",
  "sick_leave",
  "professional_development"
]
```
**Current Form**: Not implemented

### 6. **Requirements Structure** ⚠️ (Incomplete)
**Payload Structure:**
```json
{
  "requirements": {
    "skills": ["Pipe installation", "Leak repair", ...],  // ✅ Currently implemented as array
    "education": {
      "level": "high_school",         // high_school|associate|bachelor|master|phd|none_required
      "field": "Plumbing",
      "isRequired": true
    },
    "experience": {
      "years": 5,
      "description": "Minimum 5 years..."
    },
    "certifications": ["Licensed Plumber", "OSHA Certification"],
    "languages": [
      {
        "language": "English",
        "proficiency": "intermediate"  // beginner|intermediate|advanced|native
      }
    ],
    "other": ["Valid driver's license", "Own transportation"]
  }
}
```
**Current Form**: Only has `skills` array and simple `requirements` array. Missing:
- Education details
- Experience years/description
- Certifications
- Languages
- Other requirements

### 7. **Responsibilities** ❌ (Missing)
```json
"responsibilities": [
  "Install and repair plumbing systems",
  "Diagnose plumbing issues",
  ...
]
```
**Current Form**: Not implemented

### 8. **Qualifications** ❌ (Missing)
```json
"qualifications": [
  "Strong problem-solving skills",
  "Physical fitness for manual work",
  ...
]
```
**Current Form**: Not implemented (has `deliverables` which is wrong for job postings)

### 9. **Application Process** ❌ (Missing)
```json
{
  "applicationProcess": {
    "deadline": "2024-12-31T23:59:59.000Z",
    "startDate": "2025-01-15T00:00:00.000Z",
    "applicationMethod": "platform",  // email|website|platform|phone
    "contactEmail": "hr@abcplumbing.com",
    "contactPhone": "+639171234567",
    "applicationUrl": "https://abcplumbing.com/careers",
    "instructions": "Please submit your resume..."
  }
}
```
**Current Form**: Only has `deadline`, missing all other application process fields

### 10. **Status & Visibility** ❌ (Missing)
- `status`: `draft|active|paused|closed|filled`
- `visibility`: `public|private|featured`
**Current Form**: Not implemented

### 11. **Tags** ❌ (Missing)
```json
"tags": ["plumbing", "construction", "full-time", "manila"]
```
**Current Form**: Not implemented

### 12. **Timeline Fields** ⚠️ (Partially Implemented)
- `deadline` ✅ - Currently implemented
- `duration` ⚠️ - Currently implemented but may not be needed (startDate is in applicationProcess)
- `startDate` ❌ - Missing (in applicationProcess)

---

## Summary of Issues

### Critical Missing Fields:
1. **Company object** (name, website, size, industry, location)
2. **Salary structure** (min/max, period, negotiable, confidential)
3. **Benefits array**
4. **Detailed requirements** (education, experience, certifications, languages)
5. **Responsibilities array**
6. **Qualifications array**
7. **Application process** (method, contact info, instructions)
8. **Status and visibility**
9. **Tags**

### Incorrect Implementations:
1. `projectType` should be `jobType` with different enum values
2. `experienceLevel` enum values are wrong
3. `budget` should be `salary` object
4. `deliverables` doesn't belong in job postings (should be `qualifications`)
5. `category` should accept ID strings, not just enum values
6. `subcategory` is missing

### Fields to Remove:
- `deliverables` (not part of job posting structure)
- `duration` (may not be needed if using startDate)
- `timezone` (not in payload structure)

---

## Recommended Form Structure

### Step 1: Basic Information
- Title ✅
- Description ✅
- Category (with ID lookup) ⚠️
- Subcategory (with ID lookup) ❌
- Job Type (full_time, part_time, etc.) ⚠️
- Experience Level (entry, junior, etc.) ⚠️

### Step 2: Company Information (NEW)
- Company Name ✅
- Website
- Company Size
- Industry
- Location (address, city, state, country, coordinates)
- Remote Type (fully_remote, hybrid, on_site)

### Step 3: Salary & Benefits (NEW)
- Salary Min/Max
- Currency (PHP)
- Period (hourly, daily, weekly, monthly, yearly)
- Is Negotiable
- Is Confidential
- Benefits (multi-select)

### Step 4: Requirements & Qualifications (EXPANDED)
- Skills ✅
- Education (level, field, isRequired)
- Experience (years, description)
- Certifications
- Languages (language, proficiency)
- Other Requirements
- Responsibilities (NEW)
- Qualifications (NEW - replace deliverables)

### Step 5: Application Process (NEW)
- Application Deadline ✅
- Start Date
- Application Method
- Contact Email
- Contact Phone
- Application URL
- Instructions

### Step 6: Additional Settings (NEW)
- Status (draft, active, etc.)
- Visibility (public, private, featured)
- Tags

### Step 7: Review & Submit ✅

---

## Validation Schema Alignment

The current `jobSchema` in `src/lib/validations/schemas.ts` is partially aligned but needs updates:
- ✅ Basic structure matches
- ⚠️ Missing: benefits, responsibilities, qualifications, applicationProcess, status, visibility, tags
- ⚠️ Requirements structure is simplified (should be nested object)

