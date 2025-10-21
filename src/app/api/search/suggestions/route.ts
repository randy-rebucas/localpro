import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";
import { API_BASE_URL } from "@/lib/api";

// GET /api/search/suggestions - Get search suggestions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();

    const response = await fetch(`${API_BASE_URL}/api/search/suggestions?${queryString}`, {
      headers: {
        "Authorization": `Bearer ${session.user.id}`,
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `External service error: ${response.status}` },
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