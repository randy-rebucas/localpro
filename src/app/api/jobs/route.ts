import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";
import { makeAuthenticatedRequestWithPath } from "@/lib/api-auth-utils";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    console.log("Jobs API: Session:", session?.user?.email);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const location = searchParams.get("location") || "";
    const available = searchParams.get("available");
    const minBudget = searchParams.get("minBudget");
    const maxBudget = searchParams.get("maxBudget");
    const skills = searchParams.get("skills");
    const sort = searchParams.get("sort") || "relevance";

    console.log("Jobs API: Query params:", {
      search,
      category,
      location,
      available,
      minBudget,
      maxBudget,
      skills,
      sort
    });

    // Build query parameters for external API
    const queryParams = new URLSearchParams();
    if (search) queryParams.append("search", search);
    if (category) queryParams.append("category", category);
    if (location) queryParams.append("location", location);
    if (available) queryParams.append("available", available);
    if (minBudget) queryParams.append("minBudget", minBudget);
    if (maxBudget) queryParams.append("maxBudget", maxBudget);
    if (skills) queryParams.append("skills", skills);
    if (sort) queryParams.append("sort", sort);

    // Make request to external API using proper authentication with API constants
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const response = await makeAuthenticatedRequestWithPath(
      request,
      'jobs',
      [],
      Object.fromEntries(queryParams.entries()),
      { method: 'GET' }
    );

    if (!response.ok) {
      console.error("External API error:", response.status, response.statusText);
      return NextResponse.json(
        { 
          error: `External service error: ${response.status}`,
          errorMessage: `Failed to fetch jobs from external service`
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Jobs API: External API response:", data);

    // Return the data from external API
    return NextResponse.json({
      jobs: data.jobs || data || [],
      total: data.total || (Array.isArray(data) ? data.length : 0),
      page: data.page || 1,
      limit: data.limit || 20
    });

  } catch (error) {
    console.error("Jobs API: Error fetching jobs:", error);
    
    let errorMessage = "Internal server error";
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = "Request timeout - the external service is taking too long to respond";
        statusCode = 504;
      } else if (error.message.includes('fetch failed')) {
        errorMessage = "Unable to connect to external service - please try again later";
        statusCode = 503;
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        errorStack: error instanceof Error ? error.stack : undefined
      },
      { status: statusCode }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("Jobs API: Creating job:", body);

    // Make request to external API using proper authentication with API constants
    const response = await makeAuthenticatedRequestWithPath(
      request,
      'jobs',
      [],
      {},
      {
        method: 'POST',
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      console.error("External API error:", response.status, response.statusText);
      return NextResponse.json(
        { 
          error: `External service error: ${response.status}`,
          errorMessage: `Failed to create job in external service`
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Jobs API: External API response:", data);

    return NextResponse.json(data, { status: 201 });

  } catch (error) {
    console.error("Jobs API: Error creating job:", error);
    
    let errorMessage = "Internal server error";
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = "Request timeout - the external service is taking too long to respond";
        statusCode = 504;
      } else if (error.message.includes('fetch failed')) {
        errorMessage = "Unable to connect to external service - please try again later";
        statusCode = 503;
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        errorMessage: error instanceof Error ? error.message : "Unknown error"
      },
      { status: statusCode }
    );
  }
}