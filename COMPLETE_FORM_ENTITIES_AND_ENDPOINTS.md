# Complete Form Entities and Endpoints

## Overview
This document provides comprehensive details of all form entities (Provider, Supplier, Partner, Agency, Instructor, Client) with their complete field structures and corresponding API endpoints for form submission.

---

## Table of Contents
1. [Provider Forms](#1-provider-forms)
2. [Supplier Forms](#2-supplier-forms)
3. [Partner Forms](#3-partner-forms)
4. [Agency Forms](#4-agency-forms)
5. [Instructor/Course Forms](#5-instructorcourse-forms)
6. [Client/User Forms](#6-clientuser-forms)

---

## 1. Provider Forms

### 1.1 Provider Profile Creation Form

**Endpoint:** `POST /api/providers/profile`  
**Authentication:** Required  
**Role:** User must have `client` role

#### Form Fields:

```json
{
  "providerType": "individual" | "business" | "agency",  // Required
  "businessInfo": {  // Required for business/agency types
    "businessName": "string",  // Required
    "businessType": "string",
    "businessRegistration": "string",
    "taxId": "string",
    "businessAddress": {
      "street": "string",
      "city": "string",  // Required
      "state": "string",  // Required
      "zipCode": "string",
      "country": "string",
      "coordinates": {
        "lat": "number",
        "lng": "number"
      }
    },
    "businessPhone": "string",  // Required
    "businessEmail": "string",
    "website": "string",
    "businessDescription": "string",
    "yearEstablished": "number",
    "numberOfEmployees": "number"
  },
  "professionalInfo": {  // Optional at creation
    "specialties": [{
      "category": "ObjectId | string",  // ServiceCategory ID or key
      "reference": "string",
      "experience": "number",  // years
      "certifications": [{
        "name": "string",
        "issuer": "string",
        "dateIssued": "Date",
        "expiryDate": "Date",
        "certificateNumber": "string"
      }],
      "skills": ["ObjectId"],  // ProviderSkill IDs
      "hourlyRate": "number",
      "serviceAreas": [{  // At least one required
        "city": "string",  // Required
        "state": "string",  // Required
        "radius": "number"  // in miles/km
      }]
    }],
    "languages": ["string"],
    "availability": {
      "monday": { "start": "string", "end": "string", "available": "boolean" },
      "tuesday": { "start": "string", "end": "string", "available": "boolean" },
      "wednesday": { "start": "string", "end": "string", "available": "boolean" },
      "thursday": { "start": "string", "end": "string", "available": "boolean" },
      "friday": { "start": "string", "end": "string", "available": "boolean" },
      "saturday": { "start": "string", "end": "string", "available": "boolean" },
      "sunday": { "start": "string", "end": "string", "available": "boolean" }
    },
    "emergencyServices": "boolean",
    "travelDistance": "number",
    "minimumJobValue": "number",
    "maximumJobValue": "number"
  },
  "verification": {  // Optional at creation
    "identityVerified": "boolean",
    "businessVerified": "boolean",
    "backgroundCheck": {
      "status": "pending" | "passed" | "failed" | "not_required",
      "dateCompleted": "Date",
      "reportId": "string"
    },
    "insurance": {
      "hasInsurance": "boolean",
      "insuranceProvider": "string",
      "policyNumber": "string",
      "coverageAmount": "number",
      "expiryDate": "Date",
      "documents": ["string"]  // URLs
    },
    "licenses": [{
      "type": "string",
      "number": "string",
      "issuingAuthority": "string",
      "issueDate": "Date",
      "expiryDate": "Date",
      "documents": ["string"]
    }],
    "references": [{
      "name": "string",
      "relationship": "string",
      "phone": "string",
      "email": "string",
      "company": "string",
      "verified": "boolean"
    }],
    "portfolio": {
      "images": ["string"],
      "videos": ["string"],
      "descriptions": ["string"],
      "beforeAfter": [{
        "before": "string",
        "after": "string",
        "description": "string"
      }]
    }
  },
  "preferences": {  // Optional at creation
    "notificationSettings": {
      "email": {
        "jobAlerts": "boolean",
        "messages": "boolean",
        "reviews": "boolean",
        "payments": "boolean"
      },
      "sms": {
        "jobAlerts": "boolean",
        "urgentUpdates": "boolean"
      },
      "push": {
        "jobAlerts": "boolean",
        "messages": "boolean",
        "reviews": "boolean"
      }
    },
    "jobPreferences": {
      "autoAccept": "boolean",
      "minimumJobValue": "number",
      "maximumJobValue": "number",
      "preferredCategories": ["string"],
      "preferredServiceAreas": ["string"]
    },
    "communicationPreferences": {
      "preferredMethod": "email" | "sms" | "phone" | "app",
      "responseTime": "number",  // hours
      "availabilityHours": {
        "start": "string",
        "end": "string"
      }
    }
  },
  "settings": {  // Optional
    "profileVisibility": "public" | "private" | "verified_only",
    "showContactInfo": "boolean",
    "showPricing": "boolean",
    "showReviews": "boolean",
    "allowDirectBooking": "boolean",
    "requireApproval": "boolean"
  }
}
```

### 1.2 Provider Profile Update Form

**Endpoint:** `PUT /api/providers/profile`  
**Authentication:** Required  
**Description:** Supports partial updates - all fields optional

**Form Fields:** Same as creation form (all fields optional)

### 1.3 Provider Onboarding Step Update

**Endpoint:** `PUT /api/providers/onboarding/step`  
**Authentication:** Required

```json
{
  "step": "profile_setup" | "business_info" | "professional_info" | "verification" | "documents" | "portfolio" | "preferences" | "review",
  "data": {}  // Optional step-specific data
}
```

### 1.4 Provider Document Upload

**Endpoint:** `POST /api/providers/documents/upload`  
**Authentication:** Required  
**Content-Type:** `multipart/form-data`

**Form Fields:**
- `documentType`: `"insurance" | "license" | "portfolio"` (required)
- `category`: `string` (required for license type)
- `documents`: `File[]` (max 5 files, 10MB each, images or PDFs)

### 1.5 Get Provider Profile

**Endpoint:** `GET /api/providers/profile/me`  
**Authentication:** Required

---

## 2. Supplier Forms

### 2.1 Create Supply/Product Form

**Endpoint:** `POST /api/supplies` or `POST /api/supplies/products`  
**Authentication:** Required  
**Role:** `supplier` or `admin`

#### Form Fields:

```json
{
  "name": "string",  // Required
  "title": "string",  // Required
  "description": "string",  // Required
  "category": "cleaning_supplies" | "tools" | "materials" | "equipment",  // Required
  "subcategory": "string",  // Required
  "brand": "string",  // Required
  "sku": "string",  // Required, unique
  "pricing": {
    "retailPrice": "number",  // Required
    "wholesalePrice": "number",
    "currency": "string"  // Default: "USD"
  },
  "inventory": {
    "quantity": "number",  // Required, min: 0
    "minStock": "number",  // Default: 10
    "maxStock": "number",
    "location": "string"
  },
  "specifications": {
    "weight": "string",
    "dimensions": "string",
    "material": "string",
    "color": "string",
    "warranty": "string"
  },
  "location": {
    "street": "string",
    "city": "string",
    "state": "string",
    "zipCode": "string",
    "country": "string",
    "coordinates": {
      "lat": "number",
      "lng": "number"
    }
  },
  "tags": ["string"],
  "isActive": "boolean",  // Default: true
  "isFeatured": "boolean",  // Default: false
  "isSubscriptionEligible": "boolean"  // Default: false
}
```

### 2.2 Update Supply/Product Form

**Endpoint:** `PUT /api/supplies/:id`  
**Authentication:** Required  
**Role:** `supplier` or `admin`  
**Description:** Supports partial updates

**Form Fields:** Same as creation form (all fields optional)

### 2.3 Upload Supply Images

**Endpoint:** `POST /api/supplies/:id/images`  
**Authentication:** Required  
**Role:** `supplier` or `admin`  
**Content-Type:** `multipart/form-data`

**Form Fields:**
- `images`: `File[]` (max 5 files)

### 2.4 Order Supply Form

**Endpoint:** `POST /api/supplies/:id/order`  
**Authentication:** Required

```json
{
  "quantity": "number",  // Required, min: 1
  "deliveryAddress": {
    "street": "string",
    "city": "string",
    "state": "string",
    "zipCode": "string",
    "country": "string"
  },
  "specialInstructions": "string",
  "contactInfo": {
    "phone": "string",
    "email": "string"
  }
}
```

### 2.5 Add Supply Review

**Endpoint:** `POST /api/supplies/:id/reviews`  
**Authentication:** Required

```json
{
  "rating": "number",  // Required, min: 1, max: 5
  "comment": "string"
}
```

### 2.6 Generate Supply Description (AI)

**Endpoint:** `POST /api/supplies/generate-description`  
**Authentication:** Required  
**Role:** `supplier` or `admin`

```json
{
  "name": "string",
  "category": "string",
  "brand": "string",
  "specifications": {}
}
```

---

## 3. Partner Forms

### 3.1 Start Partner Onboarding

**Endpoint:** `POST /api/partners/onboarding/start`  
**Authentication:** Not required (public)

#### Form Fields:

```json
{
  "name": "string",  // Required, 2-100 characters
  "email": "string",  // Required, valid email
  "phoneNumber": "string"  // Required, valid phone format
}
```

### 3.2 Update Business Info (Onboarding Step 2)

**Endpoint:** `PUT /api/partners/:id/business-info`  
**Authentication:** Not required (identified by partner ID)

```json
{
  "businessInfo": {
    "companyName": "string",  // Optional, 2-100 characters
    "website": "string",  // Optional, valid URL
    "industry": "string",  // Optional, 2-50 characters
    "description": "string",  // Optional, max 500 characters
    "address": {
      "street": "string",
      "city": "string",
      "state": "string",
      "zipCode": "string",
      "country": "string",  // Default: "Philippines"
      "coordinates": {
        "lat": "number",
        "lng": "number"
      }
    }
  }
}
```

### 3.3 Complete Verification (Onboarding Step 4)

**Endpoint:** `PUT /api/partners/:id/verification`  
**Authentication:** Not required

```json
{
  "verification": {
    "emailVerified": "boolean",
    "phoneVerified": "boolean",
    "businessVerified": "boolean",
    "documents": [{
      "type": "business_registration" | "tax_id" | "contract" | "other",
      "name": "string",
      "url": "string",
      "publicId": "string"
    }]
  }
}
```

### 3.4 Complete API Setup (Onboarding Step 3)

**Endpoint:** `PUT /api/partners/:id/api-setup`  
**Authentication:** Not required

```json
{
  "apiCredentials": {
    "webhookUrl": "string",  // Optional, valid URL
    "callbackUrl": "string"  // Optional, valid URL
  }
}
```

### 3.5 Activate Partner (Onboarding Step 5)

**Endpoint:** `PUT /api/partners/:id/activate`  
**Authentication:** Not required

**Form Fields:** No body required (just activates partner)

### 3.6 Create Partner (Admin Only)

**Endpoint:** `POST /api/partners`  
**Authentication:** Required  
**Role:** `admin`

```json
{
  "name": "string",  // Required, 2-100 characters
  "email": "string",  // Required, valid email
  "phoneNumber": "string",  // Required, valid phone format
  "businessInfo": {},  // Optional, same structure as business-info update
  "slug": "string"  // Optional, auto-generated if not provided
}
```

### 3.7 Update Partner (Admin Only)

**Endpoint:** `PUT /api/partners/:id`  
**Authentication:** Required  
**Role:** `admin`  
**Description:** Supports partial updates

```json
{
  "name": "string",  // Optional, 2-100 characters
  "email": "string",  // Optional, valid email
  "phoneNumber": "string",  // Optional, valid phone format
  "status": "pending" | "active" | "suspended" | "inactive" | "rejected",  // Optional
  "businessInfo": {},  // Optional
  "tags": ["string"]  // Optional
}
```

### 3.8 Add Partner Note (Admin Only)

**Endpoint:** `POST /api/partners/:id/notes`  
**Authentication:** Required  
**Role:** `admin`

```json
{
  "content": "string"  // Required, 1-1000 characters
}
```

---

## 4. Agency Forms

### 4.1 Create Agency Form

**Endpoint:** `POST /api/agencies`  
**Authentication:** Required

#### Form Fields:

```json
{
  "name": "string",  // Required, 2-100 characters
  "description": "string",  // Optional, max 500 characters
  "contact": {
    "email": "string",  // Required, valid email
    "phone": "string",  // Required, 10-15 characters
    "website": "string",
    "address": {
      "street": "string",
      "city": "string",
      "state": "string",
      "zipCode": "string",
      "country": "string",
      "coordinates": {
        "lat": "number",
        "lng": "number"
      }
    }
  },
  "business": {
    "type": "sole_proprietorship" | "partnership" | "corporation" | "llc" | "nonprofit",  // Default: "sole_proprietorship"
    "registrationNumber": "string",
    "taxId": "string",
    "licenseNumber": "string",
    "insurance": {
      "provider": "string",
      "policyNumber": "string",
      "coverageAmount": "number",
      "expiryDate": "Date"
    }
  },
  "serviceAreas": [{
    "name": "string",
    "coordinates": {
      "lat": "number",
      "lng": "number"
    },
    "radius": "number",  // in kilometers
    "zipCodes": ["string"]
  }],
  "services": [{
    "category": "cleaning" | "plumbing" | "electrical" | "moving" | "landscaping" | "painting" | "carpentry" | "flooring" | "roofing" | "hvac" | "appliance_repair" | "locksmith" | "handyman" | "home_security" | "pool_maintenance" | "pest_control" | "carpet_cleaning" | "window_cleaning" | "gutter_cleaning" | "power_washing" | "snow_removal" | "other",
    "subcategories": ["string"],
    "pricing": {
      "baseRate": "number",
      "currency": "string"  // Default: "USD"
    }
  }],
  "subscription": {
    "plan": "basic" | "professional" | "enterprise",  // Default: "basic"
    "features": ["string"]
  },
  "verification": {
    "documents": [{
      "type": "business_license" | "insurance_certificate" | "tax_certificate" | "other",
      "url": "string",
      "publicId": "string",
      "filename": "string"
    }]
  },
  "settings": {
    "autoApproveProviders": "boolean",  // Default: false
    "requireProviderVerification": "boolean",  // Default: true
    "defaultCommissionRate": "number",  // Default: 10, min: 0, max: 100
    "notificationPreferences": {
      "email": {
        "newBookings": "boolean",
        "providerUpdates": "boolean",
        "paymentUpdates": "boolean"
      },
      "sms": {
        "newBookings": "boolean",
        "urgentUpdates": "boolean"
      }
    }
  }
}
```

### 4.2 Update Agency Form

**Endpoint:** `PUT /api/agencies/:id`  
**Authentication:** Required  
**Description:** User must be owner, admin, or provider of agency

**Form Fields:** Same as creation form (all fields optional)

### 4.3 Upload Agency Logo

**Endpoint:** `POST /api/agencies/:id/logo`  
**Authentication:** Required  
**Content-Type:** `multipart/form-data`

**Form Fields:**
- `logo`: `File` (single file)

### 4.4 Add Provider to Agency

**Endpoint:** `POST /api/agencies/:id/providers`  
**Authentication:** Required  
**Role:** Agency owner or admin

```json
{
  "userId": "ObjectId",  // Required
  "commissionRate": "number"  // Optional, default: 10
}
```

### 4.5 Update Provider Status in Agency

**Endpoint:** `PUT /api/agencies/:id/providers/:providerId/status`  
**Authentication:** Required  
**Role:** Agency owner or admin

```json
{
  "status": "active" | "inactive" | "suspended" | "pending"  // Required
}
```

### 4.6 Add Admin to Agency

**Endpoint:** `POST /api/agencies/:id/admins`  
**Authentication:** Required  
**Role:** Agency owner

```json
{
  "userId": "ObjectId",  // Required
  "role": "admin" | "manager" | "supervisor",  // Optional, default: "admin"
  "permissions": ["string"]  // Optional
}
```

### 4.7 Update Agency Verification

**Endpoint:** `PATCH /api/agencies/:id/verification`  
**Authentication:** Required

```json
{
  "isVerified": "boolean",
  "documents": [{
    "type": "business_license" | "insurance_certificate" | "tax_certificate" | "other",
    "url": "string",
    "publicId": "string",
    "filename": "string"
  }]
}
```

### 4.8 Join Agency

**Endpoint:** `POST /api/agencies/join`  
**Authentication:** Required

```json
{
  "agencyId": "ObjectId"  // Required
}
```

### 4.9 Leave Agency

**Endpoint:** `POST /api/agencies/leave`  
**Authentication:** Required

```json
{
  "agencyId": "ObjectId"  // Required
}
```

---

## 5. Instructor/Course Forms

### 5.1 Create Course Form

**Endpoint:** `POST /api/academy/courses`  
**Authentication:** Required  
**Role:** `instructor` or `admin`

#### Form Fields:

```json
{
  "title": "string",  // Required
  "description": "string",  // Required
  "category": "ObjectId",  // Required, AcademyCategory ID
  "partner": {  // Optional
    "name": "string",
    "logo": "string",
    "website": "string"
  },
  "level": "beginner" | "intermediate" | "advanced" | "expert",  // Required
  "duration": {
    "hours": "number",  // Required
    "weeks": "number"
  },
  "pricing": {
    "regularPrice": "number",  // Required
    "discountedPrice": "number",
    "currency": "string"  // Default: "USD"
  },
  "curriculum": [{
    "module": "string",  // Required
    "lessons": [{
      "title": "string",
      "description": "string",
      "duration": "number",  // in minutes
      "type": "video" | "text" | "quiz" | "practical",  // Default: "video"
      "content": {
        "url": "string",
        "publicId": "string",
        "type": "string"  // 'video', 'document', 'image', 'text'
      },
      "isFree": "boolean"  // Default: false
    }]
  }],
  "prerequisites": ["string"],
  "learningOutcomes": ["string"],
  "certification": {
    "isAvailable": "boolean",  // Default: false
    "name": "string",
    "issuer": "string",
    "validity": "number",  // in months
    "requirements": ["string"]
  },
  "enrollment": {
    "maxCapacity": "number",
    "isOpen": "boolean"  // Default: true
  },
  "schedule": {
    "startDate": "Date",
    "endDate": "Date",
    "sessions": [{
      "date": "Date",
      "startTime": "string",
      "endTime": "string",
      "type": "live" | "recorded" | "practical",  // Default: "live"
    }]
  },
  "tags": ["string"],
  "isActive": "boolean"  // Default: true
}
```

### 5.2 Update Course Form

**Endpoint:** `PUT /api/academy/courses/:id`  
**Authentication:** Required  
**Role:** `instructor` or `admin`  
**Description:** Supports partial updates

**Form Fields:** Same as creation form (all fields optional)

### 5.3 Upload Course Thumbnail

**Endpoint:** `POST /api/academy/courses/:id/thumbnail`  
**Authentication:** Required  
**Role:** `instructor` or `admin`  
**Content-Type:** `multipart/form-data`

**Form Fields:**
- `thumbnail` or `image` or `file`: `File` (single file)

### 5.4 Upload Course Video

**Endpoint:** `POST /api/academy/courses/:id/videos`  
**Authentication:** Required  
**Role:** `instructor` or `admin`  
**Content-Type:** `multipart/form-data`

**Form Fields:**
- `video`: `File` (single file)

### 5.5 Enroll in Course

**Endpoint:** `POST /api/academy/courses/:id/enroll`  
**Authentication:** Required

**Form Fields:** No body required (uses authenticated user)

### 5.6 Update Course Progress

**Endpoint:** `PUT /api/academy/courses/:id/progress`  
**Authentication:** Required

```json
{
  "lessonId": "string",  // Required
  "completed": "boolean"  // Optional
}
```

### 5.7 Add Course Review

**Endpoint:** `POST /api/academy/courses/:id/reviews`  
**Authentication:** Required

```json
{
  "rating": "number",  // Required, min: 1, max: 5
  "comment": "string"
}
```

### 5.8 Favorite/Unfavorite Course

**Endpoints:**
- `POST /api/academy/courses/:id/favorite` - Add to favorites
- `DELETE /api/academy/courses/:id/favorite` - Remove from favorites

**Authentication:** Required

**Form Fields:** No body required

### 5.9 Create Course Category

**Endpoint:** `POST /api/academy/categories`  
**Authentication:** Required  
**Role:** `admin` or `instructor`

```json
{
  "name": "string",  // Required, unique
  "description": "string",
  "isActive": "boolean"  // Default: true
}
```

### 5.10 Create Certification

**Endpoint:** `POST /api/academy/certifications`  
**Authentication:** Required  
**Role:** `admin` or `instructor`

```json
{
  "name": "string",  // Required
  "description": "string",  // Required
  "issuer": "string",  // Required
  "category": "string",  // Required
  "requirements": [{
    "type": "course_completion" | "exam" | "practical" | "experience",  // Required
    "description": "string",
    "value": "string"  // e.g., "80%" for exam, "2 years" for experience
  }],
  "validity": {
    "duration": "number",  // in months
    "renewable": "boolean"  // Default: true
  },
  "exam": {
    "isRequired": "boolean",  // Default: true
    "duration": "number",  // in minutes
    "passingScore": "number",  // percentage
    "questions": [{
      "question": "string",
      "options": ["string"],
      "correctAnswer": "number",
      "explanation": "string"
    }]
  },
  "isActive": "boolean"  // Default: true
}
```

---

## 6. Client/User Forms

### 6.1 User Registration Form

**Endpoint:** `POST /api/auth/register`  
**Authentication:** Not required

```json
{
  "phoneNumber": "string",  // Required, unique
  "email": "string",  // Optional, unique if provided
  "password": "string",  // Required
  "firstName": "string",
  "lastName": "string",
  "gender": "male" | "female" | "other" | "prefer_not_to_say",
  "birthdate": "Date"
}
```

### 6.2 Update User Profile Form

**Endpoint:** `PUT /api/auth/profile`  
**Authentication:** Required

```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",  // Must be unique if changed
  "gender": "male" | "female" | "other" | "prefer_not_to_say",
  "birthdate": "Date",
  "profile": {
    "avatar": {
      "url": "string",
      "publicId": "string",
      "thumbnail": "string"
    },
    "bio": "string",
    "address": {
      "street": "string",
      "city": "string",
      "state": "string",
      "zipCode": "string",
      "country": "string",
      "coordinates": {
        "lat": "number",
        "lng": "number"
      }
    }
  }
}
```

### 6.3 Upload User Avatar

**Endpoint:** `POST /api/auth/avatar`  
**Authentication:** Required  
**Content-Type:** `multipart/form-data`

**Form Fields:**
- `avatar`: `File` (single file, image)

### 6.4 Update User Settings

**Endpoint:** `PUT /api/settings`  
**Authentication:** Required

```json
{
  "notifications": {
    "email": {
      "jobAlerts": "boolean",
      "messages": "boolean",
      "reviews": "boolean",
      "payments": "boolean",
      "marketing": "boolean",
      "referralUpdates": "boolean"
    },
    "sms": {
      "jobAlerts": "boolean",
      "urgentUpdates": "boolean",
      "verification": "boolean"
    },
    "push": {
      "jobAlerts": "boolean",
      "messages": "boolean",
      "reviews": "boolean"
    }
  },
  "privacy": {
    "profileVisibility": "public" | "private" | "friends_only",
    "showEmail": "boolean",
    "showPhone": "boolean",
    "showLocation": "boolean"
  },
  "preferences": {
    "language": "string",
    "timezone": "string",
    "currency": "string",
    "theme": "light" | "dark" | "auto"
  }
}
```

---

## Summary of All Endpoints by Entity

### Provider Endpoints
- `POST /api/providers/profile` - Create provider profile
- `PUT /api/providers/profile` - Update provider profile
- `GET /api/providers/profile/me` - Get my provider profile
- `PUT /api/providers/onboarding/step` - Update onboarding step
- `POST /api/providers/documents/upload` - Upload documents
- `GET /api/providers` - Get all providers (public)
- `GET /api/providers/:id` - Get provider by ID (public)
- `GET /api/providers/skills` - Get provider skills (public)

### Supplier Endpoints
- `POST /api/supplies` - Create supply/product
- `PUT /api/supplies/:id` - Update supply/product
- `GET /api/supplies` - Get all supplies (public)
- `GET /api/supplies/:id` - Get supply by ID (public)
- `POST /api/supplies/:id/images` - Upload supply images
- `DELETE /api/supplies/:id/images/:imageId` - Delete supply image
- `POST /api/supplies/:id/order` - Order supply
- `PUT /api/supplies/:id/orders/:orderId/status` - Update order status
- `POST /api/supplies/:id/reviews` - Add review
- `GET /api/supplies/my-supplies` - Get my supplies
- `GET /api/supplies/my-orders` - Get my orders
- `GET /api/supplies/categories` - Get categories (public)
- `GET /api/supplies/featured` - Get featured supplies (public)
- `GET /api/supplies/nearby` - Get nearby supplies (public)
- `POST /api/supplies/generate-description` - Generate description (AI)

### Partner Endpoints
- `POST /api/partners/onboarding/start` - Start onboarding (public)
- `PUT /api/partners/:id/business-info` - Update business info (public)
- `PUT /api/partners/:id/verification` - Complete verification (public)
- `PUT /api/partners/:id/api-setup` - Complete API setup (public)
- `PUT /api/partners/:id/activate` - Activate partner (public)
- `POST /api/partners` - Create partner (admin)
- `GET /api/partners` - Get all partners (admin)
- `GET /api/partners/:id` - Get partner by ID (admin)
- `PUT /api/partners/:id` - Update partner (admin)
- `DELETE /api/partners/:id` - Delete partner (admin)
- `POST /api/partners/:id/notes` - Add note (admin)
- `GET /api/partners/slug/:slug` - Get partner by slug (public)

### Agency Endpoints
- `POST /api/agencies` - Create agency
- `GET /api/agencies` - Get all agencies (public)
- `GET /api/agencies/:id` - Get agency by ID (public)
- `PUT /api/agencies/:id` - Update agency
- `DELETE /api/agencies/:id` - Delete agency
- `POST /api/agencies/:id/logo` - Upload logo
- `POST /api/agencies/:id/providers` - Add provider
- `DELETE /api/agencies/:id/providers/:providerId` - Remove provider
- `PUT /api/agencies/:id/providers/:providerId/status` - Update provider status
- `POST /api/agencies/:id/admins` - Add admin
- `DELETE /api/agencies/:id/admins/:adminId` - Remove admin
- `GET /api/agencies/:id/analytics` - Get analytics
- `GET /api/agencies/my/agencies` - Get my agencies
- `POST /api/agencies/join` - Join agency
- `POST /api/agencies/leave` - Leave agency
- `PATCH /api/agencies/:id/verification` - Update verification

### Instructor/Course Endpoints
- `POST /api/academy/courses` - Create course
- `GET /api/academy/courses` - Get all courses (public)
- `GET /api/academy/courses/:id` - Get course by ID (public)
- `PUT /api/academy/courses/:id` - Update course
- `DELETE /api/academy/courses/:id` - Delete course
- `POST /api/academy/courses/:id/thumbnail` - Upload thumbnail
- `POST /api/academy/courses/:id/videos` - Upload video
- `DELETE /api/academy/courses/:id/videos/:videoId` - Delete video
- `POST /api/academy/courses/:id/enroll` - Enroll in course
- `PUT /api/academy/courses/:id/progress` - Update progress
- `POST /api/academy/courses/:id/reviews` - Add review
- `POST /api/academy/courses/:id/favorite` - Favorite course
- `DELETE /api/academy/courses/:id/favorite` - Unfavorite course
- `GET /api/academy/my-courses` - Get my courses
- `GET /api/academy/my-created-courses` - Get my created courses
- `GET /api/academy/my-favorite-courses` - Get my favorite courses
- `GET /api/academy/categories` - Get categories (public)
- `POST /api/academy/categories` - Create category
- `PUT /api/academy/categories/:id` - Update category
- `DELETE /api/academy/categories/:id` - Delete category
- `GET /api/academy/certifications` - Get certifications (public)
- `POST /api/academy/certifications` - Create certification
- `PUT /api/academy/certifications/:id` - Update certification
- `DELETE /api/academy/certifications/:id` - Delete certification
- `GET /api/academy/enrollments` - Get enrollments (admin/instructor)
- `PUT /api/academy/enrollments/:id/status` - Update enrollment status
- `DELETE /api/academy/enrollments/:id` - Delete enrollment (admin)
- `GET /api/academy/featured` - Get featured courses (public)
- `GET /api/academy/statistics` - Get statistics (admin)

### Client/User Endpoints
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `PUT /api/auth/profile` - Update profile
- `GET /api/auth/profile` - Get profile
- `POST /api/auth/avatar` - Upload avatar
- `GET /api/auth/profile-completeness` - Get profile completeness
- `PUT /api/settings` - Update settings
- `GET /api/settings` - Get settings

---

## Notes

1. **Authentication:** Most endpoints require authentication via Bearer token in Authorization header
2. **Role-based Access:** Some endpoints require specific roles (e.g., `supplier`, `instructor`, `admin`)
3. **File Uploads:** Use `multipart/form-data` content type for file uploads
4. **Validation:** All endpoints have validation middleware - check route files for specific validation rules
5. **Partial Updates:** Update endpoints support partial updates - only include fields you want to change
6. **Public Endpoints:** Some GET endpoints are public and don't require authentication
7. **ObjectId Format:** All IDs must be valid MongoDB ObjectIds (24 character hex string)

---

## Form Submission Examples

### Example 1: Create Provider Profile
```bash
POST /api/providers/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "providerType": "individual",
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

### Example 2: Create Supply Product
```bash
POST /api/supplies
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Professional Cleaning Solution",
  "title": "Heavy-Duty Cleaning Solution",
  "description": "Professional grade cleaning solution for commercial use",
  "category": "cleaning_supplies",
  "subcategory": "cleaning_chemicals",
  "brand": "ProClean",
  "sku": "PC-HD-001",
  "pricing": {
    "retailPrice": 29.99,
    "wholesalePrice": 24.99,
    "currency": "USD"
  },
  "inventory": {
    "quantity": 100,
    "minStock": 20
  }
}
```

### Example 3: Upload Provider Documents
```bash
POST /api/providers/documents/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

documentType: insurance
documents: <file1.pdf>, <file2.pdf>
```

---

This document provides a complete reference for all form entities and their submission endpoints in the LocalPro Super App.
