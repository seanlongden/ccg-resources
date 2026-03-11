import { NextResponse } from 'next/server';
import { getNavigation } from '@/lib/content';

export async function GET() {
  try {
    const navigation = getNavigation();
    return NextResponse.json(navigation);
  } catch (error) {
    console.error('Error fetching navigation:', error);
    return NextResponse.json(
      { error: 'Failed to load navigation' },
      { status: 500 }
    );
  }
}
