import { hash, compare } from 'bcryptjs';
import { MPIN } from '@/types/mpin';

// Store MPIN hashes in-memory for demo; replace with DB in production
const mpinStore = new Map<string, string>(); // userId -> hashed MPIN

export async function setUserMPIN(userId: string, mpin: MPIN) {
  const hashed = await hash(mpin, 10);
  mpinStore.set(userId, hashed);
}

export async function verifyUserMPIN(userId: string, mpin: MPIN): Promise<boolean> {
  const hashed = mpinStore.get(userId);
  if (!hashed) return false;
  return compare(mpin, hashed);
}

export function clearUserMPIN(userId: string) {
  mpinStore.delete(userId);
}
