'use client';

import { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTRPC } from '@/trpc/client';

const TRADE_URL_STORAGE_KEY = 'skinshi_trade_url';

function normalizeTradeUrl(url: string) {
  return url.trim();
}

function getStatusStyles(status: string) {
  switch (status) {
    case 'active':
      return 'border-amber-400/40 bg-amber-500/20 text-amber-200';
    case 'won':
      return 'border-emerald-400/40 bg-emerald-500/20 text-emerald-200';
    case 'lost':
      return 'border-rose-400/40 bg-rose-500/20 text-rose-200';
    case 'cancelled':
      return 'border-zinc-400/40 bg-zinc-500/20 text-zinc-200';
    default:
      return 'border-zinc-400/40 bg-zinc-500/20 text-zinc-200';
  }
}

function formatDate(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleString();
}



export default function TradePage() {
  const trpc = useTRPC();
  const [saving, setSaving] = useState(false);

  const [tradeUrl, setTradeUrl] = useState('');
  const [savedTradeUrl, setSavedTradeUrl] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimingBetId, setClaimingBetId] = useState<string | null>(null);

  const dirty = useMemo(() => normalizeTradeUrl(tradeUrl) !== normalizeTradeUrl(savedTradeUrl), [tradeUrl, savedTradeUrl]);

  // Load trade URL from localStorage on mount (same key as BetModal)
  useEffect(() => {
    const saved = localStorage.getItem(TRADE_URL_STORAGE_KEY);
    if (saved) {
      setTradeUrl(saved);
      setSavedTradeUrl(saved);
    }
  }, []);

  // Fetch user's bets
  const betsQuery = useQuery(trpc.user.bets.queryOptions());

  // Claim payout mutation
  const claimPayoutMutation = useMutation({
    ...trpc.bet.claimPayout.mutationOptions(),
    onSuccess: (data) => {
      setSuccess(`Successfully claimed ${data.casesSent} cases!`);
      setClaimingBetId(null);
      // Refetch bets to update the UI
      betsQuery.refetch();
    },
    onError: (err) => {
      setClaimError(err.message || 'Failed to claim payout');
      setClaimingBetId(null);
    },
  });

  console.log('[TradePage] betsQuery.data:', betsQuery.data);

  const saveTradeUrl = async () => {
    const next = normalizeTradeUrl(tradeUrl);
    if (!next) {
      setError('Trade URL is required.');
      return;
    }

    setSaving(true);
    setError(null);
    setClaimError(null);
    setSuccess(null);

    try {
      // Save to localStorage (same key as BetModal)
      localStorage.setItem(TRADE_URL_STORAGE_KEY, next);
      setSavedTradeUrl(next);
      setSuccess('Trade URL saved successfully!');
    } catch (err) {
      setError('Failed to save trade URL. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClaimPayout = async (marketId: string) => {
    const tradeUrlToUse = normalizeTradeUrl(tradeUrl) || normalizeTradeUrl(savedTradeUrl);
    
    if (!tradeUrlToUse) {
      setClaimError('Please enter and save your Steam Trade URL first.');
      return;
    }

    setClaimError(null);
    setSuccess(null);
    setClaimingBetId(marketId);

    claimPayoutMutation.mutate({
      marketId,
      tradeUrl: tradeUrlToUse,
    });
  };

  const bets = betsQuery.data ?? [];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold">Trade Settings</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Configure your Steam trade URL and monitor your bets.
        </p>

        <section className="mt-6 rounded-2xl border border-white/10 bg-[#141721] p-5">
          <label className="block text-xs uppercase tracking-[0.18em] text-zinc-500">
            Steam Trade URL
          </label>
          <input
            type="url"
            value={tradeUrl}
            onChange={(e) => setTradeUrl(e.target.value)}
            placeholder="https://steamcommunity.com/tradeoffer/new/?partner=...&token=..."
            className="mt-3 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-emerald-400/60"
          />
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={saveTradeUrl}
              disabled={!dirty || saving}
              className="rounded-lg border border-emerald-400/60 bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-100 transition enabled:hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? 'Saving...' : 'Save Trade URL'}
            </button>
            {dirty && <span className="text-xs text-amber-200">Unsaved changes</span>}
          </div>
          {success && <p className="mt-3 text-sm text-emerald-200">{success}</p>}
          {error && <p className="mt-3 text-sm text-rose-200">{error}</p>}
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-[#141721] p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your Trades</h2>
            {betsQuery.isLoading && <span className="text-sm text-zinc-500">Loading...</span>}
          </div>
          <p className="mt-1 text-sm text-zinc-500">Track your active and past bets.</p>
          {claimError && <p className="mt-2 text-sm text-rose-200">{claimError}</p>}

          {betsQuery.isLoading ? (
            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-8 text-center text-sm text-zinc-500">
              Loading your trades...
            </div>
          ) : bets.length === 0 ? (
            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-8 text-center">
              <p className="text-sm text-zinc-400">No trades yet.</p>
              <p className="mt-2 text-xs text-zinc-600">
                Place a bet on a market to see your trades here.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {bets.map((bet) => {
                // marketOutcome: 1=yes, 0=no
                const sideLabel = bet.marketOutcome === 1 ? 'YES' : 'NO';
                const sideColor = bet.marketOutcome === 1 ? 'text-emerald-400' : 'text-rose-400';
                const payoutCases = bet.buyIn.items.length;

                return (
                  <article
                    key={`${bet.steamId}-${bet.marketId}`}
                    className="rounded-xl border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-bold ${sideColor}`}>{sideLabel}</span>
                          <span className="text-zinc-600">•</span>
                          <p className="text-sm text-zinc-400 truncate">{bet.marketId}</p>
                        </div>
                      </div>
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusStyles(bet.status)}`}>
                        {bet.status}
                      </span>
                    </div>

                    {/* Cases Count */}
                    <p className="mt-2 text-sm text-zinc-300">
                      Bet: x{bet.buyIn.items.length} cases
                    </p>

                    <div className="mt-3 flex items-center gap-4 text-xs text-zinc-600">
                      <span>Created: {formatDate(bet.createdAt)}</span>
                      {bet.resolvedAt && (
                        <span>Resolved: {formatDate(bet.resolvedAt)}</span>
                      )}
                    </div>

                    {/* Show payout info for paid bets */}
                    {bet.status === 'paid' && bet.payout && (
                      <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2">
                        <p className="text-xs text-emerald-300">
                          Payout: x{bet.payout.items.length} cases received
                        </p>
                      </div>
                    )}

                    {/* Claim Payout Button for payout_pending status */}
                    {bet.status === 'payout_pending' && (
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => handleClaimPayout(bet.marketId)}
                          disabled={claimingBetId === bet.marketId}
                          className="w-full rounded-lg border border-amber-400/60 bg-amber-500/20 px-4 py-2 text-sm font-semibold text-amber-100 transition enabled:hover:bg-amber-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {claimingBetId === bet.marketId 
                            ? 'Claiming...' 
                            : `Claim ${payoutCases} Cases`
                          }
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
