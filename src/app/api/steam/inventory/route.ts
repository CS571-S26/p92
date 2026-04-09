import { NextRequest, NextResponse } from 'next/server';
import { getSteamInventory } from '@/lib/steam';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const steamId = request.nextUrl.searchParams.get('steamId');
  const casesOnlyRaw = request.nextUrl.searchParams.get('casesOnly');
  const casesOnly = casesOnlyRaw === 'true';

  if (!steamId) {
    return NextResponse.json({ error: 'missing_steam_id' }, { status: 400 });
  }

  try {
    const items = await getSteamInventory(steamId, casesOnly);

    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error('Steam inventory route error:', error);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
