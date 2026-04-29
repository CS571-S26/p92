"use client";

import type { OurMarket, Bet } from "@skinshi/api/schemas";

interface MarketCardProps {
	market: OurMarket;
	userBets?: Bet[];
	onBetClick?: (outcome: "yes" | "no") => void;
	isLoggedIn?: boolean;
}

function PolymarketOddsBar({ yes, no }: { yes: number; no: number }) {
	const total = yes + no;
	const yesPercent = total > 0 ? (yes / total) * 100 : 50;
	const noPercent = total > 0 ? (no / total) * 100 : 50;

	return (
		<div className="mb-3">
			<div className="flex justify-between text-[10px] text-zinc-400 mb-1">
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
	isLoggedIn = false,
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

	// Match real API bets to this market (marketId = slug + "-" + id)
	const marketIdentifier = `${market.slug}-${market.id}`;
	const userBetsOnThisMarket = userBets.filter((bet) => bet.marketId === marketIdentifier);
	const hasBetOnYes = userBetsOnThisMarket.some((bet) => bet.marketOutcome === 1);
	const hasBetOnNo = userBetsOnThisMarket.some((bet) => bet.marketOutcome === 0);
	const totalCasesBet = userBetsOnThisMarket.reduce(
		(sum, bet) => sum + bet.buyIn.items.length,
		0
	);
	const hasExistingBet = hasBetOnYes || hasBetOnNo;

	// Determine border/glow based on user's bet on active markets
	const hasAnimatedGlow = !isResolved && hasExistingBet;
	const staticBorderClass = isResolved
		? "border-2 border-zinc-700 opacity-50 pointer-events-none grayscale"
		: "border-2 border-zinc-800 hover:border-zinc-700 transition-all";

	const glowColor = hasBetOnYes ? "#10b981" : "#f43f5e";

	const timeRemaining = formatTimeRemaining(market.endDate);

	const cardContent = (
		<>
			{/* Header with icon and question */}
			<div className="flex items-start gap-3 mb-4">
				{market.icon ? (
					<img
						src={market.icon}
						alt=""
						className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-zinc-800"
					/>
				) : <div className="w-12 h-12 flex-shrink-0" />}
				<div className="flex-1 min-w-0">
					<h2 className="text-base font-semibold text-white leading-tight mb-1 line-clamp-2 min-h-[2.75rem]">{market.question}</h2>
					<div className="flex items-center gap-2 text-xs text-zinc-400">
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
							<div className="text-xs text-zinc-400 italic">No bets yet</div>
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
					disabled={!isLoggedIn || isResolved || hasExistingBet}
					className="py-2 px-4 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-500/20"
				>
					Bet YES
				</button>
				<button
					type="button"
					onClick={() => onBetClick?.("no")}
					disabled={!isLoggedIn || isResolved || hasExistingBet}
					className="py-2 px-4 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 font-medium hover:bg-rose-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-rose-500/20"
				>
					Bet NO
				</button>
			</div>

			{/* Bet status / login message — always renders to keep button alignment */}
			<div className={`mt-3 px-3 py-2 rounded-md text-center text-xs ${hasExistingBet && !isResolved ? (hasBetOnYes ? 'border bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'border bg-rose-500/10 border-rose-500/20 text-rose-400') : !isLoggedIn && !isResolved ? 'bg-zinc-800/50 border border-zinc-700/50 text-zinc-400' : 'invisible'}`}>
				{hasExistingBet && !isResolved
					? `You have ${totalCasesBet} case${totalCasesBet !== 1 ? "s" : ""} on ${hasBetOnYes ? "YES" : "NO"}`
					: !isLoggedIn && !isResolved
						? "Login to place bets"
						: "Placeholder"}
			</div>
		</>
	);

	if (hasAnimatedGlow) {
		return (
			<div className="relative rounded-lg p-[2px] h-full overflow-hidden">
				{/* Giant spinning gradient — only the edges are visible due to overflow-hidden */}
				<div
					className="absolute top-1/2 left-1/2 w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2 animate-[spin_3s_linear_infinite]"
					style={{ background: `conic-gradient(from 0deg, ${glowColor}33, ${glowColor}, ${glowColor}33)` }}
				/>
				<div className="relative bg-zinc-950 rounded-lg p-4 flex flex-col h-full z-10">
					{cardContent}
				</div>
			</div>
		);
	}

	return (
		<div className={`bg-zinc-950 rounded-lg p-4 flex flex-col h-full ${staticBorderClass}`}>
			{cardContent}
		</div>
	);
}
