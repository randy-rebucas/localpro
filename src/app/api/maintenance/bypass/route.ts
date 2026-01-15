import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const key = searchParams.get('key');

  // Check if maintenance mode is enabled
  const maintenanceMode = process.env.ENABLE_MAINTENANCE_MODE === 'true';
  if (!maintenanceMode) {
    return NextResponse.json({ error: 'Maintenance mode is not enabled' }, { status: 400 });
  }

  // Verify bypass key if set
  const bypassKey = process.env.MAINTENANCE_BYPASS_KEY;
  if (bypassKey && key !== bypassKey) {
    return NextResponse.json({ error: 'Invalid bypass key' }, { status: 401 });
  }

  if (action === 'enable') {
    // Set bypass cookie for 24 hours
    const response = NextResponse.json({
      success: true,
      message: 'Maintenance bypass enabled for 24 hours'
    });

    response.cookies.set('maintenance_bypass', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    });

    return response;
  }

  if (action === 'disable') {
    // Remove bypass cookie
    const response = NextResponse.json({
      success: true,
      message: 'Maintenance bypass disabled'
    });

    response.cookies.set('maintenance_bypass', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    });

    return response;
  }

  return NextResponse.json({ error: 'Invalid action. Use ?action=enable or ?action=disable' }, { status: 400 });
}