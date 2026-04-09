import { getMarkets } from "@/lib/polymarket";
import Link from "next/link";
import type { Market } from "@/proto/polymarket/polymarket";

function MarketCard({ market }: { market: Market }) {
  const yesPrice = market.outcomePrices[0] ?? 0;
  const yesPct = Math.round(yesPrice * 100);

  return (
    <Link
      href={`/markets/${market.slug}`}
      className="block bg-[#111118] border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors"
    >
      <div className="flex gap-4 p-4">
        {market.icon && (
          <img
            src={market.icon}
            alt=""
            className="w-16 h-16 rounded-lg object-cover shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-white line-clamp-2 mb-2">
            {market.question}
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${yesPct}%` }}
              />
            </div>
            <span className="text-xs font-medium text-zinc-400 w-10 text-right">
              {yesPct}%
            </span>
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
            <span>Vol: ${(market.volume / 1_000_000).toFixed(1)}M</span>
            {market.closed && (
              <span className="text-red-400">Closed</span>
            )}
            {!market.closed && (
              <span className="text-emerald-300">Open for betting</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default async function MarketsListPage() {
  const markets = await getMarkets();

  return (
    <div className="min-h-screen bg-[#0a0a0f] font-mono text-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">Active Markets</h1>
        
        {markets.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            No markets available. Check back soon!
          </div>
        ) : (
          <div className="space-y-3">
            {markets
              .filter((m) => !m.closed)
              .map((market) => (
                <MarketCard key={market.id} market={market} />
              ))}
          </div>
        )}

        {markets.some((m) => m.closed) && (
          <>
            <h2 className="text-xl font-bold mt-10 mb-4 text-zinc-400">
              Closed Markets
            </h2>
            <div className="space-y-3 opacity-60">
              {markets
                .filter((m) => m.closed)
                .map((market) => (
                  <MarketCard key={market.id} market={market} />
                ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export const metadata = {
  title: "Markets | Skinshi",
  description: "Browse prediction markets and bet with CS2 cases",
};

// Force dynamic rendering - don't try to fetch during build
export const dynamic = 'force-dynamic';
