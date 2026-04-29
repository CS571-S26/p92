"use client";

interface InventoryItem {
  assetid: string;
  classid: string;
  name: string;
  icon_url: string;
}

interface GroupedItem {
  classid: string;
  name: string;
  icon_url: string;
  count: number;
}

interface InventorySectionProps {
  items: InventoryItem[];
}

function groupByClassid(items: InventoryItem[]): GroupedItem[] {
  const map = new Map<string, GroupedItem>();
  for (const item of items) {
    const existing = map.get(item.classid);
    if (existing) {
      existing.count++;
    } else {
      map.set(item.classid, {
        classid: item.classid,
        name: item.name,
        icon_url: item.icon_url,
        count: 1,
      });
    }
  }
  return Array.from(map.values());
}

export default function InventorySection({ items }: InventorySectionProps) {
  const grouped = groupByClassid(items);

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Your Inventory ({items.length} items)</h2>
      {grouped.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {grouped.map((item) => (
            <div
              key={item.classid}
              className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 aspect-square flex flex-col items-center justify-center relative"
            >
              <img
                src={`https://steamcommunity-a.akamaihd.net/economy/image/${item.icon_url}`}
                alt={item.name}
                className="w-full h-full max-h-[60%] object-contain mb-2"
              />
              <p className="text-xs text-zinc-300 truncate w-full text-center px-1">
                {item.name}
              </p>
              {item.count > 1 && (
                <span className="absolute top-2 right-2 bg-emerald-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                  ×{item.count}
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-zinc-400">No items in inventory.</p>
      )}
    </div>
  );
}
