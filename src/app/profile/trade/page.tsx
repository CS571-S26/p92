'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/utils/axios';

type BetRecord = {
  bet_id: string;
  outcome: 'yes' | 'no';
  trade_offer_id?: string | null;
  trade_status: string;
  trade_expires_at?: string | null;
  created_at: string;
  item_count: number;
  market: {
    slug: string;
    market_id: string;
    question: string;
    icon_url?: string | null;
    end_date: string;
    status: string;
  };
};

function normalizeTradeUrl(url: string) {
  return url.trim();
}

function statusPill(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === 'accepted') return 'border-emerald-400/40 bg-emerald-500/20 text-emerald-200';
  if (normalized === 'declined' || normalized === 'cancelled' || normalized === 'expired') {
    return 'border-rose-400/40 bg-rose-500/20 text-rose-200';
  }
  return 'border-amber-400/40 bg-amber-500/20 text-amber-100';
}

export default function TradePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncingBetId, setSyncingBetId] = useState<string | null>(null);

  const [tradeUrl, setTradeUrl] = useState('');
  const [savedTradeUrl, setSavedTradeUrl] = useState('');
  const [bets, setBets] = useState<BetRecord[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const dirty = useMemo(() => normalizeTradeUrl(tradeUrl) !== normalizeTradeUrl(savedTradeUrl), [tradeUrl, savedTradeUrl]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tradeRes, betsRes] = await Promise.all([
        api.get('/me/trade-url'),
        api.get('/me/bets'),
      ]);

      const fetchedTradeUrl = (tradeRes.data?.trade_url as string) ?? '';
      setTradeUrl(fetchedTradeUrl);
      setSavedTradeUrl(fetchedTradeUrl);
      setBets((betsRes.data?.bets as BetRecord[]) ?? []);
    } catch {
      setError('Failed to load trade settings. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const saveTradeUrl = async () => {
    const next = normalizeTradeUrl(tradeUrl);
    if (!next) {
      setError('Trade URL is required.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.post('/me/trade-url', { trade_url: next });
      const persisted = (res.data?.trade_url as string) ?? next;
      setTradeUrl(persisted);
      setSavedTradeUrl(persisted);
      setSuccess('Trade URL saved and validated against your Steam account.');
    } catch (err: any) {
      const code = err?.response?.data?.error as string | undefined;
      if (code === 'invalid_trade_url') {
        setError('Invalid Steam trade URL or partner mismatch.');
      } else {
        setError('Failed to save trade URL.');
      }
    } finally {
      setSaving(false);
    }
  };

  const syncBetStatus = async (betId: string) => {
    setSyncingBetId(betId);
    setError(null);
    try {
      await api.post(`/me/bets/${betId}/sync`);
      await loadData();
    } catch {
      setError('Failed to sync bet status.');
    } finally {
      setSyncingBetId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center font-mono text-zinc-500 text-sm">
        <span className="animate-pulse">Loading trade settings...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold">Trade Settings</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Configure your Steam trade URL and monitor active bet trade offers.
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
          <h2 className="text-lg font-semibold">Your Bets</h2>
          <p className="mt-1 text-sm text-zinc-500">Track trade offer status for each bet.</p>

          {bets.length === 0 ? (
            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-5 text-sm text-zinc-500">
              You have not placed any bets yet.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {bets.map((bet) => (
                <article key={bet.bet_id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-100">{bet.market.question}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {bet.item_count} case{bet.item_count === 1 ? '' : 's'} • {bet.outcome.toUpperCase()}
                      </p>
                    </div>
                    <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${statusPill(bet.trade_status)}`}>
                      {bet.trade_status}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                    {bet.trade_offer_id && <span>Offer: {bet.trade_offer_id}</span>}
                    {bet.trade_expires_at && <span>Expires: {new Date(bet.trade_expires_at).toLocaleString()}</span>}
                  </div>

                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => syncBetStatus(bet.bet_id)}
                      disabled={syncingBetId === bet.bet_id}
                      className="rounded-md border border-white/20 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:border-white/35 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {syncingBetId === bet.bet_id ? 'Syncing...' : 'Sync Status'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
