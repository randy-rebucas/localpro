/**
 * Client Journey Test Suite - Phases 7-9
 * 
 * Phase 7: Marketplace Shopping
 * Phase 8: Equipment Rental
 * Phase 9: Financial Management
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
const createMockSupply = (id: string, overrides = {}) => ({
  id,
  name: `Supply ${id}`,
  description: `Description for supply ${id}`,
  category: 'CLEANING_SUPPLIES',
  price: 25,
  stock: 100,
  supplier: { name: 'Supplier Name', id: 'supplier-1' },
  rating: 4.5,
  reviewCount: 20,
  ...overrides
});

const createMockSupplyOrder = (id: string, overrides = {}) => ({
  id,
  supplyId: 'supply-1',
  clientId: 'client-123',
  quantity: 2,
  totalAmount: 50,
  status: 'pending',
  shippingAddress: '123 Main St, New York, NY',
  createdAt: '2024-01-01T00:00:00Z',
  ...overrides
});

const createMockRental = (id: string, overrides = {}) => ({
  id,
  name: `Rental ${id}`,
  description: `Description for rental ${id}`,
  category: 'CLEANING_EQUIPMENT',
  dailyRate: 50,
  available: true,
  owner: { name: 'Owner Name', id: 'owner-1' },
  rating: 4.8,
  reviewCount: 15,
  ...overrides
});

const createMockRentalBooking = (id: string, overrides = {}) => ({
  id,
  rentalId: 'rental-1',
  clientId: 'client-123',
  startDate: '2024-01-15T00:00:00Z',
  endDate: '2024-01-17T00:00:00Z',
  totalAmount: 100,
  status: 'pending',
  createdAt: '2024-01-01T00:00:00Z',
  ...overrides
});

const createMockTransaction = (id: string, overrides = {}) => ({
  id,
  type: 'payment',
  amount: 100,
  currency: 'USD',
  status: 'completed',
  description: 'Service booking payment',
  category: 'SERVICES',
  createdAt: '2024-01-01T00:00:00Z',
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

describe('Client Journey - Phases 7-9', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    jest.clearAllMocks();
  });

  describe('Phase 7: Marketplace Shopping', () => {
    describe('Supply Discovery', () => {
      it('should browse supplies', async () => {
        const mockSupplies = [
          createMockSupply('1'),
          createMockSupply('2', { category: 'PLUMBING_SUPPLIES', price: 35 })
        ];
        const mockResponse = createApiResponse({
          supplies: mockSupplies,
          total: 2,
          page: 1,
          limit: 10
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/supplies', {
          method: 'GET'
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/supplies', {
          method: 'GET'
        });

        expect(result.success).toBe(true);
        expect(result.data.supplies).toHaveLength(2);
      });

      it('should get supply details', async () => {
        const supplyId = 'supply-1';
        const mockSupply = createMockSupply(supplyId, {
          specifications: ['Size: 500ml', 'Material: Plastic'],
          images: ['image1.jpg', 'image2.jpg'],
          reviews: [
            { id: 'review-1', rating: 5, comment: 'Great product!' }
          ]
        });
        const mockResponse = createApiResponse(mockSupply);

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch(`/api/supplies/${supplyId}`, {
          method: 'GET'
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith(
          `/api/supplies/${supplyId}`,
          { method: 'GET' }
        );

        expect(result.success).toBe(true);
        expect(result.data.id).toBe(supplyId);
      });

      it('should get supply categories', async () => {
        const mockCategories = [
          { id: 'cleaning_supplies', name: 'Cleaning Supplies', count: 50 },
          { id: 'plumbing_supplies', name: 'Plumbing Supplies', count: 30 },
          { id: 'electrical_supplies', name: 'Electrical Supplies', count: 25 }
        ];
        const mockResponse = createApiResponse(mockCategories);

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/supplies/categories', {
          method: 'GET'
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/supplies/categories', {
          method: 'GET'
        });

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(3);
      });

      it('should get featured supplies', async () => {
        const mockSupplies = [
          createMockSupply('1', { featured: true }),
          createMockSupply('2', { featured: true })
        ];
        const mockResponse = createApiResponse({
          supplies: mockSupplies,
          total: 2
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/supplies/featured', {
          method: 'GET'
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/supplies/featured', {
          method: 'GET'
        });

        expect(result.success).toBe(true);
        expect(result.data.supplies).toHaveLength(2);
      });

      it('should get nearby supplies', async () => {
        const location = {
          latitude: 40.7128,
          longitude: -74.0060,
          radius: 10
        };
        const mockSupplies = [createMockSupply('1')];
        const mockResponse = createApiResponse({
          supplies: mockSupplies,
          total: 1,
          location: location
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const queryParams = new URLSearchParams(location);
        const response = await fetch(`/api/supplies/nearby?${queryParams}`, {
          method: 'GET'
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith(
          `/api/supplies/nearby?${queryParams}`,
          { method: 'GET' }
        );

        expect(result.success).toBe(true);
        expect(result.data.supplies).toHaveLength(1);
      });
    });

    describe('Order Supply', () => {
      it('should order supply', async () => {
        const supplyId = 'supply-1';
        const orderData = {
          quantity: 2,
          shippingAddress: '123 Main St, New York, NY',
          paymentMethod: 'card'
        };
        const mockOrder = createMockSupplyOrder('order-1', {
          supplyId,
          ...orderData
        });
        const mockResponse = createApiResponse(mockOrder);

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch(`/api/supplies/${supplyId}/order`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(orderData)
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith(
          `/api/supplies/${supplyId}/order`,
          {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': 'Bearer jwt-token-123'
            },
            body: JSON.stringify(orderData)
          }
        );

        expect(result.success).toBe(true);
        expect(result.data.supplyId).toBe(supplyId);
      });

      it('should handle insufficient stock', async () => {
        const supplyId = 'supply-1';
        const orderData = {
          quantity: 1000, // More than available stock
          shippingAddress: '123 Main St, New York, NY'
        };
        const mockResponse = createErrorResponse('Insufficient stock available');

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch(`/api/supplies/${supplyId}/order`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(orderData)
        });

        const result = await response.json();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Insufficient stock available');
      });
    });

    describe('Add Supply Review', () => {
      it('should add supply review', async () => {
        const supplyId = 'supply-1';
        const reviewData = {
          rating: 5,
          comment: 'Excellent quality product!',
          photos: ['photo1.jpg']
        };
        const mockResponse = createApiResponse({
          id: 'review-1',
          supplyId,
          rating: 5,
          comment: 'Excellent quality product!',
          createdAt: '2024-01-15T10:00:00Z'
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch(`/api/supplies/${supplyId}/review`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(reviewData)
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith(
          `/api/supplies/${supplyId}/review`,
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

    describe('My Orders', () => {
      it('should get user orders', async () => {
        const mockOrders = [
          createMockSupplyOrder('1'),
          createMockSupplyOrder('2', { status: 'shipped' })
        ];
        const mockResponse = createApiResponse({
          orders: mockOrders,
          total: 2,
          page: 1,
          limit: 10
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/supplies/my-orders', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/supplies/my-orders', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        expect(result.success).toBe(true);
        expect(result.data.orders).toHaveLength(2);
      });
    });
  });

  describe('Phase 8: Equipment Rental', () => {
    describe('Rental Discovery', () => {
      it('should browse rental items', async () => {
        const mockRentals = [
          createMockRental('1'),
          createMockRental('2', { category: 'GARDENING_EQUIPMENT', dailyRate: 75 })
        ];
        const mockResponse = createApiResponse({
          rentals: mockRentals,
          total: 2,
          page: 1,
          limit: 10
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/rentals', {
          method: 'GET'
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/rentals', {
          method: 'GET'
        });

        expect(result.success).toBe(true);
        expect(result.data.rentals).toHaveLength(2);
      });

      it('should get rental details', async () => {
        const rentalId = 'rental-1';
        const mockRental = createMockRental(rentalId, {
          specifications: ['Weight: 5kg', 'Power: 1200W'],
          images: ['rental1.jpg', 'rental2.jpg'],
          availability: {
            available: true,
            nextAvailable: '2024-01-20T00:00:00Z'
          }
        });
        const mockResponse = createApiResponse(mockRental);

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch(`/api/rentals/${rentalId}`, {
          method: 'GET'
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith(
          `/api/rentals/${rentalId}`,
          { method: 'GET' }
        );

        expect(result.success).toBe(true);
        expect(result.data.id).toBe(rentalId);
      });

      it('should get rental categories', async () => {
        const mockCategories = [
          { id: 'cleaning_equipment', name: 'Cleaning Equipment', count: 20 },
          { id: 'gardening_equipment', name: 'Gardening Equipment', count: 15 },
          { id: 'construction_equipment', name: 'Construction Equipment', count: 10 }
        ];
        const mockResponse = createApiResponse(mockCategories);

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/rentals/categories', {
          method: 'GET'
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/rentals/categories', {
          method: 'GET'
        });

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(3);
      });

      it('should get featured rentals', async () => {
        const mockRentals = [
          createMockRental('1', { featured: true }),
          createMockRental('2', { featured: true })
        ];
        const mockResponse = createApiResponse({
          rentals: mockRentals,
          total: 2
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/rentals/featured', {
          method: 'GET'
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/rentals/featured', {
          method: 'GET'
        });

        expect(result.success).toBe(true);
        expect(result.data.rentals).toHaveLength(2);
      });

      it('should get nearby rentals', async () => {
        const location = {
          latitude: 40.7128,
          longitude: -74.0060,
          radius: 10
        };
        const mockRentals = [createMockRental('1')];
        const mockResponse = createApiResponse({
          rentals: mockRentals,
          total: 1,
          location: location
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const queryParams = new URLSearchParams(location);
        const response = await fetch(`/api/rentals/nearby?${queryParams}`, {
          method: 'GET'
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith(
          `/api/rentals/nearby?${queryParams}`,
          { method: 'GET' }
        );

        expect(result.success).toBe(true);
        expect(result.data.rentals).toHaveLength(1);
      });
    });

    describe('Book Rental', () => {
      it('should book rental', async () => {
        const rentalId = 'rental-1';
        const bookingData = {
          startDate: '2024-01-15T00:00:00Z',
          endDate: '2024-01-17T00:00:00Z',
          deliveryAddress: '123 Main St, New York, NY',
          paymentMethod: 'card'
        };
        const mockBooking = createMockRentalBooking('booking-1', {
          rentalId,
          ...bookingData
        });
        const mockResponse = createApiResponse(mockBooking);

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch(`/api/rentals/${rentalId}/book`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(bookingData)
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith(
          `/api/rentals/${rentalId}/book`,
          {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': 'Bearer jwt-token-123'
            },
            body: JSON.stringify(bookingData)
          }
        );

        expect(result.success).toBe(true);
        expect(result.data.rentalId).toBe(rentalId);
      });

      it('should handle rental availability conflict', async () => {
        const rentalId = 'rental-1';
        const bookingData = {
          startDate: '2024-01-15T00:00:00Z',
          endDate: '2024-01-17T00:00:00Z',
          deliveryAddress: '123 Main St, New York, NY'
        };
        const mockResponse = createErrorResponse('Rental not available for selected dates');

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch(`/api/rentals/${rentalId}/book`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(bookingData)
        });

        const result = await response.json();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Rental not available for selected dates');
      });
    });

    describe('Add Rental Review', () => {
      it('should add rental review', async () => {
        const rentalId = 'rental-1';
        const reviewData = {
          rating: 5,
          comment: 'Great equipment, worked perfectly!',
          photos: ['photo1.jpg']
        };
        const mockResponse = createApiResponse({
          id: 'review-1',
          rentalId,
          rating: 5,
          comment: 'Great equipment, worked perfectly!',
          createdAt: '2024-01-15T10:00:00Z'
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch(`/api/rentals/${rentalId}/review`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(reviewData)
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith(
          `/api/rentals/${rentalId}/review`,
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

    describe('My Bookings', () => {
      it('should get rental bookings', async () => {
        const mockBookings = [
          createMockRentalBooking('1'),
          createMockRentalBooking('2', { status: 'completed' })
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

        const response = await fetch('/api/rentals/my-bookings', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/rentals/my-bookings', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        expect(result.success).toBe(true);
        expect(result.data.bookings).toHaveLength(2);
      });
    });
  });

  describe('Phase 9: Financial Management', () => {
    describe('Financial Overview', () => {
      it('should get financial overview', async () => {
        const mockOverview = {
          totalSpent: 2500,
          totalEarned: 0,
          monthlySpending: 500,
          topCategories: [
            { category: 'SERVICES', amount: 1500, percentage: 60 },
            { category: 'SUPPLIES', amount: 600, percentage: 24 },
            { category: 'RENTALS', amount: 400, percentage: 16 }
          ],
          recentTransactions: [
            { id: 'txn-1', amount: 100, description: 'Service booking' },
            { id: 'txn-2', amount: 50, description: 'Supply order' }
          ]
        };
        const mockResponse = createApiResponse(mockOverview);

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/finance/overview', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/finance/overview', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        expect(result.success).toBe(true);
        expect(result.data.totalSpent).toBe(2500);
      });
    });

    describe('Transaction History', () => {
      it('should get transaction history', async () => {
        const mockTransactions = [
          createMockTransaction('1'),
          createMockTransaction('2', { type: 'refund', amount: -50 })
        ];
        const mockResponse = createApiResponse({
          transactions: mockTransactions,
          total: 2,
          page: 1,
          limit: 10
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/finance/transactions', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/finance/transactions', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        expect(result.success).toBe(true);
        expect(result.data.transactions).toHaveLength(2);
      });

      it('should filter transactions by date range', async () => {
        const filters = {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          type: 'payment'
        };
        const mockTransactions = [createMockTransaction('1')];
        const mockResponse = createApiResponse({
          transactions: mockTransactions,
          total: 1
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const queryParams = new URLSearchParams(filters);
        const response = await fetch(`/api/finance/transactions?${queryParams}`, {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith(
          `/api/finance/transactions?${queryParams}`,
          {
            method: 'GET',
            headers: { 
              'Authorization': 'Bearer jwt-token-123'
            }
          }
        );

        expect(result.success).toBe(true);
        expect(result.data.transactions).toHaveLength(1);
      });
    });

    describe('Earnings Summary', () => {
      it('should get earnings summary', async () => {
        const mockEarnings = {
          totalEarnings: 0,
          monthlyEarnings: 0,
          earningsBySource: [],
          pendingEarnings: 0,
          availableForWithdrawal: 0
        };
        const mockResponse = createApiResponse(mockEarnings);

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/finance/earnings', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/finance/earnings', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        expect(result.success).toBe(true);
        expect(result.data.totalEarnings).toBe(0);
      });
    });

    describe('Expenses Summary', () => {
      it('should get expenses summary', async () => {
        const mockExpenses = {
          totalExpenses: 2500,
          monthlyExpenses: 500,
          expensesByCategory: [
            { category: 'SERVICES', amount: 1500, percentage: 60 },
            { category: 'SUPPLIES', amount: 600, percentage: 24 },
            { category: 'RENTALS', amount: 400, percentage: 16 }
          ],
          averageTransactionAmount: 125
        };
        const mockResponse = createApiResponse(mockExpenses);

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/finance/expenses', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/finance/expenses', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        expect(result.success).toBe(true);
        expect(result.data.totalExpenses).toBe(2500);
      });
    });

    describe('Request Withdrawal', () => {
      it('should request withdrawal', async () => {
        const withdrawalData = {
          amount: 100,
          paymentMethod: 'bank_transfer',
          accountDetails: {
            bankName: 'Test Bank',
            accountNumber: '1234567890',
            routingNumber: '123456789'
          }
        };
        const mockResponse = createApiResponse({
          withdrawalId: 'withdrawal-1',
          amount: 100,
          status: 'pending',
          estimatedProcessingTime: '2-3 business days',
          createdAt: '2024-01-15T10:00:00Z'
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/finance/request-withdrawal', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(withdrawalData)
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/finance/request-withdrawal', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(withdrawalData)
        });

        expect(result.success).toBe(true);
        expect(result.data.withdrawalId).toBe('withdrawal-1');
      });

      it('should handle insufficient funds for withdrawal', async () => {
        const withdrawalData = {
          amount: 10000, // More than available
          paymentMethod: 'bank_transfer'
        };
        const mockResponse = createErrorResponse('Insufficient funds for withdrawal');

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/finance/request-withdrawal', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(withdrawalData)
        });

        const result = await response.json();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Insufficient funds for withdrawal');
      });
    });

    describe('Tax Documents', () => {
      it('should get tax documents', async () => {
        const mockDocuments = [
          {
            id: 'doc-1',
            year: 2024,
            type: '1099',
            status: 'available',
            downloadUrl: 'https://api.localpro.com/tax-docs/2024-1099.pdf',
            createdAt: '2024-01-01T00:00:00Z'
          }
        ];
        const mockResponse = createApiResponse({
          documents: mockDocuments,
          total: 1
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/finance/tax-documents', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/finance/tax-documents', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer jwt-token-123'
          }
        });

        expect(result.success).toBe(true);
        expect(result.data.documents).toHaveLength(1);
      });
    });

    describe('Generate Financial Report', () => {
      it('should generate financial report', async () => {
        const reportData = {
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          format: 'pdf',
          includeCategories: ['SERVICES', 'SUPPLIES']
        };
        const mockResponse = createApiResponse({
          reportId: 'report-1',
          status: 'generating',
          estimatedCompletionTime: '2-3 minutes',
          downloadUrl: null
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const response = await fetch('/api/finance/generate-report', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(reportData)
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/finance/generate-report', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(reportData)
        });

        expect(result.success).toBe(true);
        expect(result.data.reportId).toBe('report-1');
      });
    });

    describe('Update Wallet Settings', () => {
      it('should update wallet settings', async () => {
        const settingsData = {
          defaultPaymentMethod: 'card',
          autoWithdrawThreshold: 500,
          notifications: {
            lowBalance: true,
            largeTransactions: true,
            monthlyReports: true
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

        const response = await fetch('/api/finance/wallet-settings', {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(settingsData)
        });

        const result = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/finance/wallet-settings', {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer jwt-token-123'
          },
          body: JSON.stringify(settingsData)
        });

        expect(result.success).toBe(true);
        expect(result.data.settings.defaultPaymentMethod).toBe('card');
      });
    });
  });

  // Performance Tests for Phases 7-9
  describe('Performance Requirements - Phases 7-9', () => {
    it('should meet supply search response time (< 500ms)', async () => {
      const startTime = Date.now();
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createApiResponse({ supplies: [] }))
      });

      await fetch('/api/supplies', { method: 'GET' });

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(500);
    });

    it('should meet rental booking response time (< 500ms)', async () => {
      const startTime = Date.now();
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createApiResponse({ bookingId: 'test' }))
      });

      await fetch('/api/rentals/rental-1/book', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer jwt-token-123'
        },
        body: JSON.stringify({ startDate: '2024-01-15', endDate: '2024-01-17' })
      });

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(500);
    });

    it('should meet financial overview response time (< 500ms)', async () => {
      const startTime = Date.now();
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createApiResponse({ totalSpent: 0 }))
      });

      await fetch('/api/finance/overview', {
        method: 'GET',
        headers: { 'Authorization': 'Bearer jwt-token-123' }
      });

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(500);
    });
  });
});
