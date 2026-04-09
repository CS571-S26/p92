"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import api from "@/utils/axios";
import { type SteamProfile } from "@/proto/steam/steam";

// Helper to construct avatar URLs from avatarHash
function avatarUrl(hash: string, size?: "medium" | "full") {
  const suffix = size === "full" ? "_full" : size === "medium" ? "_medium" : "";
  return `https://avatars.steamstatic.com/${hash}${suffix}.jpg`;
}

interface Bet {
  bet_id: string;
  market_id: string;
  market_slug: string;
  market_question: string;
  outcome: string;
  trade_status: string;
  item_count: number;
  trade_offer_id: string;
  created_at: string;
}

interface InventoryItem {
  assetId: string;
  name: string;
  iconUrl: string;
  tradable: boolean;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "inventory" | "trades">("profile");
  const [steamProfile, setSteamProfile] = useState<SteamProfile | null>(null);
  const [bets, setBets] = useState<Bet[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth state to be ready
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchData();
      } else {
        setError("Not logged in");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get steam_id from JWT claims
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      const tokenResult = await currentUser.getIdTokenResult();
      const steamId = tokenResult.claims.steam_id as string | undefined;

      if (!steamId) {
        setError("Steam account not linked");
        setLoading(false);
        return;
      }

      // Fetch profile
      const profileRes = await fetch(`/api/steam/profile?steamId=${steamId}`);
      if (!profileRes.ok) {
        const errorData = await profileRes.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch profile: ${profileRes.status}`);
      }
      const profileData = await profileRes.json();
      setSteamProfile(profileData);

      // Fetch bets (authenticated endpoint)
      try {
        const betsRes = await api.get("/me/bets");
        if (betsRes.data?.bets) {
          setBets(betsRes.data.bets);
        }
      } catch (err: any) {
        console.error("Failed to fetch bets:", err);
      }

      // Fetch inventory
      try {
        const inventoryRes = await fetch(`/api/steam/inventory?steamId=${steamId}&casesOnly=true`);
        if (inventoryRes.ok) {
          const inventoryData = await inventoryRes.json();
          if (inventoryData.items) {
            setInventory(inventoryData.items);
          }
        }
      } catch (err) {
        console.error("Failed to fetch inventory:", err);
      }
    } catch (err: any) {
      console.error("Failed to load settings data:", err);
      setError(err.message || "Failed to load settings data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "pending":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "declined":
      case "expired":
        return "bg-rose-500/20 text-rose-400 border-rose-500/30";
      default:
        return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">Please login to view settings</p>
          <Link href="/login" className="px-6 py-2 bg-white text-black rounded-lg font-medium hover:bg-zinc-200 transition-colors">
            Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-zinc-400">Loading settings...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Error</h2>
          <p className="text-zinc-400 mb-6">{error}</p>
          {error === "Steam account not linked" && (
            <Link
              href="/link-steam"
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-black rounded-lg font-medium transition-colors inline-block"
            >
              Link Steam Account
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 border-b border-zinc-800">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "profile"
                ? "text-white border-b-2 border-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "inventory"
                ? "text-white border-b-2 border-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Inventory ({inventory.length})
          </button>
          <button
            onClick={() => setActiveTab("trades")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "trades"
                ? "text-white border-b-2 border-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            My Trades ({bets.length})
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            {/* Steam Profile */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Steam Profile</h2>
              {steamProfile ? (
                <div className="flex items-center gap-4">
                  <img
                    src={avatarUrl(steamProfile.avatarHash, "full")}
                    alt={steamProfile.name}
                    className="w-20 h-20 rounded-lg"
                  />
                  <div>
                    <h3 className="text-lg font-medium text-white">{steamProfile.name}</h3>
                    <p className="text-sm text-zinc-500">Steam ID: {steamProfile.steamId}</p>
                    <Link
                      href={`https://steamcommunity.com/profiles/${steamProfile.steamId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 text-sm hover:underline mt-1 inline-block"
                    >
                      View on Steam →
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-zinc-400">
                  <p>No Steam profile linked.</p>
                  <Link
                    href="/link-steam"
                    className="text-emerald-400 hover:underline mt-2 inline-block"
                  >
                    Link Steam Account
                  </Link>
                </div>
              )}
            </div>

            {/* Account Info */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Account Information</h2>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-zinc-800">
                  <span className="text-zinc-400">Email</span>
                  <span className="text-white">{user.email}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-zinc-800">
                  <span className="text-zinc-400">User ID</span>
                  <span className="text-white font-mono text-sm">{user.uid}</span>
                </div>
              </div>
            </div>

            {/* Trade URL */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Trade Settings</h2>
              <Link
                href="/profile/trade"
                className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Manage Trade URL
              </Link>
            </div>
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === "inventory" && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Your Inventory</h2>
            {inventory.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {inventory.map((item) => (
                  <div
                    key={item.assetId}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 aspect-square flex flex-col items-center justify-center"
                  >
                    <img
                      src={item.iconUrl}
                      alt={item.name}
                      className="w-full h-full max-h-[60%] object-contain mb-2"
                    />
                    <p className="text-xs text-zinc-300 truncate w-full text-center px-1">
                      {item.name}
                    </p>
                    {!item.tradable && (
                      <span className="text-[10px] text-amber-400 mt-1">Not Tradable</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-400">No items in inventory.</p>
            )}
          </div>
        )}

        {/* Trades Tab */}
        {activeTab === "trades" && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Your Trades</h2>
            {bets.length > 0 ? (
              <div className="space-y-3">
                {bets.map((bet) => (
                  <div
                    key={bet.bet_id}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium truncate">
                          {bet.market_question || bet.market_slug}
                        </h3>
                        <p className="text-sm text-zinc-400 mt-1">
                          {bet.item_count} cases •{" "}
                          <span className={bet.outcome === "yes" ? "text-emerald-400" : "text-rose-400"}>
                            {bet.outcome.toUpperCase()}
                          </span>
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          bet.trade_status
                        )}`}
                      >
                        {bet.trade_status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">
                        {new Date(bet.created_at).toLocaleDateString()}
                      </span>
                      {bet.trade_offer_id && bet.trade_status === "pending" && (
                        <a
                          href={`https://steamcommunity.com/tradeoffer/${bet.trade_offer_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-400 hover:underline"
                        >
                          View Trade →
                        </a>
                      )}
                      {bet.trade_status === "accepted" && (
                        <span className="text-emerald-400">Trade Complete</span>
                      )}
                      {(bet.trade_status === "declined" || bet.trade_status === "expired") && (
                        <span className="text-rose-400">Trade Failed</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-400">No trades yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
