import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "./api";

// Generic API proxy function
export function createApiProxy(endpoint: string) {
  return {
    async GET(request: NextRequest) {
      try {
        const { searchParams } = new URL(request.url);
        const queryString = searchParams.toString();
        const url = `${API_BASE_URL}${endpoint}${queryString ? `?${queryString}` : ""}`;
        
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (!response.ok) {
          return NextResponse.json(
            { error: data.error || "Request failed" },
            { status: response.status }
          );
        }

        return NextResponse.json(data);
      } catch (error) {
        logger.error(`Error in GET ${endpoint}`, error instanceof Error ? error : new Error(String(error)), { endpoint });
        return NextResponse.json(
          { error: "Internal server error" },
          { status: 500 }
        );
      }
    },

    async POST(request: NextRequest) {
      try {
        const body = await request.json();
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
          return NextResponse.json(
            { error: data.error || "Request failed" },
            { status: response.status }
          );
        }

        return NextResponse.json(data, { status: response.status });
      } catch (error) {
        logger.error(`Error in POST ${endpoint}`, error instanceof Error ? error : new Error(String(error)), { endpoint });
        return NextResponse.json(
          { error: "Internal server error" },
          { status: 500 }
        );
      }
    },

    async PUT(request: NextRequest) {
      try {
        const body = await request.json();
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
          return NextResponse.json(
            { error: data.error || "Request failed" },
            { status: response.status }
          );
        }

        return NextResponse.json(data);
      } catch (error) {
        logger.error(`Error in PUT ${endpoint}`, error instanceof Error ? error : new Error(String(error)), { endpoint });
        return NextResponse.json(
          { error: "Internal server error" },
          { status: 500 }
        );
      }
    },

    async DELETE() {
      try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (!response.ok) {
          return NextResponse.json(
            { error: data.error || "Request failed" },
            { status: response.status }
          );
        }

        return NextResponse.json(data);
      } catch (error) {
        logger.error(`Error in DELETE ${endpoint}`, error instanceof Error ? error : new Error(String(error)), { endpoint });
        return NextResponse.json(
          { error: "Internal server error" },
          { status: 500 }
        );
      }
    },
  };
}
