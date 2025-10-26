import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { makeAuthenticatedRequestWithEndpoint, handleApiRoute } from '@/lib/api-auth-utils';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      confirm = false,
      backup = true 
    } = body;

    if (!confirm) {
      return NextResponse.json(
        { error: 'Confirmation required for flush operation' },
        { status: 400 }
      );
    }

    // Flush all logs from external API
    const result = await handleApiRoute(async () => {
      const flushData = {
        confirm,
        backup
      };

      const response = await makeAuthenticatedRequestWithEndpoint(
        request,
        'logsFlush',
        { 
          method: 'POST',
          body: JSON.stringify(flushData)
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to flush logs: ${response.status}`);
      }

      const flushResult = await response.json();
      return flushResult.data || flushResult;
    }, "Logs flush");

    if (result.error) {
      return NextResponse.json(
        { error: result.error, details: result.details },
        { status: result.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Admin logs flush API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Alternative flush method using DELETE
    const result = await handleApiRoute(async () => {
      const response = await makeAuthenticatedRequestWithEndpoint(
        request,
        'logsFlush',
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error(`Failed to flush logs: ${response.status}`);
      }

      const flushResult = await response.json();
      return flushResult.data || flushResult;
    }, "Logs flush (DELETE)");

    if (result.error) {
      return NextResponse.json(
        { error: result.error, details: result.details },
        { status: result.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Admin logs flush API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
