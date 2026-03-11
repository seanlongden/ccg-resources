import { NextRequest, NextResponse } from 'next/server';
import { getPage, searchPages } from '@/lib/content';
import { getRequiredAccessLevel } from '@/lib/gating';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const slug = searchParams.get('slug');
  const search = searchParams.get('search');

  try {
    // Search mode
    if (search) {
      const results = searchPages(search, 20);
      return NextResponse.json(results);
    }

    // Get specific page
    if (!slug) {
      return NextResponse.json(
        { error: 'Slug parameter required' },
        { status: 400 }
      );
    }

    const page = getPage(slug);

    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    // Get gating info for this content
    const gating = getRequiredAccessLevel(slug);

    return NextResponse.json({
      ...page,
      gating: {
        requiredLevel: gating.level,
        reason: gating.reason,
      },
    });
  } catch (error) {
    console.error('Error fetching page:', error);
    return NextResponse.json(
      { error: 'Failed to load page' },
      { status: 500 }
    );
  }
}
