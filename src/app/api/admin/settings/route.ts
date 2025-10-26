import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { makeAuthenticatedRequestWithEndpoint, handleApiRoute } from '@/lib/api-auth-utils';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin role
    const userRole = session.user?.role;
    if (!userRole || !['admin', 'agency_admin'].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Fetch settings from external API using API constants
    const result = await handleApiRoute(async () => {
      const response = await makeAuthenticatedRequestWithEndpoint(
        request,
        'settingsApp',
        { method: 'GET' }
      );
      return await response.json();
    }, "Admin settings");

    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error, details: result.details },
        { status: result.status }
      );
    }

    // Return structured settings data
    return NextResponse.json({
      success: true,
      data: {
        general: {
          maintenanceMode: {
            enabled: false,
            message: "The app is currently under maintenance. Please try again later."
          },
          forceUpdate: {
            enabled: false,
            minVersion: "1.0.0",
            message: "Please update to the latest version to continue using the app."
          },
          appName: "LocalPro Super App",
          appVersion: "1.0.0",
          environment: "development"
        },
        business: {
          companyAddress: {
            street: "123 Business Street",
            city: "Manila",
            state: "Metro Manila",
            zipCode: "1000",
            country: "Philippines"
          },
          businessHours: {
            timezone: "Asia/Manila",
            schedule: [
              { day: "monday", startTime: "09:00", endTime: "18:00", isOpen: true, _id: "68f7265e60f48a4fd66ef034" },
              { day: "tuesday", startTime: "09:00", endTime: "18:00", isOpen: true, _id: "68f7265e60f48a4fd66ef035" },
              { day: "wednesday", startTime: "09:00", endTime: "18:00", isOpen: true, _id: "68f7265e60f48a4fd66ef036" },
              { day: "thursday", startTime: "09:00", endTime: "18:00", isOpen: true, _id: "68f7265e60f48a4fd66ef037" },
              { day: "friday", startTime: "09:00", endTime: "18:00", isOpen: true, _id: "68f7265e60f48a4fd66ef038" },
              { day: "saturday", startTime: "10:00", endTime: "16:00", isOpen: true, _id: "68f7265e60f48a4fd66ef039" },
              { day: "sunday", startTime: "10:00", endTime: "16:00", isOpen: false, _id: "68f7265e60f48a4fd66ef03a" }
            ]
          },
          supportChannels: {
            email: { enabled: true, address: "support@localpro.com" },
            phone: { enabled: true, number: "+63-XXX-XXX-XXXX" },
            chat: { hours: { start: "09:00", end: "18:00" }, enabled: true }
          },
          companyName: "LocalPro Super App",
          companyEmail: "support@localpro.com",
          companyPhone: "+63-XXX-XXX-XXXX"
        },
        features: {
          marketplace: { enabled: true, allowNewProviders: true, requireVerification: true },
          academy: { enabled: true, allowNewCourses: true, requireInstructorVerification: true },
          jobBoard: { enabled: true, allowNewJobs: true, requireCompanyVerification: true },
          referrals: { enabled: true, rewardAmount: 100, maxReferralsPerUser: 50 },
          payments: {
            paypal: { enabled: true },
            paymaya: { enabled: true },
            gcash: { enabled: true },
            bankTransfer: { enabled: true }
          },
          analytics: { enabled: true, trackUserBehavior: true, trackPerformance: true }
        },
        security: {
          passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: true,
            maxLoginAttempts: 5,
            lockoutDuration: 15
          },
          sessionSettings: {
            maxSessionDuration: 24,
            allowMultipleSessions: true,
            maxConcurrentSessions: 3
          },
          dataProtection: {
            encryptSensitiveData: true,
            dataRetentionPeriod: 365,
            allowDataExport: true,
            allowDataDeletion: true
          }
        },
        rateLimiting: {
          api: { windowMs: 900000, maxRequests: 100 },
          auth: { windowMs: 900000, maxRequests: 5 },
          upload: { windowMs: 3600000, maxRequests: 10 }
        },
        uploads: {
          imageCompression: { enabled: true, quality: 80 },
          maxFileSize: 10485760,
          allowedImageTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
          allowedDocumentTypes: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
          maxImagesPerUpload: 10
        },
        notifications: {
          email: { enabled: true, provider: "nodemailer", fromEmail: "noreply@localpro.com", fromName: "LocalPro Super App" },
          sms: { enabled: true, provider: "twilio", fromNumber: "+1234567890" },
          push: { enabled: true, provider: "firebase" }
        },
        payments: {
          transactionFees: { percentage: 2.9, fixed: 0.3 },
          payoutSchedule: { frequency: "weekly", dayOfWeek: 1, dayOfMonth: 1 },
          defaultCurrency: "PHP",
          supportedCurrencies: ["PHP", "USD", "EUR", "GBP"],
          minimumPayout: 100
        },
        analytics: {
          googleAnalytics: { enabled: false },
          mixpanel: { enabled: false },
          customAnalytics: { enabled: true, retentionPeriod: 365 }
        },
        integrations: {
          googleMaps: { enabled: true, defaultZoom: 13 },
          cloudinary: { enabled: true },
          socialLogin: { google: { enabled: false }, facebook: { enabled: false } }
        }
      }
    });

  } catch (error) {
    console.error('Admin settings GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin role
    const userRole = session.user?.role;
    if (!userRole || !['admin', 'agency_admin'].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { category, settings } = body;

    if (!category || !settings) {
      return NextResponse.json(
        { success: false, error: 'Category and settings are required' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = [
      'general', 'features', 'security', 'api', 
      'notifications', 'payment', 'storage', 'monitoring'
    ];
    
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Update settings via external API using API constants
    const result = await handleApiRoute(async () => {
      const response = await makeAuthenticatedRequestWithEndpoint(
        request,
        'settingsAppUpdate',
        {
          method: 'PUT',
          body: JSON.stringify({
            category,
            settings
          })
        }
      );
      return await response.json();
    }, `Update ${category} settings`);

    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error, details: result.details },
        { status: result.status }
      );
    }

    // Log the settings update for audit purposes
    console.log(`Settings updated by ${session.user?.id} (${session.user?.role}):`, {
      category,
      timestamp: new Date().toISOString(),
      changes: Object.keys(settings)
    });

    return NextResponse.json({
      success: true,
      message: `${category} settings updated successfully`,
      data: result.data
    });

  } catch (error) {
    console.error('Admin settings PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin role
    const userRole = session.user?.role;
    if (!userRole || !['admin', 'agency_admin'].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'reset':
        // Reset all settings to default
        const resetResult = await handleApiRoute(async () => {
          const response = await makeAuthenticatedRequestWithEndpoint(
            request,
            'settingsApp',
            {
              method: 'POST',
              body: JSON.stringify({ action: 'reset' })
            }
          );
          return await response.json();
        }, "Reset settings to default");

        if (resetResult.error) {
          return NextResponse.json(
            { success: false, error: resetResult.error, details: resetResult.details },
            { status: resetResult.status }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Settings reset to default values'
        });

      case 'export':
        // Export current settings
        const exportResult = await handleApiRoute(async () => {
          const response = await makeAuthenticatedRequestWithEndpoint(
            request,
            'settingsApp',
            { method: 'GET' }
          );
          return await response.json();
        }, "Export settings");

        if (exportResult.error) {
          return NextResponse.json(
            { success: false, error: exportResult.error, details: exportResult.details },
            { status: exportResult.status }
          );
        }

        return NextResponse.json({
          success: true,
          data: exportResult.data,
          filename: `localpro-settings-${new Date().toISOString().split('T')[0]}.json`
        });

      case 'import':
        // Import settings from JSON
        const { settingsData } = body;
        if (!settingsData) {
          return NextResponse.json(
            { success: false, error: 'Settings data is required for import' },
            { status: 400 }
          );
        }

        const importResult = await handleApiRoute(async () => {
          const response = await makeAuthenticatedRequestWithEndpoint(
            request,
            'settingsAppUpdate',
            {
              method: 'PUT',
              body: JSON.stringify(settingsData)
            }
          );
          return await response.json();
        }, "Import settings");

        if (importResult.error) {
          return NextResponse.json(
            { success: false, error: importResult.error, details: importResult.details },
            { status: importResult.status }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Settings imported successfully'
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Admin settings POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
