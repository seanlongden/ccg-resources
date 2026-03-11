import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData, needsRevalidation } from '@/lib/session';
import { checkAccess } from '@/lib/auth';

// POST /api/auth - Login with email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check access
    const accessStatus = await checkAccess(email);

    if (!accessStatus.hasAccess) {
      return NextResponse.json(
        {
          error: 'No active subscription found for this email',
          status: accessStatus.status
        },
        { status: 403 }
      );
    }

    // Create session
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    session.email = email.toLowerCase().trim();
    session.hasAccess = true;
    session.status = accessStatus.status;
    // Safely convert date to ISO string, handling invalid dates
    if (accessStatus.currentPeriodEnd && !isNaN(accessStatus.currentPeriodEnd.getTime())) {
      session.currentPeriodEnd = accessStatus.currentPeriodEnd.toISOString();
    }
    session.lastVerified = Date.now();

    await session.save();

    return NextResponse.json({
      success: true,
      email: session.email,
      status: accessStatus.status,
      currentPeriodEnd: accessStatus.currentPeriodEnd,
    });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

// GET /api/auth - Check current session
export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (!session.email || !session.hasAccess) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    // Check if session needs revalidation
    if (needsRevalidation(session.lastVerified)) {
      const accessStatus = await checkAccess(session.email);

      if (!accessStatus.hasAccess) {
        // Access revoked - clear session
        session.destroy();
        return NextResponse.json(
          { authenticated: false, reason: 'subscription_expired' },
          { status: 401 }
        );
      }

      // Update session with fresh data
      session.status = accessStatus.status;
      session.currentPeriodEnd = accessStatus.currentPeriodEnd?.toISOString();
      session.lastVerified = Date.now();
      await session.save();
    }

    return NextResponse.json({
      authenticated: true,
      email: session.email,
      status: session.status,
      currentPeriodEnd: session.currentPeriodEnd,
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { authenticated: false, error: 'Session check failed' },
      { status: 500 }
    );
  }
}

// DELETE /api/auth - Logout
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    session.destroy();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
