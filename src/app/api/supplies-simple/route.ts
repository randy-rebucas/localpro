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

    // Return empty data - external API integration needed
    const filteredSupplies: Array<{
      id: string;
      name: string;
      description: string;
      category: string;
      type: string;
      status: string;
      price: number;
      location: string;
      rating: number;
      tags: string[];
      createdAt: string;
      updatedAt: string;
    }> = [];

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
