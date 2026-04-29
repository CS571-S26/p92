'use client';

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import MarketCard from "@/components/MarketCard";
import { BetModal } from "@/components/bet-modal";
import BetSuccessModal from "@/components/BetSuccessModal";
import { useAuth } from "@/context/AuthContext";
import type { OurMarket } from "@skinshi/api/schemas";

export default function HomeClient() {
  const trpc = useTRPC();
  const { user } = useAuth();

  // Use tRPC to fetch markets (fresh data on each request, no SSR cache)
  const { data: markets, isLoading } = useQuery({
    ...trpc.polymarket.allMarkets.queryOptions(),
    // Don't use initialData - let it fetch fresh every time
  });

  // Fetch real user bets to detect existing bets per market
  const { data: userBets } = useQuery({
    ...trpc.user.bets.queryOptions(),
    enabled: !!user,
  });

  const [selectedMarket, setSelectedMarket] = useState<OurMarket | null>(null);
  const [selectedOutcome, setSelectedOutcome] = useState<"yes" | "no">("yes");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Success modal state
  const [successResult, setSuccessResult] = useState<{
    bet_id: string;
    market_slug: string;
    market_id: string;
    outcome: string;
    trade_offer_id: string;
    trade_status: string;
    trade_expires_at: string;
    item_count: number;
  } | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMarket, setSuccessMarket] = useState<OurMarket | null>(null);

  const handleBetClick = (market: OurMarket, outcome: "yes" | "no") => {
    setSelectedMarket(market);
    setSelectedOutcome(outcome);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMarket(null);
  };

  const handleBetSuccess = (result: {
    bet_id: string;
    market_slug: string;
    market_id: string;
    outcome: string;
    trade_offer_id: string;
    trade_status: string;
    trade_expires_at: string;
    item_count: number;
  }) => {
    setSuccessResult(result);

    // Store the current market for the success modal before it gets cleared
    if (selectedMarket) {
      setSuccessMarket(selectedMarket);
    }

    setIsSuccessModalOpen(true);
  };

  const handleSuccessClose = () => {
    setIsSuccessModalOpen(false);
    setSuccessResult(null);
    setSuccessMarket(null);
    // Redirect to settings trades tab so user can see their bet
    window.location.href = "/settings?tab=trades";
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Active Markets</h1>
          <p className="text-zinc-400">
            Bet your CS2 cases on Polymarket outcomes
          </p>
        </div>

        {/* Markets grid */}
        {isLoading ? (
          <div className="text-center py-16">
            <p className="text-zinc-400 text-lg">Loading markets...</p>
          </div>
        ) : markets && markets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {markets.map((market) => (
              <MarketCard
                key={market.id}
                market={market}
                userBets={userBets}
                onBetClick={(outcome) => handleBetClick(market, outcome)}
                isLoggedIn={!!user}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-zinc-400 text-lg">No active markets right now.</p>
            <p className="text-zinc-400 text-sm mt-2">Check back later!</p>
          </div>
        )}
      </main>

      {/* Bet Modal */}
      {selectedMarket && (
        <BetModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSuccess={handleBetSuccess}
          market={selectedMarket}
          outcome={selectedOutcome}
        />
      )}

      {/* Success Modal */}
      {isSuccessModalOpen && successResult && successMarket && (
        <BetSuccessModal
          isOpen={isSuccessModalOpen}
          onClose={() => setIsSuccessModalOpen(false)}
          result={successResult}
          market={successMarket}
          onTimerComplete={handleSuccessClose}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-900 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-zinc-400 text-sm">
          <p>skinshi - Bet CS2 cases on prediction markets</p>
        </div>
      </footer>
    </div>
  );
}
