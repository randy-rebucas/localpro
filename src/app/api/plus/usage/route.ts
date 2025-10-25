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
          servicesUsed: 15,
          servicesLimit: 25,
          storageUsed: 1.2, // GB
          storageLimit: 5, // GB
          apiCallsUsed: 850,
          apiCallsLimit: 2000,
          bandwidthUsed: 8.5, // GB
          bandwidthLimit: 20 // GB
        },
        historicalUsage: [
          {
            period: '2023-12-01 to 2023-12-31',
            servicesUsed: 12,
            storageUsed: 0.8,
            apiCallsUsed: 650,
            bandwidthUsed: 6.2
          },
          {
            period: '2023-11-01 to 2023-11-30',
            servicesUsed: 18,
            storageUsed: 1.1,
            apiCallsUsed: 920,
            bandwidthUsed: 9.1
          }
        ],
        limits: {
          services: 25,
          storage: 5, // GB
          apiCalls: 2000,
          bandwidth: 20 // GB
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