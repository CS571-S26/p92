import { useTradeUrl } from "@/hooks/useTradeUrl";

export default function TradeUrlSection() {
  const { tradeUrl, dirty, setTradeUrl, saveTradeUrl } = useTradeUrl();

  const handleSave = () => {
    saveTradeUrl(tradeUrl);
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Trade Settings</h2>
      <label htmlFor="trade-url" className="block text-xs uppercase tracking-[0.18em] text-zinc-400">
        Steam Trade URL
      </label>
      <input
        id="trade-url"
        type="url"
        value={tradeUrl}
        onChange={(e) => setTradeUrl(e.target.value)}
        placeholder="https://steamcommunity.com/tradeoffer/new/?partner=...&token=..."
        className="mt-3 w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-white/30 focus:ring-1 focus:ring-white/20"
      />
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty}
          className="rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-100 transition enabled:hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Save Trade URL
        </button>
        {dirty && <span className="text-xs text-amber-200">Unsaved changes</span>}
      </div>
    </div>
  );
}
