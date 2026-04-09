import { NextRequest, NextResponse } from 'next/server';
import { getSteamProfile } from '@/lib/steam';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const steamId = request.nextUrl.searchParams.get('steamId');

  if (!steamId) {
    return NextResponse.json({ error: 'missing_steam_id' }, { status: 400 });
  }

  try {
    const profile = await getSteamProfile(steamId);

    if (!profile) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    return NextResponse.json(profile, { status: 200 });
  } catch (error) {
    console.error('Steam profile route error:', error);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
