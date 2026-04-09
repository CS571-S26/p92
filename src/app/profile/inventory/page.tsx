'use client';

import { auth } from "@/lib/firebase";
import { type InventoryItem } from "@/proto/steam/steam";
import { useEffect, useState } from "react";

// Group inventory items by classId
interface GroupedItem {
  item: InventoryItem;
  count: number;
}

interface GroupedInventory {
  items: GroupedItem[];
  totalCount: number;
}

function groupInventoryItems(items: InventoryItem[]): GroupedInventory {
  const map = new Map<string, GroupedItem>();

  for (const item of items) {
    const existing = map.get(item.classId);
    if (existing) {
      existing.count++;
    } else {
      map.set(item.classId, { item, count: 1 });
    }
  }

  return {
    items: Array.from(map.values()),
    totalCount: items.length,
  };
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<GroupedInventory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInventory() {
      try {
        const user = auth.currentUser;
        if (!user) {
          setError("Not logged in");
          setLoading(false);
          return;
        }

        const tokenResult = await user.getIdTokenResult();
        const steamId = tokenResult.claims.steam_id as string | undefined;

        if (!steamId) {
          setError("Steam account not linked");
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/steam/inventory?steamId=${steamId}&casesOnly=true`);
        if (!res.ok) {
          let errorMessage = "Failed to fetch inventory";
          const contentType = res.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            const data = await res.json();
            errorMessage = data.error || errorMessage;
          } else {
            const text = await res.text();
            if (text) errorMessage = text;
          }
          setError(errorMessage);
          setLoading(false);
          return;
        }

        const data = await res.json();
        const responseItems: InventoryItem[] = data.items ?? [];

        const groupedItems = groupInventoryItems(responseItems);
        setInventory(groupedItems);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch inventory");
      } finally {
        setLoading(false);
      }
    }

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchInventory();
      } else {
        setError("Not logged in");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center font-mono text-zinc-500 text-sm">
        <span className="animate-pulse">Loading inventory…</span>
      </div>
    );

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center font-mono text-red-500 text-sm">
        <span>{error}</span>
      </div>
    );
  }

  if (inventory === null) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center font-mono text-zinc-500 text-sm">
        <span>Inventory not found</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] font-mono text-white">
      <div className="max-w-6xl mx-auto px-6 py-6">
        {inventory.items.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-zinc-600 text-sm">
            No inventory items found.
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {inventory.items.map(({ item, count }) => (
              <div
                key={item.classId}
                className="relative rounded-xl overflow-hidden border border-white/10 bg-[#111118] hover:border-white/20 transition-colors duration-150"
              >
                {/* Item Image */}
                <div className="relative aspect-square">
                  <img
                    src={item.iconUrl}
                    alt={item.name}
                    className="w-full h-full object-contain p-2"
                  />

                  {/* Count badge */}
                  {count > 1 && (
                    <span className="absolute bottom-1 right-1.5 bg-black/75 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                      ×{count}
                    </span>
                  )}
                </div>

                {/* Item Name */}
                <div className="px-2 pb-2 pt-1">
                  <p className="text-[11px] text-zinc-400 leading-tight line-clamp-2 text-center">
                    {item.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
