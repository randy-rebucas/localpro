import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute, makeAuthenticatedRequestWithEndpoint } from "@/lib/api-auth-utils";

export async function GET(request: NextRequest) {
  const result = await handleApiRoute(async () => {
    try {
      // Fetch subscription usage from external API
      const response = await makeAuthenticatedRequestWithEndpoint(
        request,
        'localProPlusUsage',
        { method: 'GET' }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch subscription usage');
      }

      const usage = await response.json();
      return usage;
    } catch (error) {
      console.warn('External usage API not available, using fallback data:', error);
      
      // Fallback to mock usage data
      const mockUsage = {
        currentPeriod: {
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-01-31T23:59:59Z',
          servicesUsed: 45,
          servicesLimit: 100,
          storageUsed: 2.5, // GB
          storageLimit: 10, // GB
          apiCallsUsed: 1250,
          apiCallsLimit: 5000,
          bandwidthUsed: 15.8, // GB
          bandwidthLimit: 50 // GB
        },
        historicalUsage: [
          {
            period: '2023-12-01 to 2023-12-31',
            servicesUsed: 38,
            storageUsed: 1.8,
            apiCallsUsed: 980,
            bandwidthUsed: 12.3
          },
          {
            period: '2023-11-01 to 2023-11-30',
            servicesUsed: 42,
            storageUsed: 2.1,
            apiCallsUsed: 1100,
            bandwidthUsed: 14.2
          }
        ],
        limits: {
          services: 100,
          storage: 10, // GB
          apiCalls: 5000,
          bandwidth: 50 // GB
        },
        overages: {
          services: 0,
          storage: 0,
          apiCalls: 0,
          bandwidth: 0
        }
      };

      return mockUsage;
    }
  }, "Plus subscription usage");

  if (result.error) {
    return NextResponse.json(
      { error: result.error, details: result.details },
      { status: result.status }
    );
  }

  return NextResponse.json({ success: true, data: result.data });
}
