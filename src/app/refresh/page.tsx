'use client';

import { auth } from '@/lib/firebase';
import { useEffect, useState } from 'react';

export default function RefreshPage() {
  const [status, setStatus] = useState('Refreshing Firebase token...');
  const [details, setDetails] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function refreshToken() {
      const user = auth.currentUser;

      if (!user) {
        if (mounted) {
          setStatus('Not logged in');
          setDetails('Sign in first, then revisit /refresh.');
        }
        return;
      }

      try {
        await user.getIdToken(true);
        const tokenResult = await user.getIdTokenResult(true);
        const steamId = tokenResult.claims.steam_id as string | undefined;

        if (mounted) {
          setStatus('Token refreshed successfully');
          setDetails(steamId ? `steam_id claim present: ${steamId}` : 'steam_id claim is still missing.');
        }
      } catch (error) {
        if (mounted) {
          setStatus('Failed to refresh token');
          setDetails(error instanceof Error ? error.message : 'Unknown error');
        }
      }
    }

    refreshToken();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#141721] p-6 text-zinc-100">
        <h1 className="text-lg font-semibold">Auth Token Refresh</h1>
        <p className="mt-3 text-sm text-zinc-300">{status}</p>
        {details && <p className="mt-2 text-xs text-zinc-500 break-all">{details}</p>}
      </div>
    </div>
  );
}
