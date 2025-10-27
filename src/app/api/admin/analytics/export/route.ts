import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { makeAuthenticatedRequestWithEndpoint, handleApiRoute } from '@/lib/api-auth-utils';
import { API_ENDPOINTS } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';
    const period = searchParams.get('period') || '30d';
    const format = searchParams.get('format') || 'csv';

    // Fetch analytics data for export
    const result = await handleApiRoute(async () => {
      let endpoint: string;
      switch (type) {
        case 'user':
          endpoint = 'analyticsUser';
          break;
        case 'marketplace':
          endpoint = 'analyticsMarketplace';
          break;
        case 'jobs':
          endpoint = 'analyticsJobs';
          break;
        case 'referrals':
          endpoint = 'analyticsReferrals';
          break;
        case 'agencies':
          endpoint = 'analyticsAgencies';
          break;
        default:
          endpoint = 'analyticsOverview';
      }

      const response = await makeAuthenticatedRequestWithEndpoint(
        request,
        endpoint as keyof typeof API_ENDPOINTS,
        { 
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch ${type} analytics: ${response.status}`);
      }

      const analyticsData = await response.json();
      return analyticsData.data || analyticsData;
    }, "Analytics export");

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Convert data to CSV format
    if (format === 'csv') {
      const csvData = convertToCSV(result.data, type);
      const headers = new Headers();
      headers.set('Content-Type', 'text/csv');
      headers.set('Content-Disposition', `attachment; filename="analytics-${type}-${period}.csv"`);
      
      return new NextResponse(csvData, {
        status: 200,
        headers
      });
    }

    // Return JSON format
    return NextResponse.json({
      success: true,
      data: result.data,
      period,
      type,
      exportedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analytics export error:', error);
    return NextResponse.json(
      { error: 'Failed to export analytics data' },
      { status: 500 }
    );
  }
}

function convertToCSV(data: Record<string, unknown>, type: string): string {
  const headers = [];
  const rows = [];

  switch (type) {
    case 'overview':
      headers.push('Metric', 'Value', 'Growth Rate', 'Timestamp');
      rows.push([
        'Total Users',
        data.totalUsers || 0,
        data.growthRate || 0,
        new Date().toISOString()
      ]);
      rows.push([
        'Active Users',
        data.activeUsers || 0,
        '',
        new Date().toISOString()
      ]);
      rows.push([
        'Total Revenue',
        data.totalRevenue || 0,
        '',
        new Date().toISOString()
      ]);
      rows.push([
        'Total Services',
        data.totalServices || 0,
        '',
        new Date().toISOString()
      ]);
      rows.push([
        'Total Bookings',
        data.totalBookings || 0,
        '',
        new Date().toISOString()
      ]);
      rows.push([
        'Average Rating',
        data.averageRating || 0,
        '',
        new Date().toISOString()
      ]);
      break;

    case 'marketplace':
      headers.push('Metric', 'Value', 'Timestamp');
      if (data.marketplaceStats) {
        const marketplaceStats = data.marketplaceStats as Record<string, unknown>;
        rows.push(['Total Listings', marketplaceStats.totalListings || 0, new Date().toISOString()]);
        rows.push(['Active Listings', marketplaceStats.activeListings || 0, new Date().toISOString()]);
        rows.push(['Completed Bookings', marketplaceStats.completedBookings || 0, new Date().toISOString()]);
        rows.push(['Pending Bookings', marketplaceStats.pendingBookings || 0, new Date().toISOString()]);
        rows.push(['Total Earnings', marketplaceStats.totalEarnings || 0, new Date().toISOString()]);
        rows.push(['Average Booking Value', marketplaceStats.averageBookingValue || 0, new Date().toISOString()]);
      }
      break;

    case 'jobs':
      headers.push('Metric', 'Value', 'Timestamp');
      if (data.jobStats) {
        const jobStats = data.jobStats as Record<string, unknown>;
        rows.push(['Total Jobs', jobStats.totalJobs || 0, new Date().toISOString()]);
        rows.push(['Active Jobs', jobStats.activeJobs || 0, new Date().toISOString()]);
        rows.push(['Completed Jobs', jobStats.completedJobs || 0, new Date().toISOString()]);
        rows.push(['Total Applications', jobStats.totalApplications || 0, new Date().toISOString()]);
        rows.push(['Average Application Rate', jobStats.averageApplicationRate || 0, new Date().toISOString()]);
      }
      break;

    case 'referrals':
      headers.push('Metric', 'Value', 'Timestamp');
      if (data.referralStats) {
        const referralStats = data.referralStats as Record<string, unknown>;
        rows.push(['Total Referrals', referralStats.totalReferrals || 0, new Date().toISOString()]);
        rows.push(['Successful Referrals', referralStats.successfulReferrals || 0, new Date().toISOString()]);
        rows.push(['Total Rewards', referralStats.totalRewards || 0, new Date().toISOString()]);
        rows.push(['Conversion Rate', referralStats.conversionRate || 0, new Date().toISOString()]);
      }
      break;

    case 'agencies':
      headers.push('Metric', 'Value', 'Timestamp');
      if (data.agencyStats) {
        const agencyStats = data.agencyStats as Record<string, unknown>;
        rows.push(['Total Agencies', agencyStats.totalAgencies || 0, new Date().toISOString()]);
        rows.push(['Active Agencies', agencyStats.activeAgencies || 0, new Date().toISOString()]);
        rows.push(['Total Providers', agencyStats.totalProviders || 0, new Date().toISOString()]);
        rows.push(['Agency Revenue', agencyStats.totalRevenue || 0, new Date().toISOString()]);
      }
      break;

    default:
      headers.push('Metric', 'Value', 'Timestamp');
      rows.push(['No data available', '', new Date().toISOString()]);
  }

  // Convert to CSV format
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
}
