import { NextRequest } from "next/server";
import { decrypt } from "./session";

export interface ServerSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    phone: string;
    firstName?: string;
    lastName?: string;
  };
}

export async function getServerSession(request: NextRequest): Promise<ServerSession | null> {
  try {
    // Get session cookie from request
    const cookieHeader = request.headers.get("cookie") || "";
    const sessionCookie = cookieHeader
      .split(';')
      .find(c => c.trim().startsWith('session='))
      ?.split('=')[1];

    if (!sessionCookie) {
      return null;
    }

    // Decrypt session
    const session = await decrypt(sessionCookie);
    
    if (!session || !session.userId) {
      return null;
    }

    return {
      user: {
        id: session.userId,
        email: session.email,
        name: session.name,
        role: session.role,
        phone: session.phone,
        firstName: session.firstName,
        lastName: session.lastName,
      }
    };
  } catch (error) {
    console.error("Failed to get server session:", error);
    return null;
  }
}
