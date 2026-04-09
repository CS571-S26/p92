// components/PolymarketCard.tsx

import { type Market } from "@/proto/polymarket/polymarket";

function barColor(price: number): string {
  if (price >= 0.6) return "#E24B4A";
  if (price >= 0.35) return "#EF9F27";
  return "#1D9E75";
}

// For multi-outcome events, we display multiple markets grouped together
export interface MarketEvent {
  title: string;
  image: string;
  active: boolean;
  markets: Market[];
}

export default function PolymarketCard({ event }: { event: MarketEvent }) {
  const activeMarkets = event.markets
    .filter((m) => !m.closed)
    .sort((a, b) => (a.outcomePrices[0] ?? 0) - (b.outcomePrices[0] ?? 0));

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden max-w-sm w-full">
      <img
        src={event.image}
        alt={event.title}
        className="w-full aspect-video object-cover"
      />

      <div className="p-4 space-y-3">
        {event.active && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
            Active
          </span>
        )}

        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {event.title}
        </p>

        <div className="space-y-2">
          {activeMarkets.map((market, i) => {
            const price = market.outcomePrices[0] ?? 0;
            const pct = Math.round(price * 100);
            const label = market.question.replace("US forces enter Iran ", "");

            return (
              <div key={market.id}>
                {i > 0 && (
                  <div className="border-t border-zinc-100 dark:border-zinc-800 mb-2" />
                )}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 flex-1 truncate">
                    {label}
                  </span>
                  <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: barColor(price),
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100 w-8 text-right">
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
