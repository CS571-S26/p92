"use client";

import { useState, useEffect, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import api from "@/utils/axios";
import { auth } from "@/lib/firebase";

interface InventoryItem {
  assetId: string;
  classId: string;
  name: string;
  tradable: boolean;
  iconUrl: string;
  isCase: boolean;
}

interface Market {
  id: string;
  slug: string;
  market_id: string;
  question: string;
  icon_url: string;
  betting_closes_at: string;
  polymarket_odds: { yes: number; no: number };
  our_odds: { yes: number; no: number };
}

interface BetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (result: {
    bet_id: string;
    market_slug: string;
    market_id: string;
    outcome: string;
    trade_offer_id: string;
    trade_status: string;
    trade_expires_at: string;
    item_count: number;
  }) => void;
  market: Market;
  outcome: "yes" | "no";
}

// Grouped inventory item for display
interface GroupedItem {
  classId: string;
  name: string;
  iconUrl: string;
  availableAssetIds: string[];
  inPoolAssetIds: string[];
}

// Pool item stores the actual assetIds
interface PoolItem {
  classId: string;
  name: string;
  iconUrl: string;
  assetIds: string[];
}

// Draggable Case Card
function DraggableCase({ item, availableCount }: { item: GroupedItem; availableCount: number }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.classId,
    data: { item },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`relative bg-zinc-900 border border-zinc-800 rounded-lg p-3 cursor-move hover:border-zinc-600 transition-all w-full aspect-square flex flex-col items-center justify-center ${
        isDragging ? "opacity-50 scale-105" : ""
      } ${availableCount === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <img src={item.iconUrl} alt={item.name} className="w-full h-full max-h-[60%] object-contain mb-2" />
      <p className="text-xs text-zinc-300 truncate w-full text-center px-1">{item.name}</p>
      <span className="absolute top-2 right-2 bg-zinc-800 text-zinc-400 text-[10px] px-1.5 py-0.5 rounded">
        x{availableCount}
      </span>
    </div>
  );
}

// Quantity Selector Popup
function QuantityPopup({
  isOpen,
  onClose,
  item,
  maxQuantity,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  item: GroupedItem | null;
  maxQuantity: number;
  onConfirm: (quantity: number) => void;
}) {
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (isOpen) setQuantity(1);
  }, [isOpen]);

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-sm w-full">
        <h3 className="text-lg font-semibold text-white mb-4">Add to Bet Pool</h3>

        <div className="flex items-center gap-4 mb-6">
          <img src={item.iconUrl} alt={item.name} className="w-16 h-16 object-contain" />
          <div>
            <p className="text-white font-medium">{item.name}</p>
            <p className="text-zinc-500 text-sm">{maxQuantity} available</p>
          </div>
        </div>

        <div className="mb-6">
          <label className="text-sm text-zinc-400 mb-2 block">Quantity</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-10 h-10 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white"
            >
              -
            </button>
            <input
              type="number"
              min={1}
              max={maxQuantity}
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1;
                setQuantity(Math.max(1, Math.min(maxQuantity, val)));
              }}
              className="flex-1 h-10 bg-zinc-950 border border-zinc-700 rounded-lg text-center text-white"
            />
            <button
              onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
              className="w-10 h-10 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white"
            >
              +
            </button>
          </div>
          <input
            type="range"
            min={1}
            max={maxQuantity}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value))}
            className="w-full mt-3 accent-emerald-500"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(quantity)}
            className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-medium rounded-lg transition-colors"
          >
            Add {quantity} to Pool
          </button>
        </div>
      </div>
    </div>
  );
}

// Droppable Pool Area
function DroppablePool({
  pool,
  onRemove,
  onUpdateQuantity,
}: {
  pool: PoolItem[];
  onRemove: (classId: string) => void;
  onUpdateQuantity: (classId: string, delta: number) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "pool" });

  const totalCases = pool.reduce((sum, item) => sum + item.assetIds.length, 0);

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[200px] bg-zinc-950 border-2 border-dashed rounded-lg p-4 transition-colors ${
        isOver ? "border-emerald-500 bg-emerald-500/10" : "border-zinc-700"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-zinc-400">Your Bet Pool</h4>
        <span className="text-sm text-emerald-400">{totalCases} cases</span>
      </div>

      {pool.length === 0 ? (
        <div className="h-32 flex items-center justify-center text-zinc-600 text-sm">
          Drag cases here
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {pool.map((item) => (
            <div key={item.classId} className="relative bg-zinc-900 border border-emerald-500/30 rounded-lg p-2">
              <img src={item.iconUrl} alt={item.name} className="w-full h-12 object-contain mb-1" />
              <p className="text-xs text-zinc-400 truncate">{item.name}</p>

              <span className="absolute top-1 right-1 bg-emerald-500 text-black text-[10px] font-bold px-1.5 rounded">
                x{item.assetIds.length}
              </span>

              <div className="flex items-center justify-center gap-1 mt-1">
                <button
                  onClick={() => onUpdateQuantity(item.classId, -1)}
                  className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-xs"
                >
                  -
                </button>
                <span className="text-xs text-white w-4 text-center">{item.assetIds.length}</span>
                <button
                  onClick={() => onUpdateQuantity(item.classId, 1)}
                  className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-xs"
                >
                  +
                </button>
              </div>

              <button
                onClick={() => onRemove(item.classId)}
                className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] hover:bg-rose-600 flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BetModal({ isOpen, onClose, onSuccess, market, outcome }: BetModalProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [pool, setPool] = useState<PoolItem[]>([]);
  const [tradeUrl, setTradeUrl] = useState("");
  const [hasTradeUrl, setHasTradeUrl] = useState(false);
  const [activeDragItem, setActiveDragItem] = useState<GroupedItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [steamId, setSteamId] = useState<string>("");
  
  // Force inventory refresh counter
  const [inventoryRefreshKey, setInventoryRefreshKey] = useState(0);

  // Track user's bet history for empty state
  const [userBetHistory, setUserBetHistory] = useState<{ totalBets: number; totalCases: number } | null>(null);

  // Quantity popup state
  const [showQuantityPopup, setShowQuantityPopup] = useState(false);
  const [selectedItemForPool, setSelectedItemForPool] = useState<GroupedItem | null>(null);

  // Track pending bets for validation
  const [pendingBets, setPendingBets] = useState<number>(0);

  const ITEMS_PER_PAGE = 12;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

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
          (id) => !poolItem.assetIds.includes(id)
        );
      }
    });

    return Array.from(groups.values());
  }, [inventory, pool]);

  // Check if user can place bets
  const canPlaceBets = groupedInventory.length > 0 && pendingBets === 0;
  const hasItems = groupedInventory.length > 0;

  const totalPages = Math.ceil(groupedInventory.length / ITEMS_PER_PAGE);
  const paginatedInventory = groupedInventory.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Get steam ID from auth
  useEffect(() => {
    const getSteamId = async () => {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdTokenResult();
        const sid = token.claims.steam_id as string;
        if (sid) {
          setSteamId(sid);
        } else {
          setError("Please link your Steam account in your profile to bet");
        }
      } else {
        setError("Please login to place bets");
      }
    };
    getSteamId();
  }, []);

  // Load trade URL
  useEffect(() => {
    const saved = localStorage.getItem("skinshi_trade_url");
    if (saved) {
      setTradeUrl(saved);
      setHasTradeUrl(true);
    }
  }, []);

  // Fetch inventory
  useEffect(() => {
    if (isOpen && steamId) {
      fetchInventory();
    }
  }, [isOpen, steamId, inventoryRefreshKey]);

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/steam/inventory?steamId=${steamId}&casesOnly=true`);
      const data = await res.json();
      setInventory(data.items || []);
      
      // Also fetch user's bet history for empty state context
      try {
        const betsRes = await api.get("/me/bets");
        if (betsRes.data?.bets) {
          const bets = betsRes.data.bets;
          const totalCases = bets.reduce((sum: number, bet: any) => sum + (bet.item_count || 0), 0);
          setUserBetHistory({
            totalBets: bets.length,
            totalCases: totalCases
          });
          // Count pending bets (both 'pending' and 'sent' statuses block new bets)
          const pendingCount = bets.filter((bet: any) =>
            bet.trade_status === 'pending' || bet.trade_status === 'sent'
          ).length;
          setPendingBets(pendingCount);
        }
      } catch {
        // Silently fail - bet history is just for display
        setUserBetHistory(null);
        setPendingBets(0);
      }
    } catch {
      setError("Failed to load inventory");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const item = groupedInventory.find((i) => i.classId === event.active.id);
    if (item && item.availableAssetIds.length > 0) {
      setActiveDragItem(item);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);

    // Only add if actually dropped on pool
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
            : p
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
          // Add one more from available
          const assetIdToAdd = group!.availableAssetIds[0];
          return { ...p, assetIds: [...p.assetIds, assetIdToAdd] };
        } else if (delta < 0 && p.assetIds.length > 0) {
          // Remove one
          return { ...p, assetIds: p.assetIds.slice(0, -1) };
        }
        return p;
      });
      
      // Filter out items with 0 assetIds
      return updated.filter((p) => p.assetIds.length > 0);
    });
  };

  const saveTradeUrl = () => {
    if (tradeUrl) {
      localStorage.setItem("skinshi_trade_url", tradeUrl);
      setHasTradeUrl(true);
    }
  };

  const handleSubmit = async () => {
    if (pool.length === 0) {
      setError("Please add cases to your pool");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const assetIds = pool.flatMap((item) => item.assetIds);

      const res = await api.post("/bets", {
        slug: market.slug,
        market_id: market.market_id,
        outcome,
        asset_ids: assetIds,
        trade_url: tradeUrl,
      });

      // Clear pool and refresh inventory after successful bet
      setPool([]);
      setInventoryRefreshKey(prev => prev + 1);
      
      onSuccess?.(res.data);
      onClose();
    } catch (err: any) {
      console.error('[BetModal] Error placing bet:', err);
      console.error('[BetModal] Error response:', err.response?.data);
      setError(err.response?.data?.error || "Failed to place bet");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const totalPoolCases = pool.reduce((sum, item) => sum + item.assetIds.length, 0);

  // Check if there's an auth error
  const isAuthError = error?.includes("login") || error?.includes("Steam account");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            {market.icon_url && (
              <img src={market.icon_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
            )}
            <div>
              <h3 className="font-semibold text-white">{market.question}</h3>
              <p className="text-sm text-zinc-500">
                Betting:{" "}
                <span className={outcome === "yes" ? "text-emerald-400" : "text-rose-400"}>
                  {outcome.toUpperCase()}
                </span>
              </p>
              <p className="text-xs text-amber-400 mt-1">
                Betting closes: {new Date(market.betting_closes_at).toLocaleString()}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-2xl">
            ×
          </button>
        </div>

        {/* Auth Error State */}
        {isAuthError && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
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
              href={error?.includes("Steam") ? "/profile" : "/login"}
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
                  <h4 className="text-sm font-medium text-zinc-400 mb-2">Trade URL</h4>
                  {!hasTradeUrl ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={tradeUrl}
                        onChange={(e) => setTradeUrl(e.target.value)}
                        placeholder="https://steamcommunity.com/tradeoffer/new/?partner=..."
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded text-sm text-white placeholder-zinc-600"
                      />
                      <button
                        onClick={saveTradeUrl}
                        className="w-full py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-sm hover:bg-emerald-500/30"
                      >
                        Save Trade URL
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500 truncate flex-1">{tradeUrl}</span>
                      <button
                        onClick={() => setHasTradeUrl(false)}
                        className="text-xs text-zinc-500 hover:text-white ml-2"
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
                      <span className="font-semibold">⚠️ You have {pendingBets} pending trade{pendingBets !== 1 ? 's' : ''}</span>
                      <br />
                      <span className="text-xs">Accept your pending trade(s) in Steam before placing new bets.</span>
                    </p>
                  </div>
                )}

                {/* Empty Inventory Warning */}
                {!hasItems && !isLoading && (
                  <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                    <p className="text-sm text-rose-400">
                      <span className="font-semibold">No items available</span>
                      <br />
                      <span className="text-xs">You need CS2 cases in your Steam inventory to place bets.</span>
                    </p>
                  </div>
                )}

                {/* Confirm Button */}
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || totalPoolCases === 0 || !hasTradeUrl || !canPlaceBets}
                  className="mt-4 w-full py-3 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? "Sending Trade..." : 
                   !hasItems ? "No Items Available" : 
                   !hasTradeUrl ? "Set Trade URL First" :
                   totalPoolCases === 0 ? "Add Items to Pool" :
                   pendingBets > 0 ? `Pending Trades (${pendingBets})` : 
                   `Confirm Bet (${totalPoolCases} cases)`}
                </button>

                {error && <p className="mt-2 text-sm text-rose-400 text-center">{error}</p>}
              </div>

              {/* Right - Inventory */}
              <div className="w-2/3 p-4 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-zinc-400">Your Inventory</h4>
                  <span className="text-xs text-zinc-500">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>

                {isLoading ? (
                  <div className="flex-1 flex items-center justify-center text-zinc-500">
                    Loading inventory...
                  </div>
                ) : groupedInventory.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                    <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-white mb-2">No Tradable Items</h4>
                    <p className="text-zinc-400 text-sm mb-4 max-w-xs">
                      Your Steam inventory has no tradable CS2 cases available.
                    </p>
                    {userBetHistory && userBetHistory.totalBets > 0 && (
                      <div className="bg-zinc-900/50 rounded-lg p-4 mb-4 w-full max-w-xs">
                        <p className="text-sm text-zinc-300 mb-2">
                          <span className="font-semibold">Cases you've traded:</span>
                        </p>
                        <p className="text-2xl font-bold text-emerald-400 mb-1">
                          {userBetHistory.totalCases} cases
                        </p>
                        <p className="text-xs text-zinc-500">
                          Across {userBetHistory.totalBets} bet{userBetHistory.totalBets !== 1 ? 's' : ''}
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-zinc-500 mb-4">
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

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-zinc-800">
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 bg-zinc-900 rounded text-sm disabled:opacity-50"
                        >
                          ← Prev
                        </button>
                        <span className="text-sm text-zinc-500">
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

      {/* Quantity Popup */}
      <QuantityPopup
        isOpen={showQuantityPopup}
        onClose={() => {
          setShowQuantityPopup(false);
          setSelectedItemForPool(null);
        }}
        item={selectedItemForPool}
        maxQuantity={selectedItemForPool?.availableAssetIds.length || 0}
        onConfirm={handleQuantityConfirm}
      />
    </div>
  );
}
