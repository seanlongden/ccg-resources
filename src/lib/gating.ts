/**
 * Content Gating Configuration
 *
 * Access levels (in order of increasing access):
 * - 'free': Anyone can view (even logged out)
 * - 'trial': Trialing or active members
 * - 'active': Active paying members only
 * - 'lifetime': Lifetime members only
 *
 * By default, all content requires 'trial' access (logged in with any valid subscription)
 */

import fs from 'fs';
import path from 'path';

export type AccessLevel = 'free' | 'trial' | 'active' | 'lifetime';

export type UserStatus = 'active' | 'trialing' | 'canceled_with_access' | 'lifetime' | 'no_subscription';

// Gating rules - can gate by section slug or specific page slug
export interface GatingRule {
  slug: string;        // Section or page slug (partial match from start)
  accessLevel: AccessLevel;
  reason?: string;     // Optional message explaining why it's gated
}

interface GatingConfig {
  rules: GatingRule[];
  defaultLevel: AccessLevel;
}

const GATING_FILE = path.join(process.cwd(), 'content', 'gating-rules.json');

// Cache for gating config
let gatingCache: GatingConfig | null = null;
let lastLoadTime = 0;
const CACHE_DURATION = 30 * 1000; // 30 seconds

function loadGatingConfig(): GatingConfig {
  const now = Date.now();
  if (gatingCache && now - lastLoadTime < CACHE_DURATION) {
    return gatingCache;
  }

  try {
    const data = fs.readFileSync(GATING_FILE, 'utf-8');
    gatingCache = JSON.parse(data);
    lastLoadTime = now;
    return gatingCache!;
  } catch (error) {
    console.error('Error loading gating config:', error);
    return { rules: [], defaultLevel: 'trial' };
  }
}

export function saveGatingConfig(config: GatingConfig): boolean {
  try {
    fs.writeFileSync(GATING_FILE, JSON.stringify(config, null, 2));
    gatingCache = config;
    lastLoadTime = Date.now();
    return true;
  } catch (error) {
    console.error('Error saving gating config:', error);
    return false;
  }
}

export function getGatingRules(): GatingRule[] {
  return loadGatingConfig().rules;
}

export function getDefaultAccessLevel(): AccessLevel {
  return loadGatingConfig().defaultLevel;
}

/**
 * Get the required access level for a given content slug
 */
export function getRequiredAccessLevel(slug: string): { level: AccessLevel; reason?: string } {
  const config = loadGatingConfig();

  // Check rules in order, first match wins
  for (const rule of config.rules) {
    if (slug.startsWith(rule.slug) || slug.includes('/' + rule.slug)) {
      return { level: rule.accessLevel, reason: rule.reason };
    }
  }

  return { level: config.defaultLevel };
}

/**
 * Check if a user status has access to a given level
 */
export function hasAccessToLevel(userStatus: UserStatus | undefined, requiredLevel: AccessLevel): boolean {
  // Free content is accessible to everyone
  if (requiredLevel === 'free') return true;

  // No subscription = no access to anything except free
  if (!userStatus || userStatus === 'no_subscription') return false;

  // Map user status to access level
  const statusToLevel: Record<UserStatus, number> = {
    'no_subscription': 0,
    'trialing': 1,
    'canceled_with_access': 2,
    'active': 3,
    'lifetime': 4,
  };

  const levelToNumber: Record<AccessLevel, number> = {
    'free': 0,
    'trial': 1,
    'active': 3,
    'lifetime': 4,
  };

  return statusToLevel[userStatus] >= levelToNumber[requiredLevel];
}

/**
 * Check if user can access specific content
 */
export function canAccessContent(
  slug: string,
  userStatus: UserStatus | undefined
): { canAccess: boolean; reason?: string; requiredLevel: AccessLevel } {
  const { level, reason } = getRequiredAccessLevel(slug);
  const canAccess = hasAccessToLevel(userStatus, level);

  return {
    canAccess,
    reason: canAccess ? undefined : reason,
    requiredLevel: level,
  };
}

/**
 * Get a user-friendly message for why content is locked
 */
export function getLockedMessage(requiredLevel: AccessLevel, reason?: string): string {
  if (reason) return reason;

  switch (requiredLevel) {
    case 'active':
      return 'This content is available for active members only.';
    case 'lifetime':
      return 'This content is exclusive to lifetime members.';
    case 'trial':
      return 'Please log in to access this content.';
    default:
      return 'You do not have access to this content.';
  }
}
