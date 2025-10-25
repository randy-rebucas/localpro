import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';

    // TODO: Implement actual database query
    // For now, return mock data structure
    const mockAds = [
      {
        _id: '1',
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
          _id: '1',
          firstName: 'John',
          lastName: 'Smith',
          email: 'john@downtownhardware.com',
          isVerified: true,
          profile: {
            company: 'Downtown Hardware'
          }
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
        _id: '2',
        title: 'Professional Cleaning Services',
        description: 'Reliable and thorough cleaning services for offices and homes.',
        category: 'Cleaning Services',
        type: 'sponsored-product',
        status: 'pending',
        budget: 3000,
        spent: 0,
        targetAudience: ['businesses', 'homeowners'],
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        images: ['/api/placeholder/400/300'],
        clickCount: 0,
        impressionCount: 0,
        ctr: 0,
        cpc: 0,
        cpm: 0,
        advertiser: {
          _id: '2',
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'sarah@cleanpro.com',
          isVerified: false,
          profile: {
            company: 'CleanPro Services'
          }
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
        _id: '3',
        title: 'Electrical Training Academy',
        description: 'Certified electrical training programs for professionals.',
        category: 'Training Schools',
        type: 'training-school',
        status: 'rejected',
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
          _id: '3',
          firstName: 'Mike',
          lastName: 'Wilson',
          email: 'mike@electrotech.com',
          isVerified: false,
          profile: {
            company: 'ElectroTech Academy'
          }
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
        },
        rejectionReason: 'Incomplete documentation'
      }
    ];

    // Apply filters
    let filteredAds = mockAds;

    if (search) {
      filteredAds = filteredAds.filter(ad => 
        ad.title.toLowerCase().includes(search.toLowerCase()) ||
        ad.description.toLowerCase().includes(search.toLowerCase()) ||
        `${ad.advertiser.firstName} ${ad.advertiser.lastName}`.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (category && category !== 'all') {
      filteredAds = filteredAds.filter(ad => ad.category === category);
    }

    if (status && status !== 'all') {
      filteredAds = filteredAds.filter(ad => ad.status === status);
    }

    if (type && type !== 'all') {
      filteredAds = filteredAds.filter(ad => ad.type === type);
    }

    // Calculate pagination
    const total = filteredAds.length;
    const pages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedAds = filteredAds.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: paginatedAds,
      count: paginatedAds.length,
      total,
      page,
      pages,
      limit
    });

  } catch (error) {
    console.error('Error fetching admin ads:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch ads',
        message: 'An error occurred while fetching advertisements'
      },
      { status: 500 }
    );
  }
}
