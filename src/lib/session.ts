import { SessionOptions } from 'iron-session';

export interface SessionData {
  email?: string;
  hasAccess?: boolean;
  status?: 'active' | 'trialing' | 'canceled_with_access' | 'lifetime' | 'no_subscription';
  currentPeriodEnd?: string;
  lastVerified?: number; // timestamp
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long_for_security',
  cookieName: 'ccg-resources-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  },
};

// Session re-validation interval (23 hours in milliseconds)
export const REVALIDATION_INTERVAL = 23 * 60 * 60 * 1000;

export function needsRevalidation(lastVerified?: number): boolean {
  if (!lastVerified) return true;
  return Date.now() - lastVerified > REVALIDATION_INTERVAL;
}
