/**
 * Type Verification Utility
 * 
 * This utility helps verify that TypeScript types match the data entities
 * defined in the features directory. It provides functions to check type
 * completeness and alignment.
 */

import { Service } from "@/types/services";
import { Booking } from "@/types/bookings";
import { Product } from "@/types/supplies";
import { RentalItem } from "@/types/rentals";
import { Course } from "@/types/courses";
import { Job } from "@/types/jobs";

/**
 * Verifies that a Service type matches the expected data entity structure
 */
export function verifyServiceType(service: Partial<Service>): {
  valid: boolean;
  missing: string[];
  extra: string[];
} {
  const requiredFields = [
    "title",
    "description",
    "category",
    "subcategory",
    "provider",
    "pricing",
    "serviceArea",
  ];

  const optionalFields = [
    "availability",
    "images",
    "features",
    "requirements",
    "serviceType",
    "estimatedDuration",
    "teamSize",
    "equipmentProvided",
    "materialsIncluded",
    "warranty",
    "insurance",
    "emergencyService",
    "servicePackages",
    "addOns",
    "isActive",
    "rating",
    "createdAt",
    "updatedAt",
  ];

  const allFields = [...requiredFields, ...optionalFields];
  const serviceKeys = Object.keys(service);
  
  const missing = requiredFields.filter(field => !(field in service));
  const extra = serviceKeys.filter(key => !allFields.includes(key));

  return {
    valid: missing.length === 0,
    missing,
    extra,
  };
}

/**
 * Verifies that a Booking type matches the expected data entity structure
 */
export function verifyBookingType(booking: Partial<Booking>): {
  valid: boolean;
  missing: string[];
  extra: string[];
} {
  const requiredFields = [
    "service",
    "client",
    "provider",
    "bookingDate",
    "duration",
  ];

  const optionalFields = [
    "address",
    "specialInstructions",
    "status",
    "pricing",
    "payment",
    "review",
    "communication",
    "timeline",
    "documents",
    "beforePhotos",
    "afterPhotos",
    "completionNotes",
    "clientSatisfaction",
    "createdAt",
    "updatedAt",
  ];

  const allFields = [...requiredFields, ...optionalFields];
  const bookingKeys = Object.keys(booking);
  
  const missing = requiredFields.filter(field => !(field in booking));
  const extra = bookingKeys.filter(key => !allFields.includes(key));

  return {
    valid: missing.length === 0,
    missing,
    extra,
  };
}

/**
 * Verifies that a Product type matches the expected data entity structure
 */
export function verifyProductType(product: Partial<Product>): {
  valid: boolean;
  missing: string[];
  extra: string[];
} {
  const requiredFields = [
    "name",
    "title",
    "description",
    "category",
    "subcategory",
    "brand",
    "sku",
    "pricing",
    "inventory",
    "supplier",
  ];

  const optionalFields = [
    "specifications",
    "location",
    "images",
    "tags",
    "isActive",
    "isFeatured",
    "views",
    "isSubscriptionEligible",
    "orders",
    "reviews",
    "averageRating",
    "createdAt",
    "updatedAt",
  ];

  const allFields = [...requiredFields, ...optionalFields];
  const productKeys = Object.keys(product);
  
  const missing = requiredFields.filter(field => !(field in product));
  const extra = productKeys.filter(key => !allFields.includes(key));

  return {
    valid: missing.length === 0,
    missing,
    extra,
  };
}

/**
 * Verifies that a RentalItem type matches the expected data entity structure
 */
export function verifyRentalType(rental: Partial<RentalItem>): {
  valid: boolean;
  missing: string[];
  extra: string[];
} {
  const requiredFields = [
    "name",
    "title",
    "description",
    "category",
    "subcategory",
    "owner",
  ];

  const optionalFields = [
    "pricing",
    "availability",
    "location",
    "specifications",
    "requirements",
    "images",
    "documents",
    "maintenance",
    "rating",
    "isActive",
    "isFeatured",
    "views",
    "tags",
    "bookings",
    "reviews",
    "averageRating",
    "createdAt",
    "updatedAt",
  ];

  const allFields = [...requiredFields, ...optionalFields];
  const rentalKeys = Object.keys(rental);
  
  const missing = requiredFields.filter(field => !(field in rental));
  const extra = rentalKeys.filter(key => !allFields.includes(key));

  return {
    valid: missing.length === 0,
    missing,
    extra,
  };
}

/**
 * Verifies that a Course type matches the expected data entity structure
 */
export function verifyCourseType(course: Partial<Course>): {
  valid: boolean;
  missing: string[];
  extra: string[];
} {
  const requiredFields = [
    "title",
    "description",
    "category",
    "instructor",
    "level",
    "duration",
    "pricing",
  ];

  const optionalFields = [
    "partner",
    "curriculum",
    "prerequisites",
    "learningOutcomes",
    "certification",
    "enrollment",
    "schedule",
    "rating",
    "isActive",
    "thumbnail",
    "tags",
    "createdAt",
    "updatedAt",
  ];

  const allFields = [...requiredFields, ...optionalFields];
  const courseKeys = Object.keys(course);
  
  const missing = requiredFields.filter(field => !(field in course));
  const extra = courseKeys.filter(key => !allFields.includes(key));

  return {
    valid: missing.length === 0,
    missing,
    extra,
  };
}

/**
 * Verifies that a Job type matches the expected data entity structure
 */
export function verifyJobType(job: Partial<Job>): {
  valid: boolean;
  missing: string[];
  extra: string[];
} {
  const requiredFields = [
    "title",
    "description",
    "company",
    "employer",
    "category",
    "subcategory",
    "jobType",
    "experienceLevel",
  ];

  const optionalFields = [
    "salary",
    "benefits",
    "requirements",
    "responsibilities",
    "qualifications",
    "applicationProcess",
    "status",
    "visibility",
    "applications",
    "views",
    "analytics",
    "tags",
    "isActive",
    "featured",
    "promoted",
    "createdAt",
    "updatedAt",
  ];

  const allFields = [...requiredFields, ...optionalFields];
  const jobKeys = Object.keys(job);
  
  const missing = requiredFields.filter(field => !(field in job));
  const extra = jobKeys.filter(key => !allFields.includes(key));

  return {
    valid: missing.length === 0,
    missing,
    extra,
  };
}

/**
 * Generates a type verification report for all major types
 */
export function generateTypeVerificationReport() {
  const report = {
    services: verifyServiceType({} as Service),
    bookings: verifyBookingType({} as Booking),
    products: verifyProductType({} as Product),
    rentals: verifyRentalType({} as RentalItem),
    courses: verifyCourseType({} as Course),
    jobs: verifyJobType({} as Job),
  };

  return report;
}

