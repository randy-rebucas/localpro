import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mock PayMaya configuration validation - replace with actual validation
    const validation = {
      isValid: true,
      environment: 'sandbox',
      publicKey: {
        isValid: true,
        format: 'pk_test_***',
        environment: 'sandbox'
      },
      secretKey: {
        isValid: true,
        format: 'sk_test_***',
        environment: 'sandbox'
      },
      webhookUrl: {
        isValid: true,
        url: 'https://api.localpro.com/webhooks/paymaya',
        accessible: true
      },
      lastTested: new Date().toISOString(),
      testTransaction: {
        success: true,
        transactionId: 'test_txn_123',
        amount: 1.00,
        status: 'success'
      }
    };

    return NextResponse.json({
      success: true,
      data: validation
    });

  } catch (error) {
    console.error('PayMaya config validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate PayMaya configuration' },
      { status: 500 }
    );
  }
}
