import { NextRequest, NextResponse } from "next/server";

// GET /api/supplies-simple - Get supplies for public marketplace browsing
export async function GET(request: NextRequest) {
  try {
    console.log("API: Fetching supplies (simple)...");
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const location = searchParams.get('location');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const rating = searchParams.get('rating');
    const sortBy = searchParams.get('sortBy');
    const sortOrder = searchParams.get('sortOrder');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');

    console.log("API: Query parameters:", { 
      category, type, status, search, location, minPrice, maxPrice, 
      rating, sortBy, sortOrder, page, limit 
    });

    // Mock supplies data for development
    const mockSupplies = [
      {
        _id: '1',
        name: 'Professional Cleaning Kit - Complete Set',
        description: 'Complete cleaning kit with all essential tools and supplies for professional cleaning services. Includes premium quality products.',
        category: 'cleaning',
        type: 'cleaning',
        status: 'available',
        price: 89.99,
        originalPrice: 119.99,
        unit: 'set',
        stock: 45,
        minOrder: 1,
        maxOrder: 10,
        location: {
          address: '123 Supply Street',
          city: 'New York',
          state: 'NY',
          zipCode: '10001'
        },
        images: ['/api/placeholder/400/300', '/api/placeholder/400/300'],
        features: ['Professional Grade', 'Eco-Friendly', 'Long Lasting', 'Easy to Use'],
        specifications: {
          brand: 'CleanPro',
          weight: '5.2 kg',
          dimensions: '40cm x 30cm x 15cm',
          material: 'Premium Plastic',
          color: 'Blue',
          warranty: '1 year'
        },
        supplier: {
          _id: '1',
          name: 'Professional Supply Co.',
          rating: 4.8,
          reviewCount: 156,
          verified: true,
          location: 'New York, NY'
        },
        delivery: {
          available: true,
          estimatedDays: 2,
          cost: 9.99,
          freeShippingThreshold: 100
        },
        rating: {
          average: 4.8,
          count: 24
        },
        viewsCount: 342,
        isFeatured: true,
        isFavorited: false,
        tags: ['cleaning', 'professional', 'kit', 'eco-friendly'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '2',
        name: 'Heavy Duty Drill Set - 20 Piece',
        description: 'Professional grade drill set with various bits and accessories. Perfect for construction and maintenance work.',
        category: 'tools',
        type: 'tools',
        status: 'available',
        price: 149.99,
        unit: 'set',
        stock: 12,
        minOrder: 1,
        maxOrder: 5,
        location: {
          address: '456 Tool Avenue',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90210'
        },
        images: ['/api/placeholder/400/300'],
        features: ['Heavy Duty', 'Professional Grade', 'Durable', 'Versatile'],
        specifications: {
          brand: 'ToolMaster',
          model: 'HD-20',
          weight: '3.5 kg',
          dimensions: '35cm x 25cm x 10cm',
          material: 'Steel',
          color: 'Black',
          warranty: '2 years'
        },
        supplier: {
          _id: '2',
          name: 'Tool Supply Depot',
          rating: 4.6,
          reviewCount: 89,
          verified: true,
          location: 'Los Angeles, CA'
        },
        delivery: {
          available: true,
          estimatedDays: 3,
          cost: 15.99,
          freeShippingThreshold: 200
        },
        rating: {
          average: 4.6,
          count: 18
        },
        viewsCount: 198,
        isFeatured: false,
        isFavorited: true,
        tags: ['tools', 'drill', 'construction', 'professional'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '3',
        name: 'Monthly Cleaning Subscription Box',
        description: 'Monthly subscription box with curated cleaning supplies delivered to your door. Perfect for regular maintenance.',
        category: 'maintenance',
        type: 'subscription',
        status: 'available',
        price: 29.99,
        unit: 'box',
        stock: 999,
        minOrder: 1,
        maxOrder: 12,
        location: {
          address: '789 Subscription Lane',
          city: 'Chicago',
          state: 'IL',
          zipCode: '60601'
        },
        images: ['/api/placeholder/400/300', '/api/placeholder/400/300', '/api/placeholder/400/300'],
        features: ['Monthly Delivery', 'Curated Selection', 'Eco-Friendly', 'Flexible'],
        specifications: {
          brand: 'CleanBox',
          weight: '2.1 kg',
          dimensions: '30cm x 20cm x 15cm',
          material: 'Mixed',
          color: 'Various',
          warranty: 'Monthly'
        },
        supplier: {
          _id: '3',
          name: 'Subscription Supply Co.',
          rating: 4.9,
          reviewCount: 234,
          verified: true,
          location: 'Chicago, IL'
        },
        delivery: {
          available: true,
          estimatedDays: 1,
          cost: 0,
          freeShippingThreshold: 0
        },
        rating: {
          average: 4.9,
          count: 45
        },
        viewsCount: 567,
        isFeatured: true,
        isFavorited: false,
        tags: ['subscription', 'monthly', 'cleaning', 'convenient'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '4',
        name: 'Safety Equipment Bundle',
        description: 'Complete safety equipment set including hard hats, safety glasses, gloves, and reflective vests.',
        category: 'safety',
        type: 'equipment',
        status: 'available',
        price: 79.99,
        unit: 'set',
        stock: 25,
        minOrder: 1,
        maxOrder: 8,
        location: {
          address: '321 Safety Drive',
          city: 'Houston',
          state: 'TX',
          zipCode: '77001'
        },
        images: ['/api/placeholder/400/300'],
        features: ['OSHA Compliant', 'High Visibility', 'Durable', 'Comfortable'],
        specifications: {
          brand: 'SafeGuard',
          weight: '2.8 kg',
          dimensions: '25cm x 20cm x 15cm',
          material: 'Mixed',
          color: 'Orange/Yellow',
          warranty: '6 months'
        },
        supplier: {
          _id: '4',
          name: 'Safety First Supply',
          rating: 4.7,
          reviewCount: 67,
          verified: true,
          location: 'Houston, TX'
        },
        delivery: {
          available: true,
          estimatedDays: 2,
          cost: 12.99,
          freeShippingThreshold: 150
        },
        rating: {
          average: 4.7,
          count: 12
        },
        viewsCount: 89,
        isFeatured: false,
        isFavorited: false,
        tags: ['safety', 'equipment', 'construction', 'osha'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '5',
        name: 'Office Supplies Starter Pack',
        description: 'Essential office supplies including pens, notebooks, folders, and desk organizers.',
        category: 'office',
        type: 'materials',
        status: 'available',
        price: 45.99,
        unit: 'pack',
        stock: 60,
        minOrder: 1,
        maxOrder: 15,
        location: {
          address: '654 Office Plaza',
          city: 'Miami',
          state: 'FL',
          zipCode: '33101'
        },
        images: ['/api/placeholder/400/300'],
        features: ['Complete Set', 'Quality Materials', 'Organized', 'Professional'],
        specifications: {
          brand: 'OfficePro',
          weight: '1.5 kg',
          dimensions: '30cm x 25cm x 10cm',
          material: 'Mixed',
          color: 'Various',
          warranty: '30 days'
        },
        supplier: {
          _id: '5',
          name: 'Office Supply Central',
          rating: 4.5,
          reviewCount: 43,
          verified: true,
          location: 'Miami, FL'
        },
        delivery: {
          available: true,
          estimatedDays: 1,
          cost: 8.99,
          freeShippingThreshold: 75
        },
        rating: {
          average: 4.5,
          count: 8
        },
        viewsCount: 156,
        isFeatured: false,
        isFavorited: false,
        tags: ['office', 'supplies', 'stationery', 'professional'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // Apply filters
    let filteredSupplies = mockSupplies;

    if (search) {
      const searchLower = search.toLowerCase();
      filteredSupplies = filteredSupplies.filter(supply => 
        supply.name.toLowerCase().includes(searchLower) ||
        supply.description.toLowerCase().includes(searchLower) ||
        supply.category.toLowerCase().includes(searchLower) ||
        supply.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    if (category) {
      filteredSupplies = filteredSupplies.filter(supply => 
        supply.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (type) {
      filteredSupplies = filteredSupplies.filter(supply => 
        supply.type.toLowerCase() === type.toLowerCase()
      );
    }

    if (status) {
      filteredSupplies = filteredSupplies.filter(supply => 
        supply.status.toLowerCase() === status.toLowerCase()
      );
    }

    if (location) {
      const locationLower = location.toLowerCase();
      filteredSupplies = filteredSupplies.filter(supply => 
        supply.location.city.toLowerCase().includes(locationLower) ||
        supply.location.state.toLowerCase().includes(locationLower)
      );
    }

    if (minPrice) {
      const min = parseFloat(minPrice);
      filteredSupplies = filteredSupplies.filter(supply => supply.price >= min);
    }

    if (maxPrice) {
      const max = parseFloat(maxPrice);
      filteredSupplies = filteredSupplies.filter(supply => supply.price <= max);
    }

    if (rating) {
      const minRating = parseFloat(rating);
      filteredSupplies = filteredSupplies.filter(supply => 
        supply.rating.average >= minRating
      );
    }

    // Apply sorting
    if (sortBy) {
      filteredSupplies.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortBy) {
          case 'price':
            aValue = a.price;
            bValue = b.price;
            break;
          case 'rating.average':
            aValue = a.rating.average;
            bValue = b.rating.average;
            break;
          case 'name':
            aValue = a.name;
            bValue = b.name;
            break;
          case 'createdAt':
          default:
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
            break;
        }
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    }

    // Apply pagination
    const total = filteredSupplies.length;
    const pages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedSupplies = filteredSupplies.slice(startIndex, endIndex);

    console.log(`API: Returning ${paginatedSupplies.length} supplies (page ${page}/${pages})`);

    return NextResponse.json({
      success: true,
      data: paginatedSupplies,
      pagination: {
        current: page,
        pages: pages,
        total: total,
        limit: limit,
        count: paginatedSupplies.length
      }
    });

  } catch (error) {
    console.error('Supplies Simple API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch supplies data',
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}
