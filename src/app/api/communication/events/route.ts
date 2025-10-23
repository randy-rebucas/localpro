import { NextRequest } from "next/server";
import { getServerSession } from "@/lib/server-session";

// Server-Sent Events endpoint for real-time communication
export async function GET(request: NextRequest) {
  const session = await getServerSession(request);
  
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      const initialEvent = `data: ${JSON.stringify({
        type: 'connection',
        message: 'Connected to real-time events',
        timestamp: new Date().toISOString()
      })}\n\n`;
      
      controller.enqueue(new TextEncoder().encode(initialEvent));

      // Set up periodic heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          const heartbeatEvent = `data: ${JSON.stringify({
            type: 'heartbeat',
            timestamp: new Date().toISOString()
          })}\n\n`;
          
          controller.enqueue(new TextEncoder().encode(heartbeatEvent));
        } catch (error) {
          console.error('Error sending heartbeat:', error);
          clearInterval(heartbeat);
        }
      }, 30000); // Send heartbeat every 30 seconds

      // Store the controller for potential future use
      // In a real implementation, you'd want to store this in a way that
      // allows other parts of your app to send events to this connection
      const connectionId = `conn_${session.user.id}_${Date.now()}`;
      
      // Cleanup function
      const cleanup = () => {
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch (error) {
          console.error('Error closing controller:', error);
        }
      };

      // Handle client disconnect
      request.signal.addEventListener('abort', cleanup);
      
      // Store connection in a global map (in production, use Redis or similar)
      if (typeof global !== 'undefined') {
        if (!global.eventConnections) {
          global.eventConnections = new Map();
        }
        global.eventConnections.set(connectionId, {
          controller,
          userId: session.user.id,
          cleanup
        });
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  });
}

// Helper function to broadcast events to all connected clients
export function broadcastEvent(event: {
  type: string;
  data: unknown;
  userId?: string;
  conversationId?: string;
}) {
  if (typeof global !== 'undefined' && global.eventConnections) {
    const connections = global.eventConnections as Map<string, { userId: string; controller: ReadableStreamDefaultController<Uint8Array>; cleanup: () => void }>;
    
    connections.forEach((connection, connectionId) => {
      try {
        // If userId is specified, only send to that user
        if (event.userId && connection.userId !== event.userId) {
          return;
        }

        const eventData = `data: ${JSON.stringify({
          ...event,
          timestamp: new Date().toISOString()
        })}\n\n`;
        
        connection.controller.enqueue(new TextEncoder().encode(eventData));
      } catch (error) {
        console.error(`Error broadcasting to connection ${connectionId}:`, error);
        // Remove broken connections
        connections.delete(connectionId);
        connection.cleanup();
      }
    });
  }
}

// Helper function to send event to specific user
export function sendEventToUser(userId: string, event: {
  type: string;
  data: unknown;
  conversationId?: string;
}) {
  broadcastEvent({
    ...event,
    userId
  });
}

// Helper function to send event to conversation participants
export function sendEventToConversation(conversationId: string, event: {
  type: string;
  data: unknown;
  excludeUserId?: string;
}) {
  // In a real implementation, you'd fetch conversation participants
  // and send the event to all of them except the excluded user
  broadcastEvent({
    ...event,
    conversationId
  });
}

// Type definitions for global event connections
declare global {
  var eventConnections: Map<string, {
    controller: ReadableStreamDefaultController<Uint8Array>;
    userId: string;
    cleanup: () => void;
  }> | undefined;
}
