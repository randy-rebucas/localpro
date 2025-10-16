// API configuration
export const API_BASE_URL = "https://localpro-super-app.onrender.com";

// Helper function to make API requests
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// API endpoints
export const API_ENDPOINTS = {
  // Authentication
  sendCode: "/api/auth/send-code",
  verifyCode: "/api/auth/verify-code",
  me: "/api/auth/me",
  profile: "/api/auth/profile",
  uploadAvatar: "/api/auth/upload-avatar",
  uploadPortfolio: "/api/auth/upload-portfolio",
  logout: "/api/auth/logout",
  
  // Marketplace - Client Side Only
  marketplaceServices: "/api/marketplace/services",
  marketplaceServicesNearby: "/api/marketplace/services/nearby",
  marketplaceServiceById: "/api/marketplace/services",
  marketplaceBookings: "/api/marketplace/bookings",
  marketplaceBookingStatus: "/api/marketplace/bookings",
  marketplaceBookingPhotos: "/api/marketplace/bookings",
  marketplaceBookingReview: "/api/marketplace/bookings",
  marketplacePayPalApprove: "/api/marketplace/bookings/paypal/approve",
  marketplacePayPalOrder: "/api/marketplace/bookings/paypal/order",
  
  // Supplies
  suppliesProducts: "/api/supplies/products",
  suppliesOrders: "/api/supplies/orders",
  
  // Academy
  academyCourses: "/api/academy/courses",
  academyEnrollments: "/api/academy/enrollments",
  
  // Rentals
  rentalItems: "/api/rentals/items",
  rentals: "/api/rentals/rentals",
  
  // Finance
  loans: "/api/finance/loans",
  salaryAdvances: "/api/finance/salary-advances",
  
  // LocalPro Plus
  subscriptions: "/api/plus/subscriptions",
  
  // Facility
  facilityContracts: "/api/facility/contracts",
  
  // Advertising
  advertisements: "/api/ads/advertisements",
} as const;
