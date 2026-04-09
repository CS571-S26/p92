'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/utils/axios';
import { useAuth } from '@/context/AuthContext';
import CaseSelectionGrid, { type CaseInventoryItem } from '@/components/CaseSelectionGrid';
import BetConfirmationPanel from '@/components/BetConfirmationPanel';
import { auth } from '@/lib/firebase';

type MarketResponse = {
  id: string;
  question: string;
  slug: string;
  icon: string;
  closed: boolean;
  outcome_prices: number[];
  end_date: string;
};

type PlaceBetResponse = {
  bet_id: string;
  trade_offer_id: string;
  trade_status: string;
};

function formatApiError(code: string | undefined) {
  switch (code) {
    case 'missing_trade_url':
      return 'Set your Steam trade URL before placing a bet.';
    case 'invalid_trade_url':
      return 'Your Steam trade URL is invalid or does not match your Steam account.';
    case 'inventory_unavailable':
      return 'Could not load your Steam inventory right now.';
    case 'betting_closed':
      return 'Betting is closed for this market.';
    case 'trade_offer_failed':
      return 'Failed to send Steam trade offer. Please try again.';
    case 'steam_not_connected':
      return 'Connect your Steam account before placing bets.';
    default:
      return 'Something went wrong while placing your bet.';
  }
}

export default function PlaceBetPage() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const { user, loading } = useAuth();

  const [market, setMarket] = useState<MarketResponse | null>(null);
  const [inventory, setInventory] = useState<CaseInventoryItem[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
  const [outcome, setOutcome] = useState<'yes' | 'no'>('yes');
  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function load() {
      setPageLoading(true);
      setError(null);

      try {
        const user = auth.currentUser;
        if (!user) {
          throw new Error('Not logged in');
        }

        const tokenResult = await user.getIdTokenResult();
        const steamId = tokenResult.claims.steam_id as string | undefined;
        if (!steamId) {
          throw new Error('Steam account not linked');
        }

        const [marketRes, inventoryRes] = await Promise.all([
          api.get(`/markets/${slug}`),
          fetch(`/api/steam/inventory?steamId=${steamId}&casesOnly=true`).then(async (res) => {
            if (!res.ok) {
              const data = await res.json();
              throw new Error(data.error || 'Failed to fetch inventory');
            }
            return res.json();
          }),
        ]);

        if (cancelled) return;

        const fetchedMarket: MarketResponse = marketRes.data;
        const rawItems: CaseInventoryItem[] = inventoryRes?.items ?? [];
        const casesOnly = rawItems.filter((item) => item.isCase && item.tradable);

        setMarket(fetchedMarket);
        setInventory(casesOnly);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load market or inventory. Please refresh.');
      } finally {
        if (!cancelled) setPageLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [slug, user]);

  const canSubmit = useMemo(() => {
    if (!market || market.closed) return false;
    return selectedAssetIds.size > 0;
  }, [market, selectedAssetIds]);

  const toggleAsset = (assetId: string) => {
    setSelectedAssetIds((prev) => {
      const next = new Set(prev);
      if (next.has(assetId)) {
        next.delete(assetId);
      } else {
        next.add(assetId);
      }
      return next;
    });
  };

  const placeBet = async () => {
    if (!market || !canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        slug: market.slug,
        market_id: market.id,
        outcome,
        asset_ids: Array.from(selectedAssetIds),
      };

      const res = await api.post<PlaceBetResponse>('/bets', payload);
      router.push(`/profile/trade?bet=${res.data.bet_id}&offer=${res.data.trade_offer_id}`);
    } catch (err: any) {
      const code = err?.response?.data?.error as string | undefined;
      setError(formatApiError(code));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || pageLoading || !user) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center font-mono text-zinc-500 text-sm">
        <span className="animate-pulse">Loading bet setup...</span>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center font-mono text-rose-300 text-sm">
        Market not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 rounded-2xl border border-white/10 bg-[#141721] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Place Bet</p>
          <h1 className="mt-2 text-xl font-semibold leading-tight sm:text-2xl">{market.question}</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Select one or more cases from your inventory and choose your outcome.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <section>
            <CaseSelectionGrid
              items={inventory}
              selectedAssetIds={selectedAssetIds}
              onToggleAsset={toggleAsset}
            />
          </section>

          <BetConfirmationPanel
            marketTitle={market.question}
            outcome={outcome}
            selectedCount={selectedAssetIds.size}
            canSubmit={canSubmit}
            submitting={submitting}
            error={error}
            onOutcomeChange={setOutcome}
            onSubmit={placeBet}
          />
        </div>
      </div>
    </div>
  );
}
