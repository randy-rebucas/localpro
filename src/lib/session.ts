import { serialize } from 'cookie';
import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { AUTH_CONFIG } from './env';
import { logger } from './logger';

const secret = new TextEncoder().encode(AUTH_CONFIG.sessionSecret);

// In-memory session store for tracking active sessions
// In production, this should be replaced with Redis or a database
const activeSessions = new Map<string, {
  sessionId: string;
  userId: string;
  createdAt: Date;
  lastAccessed: Date;
  userAgent?: string;
  ipAddress?: string;
}>();

export interface SessionData extends JWTPayload {
  sessionId: string; // Unique session identifier
  userId: string;
  email: string;
  name: string;
  role: string;
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
  apiToken?: string; // Store the actual API token from external service
  fingerprint?: string; // Session fingerprint for security
}

// Generate unique session ID using Web Crypto API
export async function generateSessionId(): Promise<string> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Generate session fingerprint for security using Web Crypto API
export async function generateSessionFingerprint(userAgent?: string, ipAddress?: string): Promise<string> {
  const data = `${userAgent || 'unknown'}-${ipAddress || 'unknown'}`;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Create new session with uniqueness checks
export async function createSession(
  userData: {
    userId: string;
    email: string;
    name: string;
    role: string;
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
    apiToken?: string;
  },
  userAgent?: string,
  ipAddress?: string
): Promise<{ sessionId: string; encryptedSession: string }> {
  // Generate unique session ID
  const sessionId = await generateSessionId();
  
  // Generate session fingerprint
  const fingerprint = await generateSessionFingerprint(userAgent, ipAddress);
  
  // Invalidate any existing sessions for this user
  await invalidateUserSessions(userData.userId);
  
  // Create session data with unique ID and fingerprint
  const sessionData: SessionData = {
    ...userData,
    sessionId,
    fingerprint,
  };
  
  // Track session in memory store
  activeSessions.set(sessionId, {
    sessionId,
    userId: userData.userId,
    createdAt: new Date(),
    lastAccessed: new Date(),
    userAgent: userAgent || undefined,
    ipAddress: ipAddress || undefined,
  });
  
  
  // Encrypt session
  const encryptedSession = await encrypt(sessionData);
  
  return { sessionId, encryptedSession };
}

// Invalidate all sessions for a specific user
export async function invalidateUserSessions(userId: string): Promise<void> {
  const sessionsToDelete: string[] = [];
  
  for (const [sessionId, session] of activeSessions.entries()) {
    if (session.userId === userId) {
      sessionsToDelete.push(sessionId);
    }
  }
  
  sessionsToDelete.forEach(sessionId => {
    activeSessions.delete(sessionId);
  });
}

// Validate session and update last accessed time
export async function validateSession(sessionId: string): Promise<boolean> {
  const session = activeSessions.get(sessionId);
  
  if (!session) {
    return false;
  }
  
  // Update last accessed time
  session.lastAccessed = new Date();
  
  return true;
}


// Remove specific session
export function removeSession(sessionId: string): void {
  activeSessions.delete(sessionId);
}

// Clean up expired sessions (older than 7 days)
export function cleanupExpiredSessions(): void {
  const now = new Date();
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  
  for (const [sessionId, session] of activeSessions.entries()) {
    if (now.getTime() - session.lastAccessed.getTime() > maxAge) {
      activeSessions.delete(sessionId);
    }
  }
}

// Start periodic cleanup of expired sessions
export function startSessionCleanup(): void {
  // Clean up expired sessions every hour
  setInterval(() => {
    cleanupExpiredSessions();
  }, 60 * 60 * 1000); // 1 hour
}


// Get active sessions for a user (for admin purposes)
export function getUserActiveSessions(userId: string): Array<{
  sessionId: string;
  createdAt: Date;
  lastAccessed: Date;
  userAgent?: string;
  ipAddress?: string;
}> {
  const userSessions: Array<{
    sessionId: string;
    createdAt: Date;
    lastAccessed: Date;
    userAgent?: string;
    ipAddress?: string;
  }> = [];
  
  for (const session of activeSessions.values()) {
    if (session.userId === userId) {
      userSessions.push({
        sessionId: session.sessionId,
        createdAt: session.createdAt,
        lastAccessed: session.lastAccessed,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
      });
    }
  }
  
  return userSessions;
}

export async function encrypt(payload: SessionData): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function decrypt(session: string | undefined = ''): Promise<SessionData | null> {
  try {
    if (!session) return null;
    
    const { payload } = await jwtVerify(session, secret, {
      algorithms: ['HS256'],
    });
    
    // Validate that the payload has the required SessionData properties
    if (payload && typeof payload === 'object' && 'userId' in payload) {
      return payload as SessionData;
    }
    
    return null;
  } catch (error) {
    // Enhanced error logging for debugging
    if (error instanceof Error) {
      logger.error('Session decryption failed', error, {
        message: error.message,
        name: error.name,
        code: (error as Error & { code?: string }).code,
        stack: error.stack
      });
    } else {
      logger.error('Session decryption failed', new Error(String(error)));
    }
    return null;
  }
}

export function createSessionCookie(encryptedSession: string): string {
  return serialize('session', encryptedSession, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // One week
    path: '/',
    sameSite: 'lax',
  });
}

export function createApiTokenCookie(apiToken: string): string {
  return serialize('api-token', apiToken, {
    httpOnly: false, // Allow client-side access
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // One week
    path: '/',
    sameSite: 'lax',
  });
}

export function clearSessionCookie(): string {
  return serialize('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
    path: '/',
    sameSite: 'lax',
  });
}

/**
 * Clear all session-related cookies
 * Useful when session secrets change or for debugging
 */
export function clearAllSessionCookies(): string[] {
  return [
    clearSessionCookie(),
    serialize('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0,
      path: '/',
      sameSite: 'lax',
      domain: process.env.NODE_ENV === 'production' ? '.localpro.com' : 'localhost',
    })
  ];
}
