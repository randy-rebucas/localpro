import { NextRequest } from "next/server";
import { decrypt } from "./session";
import { logger } from "./logger";

export interface ServerSession {
  sessionId: string; // Unique session identifier
  user: {
    id: string;
    email: string;
    name: string;
    roles: string[]; // Multi-role support (array of roles)
    phone: string;
    firstName?: string;
    lastName?: string;
    bio?: string;
    location?: string;
    website?: string;
    skills?: string[];
    experience?: string;
    avatar?: string;
    portfolio?: unknown[];
    createdAt?: string;
    updatedAt?: string;
    isVerified?: boolean;
  };
  apiToken?: string; // The actual API token from external service
  roleView?: string; // Selected role view (client, provider, etc.)
  package?: string | null; // Selected app package (marketplace, academy, etc.)
}

export async function getServerSession(request: NextRequest): Promise<ServerSession | null> {
  try {
    // First, try to get Bearer token from Authorization header
    const authHeader = request.headers.get("authorization");
    let sessionToken: string | null = null;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      sessionToken = authHeader.substring(7);
    } else {
      // Fallback to session cookie
      const cookieHeader = request.headers.get("cookie") || "";
      sessionToken = cookieHeader
        .split(';')
        .find(c => c.trim().startsWith('session='))
        ?.split('=')[1] || null;
    }

    if (!sessionToken) {
      return null;
    }

    // Decrypt session
    const session = await decrypt(sessionToken);
    
    if (!session || !session.userId) {
      return null;
    }

    return {
      sessionId: session.sessionId, // Include the unique session ID
      user: {
        id: session.userId,
        email: session.email,
        name: session.name,
        roles: session.roles, // Multi-role support
        phone: session.phone,
        firstName: session.firstName,
        lastName: session.lastName,
        bio: session.bio,
        location: session.location,
        website: session.website,
        skills: session.skills,
        experience: session.experience,
        avatar: session.avatar,
        portfolio: session.portfolio as unknown[],
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        isVerified: session.isVerified,
      },
      apiToken: session.apiToken, // Include the actual API token
      roleView: session.roleView, // Include selected role view
      package: session.package // Include selected app package
    };
  } catch (error) {
    logger.error("Failed to get server session", error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}
