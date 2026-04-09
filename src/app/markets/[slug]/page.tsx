import { fetchMarket } from "@/lib/polymarket";
import PolymarketCard, { type MarketEvent } from "@/components/PolymarketCard";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function MarketsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  
  // Fetch market data via gRPC (SSR)
  const markets = await fetchMarket(slug);
  
  if (markets.length === 0) {
    notFound();
  }

  // Group markets into an event for the card
  const event: MarketEvent = {
    title: markets[0]?.groupItemTitle || markets[0]?.question || slug,
    image: markets[0]?.icon || "",
    active: markets.some((m) => !m.closed),
    markets: markets,
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center gap-4 p-6">
      <PolymarketCard event={event} />
      {!markets[0]?.closed && (
        <Link
          href={`/markets/${slug}/bet`}
          className="rounded-lg border border-emerald-400/60 bg-emerald-500/20 px-5 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/30"
        >
          Bet With Cases
        </Link>
      )}
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const markets = await fetchMarket(slug);
  
  const title = markets[0]?.question || slug;
  
  return {
    title: `${title} | Skinshi`,
    description: `Bet on "${title}" with CS2 cases`,
  };
}
