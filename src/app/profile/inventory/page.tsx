'use client';

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

// Group inventory items by classid
interface GroupedItem {
  classid: string;
  assetid: string;
  icon_url: string;
  count: number;
}

interface GroupedInventory {
  items: GroupedItem[];
  totalCount: number;
}

function groupInventoryItems(
  items: Array<{
    assetid: string;
    classid: string;
    icon_url: string;
  }>
): GroupedInventory {
  const map = new Map<string, GroupedItem>();

  for (const item of items) {
    const existing = map.get(item.classid);
    if (existing) {
      existing.count++;
    } else {
      map.set(item.classid, {
        classid: item.classid,
        assetid: item.assetid,
        icon_url: item.icon_url,
        count: 1,
      });
    }
  }

  return {
    items: Array.from(map.values()),
    totalCount: items.length,
  };
}

export default function InventoryPage() {
  const trpc = useTRPC();
  const inventoryQuery = useQuery(trpc.user.inventory.queryOptions());

  if (inventoryQuery.isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center font-mono text-zinc-500 text-sm">
        <span className="animate-pulse">Loading inventory…</span>
      </div>
    );
  }

  if (inventoryQuery.error) {
    const errorMessage = inventoryQuery.error.message;

    // Handle specific error cases
    if (errorMessage.includes("Steam account not linked")) {
      return (
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center font-mono text-sm">
          <div className="text-center">
            <p className="text-zinc-400 mb-4">Steam account not linked</p>
            <Link
              href="/link-steam"
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-black rounded-lg font-medium transition-colors inline-block"
            >
              Link Steam Account
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center font-mono text-red-500 text-sm">
        <span>{errorMessage}</span>
      </div>
    );
  }

  if (!inventoryQuery.data?.items || inventoryQuery.data.items.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center font-mono text-zinc-500 text-sm">
        <span>No inventory items found.</span>
      </div>
    );
  }

  const inventory = groupInventoryItems(inventoryQuery.data.items);

  return (
    <div className="min-h-screen bg-[#0a0a0f] font-mono text-white">
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {inventory.items.map((item) => (
            <div
              key={item.classid}
              className="relative rounded-xl overflow-hidden border border-white/10 bg-[#111118] hover:border-white/20 transition-colors duration-150"
            >
              {/* Item Image */}
              <div className="relative aspect-square">
                <img
                  src={`https://steamcommunity-a.akamaihd.net/economy/image/${item.icon_url}`}
                  alt={`Item ${item.assetid}`}
                  className="w-full h-full object-contain p-2"
                />

                {/* Count badge */}
                {item.count > 1 && (
                  <span className="absolute bottom-1 right-1.5 bg-black/75 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                    ×{item.count}
                  </span>
                )}
              </div>

              {/* Item Name */}
              <div className="px-2 pb-2 pt-1">
                <p className="text-[11px] text-zinc-400 leading-tight line-clamp-2 text-center">
                  Item #{item.assetid.slice(-6)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
