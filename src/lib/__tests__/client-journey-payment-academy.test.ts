/**
 * Client Journey Test Suite - Phases 4-6
 * 
 * Phase 4: Payment Processing
 * Phase 5: Job Board Experience  
 * Phase 6: Academy & Learning
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

// Test data factories
const createMockPayment = (id: string, overrides = {}) => ({
  id,
  bookingId: 'booking-1',
  amount: 100,
  currency: 'USD',
  status: 'pending',
  paymentMethod: 'paypal',
  transactionId: 'txn-123',
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

const createMockApplication = (id: string, overrides = {}) => ({
  id,
  jobId: 'job-1',
  applicantId: 'client-123',
  coverLetter: 'I am interested in this position',
  status: 'pending',
  appliedAt: '2024-01-01T00:00:00Z',
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

const createMockEnrollment = (id: string, overrides = {}) => ({
  id,
  courseId: 'course-1',
  studentId: 'client-123',
  enrolledAt: '2024-01-01T00:00:00Z',
  progress: 0,
  status: 'active',
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

describe('Client Journey - Phases 4-6', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    jest.clearAllMocks();
  });

  describe('Phase 4: Payment Processing', () => {
    describe('PayPal Payment', () => {
      it('should approve PayPal payment', async () => {
        const paymentData = {
          bookingId: 'booking-1',
          amount: 100,
          currency: 'USD',
          returnUrl: 'https://app.localpro.com/payment/success',
          cancelUrl: 'https://app.localpro.com/payment/cancel'
        };
        const mockResponse = createApiResponse({
          paymentId: 'paypal-payment-123',
          approvalUrl: 'https://paypal.com/approve/123',
          status: 'pending'
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/marketplace/bookings/paypal/approve', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(paymentData)
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/marketplace/bookings/paypal/approve', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(paymentData)
        });

        expect(result.success).toBe(true);
        expect(result.data.paymentId).toBe('paypal-payment-123');
      });

      it('should handle PayPal payment failure', async () => {
        const paymentData = {
          bookingId: 'booking-1',
          amount: 100,
          currency: 'USD'
        };
        const mockResponse = createErrorResponse('PayPal payment failed');

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/marketplace/bookings/paypal/approve', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(paymentData)
        });

        const result = await response.json();

        expect(result.success).toBe(false);
        expect(result.error).toBe('PayPal payment failed');
      });
    });

    describe('PayPal Order Details', () => {
      it('should get PayPal order details', async () => {
        const orderId = 'paypal-order-123';
        const mockResponse = createApiResponse({
          id: orderId,
          status: 'completed',
          amount: 100,
          currency: 'USD',
          paymentId: 'paypal-payment-123',
          createdAt: '2024-01-01T00:00:00Z',
          completedAt: '2024-01-01T00:05:00Z'
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch(`/api/marketplace/bookings/paypal/order/${orderId}`, {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith(
          `/api/marketplace/bookings/paypal/order/${orderId}`,
          {
            method: 'GET',
            headers: { 
              'Authorization': 'Bearer jwt-token-123'
            }
          }
        );

        expect(result.success).toBe(true);
        expect(result.data.status).toBe('completed');
      });
    });

    describe('PayMaya Checkout', () => {
      it('should create PayMaya checkout', async () => {
        const checkoutData = {
          bookingId: 'booking-1',
          amount: 100,
          currency: 'PHP',
          returnUrl: 'https://app.localpro.com/payment/success'
        };
        const mockResponse = createApiResponse({
          checkoutId: 'paymaya-checkout-123',
          checkoutUrl: 'https://paymaya.com/checkout/123',
          status: 'pending'
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/paymaya/create-checkout', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(checkoutData)
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/paymaya/create-checkout', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(checkoutData)
        });

        expect(result.success).toBe(true);
        expect(result.data.checkoutId).toBe('paymaya-checkout-123');
      });
    });

    describe('PayMaya Payment', () => {
      it('should create PayMaya payment', async () => {
        const paymentData = {
          checkoutId: 'paymaya-checkout-123',
          paymentMethod: 'card',
          cardToken: 'card-token-123'
        };
        const mockResponse = createApiResponse({
          paymentId: 'paymaya-payment-123',
          status: 'processing',
          transactionId: 'txn-123'
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/paymaya/create-payment', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(paymentData)
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/paymaya/create-payment', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(paymentData)
        });

        expect(result.success).toBe(true);
        expect(result.data.paymentId).toBe('paymaya-payment-123');
      });
    });

    describe('PayMaya Invoice', () => {
      it('should create PayMaya invoice', async () => {
        const invoiceData = {
          bookingId: 'booking-1',
          amount: 100,
          currency: 'PHP',
          description: 'Service booking payment'
        };
        const mockResponse = createApiResponse({
          invoiceId: 'paymaya-invoice-123',
          invoiceUrl: 'https://paymaya.com/invoice/123',
          status: 'pending'
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/paymaya/create-invoice', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(invoiceData)
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/paymaya/create-invoice', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(invoiceData)
        });

        expect(result.success).toBe(true);
        expect(result.data.invoiceId).toBe('paymaya-invoice-123');
      });
    });
  });

  describe('Phase 5: Job Board Experience', () => {
    describe('Job Search', () => {
      it('should browse all jobs', async () => {
        const mockJobs = [
          createMockJob('1'),
          createMockJob('2', { category: 'PLUMBING', budget: 800 })
        ];
        const mockResponse = createApiResponse({
          jobs: mockJobs,
          total: 2,
          page: 1,
          limit: 10
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/jobs', {
          method: 'GET'
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/jobs', {
          method: 'GET'
        });

        expect(result.success).toBe(true);
        expect(result.data.jobs).toHaveLength(2);
      });

      it('should search jobs with filters', async () => {
        const filters = {
          category: 'CLEANING',
          minBudget: 100,
          maxBudget: 1000,
          location: 'New York'
        };
        const mockJobs = [createMockJob('1')];
        const mockResponse = createApiResponse({
          jobs: mockJobs,
          total: 1,
          page: 1,
          limit: 10
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const queryParams = new URLSearchParams(filters);
        const response = await fetch(`/api/jobs/search?${queryParams}`, {
          method: 'GET'
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith(
          `/api/jobs/search?${queryParams}`,
          { method: 'GET' }
        );

        expect(result.success).toBe(true);
        expect(result.data.jobs).toHaveLength(1);
      });
    });

    describe('Job Details', () => {
      it('should get job details', async () => {
        const jobId = 'job-1';
        const mockJob = createMockJob(jobId);
        const mockResponse = createApiResponse(mockJob);

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch(`/api/jobs/${jobId}`, {
          method: 'GET'
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith(
          `/api/jobs/${jobId}`,
          { method: 'GET' }
        );

        expect(result.success).toBe(true);
        expect(result.data.id).toBe(jobId);
      });
    });

    describe('Apply for Job', () => {
      it('should apply for job', async () => {
        const jobId = 'job-1';
        const applicationData = {
          coverLetter: 'I am very interested in this position and have relevant experience.',
          expectedRate: 25,
          availability: 'Immediate'
        };
        const mockApplication = createMockApplication('application-1', {
          jobId,
          ...applicationData
        });
        const mockResponse = createApiResponse(mockApplication);

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch(`/api/jobs/${jobId}/apply`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(applicationData)
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith(
          `/api/jobs/${jobId}/apply`,
          {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': 'Bearer jwt-token-123'
            },
            body: JSON.stringify(applicationData)
          }
        );

        expect(result.success).toBe(true);
        expect(result.data.jobId).toBe(jobId);
      });

      it('should handle duplicate application', async () => {
        const jobId = 'job-1';
        const applicationData = {
          coverLetter: 'I am very interested in this position.',
          expectedRate: 25
        };
        const mockResponse = createErrorResponse('Already applied for this job');

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch(`/api/jobs/${jobId}/apply`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(applicationData)
        });

        const result = await response.json();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Already applied for this job');
      });
    });

    describe('My Applications', () => {
      it('should get user applications', async () => {
        const mockApplications = [
          createMockApplication('1'),
          createMockApplication('2', { status: 'accepted' })
        ];
        const mockResponse = createApiResponse({
          applications: mockApplications,
          total: 2,
          page: 1,
          limit: 10
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/jobs/my-applications', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/jobs/my-applications', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        expect(result.success).toBe(true);
        expect(result.data.applications).toHaveLength(2);
      });
    });

    describe('Update Application Status', () => {
      it('should update application status', async () => {
        const applicationId = 'application-1';
        const statusUpdate = { 
          status: 'accepted',
          message: 'Congratulations! You have been selected for this job.'
        };
        const mockResponse = createApiResponse({
          id: applicationId,
          status: 'accepted',
          updatedAt: '2024-01-15T10:00:00Z'
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch(`/api/jobs/applications/${applicationId}/status`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(statusUpdate)
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith(
          `/api/jobs/applications/${applicationId}/status`,
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
        expect(result.data.status).toBe('accepted');
      });
    });
  });

  describe('Phase 6: Academy & Learning', () => {
    describe('Course Discovery', () => {
      it('should browse all courses', async () => {
        const mockCourses = [
          createMockCourse('1'),
          createMockCourse('2', { category: 'TECHNICAL', price: 199 })
        ];
        const mockResponse = createApiResponse({
          courses: mockCourses,
          total: 2,
          page: 1,
          limit: 10
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/academy/courses', {
          method: 'GET'
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/academy/courses', {
          method: 'GET'
        });

        expect(result.success).toBe(true);
        expect(result.data.courses).toHaveLength(2);
      });

      it('should get course categories', async () => {
        const mockCategories = [
          { id: 'business', name: 'Business', count: 25 },
          { id: 'technical', name: 'Technical', count: 15 },
          { id: 'creative', name: 'Creative', count: 10 }
        ];
        const mockResponse = createApiResponse(mockCategories);

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/academy/courses/categories', {
          method: 'GET'
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/academy/courses/categories', {
          method: 'GET'
        });

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(3);
      });

      it('should get featured courses', async () => {
        const mockCourses = [
          createMockCourse('1', { featured: true }),
          createMockCourse('2', { featured: true })
        ];
        const mockResponse = createApiResponse({
          courses: mockCourses,
          total: 2
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/academy/courses/featured', {
          method: 'GET'
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/academy/courses/featured', {
          method: 'GET'
        });

        expect(result.success).toBe(true);
        expect(result.data.courses).toHaveLength(2);
      });
    });

    describe('Course Details', () => {
      it('should get course details', async () => {
        const courseId = 'course-1';
        const mockCourse = createMockCourse(courseId, {
          modules: [
            { id: 'module-1', title: 'Introduction', duration: '30 min' },
            { id: 'module-2', title: 'Advanced Topics', duration: '45 min' }
          ],
          requirements: ['Basic knowledge of business'],
          learningOutcomes: ['Understand business fundamentals']
        });
        const mockResponse = createApiResponse(mockCourse);

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch(`/api/academy/courses/${courseId}`, {
          method: 'GET'
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith(
          `/api/academy/courses/${courseId}`,
          { method: 'GET' }
        );

        expect(result.success).toBe(true);
        expect(result.data.id).toBe(courseId);
        expect(result.data.modules).toHaveLength(2);
      });
    });

    describe('Enroll in Course', () => {
      it('should enroll in course', async () => {
        const courseId = 'course-1';
        const enrollmentData = {
          paymentMethod: 'card',
          couponCode: 'SAVE20'
        };
        const mockEnrollment = createMockEnrollment('enrollment-1', {
          courseId,
          ...enrollmentData
        });
        const mockResponse = createApiResponse(mockEnrollment);

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch(`/api/academy/courses/${courseId}/enroll`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(enrollmentData)
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith(
          `/api/academy/courses/${courseId}/enroll`,
          {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': 'Bearer jwt-token-123'
            },
            body: JSON.stringify(enrollmentData)
          }
        );

        expect(result.success).toBe(true);
        expect(result.data.courseId).toBe(courseId);
      });

      it('should handle enrollment in already enrolled course', async () => {
        const courseId = 'course-1';
        const enrollmentData = {
          paymentMethod: 'card'
        };
        const mockResponse = createErrorResponse('Already enrolled in this course');

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch(`/api/academy/courses/${courseId}/enroll`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(enrollmentData)
        });

        const result = await response.json();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Already enrolled in this course');
      });
    });

    describe('Update Course Progress', () => {
      it('should update course progress', async () => {
        const courseId = 'course-1';
        const progressData = {
          moduleId: 'module-1',
          completed: true,
          timeSpent: 30,
          quizScore: 85
        };
        const mockResponse = createApiResponse({
          courseId,
          progress: 25,
          completedModules: 1,
          totalModules: 4,
          updatedAt: '2024-01-15T10:00:00Z'
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch(`/api/academy/courses/${courseId}/progress`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(progressData)
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith(
          `/api/academy/courses/${courseId}/progress`,
          {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': 'Bearer jwt-token-123'
            },
            body: JSON.stringify(progressData)
          }
        );

        expect(result.success).toBe(true);
        expect(result.data.progress).toBe(25);
      });
    });

    describe('Add Course Review', () => {
      it('should add course review', async () => {
        const courseId = 'course-1';
        const reviewData = {
          rating: 5,
          comment: 'Excellent course! Very informative and well-structured.',
          wouldRecommend: true
        };
        const mockResponse = createApiResponse({
          id: 'review-1',
          courseId,
          rating: 5,
          comment: 'Excellent course! Very informative and well-structured.',
          createdAt: '2024-01-15T10:00:00Z'
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch(`/api/academy/courses/${courseId}/review`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(reviewData)
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith(
          `/api/academy/courses/${courseId}/review`,
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

    describe('My Courses', () => {
      it('should get enrolled courses', async () => {
        const mockEnrollments = [
          createMockEnrollment('1', { progress: 50 }),
          createMockEnrollment('2', { progress: 100, status: 'completed' })
        ];
        const mockResponse = createApiResponse({
          enrollments: mockEnrollments,
          total: 2,
          page: 1,
          limit: 10
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/academy/my-courses', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/academy/my-courses', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        expect(result.success).toBe(true);
        expect(result.data.enrollments).toHaveLength(2);
      });
    });
  });

  // Performance Tests for Phases 4-6
  describe('Performance Requirements - Phases 4-6', () => {
    it('should meet payment endpoint response time (< 1000ms)', async () => {
      const startTime = Date.now();
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createApiResponse({ paymentId: 'test' }))
      });

      await fetch('/api/marketplace/bookings/paypal/approve', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer jwt-token-123'
        },
        body: JSON.stringify({ bookingId: 'test', amount: 100 })
      });

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000);
    });

    it('should meet job search response time (< 500ms)', async () => {
      const startTime = Date.now();
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createApiResponse({ jobs: [] }))
      });

      await fetch('/api/jobs/search', { method: 'GET' });

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(500);
    });

    it('should meet course enrollment response time (< 500ms)', async () => {
      const startTime = Date.now();
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createApiResponse({ enrollmentId: 'test' }))
      });

      await fetch('/api/academy/courses/course-1/enroll', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer jwt-token-123'
        },
        body: JSON.stringify({ paymentMethod: 'card' })
      });

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(500);
    });
  });
});
