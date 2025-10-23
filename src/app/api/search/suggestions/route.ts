import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";
import { makeAuthenticatedRequestWithPath } from "@/lib/api-auth-utils";

// GET /api/search/suggestions - Get search suggestions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const response = await makeAuthenticatedRequestWithPath(
      session,
      'searchSuggestions',
      [],
      queryParams,
      { method: 'GET' }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || `External service error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    // Fallback to mock suggestions if external API fails
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    
    const mockSuggestions = [
      "Cleaning services",
      "Plumbing repair",
      "Electrical work",
      "Moving services",
      "House cleaning",
      "Emergency plumbing",
      "Electrical installation",
      "Full service moving"
    ].filter(suggestion => 
      suggestion.toLowerCase().includes(q.toLowerCase())
    ).slice(0, 5);

    return NextResponse.json(mockSuggestions);
  }
}