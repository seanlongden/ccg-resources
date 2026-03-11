import { NextResponse, NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { isAdmin } from '@/lib/admin';
import { getGatingRules, saveGatingConfig, getDefaultAccessLevel, GatingRule, AccessLevel } from '@/lib/gating';
import { getPageIndex } from '@/lib/content';

// GET /api/admin - Get admin dashboard data
export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (!session.email || !isAdmin(session.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get gating rules
    const rules = getGatingRules();
    const defaultLevel = getDefaultAccessLevel();

    // Get content stats
    const pageIndex = getPageIndex();
    const totalPages = pageIndex.length;
    const sections = pageIndex.filter(p => p.isSection).length;

    return NextResponse.json({
      gating: {
        rules,
        defaultLevel,
      },
      stats: {
        totalPages,
        sections,
        contentPages: totalPages - sections,
      },
      admin: session.email,
    });
  } catch (error) {
    console.error('Admin API error:', error);
    return NextResponse.json({ error: 'Failed to load admin data' }, { status: 500 });
  }
}

// POST /api/admin - Update gating rules
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (!session.email || !isAdmin(session.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { rules, defaultLevel } = body as { rules: GatingRule[]; defaultLevel: AccessLevel };

    // Validate
    if (!Array.isArray(rules)) {
      return NextResponse.json({ error: 'Rules must be an array' }, { status: 400 });
    }

    const validLevels = ['free', 'trial', 'active', 'lifetime'];
    if (!validLevels.includes(defaultLevel)) {
      return NextResponse.json({ error: 'Invalid default level' }, { status: 400 });
    }

    for (const rule of rules) {
      if (!rule.slug || typeof rule.slug !== 'string') {
        return NextResponse.json({ error: 'Each rule must have a slug' }, { status: 400 });
      }
      if (!validLevels.includes(rule.accessLevel)) {
        return NextResponse.json({ error: `Invalid access level: ${rule.accessLevel}` }, { status: 400 });
      }
    }

    // Save
    const success = saveGatingConfig({ rules, defaultLevel });

    if (!success) {
      return NextResponse.json({ error: 'Failed to save gating config' }, { status: 500 });
    }

    return NextResponse.json({ success: true, rules, defaultLevel });
  } catch (error) {
    console.error('Admin API error:', error);
    return NextResponse.json({ error: 'Failed to update gating rules' }, { status: 500 });
  }
}
