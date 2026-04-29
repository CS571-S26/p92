"use client";

interface TradeBet {
  steamId: string;
  marketId: string;
  marketOutcome: number;
  status: string;
  createdAt: number;
  resolvedAt?: number | null;
  buyIn: { items: Array<unknown> };
  payout?: { items: Array<unknown> } | null;
}

interface TradesSectionProps {
  bets: TradeBet[];
  isLoading: boolean;
  claimError: string | null;
  claimingBetId: string | null;
  onClaimPayout: (marketId: string) => void;
}

function getStatusColor(status: string) {
  switch (status) {
    case "won":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "active":
      return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case "lost":
    case "cancelled":
      return "bg-rose-500/20 text-rose-400 border-rose-500/30";
    default:
      return "bg-zinc-800 text-zinc-400 border-zinc-700";
  }
}

function formatDate(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleString();
}

export default function TradesSection({
  bets,
  isLoading,
  claimError,
  claimingBetId,
  onClaimPayout,
}: TradesSectionProps) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Your Trades</h2>
      <p className="mt-1 text-sm text-zinc-400">Track your active and past bets.</p>
      {claimError && <p className="mt-2 text-sm text-rose-300">{claimError}</p>}

      {isLoading ? (
        <p className="text-zinc-400">Loading trades...</p>
      ) : bets.length > 0 ? (
        <div className="space-y-3 mt-4">
          {bets.map((bet) => {
            const sideLabel = bet.marketOutcome === 1 ? "YES" : "NO";
            const sideColor = bet.marketOutcome === 1 ? "text-emerald-400" : "text-rose-400";
            const payoutCases = bet.buyIn.items.length;

            return (
              <div
                key={`${bet.steamId}-${bet.marketId}`}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${sideColor}`}>{sideLabel}</span>
                      <span className="text-zinc-400">•</span>
                      <h3 className="text-white font-medium truncate text-sm">
                        {bet.marketId}
                      </h3>
                    </div>
                    <p className="text-sm text-zinc-400 mt-1">
                      Bet: x{bet.buyIn.items.length} cases
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                      bet.status
                    )}`}
                  >
                    {bet.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">
                    {formatDate(bet.createdAt)}
                  </span>
                  {bet.status === "active" && (
                    <span className="text-amber-400">In Progress</span>
                  )}
                  {bet.status === "payout_pending" && (
                    <span className="text-amber-400">Ready to Claim</span>
                  )}
                  {bet.status === "paid" && (
                    <span className="text-emerald-400">Paid Out</span>
                  )}
                  {(bet.status === "lost" || bet.status === "cancelled") && (
                    <span className="text-rose-400">
                      {bet.status === "lost" ? "Lost" : "Cancelled"}
                    </span>
                  )}
                </div>
                {bet.resolvedAt && (
                  <p className="mt-1 text-xs text-zinc-500">
                    Resolved: {formatDate(bet.resolvedAt)}
                  </p>
                )}
                {bet.status === "paid" && bet.payout && (
                  <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2">
                    <p className="text-xs text-emerald-300">
                      Payout: x{bet.payout.items.length} cases received
                    </p>
                  </div>
                )}
                {bet.status === "payout_pending" && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => onClaimPayout(bet.marketId)}
                      disabled={claimingBetId === bet.marketId}
                      className="w-full rounded-lg border border-amber-400/60 bg-amber-500/20 px-4 py-2 text-sm font-semibold text-amber-100 transition enabled:hover:bg-amber-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {claimingBetId === bet.marketId
                        ? "Claiming..."
                        : `Claim ${payoutCases} Cases`}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-zinc-400">No trades yet.</p>
          <p className="mt-2 text-xs text-zinc-400">
            Place a bet on a market to see your trades here.
          </p>
        </div>
      )}
    </div>
  );
}
