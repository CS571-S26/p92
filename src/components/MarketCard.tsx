"use client";

import type { OurMarket } from "@skinshi/auth-worker/schemas";
import type { UserBet } from "@/types/market";

interface MarketCardProps {
	market: OurMarket;
	userBets?: UserBet[];
	onBetClick?: (outcome: "yes" | "no") => void;
	hasPendingBets?: boolean;
}

function PolymarketOddsBar({ yes, no }: { yes: number; no: number }) {
	const total = yes + no;
	const yesPercent = total > 0 ? (yes / total) * 100 : 50;
	const noPercent = total > 0 ? (no / total) * 100 : 50;

	return (
		<div className="mb-3">
			<div className="flex justify-between text-[10px] text-zinc-500 mb-1">
				<span>Polymarket</span>
				<span>
					{Math.round(yesPercent)}% / {Math.round(noPercent)}%
				</span>
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
				<span className="text-zinc-400">
					Yes: {yes} | No: {no}
				</span>
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

function formatTimeRemaining(endDate: Date | null): string {
	if (!endDate) return "Unknown";
	const now = new Date();

	if (endDate <= now) return "Closed";

	const diffMs = endDate.getTime() - now.getTime();
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
	const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

	if (diffDays > 0) return `${diffDays}d ${diffHours}h`;
	if (diffHours > 0) return `${diffHours}h`;
	return "< 1h";
}

export default function MarketCard({
	market,
	userBets = [],
	onBetClick,
	hasPendingBets = false,
}: MarketCardProps) {
	// Check if market is resolved (or closed/cancelled) - disable betting
	const isResolved = market.status !== 'open';
	const resolvedReason = market.status === 'resolved' 
		? 'Market resolved' 
		: market.status === 'closed' 
			? 'Betting closed' 
			: market.status === 'cancelled' 
				? 'Market cancelled' 
				: null;

	// Calculate odds from OurMarket data
	const yesProb = market.polymarketYesProbability ?? 0.5;
	const polymarketOdds = {
		yes: Math.round(yesProb * 100),
		no: Math.round((1 - yesProb) * 100),
	};

	const totalPool = market.totalPoolYes + market.totalPoolNo;
	const hasBets = market.totalPoolYes > 0 || market.totalPoolNo > 0;
	const ourOdds = hasBets
		? {
				yes: Math.round((market.totalPoolYes / totalPool) * 100),
				no: Math.round((market.totalPoolNo / totalPool) * 100),
			}
		: { yes: 0, no: 0 };

	// Calculate user's bets on this market
	const userBetsOnThisMarket = userBets.filter((bet) => bet.market.market_id === market.id);
	const yesBets = userBetsOnThisMarket.filter((bet) => bet.outcome === "yes");
	const noBets = userBetsOnThisMarket.filter((bet) => bet.outcome === "no");
	const yesCasesCount = yesBets.reduce((sum, bet) => sum + bet.item_count, 0);
	const noCasesCount = noBets.reduce((sum, bet) => sum + bet.item_count, 0);
	const totalCasesBet = yesCasesCount + noCasesCount;
	const hasBetOnYes = yesCasesCount > 0;
	const hasBetOnNo = noCasesCount > 0;

	// Determine border color based on user's bet and resolved status
	let borderClass = "border-zinc-800";
	if (isResolved) {
		borderClass = "border-zinc-700";
	} else if (totalCasesBet > 0) {
		if (hasBetOnYes && hasBetOnNo) {
			borderClass = "border-amber-500/50";
		} else if (hasBetOnYes) {
			borderClass = "border-emerald-500/50";
		} else if (hasBetOnNo) {
			borderClass = "border-rose-500/50";
		}
	}

	const timeRemaining = formatTimeRemaining(market.endDate);

	return (
		<div
			className={`bg-zinc-950 border-2 ${borderClass} rounded-lg p-4 transition-all flex flex-col ${
				isResolved
					? "opacity-50 pointer-events-none grayscale"
					: `hover:border-zinc-700 ${totalCasesBet > 0 ? "shadow-lg" : ""}`
				}`}
		>
			{/* User bet indicator */}
			{totalCasesBet > 0 && (
				<div className="mb-3 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
					<p className="text-xs text-emerald-400 font-medium">
						{hasBetOnYes && hasBetOnNo ? (
							<>
								You have bet {yesCasesCount} case
								{yesCasesCount !== 1 ? "s" : ""} on YES and {noCasesCount} case
								{noCasesCount !== 1 ? "s" : ""} on NO
							</>
						) : hasBetOnYes ? (
							<>
								You have bet {yesCasesCount} case
								{yesCasesCount !== 1 ? "s" : ""} on YES
							</>
						) : (
							<>
								You have bet {noCasesCount} case
								{noCasesCount !== 1 ? "s" : ""} on NO
							</>
						)}
					</p>
				</div>
			)}

			{/* Header with icon and question */}
			<div className="flex items-start gap-3 mb-4">
				{market.icon ? (
					<img
						src={market.icon}
						alt=""
						className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-zinc-800"
					/>
				) : null}
				<div className="flex-1 min-w-0">
					<h3 className="font-semibold text-white leading-tight mb-1">{market.question}</h3>
					<div className="flex items-center gap-2 text-xs text-zinc-500">
						<span className="capitalize">{market.status}</span>
						<span>•</span>
						<span title={market.endDate ? `Betting closes at: ${market.endDate.toLocaleString()}` : "Betting close date not available"}>
							Betting closes: {timeRemaining}
						</span>
					</div>
				</div>
			</div>

			{/* Middle content - grows to push buttons to bottom */}
			<div className="flex-1 flex flex-col justify-end">
				{/* Odds comparison - Our Market first (bigger, more prominent) */}
				<div className="mb-4">
					{hasBets ? (
						<OurOddsBar yes={ourOdds.yes} no={ourOdds.no} />
					) : (
						<div className="mb-3">
							<div className="flex justify-between text-xs text-zinc-300 mb-1.5">
								<span className="font-medium">Our Market</span>
							</div>
							<div className="text-xs text-zinc-500 italic">No bets yet</div>
						</div>
					)}

					<PolymarketOddsBar yes={polymarketOdds.yes} no={polymarketOdds.no} />
				</div>

				{/* Volume */}
				<div className="flex items-center justify-between text-sm mb-4">
					<span className="text-zinc-400">Volume:</span>
					<span className="text-white font-medium">{totalPool} cases</span>
				</div>
			</div>

			{/* Action buttons - always at bottom */}
			<div className="grid grid-cols-2 gap-2">
				<button
					type="button"
					onClick={() => onBetClick?.("yes")}
					disabled={hasPendingBets || isResolved}
					className="py-2 px-4 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-500/20"
				>
					Bet YES
				</button>
				<button
					type="button"
					onClick={() => onBetClick?.("no")}
					disabled={hasPendingBets || isResolved}
					className="py-2 px-4 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 font-medium hover:bg-rose-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-rose-500/20"
				>
					Bet NO
				</button>
			</div>

			{/* Resolved market message */}
			{isResolved && resolvedReason && (
				<div className="mt-3 px-3 py-2 bg-zinc-700/30 border border-zinc-600/30 rounded-md">
					<p className="text-xs text-zinc-400 text-center">
						{resolvedReason} — betting unavailable
					</p>
				</div>
			)}

			{/* Pending bets warning */}
			{hasPendingBets && !isResolved && (
				<div className="mt-3 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-md">
					<p className="text-xs text-amber-400 text-center">
						Accept your pending trade(s) before placing new bets
					</p>
				</div>
			)}
		</div>
	);
}
