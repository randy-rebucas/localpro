import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { makeAuthenticatedRequestWithPath, makeAuthenticatedRequestWithEndpoint, handleApiRoute } from '@/lib/api-auth-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    // Mock data for development when external API is not available
    const mockAds = [
      {
        id: '1',
        title: 'Premium Hardware Store - Downtown',
        description: 'Your one-stop shop for all hardware needs. Quality tools, materials, and expert advice.',
        category: 'Hardware Stores',
        type: 'featured-listing',
        status: 'active',
        budget: 5000,
        spent: 1250,
        targetAudience: ['contractors', 'homeowners', 'professionals'],
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        images: ['/api/placeholder/400/300'],
        clickCount: 245,
        impressionCount: 12500,
        ctr: 1.96,
        cpc: 2.50,
        cpm: 15.00,
        advertiser: {
          id: '1',
          name: 'Downtown Hardware',
          verified: true
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPromoted: true,
        priority: 'high',
        tags: ['hardware', 'tools', 'materials'],
        location: {
          city: 'New York',
          state: 'NY',
          country: 'USA'
        }
      },
      {
        id: '2',
        title: 'Professional Cleaning Services',
        description: 'Reliable and thorough cleaning services for offices and homes.',
        category: 'Cleaning Services',
        type: 'sponsored-product',
        status: 'active',
        budget: 3000,
        spent: 850,
        targetAudience: ['businesses', 'homeowners'],
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        images: ['/api/placeholder/400/300'],
        clickCount: 180,
        impressionCount: 8500,
        ctr: 2.12,
        cpc: 1.80,
        cpm: 12.00,
        advertiser: {
          id: '2',
          name: 'CleanPro Services',
          verified: true
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPromoted: false,
        priority: 'medium',
        tags: ['cleaning', 'professional', 'reliable'],
        location: {
          city: 'Los Angeles',
          state: 'CA',
          country: 'USA'
        }
      },
      {
        id: '3',
        title: 'Electrical Training Academy',
        description: 'Certified electrical training programs for professionals.',
        category: 'Training Schools',
        type: 'training-school',
        status: 'pending',
        budget: 2000,
        spent: 0,
        targetAudience: ['electricians', 'students', 'professionals'],
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        images: ['/api/placeholder/400/300'],
        clickCount: 0,
        impressionCount: 0,
        ctr: 0,
        cpc: 0,
        cpm: 0,
        advertiser: {
          id: '3',
          name: 'ElectroTech Academy',
          verified: false
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPromoted: false,
        priority: 'low',
        tags: ['training', 'electrical', 'certification'],
        location: {
          city: 'Chicago',
          state: 'IL',
          country: 'USA'
        }
      }
    ];

    // Try to fetch real ads data from external API first
    try {
      const result = await handleApiRoute(async () => {
        if (type === 'ads') {
          // Fetch ads with query parameters
          const queryParams: Record<string, string> = {};
          if (status) queryParams.status = status;
          if (category) queryParams.category = category;
          queryParams.page = page.toString();
          queryParams.limit = limit.toString();

          const response = await makeAuthenticatedRequestWithPath(
            request,
            'ads',
            [],
            queryParams,
            { method: 'GET' }
          );

          if (!response.ok) {
            throw new Error(`Failed to fetch ads: ${response.status}`);
          }

          const adsData = await response.json();
          return {
            data: adsData.data || adsData,
            pagination: adsData.pagination || {
              page,
              limit,
              total: adsData.total || 0,
              pages: Math.ceil((adsData.total || 0) / limit)
            }
          };
        } else {
          // Fetch ads overview/statistics
          const response = await makeAuthenticatedRequestWithEndpoint(
            request,
            'adsAnalytics',
            { method: 'GET' }
          );

          if (!response.ok) {
            throw new Error(`Failed to fetch ads statistics: ${response.status}`);
          }

          const statsData = await response.json();
          return {
            data: statsData.data || statsData,
            pagination: undefined
          };
        }
      }, "Ads data");

      if (result.error) {
        throw new Error(result.error);
      }

      const { data, pagination } = result.data || { data: null, pagination: null };

      return NextResponse.json({
        success: true,
        data,
        pagination
      });
    } catch (apiError) {
      console.log('External API not available, using mock data:', apiError);
      
      // Filter mock data based on query parameters
      let filteredAds = [...mockAds];
      
      if (status && status !== 'All Status') {
        filteredAds = filteredAds.filter(ad => ad.status === status.toLowerCase());
      }
      
      if (category && category !== 'All Categories') {
        filteredAds = filteredAds.filter(ad => ad.category === category);
      }

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedAds = filteredAds.slice(startIndex, endIndex);

      return NextResponse.json({
        success: true,
        data: paginatedAds,
        pagination: {
          page,
          limit,
          total: filteredAds.length,
          pages: Math.ceil(filteredAds.length / limit)
        }
      });
    }

  } catch (error) {
    console.error('Ads API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ads data' },
      { status: 500 }
    );
  }
}