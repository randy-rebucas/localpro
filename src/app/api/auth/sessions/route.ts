import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";
import { getUserActiveSessions, removeSession, cleanupExpiredSessions } from "@/lib/session";

// GET /api/auth/sessions - Get active sessions for current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get active sessions for the user
    const activeSessions = getUserActiveSessions(session.user.id);
    
    return NextResponse.json({
      success: true,
      sessions: activeSessions.map(s => ({
        sessionId: s.sessionId,
        createdAt: s.createdAt,
        lastAccessed: s.lastAccessed,
        userAgent: s.userAgent,
        ipAddress: s.ipAddress,
        isCurrent: s.sessionId === session.sessionId
      }))
    });

  } catch (error) {
    console.error("Error getting sessions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/auth/sessions - Remove specific session or all sessions
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const removeAll = searchParams.get('removeAll') === 'true';

    if (removeAll) {
      // Remove all sessions for the user (they'll need to log in again)
      const activeSessions = getUserActiveSessions(session.user.id);
      activeSessions.forEach(s => {
        removeSession(s.sessionId);
      });
      
      return NextResponse.json({
        success: true,
        message: "All sessions removed"
      });
    } else if (sessionId) {
      // Remove specific session
      removeSession(sessionId);
      
      return NextResponse.json({
        success: true,
        message: "Session removed"
      });
    } else {
      return NextResponse.json(
        { error: "sessionId or removeAll parameter required" },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error("Error removing session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/auth/sessions/cleanup - Clean up expired sessions (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Clean up expired sessions
    cleanupExpiredSessions();
    
    return NextResponse.json({
      success: true,
      message: "Expired sessions cleaned up"
    });

  } catch (error) {
    console.error("Error cleaning up sessions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
