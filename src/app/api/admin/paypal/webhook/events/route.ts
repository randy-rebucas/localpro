import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const event = searchParams.get('event');
    const status = searchParams.get('status');

    // Mock PayPal webhook events data - replace with actual database queries
    const webhookEvents = [
      {
        id: '1',
        event: 'PAYMENT.SALE.COMPLETED',
        orderId: 'order_123',
        amount: 299.99,
        status: 'processed',
        processed: true,
        createdAt: new Date().toISOString(),
        processedAt: new Date().toISOString()
      },
      {
        id: '2',
        event: 'PAYMENT.SALE.DENIED',
        orderId: 'order_456',
        amount: 149.99,
        status: 'processed',
        processed: true,
        createdAt: new Date().toISOString(),
        processedAt: new Date().toISOString()
      },
      {
        id: '3',
        event: 'CHECKOUT.ORDER.APPROVED',
        orderId: 'order_789',
        amount: 199.99,
        status: 'pending',
        processed: false,
        createdAt: new Date().toISOString(),
        processedAt: null
      }
    ];

    const filteredEvents = webhookEvents.filter(eventData => {
      if (event && eventData.event !== event) return false;
      if (status && eventData.status !== status) return false;
      return true;
    });

    const total = filteredEvents.length;
    const paginatedEvents = filteredEvents.slice(
      (page - 1) * limit,
      page * limit
    );

    return NextResponse.json({
      success: true,
      data: paginatedEvents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('PayPal webhook events error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhook events' },
      { status: 500 }
    );
  }
}
