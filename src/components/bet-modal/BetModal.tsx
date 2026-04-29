"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { useBetTrade } from "@/hooks/useBetting";
import { useTradeUrl } from "@/hooks/useTradeUrl";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { PlaceBetSchema } from "@skinshi/api/schemas/bet";
import DraggableCase from "./DraggableCase";
import QuantityPopup from "./QuantityPopup";
import DroppablePool from "./DroppablePool";
import type { BetModalProps, InventoryAsset, InventoryItem, GroupedItem, PoolItem } from "./types";

const ITEMS_PER_PAGE = 12;

export default function BetModal({
  isOpen,
  onClose,
  onSuccess,
  market,
  outcome,
}: BetModalProps) {
  const trpc = useTRPC();
  const betTradeMutation = useBetTrade();
  const { tradeUrl, hasTradeUrl, setTradeUrl, saveTradeUrl, setHasTradeUrl } = useTradeUrlLocal();

  // Check if market is resolved (or closed/cancelled) - disable betting entirely
  const isResolved = market.status !== "open";
  const resolvedReason =
    market.status === "resolved"
      ? "Market resolved"
      : market.status === "closed"
        ? "Betting closed"
        : market.status === "cancelled"
          ? "Market cancelled"
          : null;

  // Fetch inventory via tRPC (must be before any hooks that reference it)
  const inventoryQuery = useQuery({
    ...trpc.user.inventory.queryOptions(),
    enabled: isOpen,
  });

  const [pool, setPool] = useState<PoolItem[]>([]);
  const [activeDragItem, setActiveDragItem] = useState<GroupedItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQuantityPopup, setShowQuantityPopup] = useState(false);
  const [selectedItemForPool, setSelectedItemForPool] = useState<GroupedItem | null>(null);
  const [pendingBets, setPendingBets] = useState(0);
  const [userBetHistory, setUserBetHistory] = useState<{ totalBets: number; totalCases: number } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  // Transform tRPC data to BetModal format
  const inventory: InventoryItem[] = useMemo(() => {
    if (!inventoryQuery.data?.items) return [];
    return inventoryQuery.data.items.map((item: InventoryAsset) => ({
      assetId: item.assetid,
      classId: item.classid,
      name: item.name,
      tradable: true,
      iconUrl: `https://steamcommunity-a.akamaihd.net/economy/image/${item.icon_url}`,
      isCase: true,
    }));
  }, [inventoryQuery.data]);

  // Refresh inventory when modal opens
  useEffect(() => {
    if (isOpen && inventoryQuery.refetch) {
      inventoryQuery.refetch();
    }
  }, [isOpen, inventoryQuery]);

  // Group inventory by classId
  const groupedInventory = useMemo(() => {
    const groups = new Map<string, GroupedItem>();

    inventory.forEach((item) => {
      if (!groups.has(item.classId)) {
        groups.set(item.classId, {
          classId: item.classId,
          name: item.name,
          iconUrl: item.iconUrl,
          availableAssetIds: [],
          inPoolAssetIds: [],
        });
      }
      const group = groups.get(item.classId)!;
      group.availableAssetIds.push(item.assetId);
    });

    // Subtract pool items from available
    pool.forEach((poolItem) => {
      const group = groups.get(poolItem.classId);
      if (group) {
        group.inPoolAssetIds = [...poolItem.assetIds];
        group.availableAssetIds = group.availableAssetIds.filter(
          (id) => !poolItem.assetIds.includes(id),
        );
      }
    });

    return Array.from(groups.values());
  }, [inventory, pool]);

  const hasItems = groupedInventory.length > 0;
  const isLoading = inventoryQuery.isLoading;
  const totalPages = Math.ceil(groupedInventory.length / ITEMS_PER_PAGE);
  const paginatedInventory = groupedInventory.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // TODO: Fetch user's bet history via tRPC once auth worker has bets.list procedure
  useEffect(() => {
    setUserBetHistory(null);
    setPendingBets(0);
  }, []);

  // Handle tRPC errors
  useEffect(() => {
    if (inventoryQuery.error) {
      const errorMessage = inventoryQuery.error.message;
      if (errorMessage.includes("Steam account not linked")) {
        setError("Please link your Steam account in your profile to bet");
      } else if (errorMessage.includes("not authenticated")) {
        setError("Please login to place bets");
      } else {
        setError("Failed to load inventory");
      }
    }
  }, [inventoryQuery.error]);

  const handleDragStart = (event: DragStartEvent) => {
    const item = groupedInventory.find((i) => i.classId === event.active.id);
    if (item && item.availableAssetIds.length > 0) {
      setActiveDragItem(item);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (over?.id === "pool") {
      const item = groupedInventory.find((i) => i.classId === active.id);
      if (item && item.availableAssetIds.length > 0) {
        setSelectedItemForPool(item);
        setShowQuantityPopup(true);
      }
    }
  };

  const handleQuantityConfirm = (quantity: number) => {
    if (!selectedItemForPool) return;

    const assetIdsToAdd = selectedItemForPool.availableAssetIds.slice(0, quantity);

    setPool((prev) => {
      const existing = prev.find((p) => p.classId === selectedItemForPool.classId);
      if (existing) {
        return prev.map((p) =>
          p.classId === selectedItemForPool.classId
            ? { ...p, assetIds: [...p.assetIds, ...assetIdsToAdd] }
            : p,
        );
      }
      return [
        ...prev,
        {
          classId: selectedItemForPool.classId,
          name: selectedItemForPool.name,
          iconUrl: selectedItemForPool.iconUrl,
          assetIds: assetIdsToAdd,
        },
      ];
    });

    setShowQuantityPopup(false);
    setSelectedItemForPool(null);
  };

  const removeFromPool = (classId: string) => {
    setPool((prev) => prev.filter((p) => p.classId !== classId));
  };

  const updateQuantity = (classId: string, delta: number) => {
    setPool((prev) => {
      const updated = prev.map((p) => {
        if (p.classId !== classId) return p;

        const group = groupedInventory.find((g) => g.classId === classId);
        const availableCount = group?.availableAssetIds.length || 0;

        if (delta > 0 && availableCount > 0) {
          const assetIdToAdd = group!.availableAssetIds[0];
          return { ...p, assetIds: [...p.assetIds, assetIdToAdd] };
        } else if (delta < 0 && p.assetIds.length > 0) {
          return { ...p, assetIds: p.assetIds.slice(0, -1) };
        }
        return p;
      });

      return updated.filter((p) => p.assetIds.length > 0);
    });
  };

  const handleSaveTradeUrl = () => {
    if (saveTradeUrl(tradeUrl)) {
      setHasTradeUrl(true);
    }
  };

  const handleSubmit = async () => {
    if (pool.length === 0) {
      setError("Please add cases to your pool");
      return;
    }

    if (!tradeUrl || tradeUrl.trim() === "") {
      setError("Please enter your Steam trade URL");
      setHasTradeUrl(false);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const poolAssetIds = pool.flatMap((item) => item.assetIds);
      const selectedItems = inventory.filter((item) =>
        poolAssetIds.includes(item.assetId),
      );

      const payload = {
        slug: market.slug,
        id: market.id,
        marketOutcome: outcome === "yes" ? 1 : 0,
        tradeUrl: tradeUrl,
        message: "Bet on " + market.question,
        items: selectedItems.map((item) => ({
          appid: "730",
          contextid: "2",
          assetid: item.assetId,
          classid: item.classId,
          instanceid: "0",
          icon_url: item.iconUrl.replace(
            "https://steamcommunity-a.akamaihd.net/economy/image/",
            "",
          ),
          background_color: "",
          name: item.name,
        })),
      };

      try {
        PlaceBetSchema.parse(payload);
      } catch (validationError: unknown) {
        const message =
          validationError instanceof Error
            ? validationError.message
            : 'Validation failed';
        setError(`Validation error: ${message}`);
        setIsSubmitting(false);
        return;
      }

      const result = await betTradeMutation.mutateAsync(payload);

      setPool([]);
      inventoryQuery.refetch();

      onSuccess?.({
        bet_id: result.marketId,
        market_slug: market.slug,
        market_id: market.id,
        outcome: outcome,
        trade_offer_id: result.tradeId || "",
        trade_status: "pending",
        trade_expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        item_count: result.itemsBet,
      });

      onClose();
    } catch {
      setError("Failed to place bet");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const totalPoolCases = pool.reduce((sum, item) => sum + item.assetIds.length, 0);

  if (isResolved) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {resolvedReason}
          </h3>
          <p className="text-zinc-400 text-sm mb-6">
            This market is no longer accepting bets.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const isAuthError = error?.includes("login") || error?.includes("Steam account");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            {market.icon && (
              <img src={market.icon} alt="" className="w-10 h-10 rounded-lg object-cover" />
            )}
            <div>
              <h3 className="font-semibold text-white">{market.question}</h3>
              <p className="text-sm text-zinc-400">
                Betting:{" "}
                <span className={outcome === "yes" ? "text-emerald-400" : "text-rose-400"}>
                  {outcome.toUpperCase()}
                </span>
              </p>
              <p className="text-xs text-amber-400 mt-1">
                Betting closes:{" "}
                {market.endDate ? market.endDate.toLocaleString() : "Unknown"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white text-2xl"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Auth Error State */}
        {isAuthError && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-white mb-2">
              {error?.includes("Steam") ? "Steam Account Required" : "Login Required"}
            </h4>
            <p className="text-zinc-400 text-sm mb-6 max-w-sm">
              {error?.includes("Steam")
                ? "You need to link your Steam account to place bets with CS2 cases."
                : "Please login to start placing bets on prediction markets."}
            </p>
            <a
              href={error?.includes("Steam") ? "/settings" : "/login"}
              className="px-6 py-2 bg-white text-black rounded-lg font-medium hover:bg-zinc-200 transition-colors"
            >
              {error?.includes("Steam") ? "Link Steam Account" : "Login"}
            </a>
          </div>
        )}

        {/* Content - Only show if no auth error */}
        {!isAuthError && (
          <div className="flex-1 overflow-hidden flex">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              {/* Left - Pool */}
              <div className="w-1/3 p-4 border-r border-zinc-800 flex flex-col">
                <DroppablePool
                  pool={pool}
                  onRemove={removeFromPool}
                  onUpdateQuantity={updateQuantity}
                />

                {/* Trade URL Section */}
                <div className="mt-4 p-3 bg-zinc-900 rounded-lg">
                  <h4 className="text-sm font-medium text-zinc-400 mb-2">
                    Trade URL
                  </h4>
                  {!hasTradeUrl ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={tradeUrl}
                        onChange={(e) => setTradeUrl(e.target.value)}
                        placeholder="https://steamcommunity.com/tradeoffer/new/?partner=..."
                        aria-label="Steam Trade URL"
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded text-sm text-white placeholder-zinc-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <button
                        onClick={handleSaveTradeUrl}
                        className="w-full py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-sm hover:bg-emerald-500/30"
                      >
                        Save Trade URL
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-400 truncate flex-1">
                        {tradeUrl}
                      </span>
                      <button
                        onClick={() => setHasTradeUrl(false)}
                        className="text-xs text-zinc-400 hover:text-white ml-2"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>

                {/* Pending Bets Warning */}
                {pendingBets > 0 && (
                  <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <p className="text-sm text-amber-400">
                      <span className="font-semibold">
                        ⚠️ You have {pendingBets} pending trade
                        {pendingBets !== 1 ? "s" : ""}
                      </span>
                      <br />
                      <span className="text-xs">
                        Accept your pending trade(s) in Steam before placing new
                        bets.
                      </span>
                    </p>
                  </div>
                )}

                {/* Empty Inventory Warning */}
                {!hasItems && !isLoading && (
                  <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                    <p className="text-sm text-rose-400">
                      <span className="font-semibold">No items available</span>
                      <br />
                      <span className="text-xs">
                        You need CS2 cases in your Steam inventory to place bets.
                      </span>
                    </p>
                  </div>
                )}

                {/* Confirm Button */}
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || totalPoolCases === 0 || !hasTradeUrl || !hasItems || pendingBets > 0}
                  className="mt-4 w-full py-3 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting
                    ? "Sending Trade..."
                    : !hasItems
                      ? "No Items Available"
                      : !hasTradeUrl
                        ? "Set Trade URL First"
                        : totalPoolCases === 0
                          ? "Add Items to Pool"
                          : pendingBets > 0
                            ? `Pending Trades (${pendingBets})`
                            : `Confirm Bet (${totalPoolCases} cases)`}
                </button>

                {error && (
                  <p className="mt-2 text-sm text-rose-400 text-center">
                    {error}
                  </p>
                )}
              </div>

              {/* Right - Inventory */}
              <div className="w-2/3 p-4 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-zinc-400">
                    Your Inventory
                  </h4>
                  <span className="text-xs text-zinc-400">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>

                {inventoryQuery.isLoading ? (
                  <div className="flex-1 flex items-center justify-center text-zinc-400">
                    Loading inventory...
                  </div>
                ) : groupedInventory.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                    <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-white mb-2">
                      No Tradable Items
                    </h4>
                    <p className="text-zinc-400 text-sm mb-4 max-w-xs">
                      Your Steam inventory has no tradable CS2 cases available.
                    </p>
                    {userBetHistory && userBetHistory.totalBets > 0 && (
                      <div className="bg-zinc-900/50 rounded-lg p-4 mb-4 w-full max-w-xs">
                        <p className="text-sm text-zinc-300 mb-2">
                          <span className="font-semibold">
                            Cases you&apos;ve traded:
                          </span>
                        </p>
                        <p className="text-2xl font-bold text-emerald-400 mb-1">
                          {userBetHistory.totalCases} cases
                        </p>
                        <p className="text-xs text-zinc-400">
                          Across {userBetHistory.totalBets} bet
                          {userBetHistory.totalBets !== 1 ? "s" : ""}
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-zinc-400 mb-4">
                      You need CS2 cases in your Steam inventory to place bets.
                    </p>
                    <a
                      href="https://steamcommunity.com/market/search?appid=730&q=case"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-medium rounded-lg transition-colors text-sm"
                    >
                      Buy Cases on Steam Market →
                    </a>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-4 gap-2 overflow-y-auto flex-1">
                      {paginatedInventory.map((item) => (
                        <DraggableCase
                          key={item.classId}
                          item={item}
                          availableCount={item.availableAssetIds.length}
                        />
                      ))}
                    </div>

                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-zinc-800">
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 bg-zinc-900 rounded text-sm disabled:opacity-50"
                        >
                          ← Prev
                        </button>
                        <span className="text-sm text-zinc-400">
                          {currentPage} / {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 bg-zinc-900 rounded text-sm disabled:opacity-50"
                        >
                          Next →
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              <DragOverlay>
                {activeDragItem && (
                  <DraggableCase
                    item={activeDragItem}
                    availableCount={activeDragItem.availableAssetIds.length}
                  />
                )}
              </DragOverlay>
            </DndContext>
          </div>
        )}
      </div>

      {showQuantityPopup && (
        <QuantityPopup
          onClose={() => {
            setShowQuantityPopup(false);
            setSelectedItemForPool(null);
          }}
          item={selectedItemForPool}
          maxQuantity={selectedItemForPool?.availableAssetIds.length || 0}
          onConfirm={handleQuantityConfirm}
        />
      )}
    </div>
  );
}

// Local trade-url state that mirrors the old BetModal behavior
// (separate from the global useTradeUrl because the modal needs
//  its own hasTradeUrl toggle without persisting until Save)
function useTradeUrlLocal() {
  const global = useTradeUrl();
  const [hasTradeUrl, setHasTradeUrl] = useState(() => !!global.savedTradeUrl);

  return {
    tradeUrl: global.tradeUrl,
    savedTradeUrl: global.savedTradeUrl,
    dirty: global.dirty,
    hasTradeUrl,
    setTradeUrl: global.setTradeUrl,
    saveTradeUrl: global.saveTradeUrl,
    setHasTradeUrl,
  };
}
