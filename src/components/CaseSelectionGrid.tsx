'use client';

export interface CaseInventoryItem {
  assetId: string;
  classId: string;
  name: string;
  tradable: boolean;
  iconUrl: string;
  quality: string;
  rarity: string;
  isCase: boolean;
}

interface CaseSelectionGridProps {
  items: CaseInventoryItem[];
  selectedAssetIds: Set<string>;
  onToggleAsset: (assetId: string) => void;
}

export default function CaseSelectionGrid({
  items,
  selectedAssetIds,
  onToggleAsset,
}: CaseSelectionGridProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#12141b] p-8 text-center text-zinc-500">
        No tradable CS2 cases available in your inventory.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => {
        const selected = selectedAssetIds.has(item.assetId);
        const icon = item.iconUrl;

        return (
          <button
            key={item.assetId}
            type="button"
            onClick={() => onToggleAsset(item.assetId)}
            className={`group rounded-xl border p-3 text-left transition ${selected
              ? 'border-emerald-400 bg-emerald-500/10'
              : 'border-white/10 bg-[#101218] hover:border-white/25'
              }`}
          >
            <div className="relative mb-3 aspect-square overflow-hidden rounded-lg bg-black/30">
              <img src={icon} alt={item.name} className="h-full w-full object-contain p-2" />
              <span className={`absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full border text-xs ${selected
                ? 'border-emerald-300 bg-emerald-400 text-black'
                : 'border-white/20 bg-black/40 text-zinc-400'
                }`}>
                {selected ? '1' : '+'}
              </span>
            </div>
            <p className="line-clamp-2 text-xs text-zinc-200">{item.name}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wide text-zinc-500">Asset #{item.assetId}</p>
          </button>
        );
      })}
    </div>
  );
}
