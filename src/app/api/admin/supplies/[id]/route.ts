import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { makeAuthenticatedRequestWithPath, handleApiRoute } from '@/lib/api-auth-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const result = await handleApiRoute(async () => {
      const response = await makeAuthenticatedRequestWithPath(
        request,
        'suppliesById',
        [id],
        {},
        { method: 'GET' }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch supply: ${response.status}`);
      }

      return await response.json();
    }, "Supply details");

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Supply details API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supply details' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const result = await handleApiRoute(async () => {
      const response = await makeAuthenticatedRequestWithPath(
        request,
        'suppliesById',
        [id],
        {},
        {
          method: 'PUT',
          body: JSON.stringify(body)
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update supply: ${response.status}`);
      }

      return await response.json();
    }, "Supply update");

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Supply update API error:', error);
    return NextResponse.json(
      { error: 'Failed to update supply' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const result = await handleApiRoute(async () => {
      const response = await makeAuthenticatedRequestWithPath(
        request,
        'suppliesById',
        [id],
        {},
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete supply: ${response.status}`);
      }

      return await response.json();
    }, "Supply deletion");

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Supply deleted successfully'
    });

  } catch (error) {
    console.error('Supply deletion API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete supply' },
      { status: 500 }
    );
  }
}
