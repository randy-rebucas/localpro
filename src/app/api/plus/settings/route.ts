import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute, makeAuthenticatedRequestWithEndpoint } from "@/lib/api-auth-utils";

export async function GET(request: NextRequest) {
  const result = await handleApiRoute(async () => {
    try {
      // Fetch subscription settings from external API
      const response = await makeAuthenticatedRequestWithEndpoint(
        request,
        'localProPlusSettings',
        { method: 'GET' }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch subscription settings');
      }

      const settings = await response.json();
      return settings;
    } catch (error) {
      console.warn('External settings API not available, using fallback data:', error);
      
      // Fallback to mock settings data
      const mockSettings = {
        autoRenew: true,
        paymentMethod: 'credit_card',
        billingAddress: {
          street: '123 Main St',
          city: 'Manila',
          state: 'NCR',
          zipCode: '1000',
          country: 'Philippines'
        },
        notifications: {
          email: true,
          sms: false,
          push: true
        },
        preferences: {
          currency: 'PHP',
          timezone: 'Asia/Manila',
          language: 'en'
        }
      };

      return mockSettings;
    }
  }, "Plus subscription settings");

  if (result.error) {
    return NextResponse.json(
      { error: result.error, details: result.details },
      { status: result.status }
    );
  }

  return NextResponse.json({ success: true, data: result.data });
}

export async function PUT(request: NextRequest) {
  const result = await handleApiRoute(async () => {
    const body = await request.json();

    // Update subscription settings via external API
    const response = await makeAuthenticatedRequestWithEndpoint(
      request,
      'localProPlusSettings',
      {
        method: 'PUT',
        body: JSON.stringify({
          autoRenew: body.autoRenew,
          paymentMethod: body.paymentMethod,
          billingAddress: body.billingAddress,
          notifications: body.notifications,
          preferences: body.preferences
        })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update subscription settings');
    }

    const updatedSettings = await response.json();
    return updatedSettings;
  }, "Update plus subscription settings");

  if (result.error) {
    return NextResponse.json(
      { error: result.error, details: result.details },
      { status: result.status }
    );
  }

  return NextResponse.json({ success: true, data: result.data });
}
