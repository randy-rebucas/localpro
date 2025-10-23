import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";
import { makeAuthenticatedRequestWithEndpoint } from "@/lib/api-auth-utils";

// POST /api/communication/typing - Handle typing indicators
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId, type } = body;

    if (!conversationId || !type) {
      return NextResponse.json(
        { error: "Missing required fields: conversationId and type" },
        { status: 400 }
      );
    }

    if (!['start', 'stop'].includes(type)) {
      return NextResponse.json(
        { error: "Type must be 'start' or 'stop'" },
        { status: 400 }
      );
    }

    // Forward to external API using proper authentication
    const response = await makeAuthenticatedRequestWithEndpoint(
      session,
      'communicationTyping',
      {
        method: 'POST',
        body: JSON.stringify({
          conversationId,
          type,
          userId: session.user.id,
          timestamp: new Date().toISOString()
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || `External service error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Broadcast typing event to conversation participants
    if (typeof global !== 'undefined' && global.eventConnections) {
      const connections = global.eventConnections as Map<string, { userId: string; controller: ReadableStreamDefaultController<Uint8Array>; cleanup: () => void }>;
      
      connections.forEach((connection) => {
        try {
          const eventData = `data: ${JSON.stringify({
            type: `typing_${type}`,
            conversationId,
            userId: session.user.id,
            timestamp: new Date().toISOString()
          })}\n\n`;
          
          connection.controller.enqueue(new TextEncoder().encode(eventData));
        } catch (error) {
          console.error('Error broadcasting typing event:', error);
        }
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    
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
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: statusCode }
    );
  }
}
