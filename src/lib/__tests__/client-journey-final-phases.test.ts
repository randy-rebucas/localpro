/**
 * Client Journey Test Suite - Phases 13-18
 * 
 * Phase 13: Referral System
 * Phase 14: Analytics & Insights
 * Phase 15: Activity & Social Features
 * Phase 16: Settings & Preferences
 * Phase 17: Profile Management
 * Phase 18: Maps & Location Services
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
const createMockReferral = (id: string, overrides = {}) => ({
  id,
  referrerId: 'client-123',
  referredId: 'client-456',
  code: 'REF123',
  status: 'active',
  rewardAmount: 25,
  createdAt: '2024-01-01T00:00:00Z',
  ...overrides
});

const createMockReferralReward = (id: string, overrides = {}) => ({
  id,
  referralId: 'ref-1',
  userId: 'client-123',
  amount: 25,
  type: 'signup_bonus',
  status: 'pending',
  createdAt: '2024-01-01T00:00:00Z',
  ...overrides
});

const createMockAnalytics = (overrides = {}) => ({
  totalBookings: 15,
  totalSpent: 2500,
  averageRating: 4.8,
  favoriteCategory: 'CLEANING',
  monthlyTrend: [
    { month: 'Jan', bookings: 5, spent: 500 },
    { month: 'Feb', bookings: 7, spent: 800 },
    { month: 'Mar', bookings: 3, spent: 400 }
  ],
  topServices: [
    { serviceId: 'service-1', name: 'House Cleaning', bookings: 8 },
    { serviceId: 'service-2', name: 'Plumbing', bookings: 4 }
  ],
  ...overrides
});

const createMockActivity = (id: string, overrides = {}) => ({
  id,
  userId: 'client-123',
  type: 'booking_created',
  title: 'New Booking Created',
  description: 'You booked a cleaning service for tomorrow',
  metadata: { serviceId: 'service-1', bookingId: 'booking-1' },
  timestamp: '2024-01-15T10:00:00Z',
  ...overrides
});

const createMockUserSettings = (overrides = {}) => ({
  notifications: {
    email: true,
    sms: false,
    push: true,
    bookingUpdates: true,
    marketing: false
  },
  privacy: {
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false
  },
  preferences: {
    language: 'en',
    timezone: 'UTC',
    currency: 'USD',
    theme: 'light'
  },
  ...overrides
});

const createMockLocation = (overrides = {}) => ({
  latitude: 40.7128,
  longitude: -74.0060,
  address: '123 Main St, New York, NY 10001',
  city: 'New York',
  state: 'NY',
  country: 'US',
  postalCode: '10001',
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

describe('Client Journey - Phases 13-18', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    jest.clearAllMocks();
  });

  describe('Phase 13: Referral System', () => {
    describe('Validate Referral Code', () => {
      it('should validate referral code', async () => {
        const referralCode = 'REF123';
        const mockResponse = createApiResponse({
          code: referralCode,
          valid: true,
          referrer: {
            id: 'referrer-123',
            name: 'John Referrer',
            avatar: 'avatar.jpg'
          },
          reward: {
            amount: 25,
            currency: 'USD',
            type: 'signup_bonus'
          }
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch(`/api/referrals/validate/${referralCode}`, {
          method: 'GET'
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith(
          `/api/referrals/validate/${referralCode}`,
          { method: 'GET' }
        );

        expect(result.success).toBe(true);
        expect(result.data.valid).toBe(true);
      });

      it('should handle invalid referral code', async () => {
        const referralCode = 'INVALID';
        const mockResponse = createErrorResponse('Invalid referral code');

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch(`/api/referrals/validate/${referralCode}`, {
          method: 'GET'
        });

        const result = await response.json();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid referral code');
      });
    });

    describe('Track Referral Click', () => {
      it('should track referral link click', async () => {
        const clickData = {
          referralCode: 'REF123',
          source: 'email',
          userAgent: 'Mozilla/5.0...',
          ipAddress: '192.168.1.1'
        };
        const mockResponse = createApiResponse({
          tracked: true,
          clickId: 'click-123',
          timestamp: '2024-01-15T10:00:00Z'
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/referrals/track-click', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(clickData)
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/referrals/track-click', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(clickData)
        });

        expect(result.success).toBe(true);
        expect(result.data.tracked).toBe(true);
      });
    });

    describe('Leaderboard', () => {
      it('should get referral leaderboard', async () => {
        const mockLeaderboard = [
          {
            userId: 'user-1',
            name: 'Top Referrer',
            referrals: 25,
            rewards: 625,
            rank: 1
          },
          {
            userId: 'user-2',
            name: 'Second Place',
            referrals: 18,
            rewards: 450,
            rank: 2
          }
        ];
        const mockResponse = createApiResponse({
          leaderboard: mockLeaderboard,
          total: 2,
          period: 'monthly'
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/referrals/leaderboard', {
          method: 'GET'
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/referrals/leaderboard', {
          method: 'GET'
        });

        expect(result.success).toBe(true);
        expect(result.data.leaderboard).toHaveLength(2);
      });
    });

    describe('My Referrals', () => {
      it('should get user referrals', async () => {
        const mockReferrals = [
          createMockReferral('1'),
          createMockReferral('2', { status: 'completed' })
        ];
        const mockResponse = createApiResponse({
          referrals: mockReferrals,
          total: 2,
          totalRewards: 50
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/referrals/my-referrals', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/referrals/my-referrals', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        expect(result.success).toBe(true);
        expect(result.data.referrals).toHaveLength(2);
      });
    });

    describe('Referral Stats', () => {
      it('should get referral statistics', async () => {
        const mockStats = {
          totalReferrals: 15,
          successfulReferrals: 12,
          pendingReferrals: 2,
          failedReferrals: 1,
          totalRewards: 300,
          availableRewards: 50,
          conversionRate: 0.8
        };
        const mockResponse = createApiResponse(mockStats);

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/referrals/stats', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/referrals/stats', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        expect(result.success).toBe(true);
        expect(result.data.totalReferrals).toBe(15);
      });
    });

    describe('Referral Links', () => {
      it('should get referral links', async () => {
        const mockLinks = [
          {
            id: 'link-1',
            code: 'REF123',
            url: 'https://app.localpro.com/ref/REF123',
            clicks: 25,
            conversions: 5,
            createdAt: '2024-01-01T00:00:00Z'
          }
        ];
        const mockResponse = createApiResponse({
          links: mockLinks,
          total: 1
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/referrals/links', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/referrals/links', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        expect(result.success).toBe(true);
        expect(result.data.links).toHaveLength(1);
      });
    });

    describe('Referral Rewards', () => {
      it('should get referral rewards', async () => {
        const mockRewards = [
          createMockReferralReward('1'),
          createMockReferralReward('2', { status: 'paid' })
        ];
        const mockResponse = createApiResponse({
          rewards: mockRewards,
          total: 2,
          totalAmount: 50
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/referrals/rewards', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/referrals/rewards', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        expect(result.success).toBe(true);
        expect(result.data.rewards).toHaveLength(2);
      });
    });

    describe('Invite User', () => {
      it('should invite user via referral', async () => {
        const inviteData = {
          email: 'friend@example.com',
          message: 'Join me on LocalPro!',
          referralCode: 'REF123'
        };
        const mockResponse = createApiResponse({
          inviteId: 'invite-1',
          sent: true,
          sentAt: '2024-01-15T10:00:00Z'
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/referrals/invite', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(inviteData)
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/referrals/invite', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(inviteData)
        });

        expect(result.success).toBe(true);
        expect(result.data.sent).toBe(true);
      });
    });

    describe('Update Referral Preferences', () => {
      it('should update referral preferences', async () => {
        const preferencesData = {
          autoInvite: true,
          emailNotifications: true,
          smsNotifications: false,
          rewardThreshold: 100
        };
        const mockResponse = createApiResponse({
          preferences: preferencesData,
          updatedAt: '2024-01-15T10:00:00Z'
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/referrals/preferences', {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(preferencesData)
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/referrals/preferences', {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(preferencesData)
        });

        expect(result.success).toBe(true);
        expect(result.data.preferences.autoInvite).toBe(true);
      });
    });
  });

  describe('Phase 14: Analytics & Insights', () => {
    describe('Analytics Overview', () => {
      it('should get analytics overview', async () => {
        const mockOverview = createMockAnalytics();
        const mockResponse = createApiResponse(mockOverview);

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

    describe('User Analytics', () => {
      it('should get user analytics', async () => {
        const mockUserAnalytics = {
          profile: {
                totalBookings: 15,
                totalSpent: 2500,
                averageRating: 4.8,
                joinDate: '2024-01-01T00:00:00Z',
                lastActivity: '2024-01-15T10:00:00Z'
          },
          trends: {
            bookings: { weekly: [5, 7, 3, 8, 2, 4, 6], monthly: [15, 18, 12] },
            spending: { weekly: [500, 700, 300, 800, 200, 400, 600], monthly: [2500, 2800, 2200] }
          },
          insights: [
            'You book cleaning services most frequently',
            'Your average booking value is $167',
            'You prefer weekend bookings'
          ]
        };
        const mockResponse = createApiResponse(mockUserAnalytics);

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/analytics/user', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/analytics/user', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        expect(result.success).toBe(true);
        expect(result.data.profile.totalBookings).toBe(15);
      });
    });

    describe('Marketplace Analytics', () => {
      it('should get marketplace analytics', async () => {
        const mockMarketplaceAnalytics = {
          popularServices: [
            { serviceId: 'service-1', name: 'House Cleaning', bookings: 150 },
            { serviceId: 'service-2', name: 'Plumbing', bookings: 80 }
          ],
          categoryDistribution: [
            { category: 'CLEANING', percentage: 60, bookings: 300 },
            { category: 'PLUMBING', percentage: 25, bookings: 125 },
            { category: 'ELECTRICAL', percentage: 15, bookings: 75 }
          ],
          averagePricing: {
            CLEANING: 120,
            PLUMBING: 200,
            ELECTRICAL: 180
          }
        };
        const mockResponse = createApiResponse(mockMarketplaceAnalytics);

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/analytics/marketplace', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/analytics/marketplace', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        expect(result.success).toBe(true);
        expect(result.data.popularServices).toHaveLength(2);
      });
    });

    describe('Job Analytics', () => {
      it('should get job analytics', async () => {
        const mockJobAnalytics = {
          applications: {
            total: 25,
            pending: 8,
            accepted: 12,
            rejected: 5
          },
          successRate: 0.48,
          averageResponseTime: '2.5 days',
          topCategories: [
            { category: 'CLEANING', applications: 15 },
            { category: 'PLUMBING', applications: 7 },
            { category: 'ELECTRICAL', applications: 3 }
          ]
        };
        const mockResponse = createApiResponse(mockJobAnalytics);

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/analytics/jobs', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/analytics/jobs', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        expect(result.success).toBe(true);
        expect(result.data.applications.total).toBe(25);
      });
    });

    describe('Referral Analytics', () => {
      it('should get referral analytics', async () => {
        const mockReferralAnalytics = {
          totalReferrals: 15,
          successfulReferrals: 12,
          totalRewards: 300,
          conversionRate: 0.8,
          topReferralSources: [
            { source: 'email', count: 8, conversionRate: 0.75 },
            { source: 'social', count: 5, conversionRate: 0.8 },
            { source: 'direct', count: 2, conversionRate: 1.0 }
          ],
          monthlyTrend: [
            { month: 'Jan', referrals: 5, rewards: 125 },
            { month: 'Feb', referrals: 7, rewards: 175 },
            { month: 'Mar', referrals: 3, rewards: 75 }
          ]
        };
        const mockResponse = createApiResponse(mockReferralAnalytics);

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/analytics/referrals', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/analytics/referrals', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        expect(result.success).toBe(true);
        expect(result.data.totalReferrals).toBe(15);
      });
    });

    describe('Track Event', () => {
      it('should track custom event', async () => {
        const eventData = {
          event: 'service_viewed',
          properties: {
            serviceId: 'service-1',
            category: 'CLEANING',
            source: 'search'
          },
          timestamp: '2024-01-15T10:00:00Z'
        };
        const mockResponse = createApiResponse({
          tracked: true,
          eventId: 'event-123',
          timestamp: '2024-01-15T10:00:00Z'
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/analytics/track-event', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(eventData)
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/analytics/track-event', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(eventData)
        });

        expect(result.success).toBe(true);
        expect(result.data.tracked).toBe(true);
      });
    });
  });

  describe('Phase 15: Activity & Social Features', () => {
    describe('Activity Feed', () => {
      it('should get activity feed', async () => {
        const mockActivities = [
          createMockActivity('1'),
          createMockActivity('2', { type: 'review_added' })
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

    describe('My Activities', () => {
      it('should get user activities', async () => {
        const mockActivities = [
          createMockActivity('1'),
          createMockActivity('2', { type: 'booking_cancelled' })
        ];
        const mockResponse = createApiResponse({
          activities: mockActivities,
          total: 2,
          page: 1,
          limit: 10
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/activities/my-activities', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/activities/my-activities', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        expect(result.success).toBe(true);
        expect(result.data.activities).toHaveLength(2);
      });
    });

    describe('User Activities', () => {
      it('should get specific user activities', async () => {
        const userId = 'user-456';
        const mockActivities = [createMockActivity('1', { userId })];
        const mockResponse = createApiResponse({
          activities: mockActivities,
          total: 1,
          user: {
            id: userId,
            name: 'Other User',
            avatar: 'avatar.jpg'
          }
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch(`/api/activities/user/${userId}`, {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith(
          `/api/activities/user/${userId}`,
          {
            method: 'GET',
            headers: { 
              'Authorization': 'Bearer jwt-token-123'
            }
          }
        );

        expect(result.success).toBe(true);
        expect(result.data.activities).toHaveLength(1);
      });
    });

    describe('Activity Details', () => {
      it('should get activity details', async () => {
        const activityId = 'activity-1';
        const mockActivity = createMockActivity(activityId, {
          interactions: [
            { id: 'int-1', userId: 'user-1', type: 'like', timestamp: '2024-01-15T10:00:00Z' },
            { id: 'int-2', userId: 'user-2', type: 'comment', content: 'Great job!', timestamp: '2024-01-15T10:05:00Z' }
          ]
        });
        const mockResponse = createApiResponse(mockActivity);

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch(`/api/activities/${activityId}`, {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith(
          `/api/activities/${activityId}`,
          {
            method: 'GET',
            headers: { 
              'Authorization': 'Bearer jwt-token-123'
            }
          }
        );

        expect(result.success).toBe(true);
        expect(result.data.id).toBe(activityId);
      });
    });

    describe('Create Activity', () => {
      it('should create activity', async () => {
        const activityData = {
          type: 'custom_post',
          title: 'My Service Experience',
          content: 'I had an amazing experience with the cleaning service!',
          visibility: 'public',
          tags: ['cleaning', 'review']
        };
        const mockActivity = createMockActivity('activity-1', activityData);
        const mockResponse = createApiResponse(mockActivity);

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/activities', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(activityData)
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/activities', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(activityData)
        });

        expect(result.success).toBe(true);
        expect(result.data.type).toBe('custom_post');
      });
    });

    describe('Add Interaction', () => {
      it('should add interaction to activity', async () => {
        const activityId = 'activity-1';
        const interactionData = {
          type: 'like',
          content: 'Great post!'
        };
        const mockResponse = createApiResponse({
          id: 'interaction-1',
          activityId,
          type: 'like',
          content: 'Great post!',
          userId: 'client-123',
          createdAt: '2024-01-15T10:00:00Z'
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch(`/api/activities/${activityId}/interactions`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(interactionData)
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith(
          `/api/activities/${activityId}/interactions`,
          {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': 'Bearer jwt-token-123'
            },
            body: JSON.stringify(interactionData)
          }
        );

        expect(result.success).toBe(true);
        expect(result.data.type).toBe('like');
      });
    });

    describe('User Activity Stats', () => {
      it('should get user activity statistics', async () => {
        const userId = 'client-123';
        const mockStats = {
          totalActivities: 25,
          totalInteractions: 150,
          likesReceived: 120,
          commentsReceived: 30,
          averageEngagement: 6.0,
          topActivityTypes: [
            { type: 'booking_created', count: 10 },
            { type: 'review_added', count: 8 },
            { type: 'custom_post', count: 7 }
          ]
        };
        const mockResponse = createApiResponse(mockStats);

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch(`/api/activities/user/${userId}/stats`, {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith(
          `/api/activities/user/${userId}/stats`,
          {
            method: 'GET',
            headers: { 
              'Authorization': 'Bearer jwt-token-123'
            }
          }
        );

        expect(result.success).toBe(true);
        expect(result.data.totalActivities).toBe(25);
      });
    });
  });

  describe('Phase 16: Settings & Preferences', () => {
    describe('User Settings', () => {
      it('should get user settings', async () => {
        const mockSettings = createMockUserSettings();
        const mockResponse = createApiResponse(mockSettings);

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/settings/user', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/settings/user', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        expect(result.success).toBe(true);
        expect(result.data.notifications.email).toBe(true);
      });
    });

    describe('Update User Settings', () => {
      it('should update user settings', async () => {
        const settingsData = {
          notifications: {
            email: false,
            sms: true,
            push: true,
            bookingUpdates: true,
            marketing: false
          },
          privacy: {
            profileVisibility: 'private',
            showEmail: false,
            showPhone: false
          }
        };
        const mockResponse = createApiResponse({
          settings: settingsData,
          updatedAt: '2024-01-15T10:00:00Z'
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/settings/user', {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(settingsData)
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/settings/user', {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(settingsData)
        });

        expect(result.success).toBe(true);
        expect(result.data.settings.notifications.email).toBe(false);
      });
    });

    describe('Reset User Settings', () => {
      it('should reset user settings', async () => {
        const mockResponse = createApiResponse({
          reset: true,
          resetAt: '2024-01-15T10:00:00Z',
          settings: createMockUserSettings()
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/settings/user/reset', {
          method: 'POST',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/settings/user/reset', {
          method: 'POST',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        expect(result.success).toBe(true);
        expect(result.data.reset).toBe(true);
      });
    });

    describe('Public App Settings', () => {
      it('should get public app settings', async () => {
        const mockPublicSettings = {
          appName: 'LocalPro',
          version: '1.0.0',
          features: {
            messaging: true,
            payments: true,
            referrals: true,
            analytics: true
          },
          maintenance: {
            enabled: false,
            message: null
          }
        };
        const mockResponse = createApiResponse(mockPublicSettings);

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/settings/public', {
          method: 'GET'
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/settings/public', {
          method: 'GET'
        });

        expect(result.success).toBe(true);
        expect(result.data.appName).toBe('LocalPro');
      });
    });

    describe('App Health', () => {
      it('should get app health status', async () => {
        const mockHealth = {
          status: 'healthy',
          version: '1.0.0',
          uptime: 86400,
          services: {
            database: 'healthy',
            redis: 'healthy',
            external_apis: 'healthy'
          },
          timestamp: '2024-01-15T10:00:00Z'
        };
        const mockResponse = createApiResponse(mockHealth);

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/settings/health', {
          method: 'GET'
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/settings/health', {
          method: 'GET'
        });

        expect(result.success).toBe(true);
        expect(result.data.status).toBe('healthy');
      });
    });
  });

  describe('Phase 17: Profile Management', () => {
    describe('Get Profile', () => {
      it('should get current user profile', async () => {
        const mockProfile = {
          ...mockClientSession,
          avatar: 'avatar.jpg',
          bio: 'Professional service user',
          location: 'New York, NY',
          joinDate: '2024-01-01T00:00:00Z',
          lastActive: '2024-01-15T10:00:00Z',
          preferences: {
            notifications: true,
            privacy: 'public'
          }
        };
        const mockResponse = createApiResponse(mockProfile);

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

    describe('Update Profile', () => {
      it('should update user profile', async () => {
        const profileData = {
          name: 'John Updated Client',
          bio: 'Updated bio',
          location: 'Los Angeles, CA',
          preferences: {
            notifications: false,
            privacy: 'private'
          }
        };
        const mockResponse = createApiResponse({
          ...mockClientSession,
          ...profileData,
          updatedAt: '2024-01-15T10:00:00Z'
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/auth/profile', {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(profileData)
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/auth/profile', {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(profileData)
        });

        expect(result.success).toBe(true);
        expect(result.data.name).toBe('John Updated Client');
      });
    });

    describe('Upload Avatar', () => {
      it('should upload profile avatar', async () => {
        const formData = new FormData();
        formData.append('avatar', new Blob(['avatar']), 'avatar.jpg');

        const mockResponse = createApiResponse({
          avatarUrl: 'https://cdn.localpro.com/avatars/client-123.jpg',
          uploadedAt: '2024-01-15T10:00:00Z'
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/auth/upload-avatar', {
          method: 'POST',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          },
          body: formData
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/auth/upload-avatar', {
          method: 'POST',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          },
          body: formData
        });

        expect(result.success).toBe(true);
        expect(result.data.avatarUrl).toContain('avatars/client-123.jpg');
      });
    });

    describe('Upload Portfolio Images', () => {
      it('should upload portfolio images', async () => {
        const formData = new FormData();
        formData.append('images', new Blob(['image1']), 'image1.jpg');
        formData.append('images', new Blob(['image2']), 'image2.jpg');

        const mockResponse = createApiResponse({
          images: [
            'https://cdn.localpro.com/portfolio/client-123/image1.jpg',
            'https://cdn.localpro.com/portfolio/client-123/image2.jpg'
          ],
          uploadedAt: '2024-01-15T10:00:00Z'
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/auth/upload-portfolio', {
          method: 'POST',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          },
          body: formData
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/auth/upload-portfolio', {
          method: 'POST',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          },
          body: formData
        });

        expect(result.success).toBe(true);
        expect(result.data.images).toHaveLength(2);
      });
    });

    describe('Logout', () => {
      it('should logout user', async () => {
        const mockResponse = createApiResponse({
          loggedOut: true,
          loggedOutAt: '2024-01-15T10:00:00Z'
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/auth/logout', {
          method: 'POST',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        expect(result.success).toBe(true);
        expect(result.data.loggedOut).toBe(true);
      });
    });
  });

  describe('Phase 18: Maps & Location Services', () => {
    describe('Geocode Address', () => {
      it('should convert address to coordinates', async () => {
        const address = '123 Main St, New York, NY 10001';
        const mockLocation = createMockLocation();
        const mockResponse = createApiResponse(mockLocation);

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch(`/api/maps/geocode?address=${encodeURIComponent(address)}`, {
          method: 'GET'
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith(
          `/api/maps/geocode?address=${encodeURIComponent(address)}`,
          { method: 'GET' }
        );

        expect(result.success).toBe(true);
        expect(result.data.latitude).toBe(40.7128);
      });
    });

    describe('Reverse Geocode', () => {
      it('should convert coordinates to address', async () => {
        const coordinates = { lat: 40.7128, lng: -74.0060 };
        const mockLocation = createMockLocation();
        const mockResponse = createApiResponse(mockLocation);

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const queryParams = new URLSearchParams(coordinates);
        const response = await fetch(`/api/maps/reverse-geocode?${queryParams}`, {
          method: 'GET'
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith(
          `/api/maps/reverse-geocode?${queryParams}`,
          { method: 'GET' }
        );

        expect(result.success).toBe(true);
        expect(result.data.address).toBe('123 Main St, New York, NY 10001');
      });
    });

    describe('Search Places', () => {
      it('should search for places', async () => {
        const searchQuery = 'restaurants near me';
        const mockPlaces = [
          {
            id: 'place-1',
            name: 'Restaurant A',
            address: '456 Food St, New York, NY',
            rating: 4.5,
            types: ['restaurant', 'food'],
            location: { lat: 40.7589, lng: -73.9851 }
          },
          {
            id: 'place-2',
            name: 'Restaurant B',
            address: '789 Eat St, New York, NY',
            rating: 4.2,
            types: ['restaurant', 'food'],
            location: { lat: 40.7614, lng: -73.9776 }
          }
        ];
        const mockResponse = createApiResponse({
          places: mockPlaces,
          total: 2
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch(`/api/maps/search-places?q=${encodeURIComponent(searchQuery)}`, {
          method: 'GET'
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith(
          `/api/maps/search-places?q=${encodeURIComponent(searchQuery)}`,
          { method: 'GET' }
        );

        expect(result.success).toBe(true);
        expect(result.data.places).toHaveLength(2);
      });
    });

    describe('Place Details', () => {
      it('should get place details', async () => {
        const placeId = 'place-1';
        const mockPlace = {
          id: placeId,
          name: 'Restaurant A',
          address: '456 Food St, New York, NY',
          rating: 4.5,
          reviews: [
            { id: 'review-1', rating: 5, text: 'Great food!', author: 'John D.' }
          ],
          photos: ['photo1.jpg', 'photo2.jpg'],
          hours: {
            monday: '9:00 AM - 10:00 PM',
            tuesday: '9:00 AM - 10:00 PM'
          },
          contact: {
            phone: '+1-555-123-4567',
            website: 'https://restauranta.com'
          }
        };
        const mockResponse = createApiResponse(mockPlace);

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch(`/api/maps/place-details/${placeId}`, {
          method: 'GET'
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith(
          `/api/maps/place-details/${placeId}`,
          { method: 'GET' }
        );

        expect(result.success).toBe(true);
        expect(result.data.id).toBe(placeId);
      });
    });

    describe('Calculate Distance', () => {
      it('should calculate distance between points', async () => {
        const origin = { lat: 40.7128, lng: -74.0060 };
        const destination = { lat: 40.7589, lng: -73.9851 };
        const mockDistance = {
          distance: 5.2,
          unit: 'miles',
          duration: 15,
          durationUnit: 'minutes',
          route: {
            summary: 'I-95 N',
            steps: [
              { instruction: 'Head north on Main St', distance: 0.5, duration: 2 },
              { instruction: 'Turn right on I-95 N', distance: 4.7, duration: 13 }
            ]
          }
        };
        const mockResponse = createApiResponse(mockDistance);

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const queryParams = new URLSearchParams({
          origin: `${origin.lat},${origin.lng}`,
          destination: `${destination.lat},${destination.lng}`
        });
        const response = await fetch(`/api/maps/calculate-distance?${queryParams}`, {
          method: 'GET'
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith(
          `/api/maps/calculate-distance?${queryParams}`,
          { method: 'GET' }
        );

        expect(result.success).toBe(true);
        expect(result.data.distance).toBe(5.2);
      });
    });

    describe('Nearby Places', () => {
      it('should get nearby places', async () => {
        const location = { lat: 40.7128, lng: -74.0060, radius: 1000 };
        const mockPlaces = [
          {
            id: 'place-1',
            name: 'Nearby Restaurant',
            distance: 0.3,
            rating: 4.5
          }
        ];
        const mockResponse = createApiResponse({
          places: mockPlaces,
          total: 1,
          location: location
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const queryParams = new URLSearchParams(location);
        const response = await fetch(`/api/maps/nearby-places?${queryParams}`, {
          method: 'GET'
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith(
          `/api/maps/nearby-places?${queryParams}`,
          { method: 'GET' }
        );

        expect(result.success).toBe(true);
        expect(result.data.places).toHaveLength(1);
      });
    });

    describe('Validate Service Area', () => {
      it('should validate service coverage area', async () => {
        const location = { lat: 40.7128, lng: -74.0060 };
        const mockValidation = {
          covered: true,
          serviceArea: 'New York Metro',
          provider: {
            id: 'provider-1',
            name: 'Local Cleaning Co',
            coverageRadius: 25
          },
          estimatedTravelTime: 15,
          estimatedTravelDistance: 3.2
        };
        const mockResponse = createApiResponse(mockValidation);

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const queryParams = new URLSearchParams(location);
        const response = await fetch(`/api/maps/validate-service-area?${queryParams}`, {
          method: 'GET'
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith(
          `/api/maps/validate-service-area?${queryParams}`,
          { method: 'GET' }
        );

        expect(result.success).toBe(true);
        expect(result.data.covered).toBe(true);
      });
    });

    describe('Analyze Service Coverage', () => {
      it('should analyze service coverage', async () => {
        const analysisData = {
          serviceType: 'cleaning',
          location: { lat: 40.7128, lng: -74.0060 },
          radius: 10
        };
        const mockAnalysis = {
          coverage: {
            totalProviders: 25,
            availableProviders: 20,
            averageResponseTime: '2.5 hours',
            coveragePercentage: 85
          },
          recommendations: [
            'Consider expanding to Brooklyn',
            'Peak hours: 9 AM - 5 PM'
          ],
          heatmap: {
            highDemand: [
              { lat: 40.7589, lng: -73.9851, intensity: 0.9 },
              { lat: 40.7614, lng: -73.9776, intensity: 0.8 }
            ]
          }
        };
        const mockResponse = createApiResponse(mockAnalysis);

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/maps/analyze-coverage', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/maps/analyze-coverage', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        expect(result.success).toBe(true);
        expect(result.data.coverage.totalProviders).toBe(25);
      });
    });
  });

  // Performance Tests for Phases 13-18
  describe('Performance Requirements - Phases 13-18', () => {
    it('should meet referral endpoint response time (< 500ms)', async () => {
      const startTime = Date.now();
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createApiResponse({ referrals: [] }))
      });

      await fetch('/api/referrals/my-referrals', {
        method: 'GET',
        headers: { 'Authorization': 'Bearer jwt-token-123' }
      });

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(500);
    });

    it('should meet analytics endpoint response time (< 500ms)', async () => {
      const startTime = Date.now();
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createApiResponse({ totalBookings: 0 }))
      });

      await fetch('/api/analytics/overview', {
        method: 'GET',
        headers: { 'Authorization': 'Bearer jwt-token-123' }
      });

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(500);
    });

    it('should meet maps endpoint response time (< 500ms)', async () => {
      const startTime = Date.now();
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createApiResponse({ places: [] }))
      });

      await fetch('/api/maps/search-places?q=restaurants', { method: 'GET' });

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(500);
    });
  });
});
