"use client";

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

interface MarketCardProps {
  market: {
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
  };
  userBets?: UserBet[];
  onBetClick?: (outcome: "yes" | "no") => void;
}

function PolymarketOddsBar({ yes, no }: { yes: number; no: number }) {
  const total = yes + no;
  const yesPercent = total > 0 ? (yes / total) * 100 : 50;
  const noPercent = total > 0 ? (no / total) * 100 : 50;

  return (
    <div className="mb-3">
      <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
        <span>Polymarket</span>
        <span>{Math.round(yesPercent)}% / {Math.round(noPercent)}%</span>
      </div>
      <div className="h-1 bg-zinc-800 rounded-full overflow-hidden flex">
        <div 
          className="h-full bg-blue-400/60 transition-all duration-300"
          style={{ width: `${yesPercent}%` }}
        />
        <div 
          className="h-full bg-slate-400/60 transition-all duration-300"
          style={{ width: `${noPercent}%` }}
        />
      </div>
    </div>
  );
}

function OurOddsBar({ yes, no }: { yes: number; no: number }) {
  const total = yes + no;
  const yesPercent = total > 0 ? (yes / total) * 100 : 50;
  const noPercent = total > 0 ? (no / total) * 100 : 50;

  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs text-zinc-300 mb-1.5">
        <span className="font-medium">Our Market</span>
        <span className="text-zinc-400">Yes: {yes} | No: {no}</span>
      </div>
      <div className="h-3 bg-zinc-800 rounded-lg overflow-hidden flex shadow-inner">
        <div 
          className="h-full bg-emerald-500 transition-all duration-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
          style={{ width: `${yesPercent}%` }}
        />
        <div 
          className="h-full bg-rose-500 transition-all duration-300 shadow-[0_0_10px_rgba(244,63,94,0.3)]"
          style={{ width: `${noPercent}%` }}
        />
      </div>
    </div>
  );
}

export default function MarketCard({ market, userBets = [], onBetClick }: MarketCardProps) {
  const formatOdds = (odds: { yes: number; no: number }) => {
    if (odds.yes === 0 && odds.no === 0) return null;
    const total = odds.yes + odds.no;
    return {
      yes: total > 0 ? Math.round((odds.yes / total) * 100) : 0,
      no: total > 0 ? Math.round((odds.no / total) * 100) : 0,
    };
  };

  const polymarketFormatted = formatOdds(market.polymarket_odds);
  const ourFormatted = formatOdds(market.our_odds);

  // Calculate user's bets on this market
  const userBetsOnThisMarket = userBets.filter(bet => bet.market.market_id === market.market_id);
  const yesBets = userBetsOnThisMarket.filter(bet => bet.outcome === "yes");
  const noBets = userBetsOnThisMarket.filter(bet => bet.outcome === "no");
  const yesCasesCount = yesBets.reduce((sum, bet) => sum + bet.item_count, 0);
  const noCasesCount = noBets.reduce((sum, bet) => sum + bet.item_count, 0);
  const totalCasesBet = yesCasesCount + noCasesCount;
  const hasBetOnYes = yesCasesCount > 0;
  const hasBetOnNo = noCasesCount > 0;

  // Determine border color based on user's bet
  let borderClass = "border-zinc-800";
  if (totalCasesBet > 0) {
    if (hasBetOnYes && hasBetOnNo) {
      borderClass = "border-amber-500/50";
    } else if (hasBetOnYes) {
      borderClass = "border-emerald-500/50";
    } else if (hasBetOnNo) {
      borderClass = "border-rose-500/50";
    }
  }

  return (
    <div className={`bg-zinc-950 border-2 ${borderClass} rounded-lg p-4 hover:border-zinc-700 transition-all ${totalCasesBet > 0 ? 'shadow-lg' : ''}`}>
      {/* User bet indicator */}
      {totalCasesBet > 0 && (
        <div className="mb-3 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
          <p className="text-xs text-emerald-400 font-medium">
            {hasBetOnYes && hasBetOnNo ? (
              <>You have bet {yesCasesCount} case{yesCasesCount !== 1 ? 's' : ''} on YES and {noCasesCount} case{noCasesCount !== 1 ? 's' : ''} on NO</>
            ) : hasBetOnYes ? (
              <>You have bet {yesCasesCount} case{yesCasesCount !== 1 ? 's' : ''} on YES</>
            ) : (
              <>You have bet {noCasesCount} case{noCasesCount !== 1 ? 's' : ''} on NO</>
            )}
          </p>
        </div>
      )}

      {/* Header with icon and question */}
      <div className="flex items-start gap-3 mb-4">
        {market.icon_url && (
          <img 
            src={market.icon_url} 
            alt="" 
            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white leading-tight mb-1">
            {market.question}
          </h3>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="capitalize">{market.status}</span>
            <span>•</span>
            <span title={`Betting closes at: ${new Date(market.betting_closes_at).toLocaleString()}`}>
              Betting closes: {market.time_remaining}
            </span>
          </div>
        </div>
      </div>

      {/* Odds comparison - Our Market first (bigger, more prominent) */}
      <div className="mb-4">
        {ourFormatted && ourFormatted.yes + ourFormatted.no > 0 ? (
          <OurOddsBar 
            yes={ourFormatted.yes} 
            no={ourFormatted.no} 
          />
        ) : (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-zinc-300 mb-1.5">
              <span className="font-medium">Our Market</span>
            </div>
            <div className="text-xs text-zinc-500 italic">
              No bets yet on our market
            </div>
          </div>
        )}

        {polymarketFormatted && (
          <PolymarketOddsBar 
            yes={polymarketFormatted.yes} 
            no={polymarketFormatted.no} 
          />
        )}
      </div>

      {/* Volume */}
      <div className="flex items-center justify-between text-sm mb-4">
        <span className="text-zinc-400">Volume:</span>
        <span className="text-white font-medium">{market.total_volume} cases</span>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onBetClick?.("yes")}
          className="py-2 px-4 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium hover:bg-emerald-500/30 transition-colors"
        >
          Bet YES
        </button>
        <button
          onClick={() => onBetClick?.("no")}
          className="py-2 px-4 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 font-medium hover:bg-rose-500/30 transition-colors"
        >
          Bet NO
        </button>
      </div>
    </div>
  );
}
