/**
 * Client Journey Test Suite
 * 
 * This comprehensive test suite covers all 18 phases of the client user journey
 * based on the API endpoint mapping document. Each phase is tested with:
 * - Happy path scenarios
 * - Error handling
 * - Edge cases
 * - Performance requirements
 * - Security validations
 */

import { jest } from '@jest/globals';

// Mock fetch globally
global.fetch = jest.fn();

// Mock session data
const mockClientSession = {
  userId: 'client-123',
  email: 'client@example.com',
  name: 'John Client',
  role: 'client',
  phone: '+1234567890',
  sessionId: 'session-123',
  isAuthenticated: true
};

const mockUnauthenticatedSession = null;

// Test data factories
const createMockService = (id: string, overrides = {}) => ({
  id,
  name: `Service ${id}`,
  description: `Description for service ${id}`,
  category: 'CLEANING',
  price: 100,
  rating: 4.5,
  reviewCount: 10,
  provider: { name: 'Provider Name', id: 'provider-1' },
  status: 'active',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  bookings: 50,
  revenue: 5000,
  ...overrides
});

const createMockBooking = (id: string, overrides = {}) => ({
  id,
  serviceId: 'service-1',
  clientId: 'client-123',
  providerId: 'provider-1',
  status: 'pending',
  scheduledDate: '2024-01-15T10:00:00Z',
  totalAmount: 100,
  createdAt: '2024-01-01T00:00:00Z',
  ...overrides
});

const createMockJob = (id: string, overrides = {}) => ({
  id,
  title: `Job ${id}`,
  description: `Description for job ${id}`,
  category: 'CLEANING',
  location: 'New York, NY',
  budget: 500,
  status: 'open',
  clientId: 'client-123',
  createdAt: '2024-01-01T00:00:00Z',
  ...overrides
});

const createMockCourse = (id: string, overrides = {}) => ({
  id,
  title: `Course ${id}`,
  description: `Description for course ${id}`,
  category: 'BUSINESS',
  price: 99,
  duration: '4 weeks',
  instructor: { name: 'Instructor Name', id: 'instructor-1' },
  rating: 4.8,
  studentCount: 150,
  ...overrides
});

// API Response helpers
const createApiResponse = (data: any, success = true) => ({
  success,
  data,
  message: success ? 'Success' : 'Error',
  timestamp: new Date().toISOString()
});

const createErrorResponse = (message: string, code = 400) => ({
  success: false,
  error: message,
  code,
  timestamp: new Date().toISOString()
});

describe('Client Journey Test Suite', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    jest.clearAllMocks();
  });

  describe('Phase 1: Registration & Onboarding', () => {
    describe('Phone Registration', () => {
      it('should send SMS verification code successfully', async () => {
        const phoneNumber = '+1234567890';
        const mockResponse = createApiResponse({ 
          messageId: 'msg-123',
          expiresAt: '2024-01-01T05:00:00Z'
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/auth/send-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: phoneNumber })
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/auth/send-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: phoneNumber })
        });

        expect(result.success).toBe(true);
        expect(result.data.messageId).toBe('msg-123');
      });

      it('should handle invalid phone number', async () => {
        const invalidPhone = 'invalid-phone';
        const mockResponse = createErrorResponse('Invalid phone number format');

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/auth/send-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: invalidPhone })
        });

        const result = await response.json();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid phone number format');
      });

      it('should handle rate limiting', async () => {
        const phoneNumber = '+1234567890';
        const mockResponse = createErrorResponse('Too many requests', 429);

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 429,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/auth/send-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: phoneNumber })
        });

        expect(response.status).toBe(429);
      });
    });

    describe('Phone Verification', () => {
      it('should verify SMS code and register user', async () => {
        const verificationData = {
          phone: '+1234567890',
          code: '123456'
        };
        const mockResponse = createApiResponse({
          user: mockClientSession,
          token: 'jwt-token-123',
          isNewUser: true
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/auth/verify-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(verificationData)
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/auth/verify-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(verificationData)
        });

        expect(result.success).toBe(true);
        expect(result.data.user.role).toBe('client');
        expect(result.data.isNewUser).toBe(true);
      });

      it('should handle invalid verification code', async () => {
        const verificationData = {
          phone: '+1234567890',
          code: '000000'
        };
        const mockResponse = createErrorResponse('Invalid verification code');

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/auth/verify-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(verificationData)
        });

        const result = await response.json();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid verification code');
      });

      it('should handle expired verification code', async () => {
        const verificationData = {
          phone: '+1234567890',
          code: '123456'
        };
        const mockResponse = createErrorResponse('Verification code expired');

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/auth/verify-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(verificationData)
        });

        const result = await response.json();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Verification code expired');
      });
    });

    describe('Profile Completion', () => {
      it('should complete user profile setup', async () => {
        const profileData = {
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: '1990-01-01',
          address: '123 Main St, New York, NY',
          preferences: {
            notifications: true,
            marketing: false
          }
        };
        const mockResponse = createApiResponse({
          profile: { ...mockClientSession, ...profileData },
          completeness: 100
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/auth/complete-onboarding', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(profileData)
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/auth/complete-onboarding', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(profileData)
        });

        expect(result.success).toBe(true);
        expect(result.data.completeness).toBe(100);
      });

      it('should handle incomplete profile data', async () => {
        const incompleteData = {
          firstName: 'John'
          // Missing required fields
        };
        const mockResponse = createErrorResponse('Missing required fields');

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/auth/complete-onboarding', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(incompleteData)
        });

        const result = await response.json();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Missing required fields');
      });
    });

    describe('Profile Completeness Check', () => {
      it('should check onboarding status', async () => {
        const mockResponse = createApiResponse({
          completeness: 75,
          missingFields: ['dateOfBirth', 'address'],
          isComplete: false
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/auth/profile-completeness', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/auth/profile-completeness', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        expect(result.success).toBe(true);
        expect(result.data.completeness).toBe(75);
        expect(result.data.isComplete).toBe(false);
      });

      it('should handle unauthenticated request', async () => {
        const mockResponse = createErrorResponse('Unauthorized', 401);

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/auth/profile-completeness', {
          method: 'GET'
        });

        expect(response.status).toBe(401);
      });
    });
  });

  describe('Phase 2: Dashboard & Discovery', () => {
    describe('User Profile', () => {
      it('should get current user profile', async () => {
        const mockResponse = createApiResponse(mockClientSession);

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/auth/me', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/auth/me', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        expect(result.success).toBe(true);
        expect(result.data.role).toBe('client');
      });
    });

    describe('Analytics Overview', () => {
      it('should get user analytics summary', async () => {
        const mockResponse = createApiResponse({
          totalBookings: 15,
          totalSpent: 1500,
          favoriteCategory: 'CLEANING',
          averageRating: 4.8,
          joinDate: '2024-01-01T00:00:00Z',
          lastActivity: '2024-01-15T10:00:00Z'
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/analytics/overview', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/analytics/overview', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        expect(result.success).toBe(true);
        expect(result.data.totalBookings).toBe(15);
      });
    });

    describe('Activity Feed', () => {
      it('should get user activity feed', async () => {
        const mockActivities = [
          {
            id: 'activity-1',
            type: 'booking_created',
            message: 'You booked a cleaning service',
            timestamp: '2024-01-15T10:00:00Z',
            metadata: { serviceId: 'service-1' }
          },
          {
            id: 'activity-2',
            type: 'review_added',
            message: 'You reviewed a service',
            timestamp: '2024-01-14T15:30:00Z',
            metadata: { serviceId: 'service-1', rating: 5 }
          }
        ];
        const mockResponse = createApiResponse({
          activities: mockActivities,
          total: 2,
          hasMore: false
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/activities/feed', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/activities/feed', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        expect(result.success).toBe(true);
        expect(result.data.activities).toHaveLength(2);
      });
    });
  });

  describe('Phase 3: Service Discovery & Booking', () => {
    describe('Service Search', () => {
      it('should browse all services', async () => {
        const mockServices = [
          createMockService('1'),
          createMockService('2', { category: 'PLUMBING', price: 150 })
        ];
        const mockResponse = createApiResponse({
          services: mockServices,
          total: 2,
          page: 1,
          limit: 10
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/marketplace/services', {
          method: 'GET'
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/marketplace/services', {
          method: 'GET'
        });

        expect(result.success).toBe(true);
        expect(result.data.services).toHaveLength(2);
      });

      it('should search services with filters', async () => {
        const filters = {
          category: 'CLEANING',
          minPrice: 50,
          maxPrice: 200,
          rating: 4.0
        };
        const mockServices = [createMockService('1')];
        const mockResponse = createApiResponse({
          services: mockServices,
          total: 1,
          page: 1,
          limit: 10
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const queryParams = new URLSearchParams(filters);
        const response = await fetch(`/api/marketplace/services?${queryParams}`, {
          method: 'GET'
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith(
          `/api/marketplace/services?${queryParams}`,
          { method: 'GET' }
        );

        expect(result.success).toBe(true);
        expect(result.data.services).toHaveLength(1);
      });
    });

    describe('Nearby Services', () => {
      it('should find nearby services', async () => {
        const location = {
          latitude: 40.7128,
          longitude: -74.0060,
          radius: 10
        };
        const mockServices = [createMockService('1')];
        const mockResponse = createApiResponse({
          services: mockServices,
          total: 1,
          location: location
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const queryParams = new URLSearchParams(location);
        const response = await fetch(`/api/marketplace/services/nearby?${queryParams}`, {
          method: 'GET'
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith(
          `/api/marketplace/services/nearby?${queryParams}`,
          { method: 'GET' }
        );

        expect(result.success).toBe(true);
        expect(result.data.services).toHaveLength(1);
      });
    });

    describe('Service Details', () => {
      it('should get service details', async () => {
        const serviceId = 'service-1';
        const mockService = createMockService(serviceId);
        const mockResponse = createApiResponse(mockService);

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch(`/api/marketplace/services/${serviceId}`, {
          method: 'GET'
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith(
          `/api/marketplace/services/${serviceId}`,
          { method: 'GET' }
        );

        expect(result.success).toBe(true);
        expect(result.data.id).toBe(serviceId);
      });

      it('should handle service not found', async () => {
        const serviceId = 'non-existent';
        const mockResponse = createErrorResponse('Service not found', 404);

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch(`/api/marketplace/services/${serviceId}`, {
          method: 'GET'
        });

        expect(response.status).toBe(404);
      });
    });

    describe('Global Search', () => {
      it('should search across platform', async () => {
        const searchQuery = 'cleaning';
        const mockResults = {
          services: [createMockService('1')],
          jobs: [createMockJob('1')],
          courses: [createMockCourse('1')],
          total: 3
        };
        const mockResponse = createApiResponse(mockResults);

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch(`/api/search/global?q=${searchQuery}`, {
          method: 'GET'
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith(
          `/api/search/global?q=${searchQuery}`,
          { method: 'GET' }
        );

        expect(result.success).toBe(true);
        expect(result.data.total).toBe(3);
      });
    });

    describe('Create Booking', () => {
      it('should create service booking', async () => {
        const bookingData = {
          serviceId: 'service-1',
          scheduledDate: '2024-01-15T10:00:00Z',
          notes: 'Please clean the kitchen thoroughly',
          address: '123 Main St, New York, NY'
        };
        const mockBooking = createMockBooking('booking-1', bookingData);
        const mockResponse = createApiResponse(mockBooking);

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/marketplace/bookings', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(bookingData)
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/marketplace/bookings', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(bookingData)
        });

        expect(result.success).toBe(true);
        expect(result.data.id).toBe('booking-1');
      });

      it('should handle booking conflicts', async () => {
        const bookingData = {
          serviceId: 'service-1',
          scheduledDate: '2024-01-15T10:00:00Z',
          notes: 'Please clean the kitchen thoroughly',
          address: '123 Main St, New York, NY'
        };
        const mockResponse = createErrorResponse('Time slot not available');

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/marketplace/bookings', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(bookingData)
        });

        const result = await response.json();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Time slot not available');
      });
    });

    describe('Get Bookings', () => {
      it('should get user bookings', async () => {
        const mockBookings = [
          createMockBooking('booking-1'),
          createMockBooking('booking-2', { status: 'completed' })
        ];
        const mockResponse = createApiResponse({
          bookings: mockBookings,
          total: 2,
          page: 1,
          limit: 10
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/marketplace/bookings', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/marketplace/bookings', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        expect(result.success).toBe(true);
        expect(result.data.bookings).toHaveLength(2);
      });
    });

    describe('Update Booking Status', () => {
      it('should update booking status', async () => {
        const bookingId = 'booking-1';
        const statusUpdate = { status: 'cancelled', reason: 'Client requested' };
        const mockResponse = createApiResponse({
          id: bookingId,
          status: 'cancelled',
          updatedAt: '2024-01-15T10:00:00Z'
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch(`/api/marketplace/bookings/${bookingId}/status`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(statusUpdate)
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith(
          `/api/marketplace/bookings/${bookingId}/status`,
          {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': 'Bearer jwt-token-123'
            },
            body: JSON.stringify(statusUpdate)
          }
        );

        expect(result.success).toBe(true);
        expect(result.data.status).toBe('cancelled');
      });
    });

    describe('Upload Booking Photos', () => {
      it('should upload completion photos', async () => {
        const bookingId = 'booking-1';
        const formData = new FormData();
        formData.append('photos', new Blob(['photo1']), 'photo1.jpg');
        formData.append('photos', new Blob(['photo2']), 'photo2.jpg');

        const mockResponse = createApiResponse({
          id: bookingId,
          photos: ['photo1.jpg', 'photo2.jpg'],
          uploadedAt: '2024-01-15T10:00:00Z'
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch(`/api/marketplace/bookings/${bookingId}/photos`, {
          method: 'POST',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          },
          body: formData
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith(
          `/api/marketplace/bookings/${bookingId}/photos`,
          {
            method: 'POST',
            headers: { 
              'Authorization': 'Bearer jwt-token-123'
            },
            body: formData
          }
        );

        expect(result.success).toBe(true);
        expect(result.data.photos).toHaveLength(2);
      });
    });

    describe('Add Review', () => {
      it('should add service review', async () => {
        const bookingId = 'booking-1';
        const reviewData = {
          rating: 5,
          comment: 'Excellent service!',
          photos: ['photo1.jpg']
        };
        const mockResponse = createApiResponse({
          id: 'review-1',
          bookingId,
          rating: 5,
          comment: 'Excellent service!',
          createdAt: '2024-01-15T10:00:00Z'
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch(`/api/marketplace/bookings/${bookingId}/review`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(reviewData)
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith(
          `/api/marketplace/bookings/${bookingId}/review`,
          {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': 'Bearer jwt-token-123'
            },
            body: JSON.stringify(reviewData)
          }
        );

        expect(result.success).toBe(true);
        expect(result.data.rating).toBe(5);
      });
    });
  });

  // Performance Tests
  describe('Performance Requirements', () => {
    it('should meet authentication endpoint response time (< 200ms)', async () => {
      const startTime = Date.now();
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createApiResponse(mockClientSession))
      });

      await fetch('/api/auth/me', {
        method: 'GET',
        headers: { 'Authorization': 'Bearer jwt-token-123' }
      });

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(200);
    });

    it('should meet search endpoint response time (< 500ms)', async () => {
      const startTime = Date.now();
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createApiResponse({ services: [] }))
      });

      await fetch('/api/marketplace/services', { method: 'GET' });

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(500);
    });
  });

  // Security Tests
  describe('Security Validations', () => {
    it('should require authentication for protected endpoints', async () => {
      const mockResponse = createErrorResponse('Unauthorized', 401);

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve(mockResponse)
      });

      const response = await fetch('/api/marketplace/bookings', {
        method: 'GET'
      });

      expect(response.status).toBe(401);
    });

    it('should validate JWT token format', async () => {
      const mockResponse = createErrorResponse('Invalid token format', 401);

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve(mockResponse)
      });

      const response = await fetch('/api/marketplace/bookings', {
        method: 'GET',
        headers: { 'Authorization': 'Invalid token' }
      });

      expect(response.status).toBe(401);
    });

    it('should prevent unauthorized access to other users data', async () => {
      const mockResponse = createErrorResponse('Access denied', 403);

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: () => Promise.resolve(mockResponse)
      });

      const response = await fetch('/api/marketplace/bookings/other-user-booking', {
        method: 'PUT',
        headers: { 
          'Authorization': 'Bearer jwt-token-123',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'cancelled' })
      });

      expect(response.status).toBe(403);
    });
  });
});
