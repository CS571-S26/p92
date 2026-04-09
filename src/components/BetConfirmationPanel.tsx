'use client';

interface BetConfirmationPanelProps {
  marketTitle: string;
  outcome: 'yes' | 'no';
  selectedCount: number;
  canSubmit: boolean;
  submitting: boolean;
  error: string | null;
  onOutcomeChange: (next: 'yes' | 'no') => void;
  onSubmit: () => void;
}

export default function BetConfirmationPanel({
  marketTitle,
  outcome,
  selectedCount,
  canSubmit,
  submitting,
  error,
  onOutcomeChange,
  onSubmit,
}: BetConfirmationPanelProps) {
  return (
    <aside className="rounded-2xl border border-white/10 bg-[#12141b] p-5 lg:sticky lg:top-6">
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Bet Slip</p>
      <h2 className="mt-2 text-sm font-semibold text-zinc-100">{marketTitle}</h2>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onOutcomeChange('yes')}
          className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${outcome === 'yes'
            ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
            : 'border-white/10 bg-black/20 text-zinc-300 hover:border-white/20'
            }`}
        >
          YES
        </button>
        <button
          type="button"
          onClick={() => onOutcomeChange('no')}
          className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${outcome === 'no'
            ? 'border-rose-400 bg-rose-500/20 text-rose-200'
            : 'border-white/10 bg-black/20 text-zinc-300 hover:border-white/20'
            }`}
        >
          NO
        </button>
      </div>

      <div className="mt-5 rounded-lg border border-white/10 bg-black/20 p-3">
        <p className="text-xs text-zinc-400">Selected cases</p>
        <p className="mt-1 text-2xl font-bold text-white">{selectedCount}</p>
        <p className="mt-1 text-xs text-zinc-500">1 case = 1 entry</p>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          {error}
        </div>
      )}

      <button
        type="button"
        disabled={!canSubmit || submitting}
        onClick={onSubmit}
        className="mt-5 w-full rounded-lg border border-emerald-400/60 bg-emerald-500/20 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition enabled:hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? 'Sending Trade Offer...' : 'Place Bet'}
      </button>
      <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
        Betting closes 3 days before market end. Trade offers expire in 1 hour if not accepted.
      </p>
    </aside>
  );
}
