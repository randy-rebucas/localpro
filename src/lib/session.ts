import { serialize } from 'cookie';
import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { AUTH_CONFIG } from './env';

const secret = new TextEncoder().encode(AUTH_CONFIG.sessionSecret);

export interface SessionData extends JWTPayload {
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
      console.error('Session decryption failed:', {
        message: error.message,
        name: error.name,
        code: (error as Error & { code?: string }).code,
        stack: error.stack
      });
    } else {
      console.error('Session decryption failed:', error);
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
