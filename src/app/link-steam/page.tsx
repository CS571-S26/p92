'use client';

import { useState } from 'react';
import api from '@/utils/axios';
import axios from 'axios';

export default function LinkSteamPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSteamLogin() {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get('/auth/steam');
      window.location.href = data.redirectUrl;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Failed to start Steam linking');
      } else {
        setError('Failed to start Steam linking');
      }
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#141721] p-8 shadow-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">Link Steam</h1>
        <p className="mt-3 text-sm text-zinc-400">
          Connect your account to Steam to load your profile and CS2 cases.
        </p>

        <button
          type="button"
          onClick={handleSteamLogin}
          disabled={loading}
          className="mt-6 w-full rounded-lg border border-emerald-400/50 bg-emerald-500/20 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Redirecting to Steam...' : 'Connect your account to Steam'}
        </button>

        {error && (
          <p className="mt-4 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
