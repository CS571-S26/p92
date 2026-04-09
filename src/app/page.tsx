"use client";

import { useState, useEffect } from "react";
import MarketCard from "@/components/MarketCard";
import BetModal from "@/components/BetModal";
import BetSuccessModal from "@/components/BetSuccessModal";
import api from "@/utils/axios";
import { useAuth } from "@/context/AuthContext";

interface Market {
  id: string;
  slug: string;
  market_id: string;
  question: string;
  icon_url: string;
  end_date: string;
  betting_closes_at: string;
  status: string;
  polymarket_odds: {
    yes: number;
    no: number;
  };
  our_odds: {
    yes: number;
    no: number;
  };
  total_volume: number;
  time_remaining: string;
}

interface UserBet {
  bet_id: string;
  market: {
    slug: string;
    market_id: string;
    question: string;
    icon_url?: string;
    end_date?: string;
    status?: string;
  };
  outcome: string;
  item_count: number;
  trade_status: string;
}

export default function Home() {
  const { user } = useAuth();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [userBets, setUserBets] = useState<UserBet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
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
  const [successMarket, setSuccessMarket] = useState<Market | null>(null);

  // Fetch markets and user bets
  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Always fetch markets
      const marketsRes = await api.get("/markets");
      setMarkets(marketsRes.data.markets || []);
      
      // Only fetch user bets if logged in
      if (user) {
        try {
          const betsRes = await api.get("/me/bets");
          setUserBets(betsRes.data.bets || []);
        } catch (err) {
          // Silently fail - user might not have bets
          setUserBets([]);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load markets");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleBetClick = (market: Market, outcome: "yes" | "no") => {
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
    
    // Refresh markets and bets to show updated data
    fetchData();
  };

  const handleSuccessClose = () => {
    setIsSuccessModalOpen(false);
    setSuccessResult(null);
    setSuccessMarket(null);
    // Redirect to trade page after closing
    window.location.href = "/profile/trade";
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Active Markets</h2>
          <p className="text-zinc-400">
            Bet your CS2 cases on Polymarket outcomes
          </p>
        </div>

        {/* Markets grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-zinc-500">Loading markets...</div>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-rose-400 text-lg">{error}</p>
            <p className="text-zinc-600 text-sm mt-2">Please try again later</p>
          </div>
        ) : markets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {markets.map((market) => (
              <MarketCard 
                key={market.id} 
                market={market} 
                userBets={userBets}
                onBetClick={(outcome) => handleBetClick(market, outcome)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-zinc-500 text-lg">No active markets right now.</p>
            <p className="text-zinc-600 text-sm mt-2">Check back later!</p>
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
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-zinc-600 text-sm">
          <p>skinshi - Bet CS2 cases on prediction markets</p>
        </div>
      </footer>
    </div>
  );
}
