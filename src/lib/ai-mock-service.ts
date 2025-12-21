/**
 * Mock AI Service Implementation
 * Provides fallback AI functionality while backend services are being developed
 * This can be replaced with real AI service calls once the backend is ready
 */

import {
  NaturalLanguageSearchParams,
  NaturalLanguageSearchResult,
  ServiceRecommendationParams,
  ServiceRecommendation,
  PriceEstimateParams,
  PriceEstimate,
  ServiceMatchParams,
  ServiceMatch,
  ReviewSentimentParams,
  ReviewSentiment,
  BookingAssistantParams,
  BookingSuggestion,
  DescriptionGeneratorParams,
  GeneratedDescription,
  DescriptionFromTitleParams,
  DescriptionFromTitleResponse,
  RentalDescriptionParams,
  RentalDescriptionResponse,
  BioGeneratorParams,
  GeneratedBio,
  PricingOptimizerParams,
  PricingRecommendation,
  DemandForecastParams,
  DemandForecast,
  ReviewInsightsParams,
  ReviewInsights,
  ResponseAssistantParams,
  GeneratedResponse,
  ListingOptimizerParams,
  ListingOptimization,
  SchedulingAssistantParams,
  SchedulingRecommendation,
  FormPrefillerParams,
  PrefilledFormData
} from './ai-utils';
import { logger } from './logger';

// Mock data and utilities
const MOCK_SERVICES = [
  {
    _id: '1',
    id: '1',
    title: 'Professional Cleaning Service',
    name: 'Professional Cleaning Service',
    description: 'Comprehensive cleaning services for homes and offices',
    pricing: { basePrice: 1500, currency: 'PHP' },
    provider: { firstName: 'Juan', name: 'Juan dela Cruz' },
    rating: { average: 4.8, count: 25 },
    location: 'Makati City'
  },
  {
    _id: '2',
    id: '2',
    title: 'Electrical Repair & Installation',
    name: 'Electrical Repair & Installation',
    description: 'Expert electrical services for residential and commercial properties',
    pricing: { basePrice: 2000, currency: 'PHP' },
    provider: { firstName: 'Maria', name: 'Maria Santos' },
    rating: { average: 4.9, count: 18 },
    location: 'Quezon City'
  },
  {
    _id: '3',
    id: '3',
    title: 'Plumbing Services',
    name: 'Plumbing Services',
    description: 'Professional plumbing repairs and installations',
    pricing: { basePrice: 1200, currency: 'PHP' },
    provider: { firstName: 'Pedro', name: 'Pedro Garcia' },
    rating: { average: 4.7, count: 32 },
    location: 'Manila'
  }
];

const MOCK_CATEGORIES = ['cleaning', 'electrical', 'plumbing', 'carpentry', 'painting', 'landscaping'];

// Utility functions
function getRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateMockPrice(basePrice: number): { min: number; max: number; average: number } {
  const variation = basePrice * 0.2; // 20% variation
  const min = Math.max(500, basePrice - variation);
  const max = basePrice + variation;
  const average = (min + max) / 2;
  return { min: Math.round(min), max: Math.round(max), average: Math.round(average) };
}

// Mock AI Service Implementation
export class MockAIService {
  // Natural Language Search
  static async naturalLanguageSearch(params: NaturalLanguageSearchParams): Promise<NaturalLanguageSearchResult> {
    logger.debug('Mock AI: Processing natural language search', { query: params.query });

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Mock interpretation based on query keywords
    const query = params.query.toLowerCase();
    let category = '';
    let estimatedPrice = 0;
    let confidence = 0.8;

    if (query.includes('clean')) {
      category = 'cleaning';
      estimatedPrice = 1500;
    } else if (query.includes('electric') || query.includes('wiring')) {
      category = 'electrical';
      estimatedPrice = 2000;
    } else if (query.includes('plumb')) {
      category = 'plumbing';
      estimatedPrice = 1200;
    } else {
      category = getRandomElements(MOCK_CATEGORIES, 1)[0];
      estimatedPrice = 1000 + Math.random() * 2000;
      confidence = 0.6;
    }

    const priceRange = generateMockPrice(estimatedPrice);
    const relevantServices = MOCK_SERVICES.filter(service =>
      service.description.toLowerCase().includes(category) ||
      service.title.toLowerCase().includes(category)
    );

    return {
      success: true,
      message: 'Search completed successfully',
      data: {
        services: relevantServices,
        aiAnalysis: {
          estimatedPrice,
          priceRange: { min: priceRange.min, max: priceRange.max },
          currency: 'PHP',
          confidence,
          factors: ['Service complexity', 'Location', 'Time of day', 'Provider experience']
        },
        query: params.query,
        count: relevantServices.length
      },
      filters: {
        category,
        minPrice: priceRange.min,
        maxPrice: priceRange.max,
        location: params.location
      },
      interpretedQuery: `Looking for ${category} services`,
      confidence
    };
  }

  // Service Recommendations
  static async getServiceRecommendations(params: ServiceRecommendationParams): Promise<ServiceRecommendation[]> {
    logger.debug('Mock AI: Generating service recommendations', params);

    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

    const recommendations = MOCK_SERVICES.slice(0, params.limit || 5).map((service, index) => ({
      service,
      score: 0.9 - (index * 0.1),
      reasons: [
        'High customer satisfaction',
        'Good location match',
        'Competitive pricing',
        'Verified provider'
      ],
      matchFactors: {
        pastBookings: Math.random() * 0.5,
        location: Math.random() * 0.8,
        preferences: Math.random() * 0.6,
        similarUsers: Math.random() * 0.4
      }
    }));

    return recommendations;
  }

  // Price Estimation
  static async estimatePrice(params: PriceEstimateParams): Promise<PriceEstimate> {
    logger.debug('Mock AI: Estimating service price', params);

    await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 1800));

    let basePrice = 1000;
    const factors = ['Service complexity', 'Location premium', 'Time requirements'];

    // Adjust price based on category and complexity
    if (params.serviceType.toLowerCase().includes('cleaning')) {
      basePrice = 1500;
      if (params.complexity === 'complex') basePrice *= 1.5;
    } else if (params.serviceType.toLowerCase().includes('electrical')) {
      basePrice = 2000;
      factors.push('Electrical certification required');
    } else if (params.serviceType.toLowerCase().includes('plumbing')) {
      basePrice = 1200;
      factors.push('Emergency plumbing surcharge');
    }

    const priceRange = generateMockPrice(basePrice);

    return {
      success: true,
      message: 'Price estimation completed',
      data: {
        estimate: {
          estimatedPrice: priceRange.average,
          priceRange: { min: priceRange.min, max: priceRange.max },
          currency: 'PHP',
          confidence: 0.85,
          factors
        },
        marketData: {
          averagePrice: basePrice,
          priceRange: { min: basePrice * 0.8, max: basePrice * 1.2 },
          sampleSize: 25
        },
        aiConfidence: 'high'
      }
    };
  }

  // Service Matching
  static async matchService(params: ServiceMatchParams): Promise<ServiceMatch[]> {
    logger.debug('Mock AI: Matching services', params);

    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500));

    const matches = MOCK_SERVICES.slice(0, 3).map((service, index) => ({
      service,
      matchScore: 0.9 - (index * 0.15),
      reasons: [
        'Service type matches your requirements',
        'Provider has good reviews',
        'Available in your area'
      ],
      estimatedPrice: service.pricing?.basePrice || 1000,
      estimatedDuration: 120, // minutes
      _count: 3
    }));

    return matches;
  }

  // Review Sentiment Analysis
  static async analyzeReviewSentiment(params: ReviewSentimentParams): Promise<ReviewSentiment> {
    logger.debug('Mock AI: Analyzing review sentiment', { serviceId: params.serviceId });

    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));

    return {
      overallSentiment: 'positive',
      sentimentScore: 0.85,
      themes: [
        { theme: 'Service Quality', sentiment: 'positive', mentions: 12, examples: ['Great work!', 'Very professional'] },
        { theme: 'Communication', sentiment: 'positive', mentions: 8, examples: ['Good communication', 'Responsive'] },
        { theme: 'Punctuality', sentiment: 'neutral', mentions: 5, examples: ['On time most days'] }
      ],
      strengths: ['Professional service', 'Good communication', 'Quality work'],
      weaknesses: ['Occasional delays', 'Pricing could be clearer'],
      summary: 'Overall positive sentiment with strong emphasis on service quality and professionalism.'
    };
  }

  // Booking Assistant
  static async getBookingSuggestions(params: BookingAssistantParams): Promise<BookingSuggestion[]> {
    logger.debug('Mock AI: Generating booking suggestions', params);

    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1000));

    const suggestions: BookingSuggestion[] = [
      {
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
        time: '09:00',
        reason: 'Optimal time based on your schedule and provider availability',
        confidence: 0.9,
        providerAvailability: true
      },
      {
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        time: '14:00',
        reason: 'Alternative time with good availability',
        confidence: 0.8,
        providerAvailability: true
      }
    ];

    return suggestions;
  }

  // Description Generator
  static async generateServiceDescription(params: DescriptionGeneratorParams): Promise<GeneratedDescription> {
    logger.debug('Mock AI: Generating service description', params);

    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

    return {
      title: params.title || `${params.serviceType} Service`,
      description: `Professional ${params.serviceType} services tailored to your needs. Our experienced team provides high-quality service with attention to detail and customer satisfaction.`,
      shortDescription: `Expert ${params.serviceType} services you can trust.`,
      keywords: [params.serviceType, 'professional', 'quality', 'reliable'],
      seoSuggestions: ['Include location in title', 'Add service highlights', 'Mention experience']
    };
  }

  // Description From Title
  static async generateDescriptionFromTitle(params: DescriptionFromTitleParams): Promise<DescriptionFromTitleResponse> {
    logger.debug('Mock AI: Generating description from title', params);

    await new Promise(resolve => setTimeout(resolve, 1800 + Math.random() * 2200));

    return {
      success: true,
      message: 'Description generated successfully',
      data: {
        title: params.title,
        description: `Comprehensive ${params.title.toLowerCase()} services designed to meet your specific needs. Our professional team ensures quality workmanship and customer satisfaction.`,
        keyFeatures: ['Professional service', 'Quality materials', 'Timely completion'],
        benefits: ['Peace of mind', 'Expert craftsmanship', 'Reliable service'],
        tags: params.title.toLowerCase().split(' ').slice(0, 3),
        wordCount: 45
      }
    };
  }

  // Rental Description
  static async generateRentalDescription(params: RentalDescriptionParams): Promise<RentalDescriptionResponse> {
    logger.debug('Mock AI: Generating rental description', params);

    await new Promise(resolve => setTimeout(resolve, 1600 + Math.random() * 2000));

    return {
      success: true,
      message: 'Rental description generated successfully',
      data: {
        title: params.title,
        name: params.name || params.title,
        description: `High-quality ${params.title.toLowerCase()} available for rent. Perfect for professional use with reliable performance and maintenance.`,
        keyFeatures: ['Professional grade', 'Well maintained', 'Easy to use'],
        benefits: ['Cost effective', 'Reliable equipment', 'Expert support'],
        tags: ['rental', 'equipment', params.category].filter(Boolean),
        wordCount: 38
      }
    };
  }

  // Bio Generator
  static async generateBio(params: BioGeneratorParams): Promise<GeneratedBio> {
    logger.debug('Mock AI: Generating bio', params);

    await new Promise(resolve => setTimeout(resolve, 1400 + Math.random() * 1600));

    const skillsText = params.skills.join(', ');
    const experienceText = params.experience ? `with ${params.experience} years of experience ` : '';

    return {
      bio: `Professional service provider ${experienceText}specializing in ${skillsText}. Committed to delivering high-quality work and excellent customer service.`,
      suggestions: [
        'Consider mentioning specific certifications',
        'Add information about service areas',
        'Include response time commitments'
      ]
    };
  }

  // Pricing Optimizer
  static async optimizePricing(params: PricingOptimizerParams): Promise<PricingRecommendation> {
    logger.debug('Mock AI: Optimizing pricing', params);

    await new Promise(resolve => setTimeout(resolve, 1800 + Math.random() * 2200));

    const currentPrice = params.currentPrice;
    const recommendedPrice = Math.round(currentPrice * (0.95 + Math.random() * 0.1)); // ±5% variation

    return {
      recommendedPrice: {
        min: Math.round(recommendedPrice * 0.9),
        optimal: recommendedPrice,
        max: Math.round(recommendedPrice * 1.1),
        currency: 'PHP'
      },
      currentMarketAverage: Math.round(currentPrice * 1.05),
      competitiveness: Math.random() > 0.5 ? 'medium' : 'high',
      factors: [
        { factor: 'Market demand', impact: 0.2, recommendation: 'Slight price increase justified' },
        { factor: 'Competitor pricing', impact: -0.1, recommendation: 'Monitor competitor rates' },
        { factor: 'Service quality', impact: 0.15, recommendation: 'Premium pricing supported by reviews' }
      ],
      expectedImpact: {
        bookings: { change: 5, percentage: 8 },
        revenue: { change: recommendedPrice - currentPrice, percentage: ((recommendedPrice - currentPrice) / currentPrice) * 100 }
      }
    };
  }

  // Demand Forecast
  static async getDemandForecast(params: DemandForecastParams): Promise<DemandForecast> {
    logger.debug('Mock AI: Generating demand forecast', params);

    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

    const forecast = [];
    for (let i = 0; i < 7; i++) {
      forecast.push({
        date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
        predictedDemand: Math.round(50 + Math.random() * 50),
        confidence: 0.7 + Math.random() * 0.25,
        factors: ['Weather conditions', 'Seasonal trends', 'Local events']
      });
    }

    return {
      forecast,
      trends: {
        overall: 'stable',
        seasonalFactors: ['Weekend demand higher', 'Weather-dependent services'],
        recommendations: ['Schedule more staff on weekends', 'Offer weather-related promotions']
      },
      peakPeriods: [
        { period: 'Weekends', expectedDemand: 75, recommendation: 'Increase staffing' },
        { period: 'Weekday afternoons', expectedDemand: 65, recommendation: 'Optimize scheduling' }
      ]
    };
  }

  // Review Insights
  static async getReviewInsights(params: ReviewInsightsParams): Promise<ReviewInsights> {
    logger.debug('Mock AI: Generating review insights', params);

    await new Promise(resolve => setTimeout(resolve, 2200 + Math.random() * 2800));

    return {
      summary: {
        totalReviews: 47,
        averageRating: 4.6,
        sentimentTrend: 'improving'
      },
      themes: [
        { theme: 'Service Quality', frequency: 0.35, sentiment: 'positive', mentions: 16, examples: ['Excellent work', 'Very satisfied'] },
        { theme: 'Communication', frequency: 0.25, sentiment: 'positive', mentions: 12, examples: ['Good communication', 'Responsive'] },
        { theme: 'Punctuality', frequency: 0.20, sentiment: 'neutral', mentions: 9, examples: ['Usually on time'] }
      ],
      strengths: ['Professional service delivery', 'Good customer communication', 'Quality workmanship'],
      improvements: [
        { area: 'Response time', mentionCount: 5, priority: 'medium', suggestions: ['Implement faster response system', 'Set clear response time expectations'] },
        { area: 'Pricing transparency', mentionCount: 3, priority: 'low', suggestions: ['Provide detailed quotes upfront', 'Explain pricing factors clearly'] }
      ]
    };
  }

  // Response Assistant
  static async generateResponse(params: ResponseAssistantParams): Promise<GeneratedResponse> {
    logger.debug('Mock AI: Generating response', params);

    await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 1800));

    return {
      response: `Thank you for your inquiry. I'd be happy to help with your ${params.context?.bookingId ? 'booking' : 'request'}. I'll review the details and get back to you within 2 hours with a detailed proposal.`,
      alternatives: [
        'I appreciate your interest in our services. Let me check my availability and provide you with options.',
        'Thank you for reaching out. I can assist you with this request. Could you please provide more details about your specific needs?'
      ],
      suggestedActions: ['Send detailed quote', 'Schedule consultation call', 'Check availability']
    };
  }

  // Listing Optimizer
  static async optimizeListing(params: ListingOptimizerParams): Promise<ListingOptimization> {
    logger.debug('Mock AI: Optimizing listing', params);

    await new Promise(resolve => setTimeout(resolve, 2500 + Math.random() * 3500));

    return {
      currentScore: 75,
      maxScore: 100,
      improvements: [
        {
          area: 'Title',
          current: 'Service',
          suggested: 'Professional Service with 5+ Years Experience',
          impact: 'high',
          reason: 'More specific titles rank better in searches'
        },
        {
          area: 'Description',
          current: 'Basic description',
          suggested: 'Add more details about your experience and service guarantees',
          impact: 'medium',
          reason: 'Detailed descriptions build trust and improve conversion'
        },
        {
          area: 'Photos',
          current: 'Limited photos',
          suggested: 'Add before/after photos and team photos',
          impact: 'high',
          reason: 'Visual proof increases booking rates by 40%'
        }
      ],
      seoScore: { current: 65, potential: 85, keywords: ['professional', 'experienced', 'reliable'] },
      visibilityScore: { current: 70, potential: 90, factors: ['Title optimization', 'Keyword usage', 'Photo quality'] }
    };
  }

  // Scheduling Assistant
  static async getSchedulingRecommendations(params: SchedulingAssistantParams): Promise<SchedulingRecommendation[]> {
    logger.debug('Mock AI: Generating scheduling recommendations', params);

    await new Promise(resolve => setTimeout(resolve, 1600 + Math.random() * 2400));

    const recommendations = [];
    for (let i = 0; i < 3; i++) {
      const date = new Date(Date.now() + (i + 1) * 86400000);
      recommendations.push({
        date: date.toISOString().split('T')[0],
        timeSlots: [
          { start: '09:00', end: '11:00', score: 0.85 - i * 0.1, reason: 'High efficiency period' },
          { start: '14:00', end: '16:00', score: 0.80 - i * 0.1, reason: 'Good availability window' }
        ],
        optimization: {
          travelTime: Math.round(15 + Math.random() * 30),
          efficiency: Math.round(80 + Math.random() * 15),
          revenue: Math.round(2000 + Math.random() * 1000)
        },
        suggestions: ['Minimize travel between jobs', 'Schedule similar services together', 'Allow buffer time for unexpected delays']
      });
    }

    return recommendations;
  }

  // Form Prefiller
  static async prefillServiceForm(params: FormPrefillerParams): Promise<PrefilledFormData> {
    logger.debug('Mock AI: Prefilling service form', params);

    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

    return {
      title: 'Professional Cleaning Service',
      description: 'Comprehensive cleaning services for homes and offices with attention to detail and eco-friendly products.',
      category: 'cleaning',
      subcategory: 'house_cleaning',
      serviceType: 'residential_cleaning',
      teamSize: 2,
      pricing: { type: 'hourly', basePrice: 1500, currency: 'PHP' },
      estimatedDuration: { min: 120, max: 240 },
      serviceArea: ['Makati', 'Taguig', ' BGC'],
      features: ['Eco-friendly products', 'Experienced staff', 'Satisfaction guarantee'],
      requirements: ['Access to property', 'Water and electricity', 'Parking space'],
      equipmentProvided: true,
      materialsIncluded: true,
      warranty: { hasWarranty: true, duration: 30, description: '30-day satisfaction guarantee' },
      insurance: { covered: true, coverageAmount: 100000 },
      emergencyService: { available: true, surcharge: 500, responseTime: '2-4 hours' },
      servicePackages: [
        { name: 'Basic Cleaning', description: 'Essential cleaning services', price: 1200, features: ['Vacuuming', 'Dusting', 'Bathroom cleaning'] },
        { name: 'Deep Cleaning', description: 'Thorough cleaning of all areas', price: 2000, features: ['Basic package', 'Inside appliances', 'Window cleaning'] }
      ],
      addOns: [
        { name: 'Carpet Cleaning', description: 'Deep carpet cleaning service', price: 800, category: 'cleaning' },
        { name: 'Upholstery Cleaning', description: 'Furniture and upholstery cleaning', price: 600, category: 'cleaning' }
      ],
      availability: {
        timezone: 'Asia/Manila',
        schedule: [
          { day: 'Monday', startTime: '08:00', endTime: '18:00', isAvailable: true },
          { day: 'Tuesday', startTime: '08:00', endTime: '18:00', isAvailable: true },
          { day: 'Wednesday', startTime: '08:00', endTime: '18:00', isAvailable: true },
          { day: 'Thursday', startTime: '08:00', endTime: '18:00', isAvailable: true },
          { day: 'Friday', startTime: '08:00', endTime: '18:00', isAvailable: true },
          { day: 'Saturday', startTime: '09:00', endTime: '17:00', isAvailable: true },
          { day: 'Sunday', startTime: '09:00', endTime: '15:00', isAvailable: false }
        ]
      }
    };
  }
}

// Export the mock service as the default AI service for now
export default MockAIService;
