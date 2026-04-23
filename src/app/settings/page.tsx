"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { type SteamProfile } from "@skinshi/steam-service/schemas";
// Helper to construct avatar URLs from avatarHash
function avatarUrl(hash: string, size?: "medium" | "full") {
  const suffix = size === "full" ? "_full" : size === "medium" ? "_medium" : "";
  return `https://avatars.steamstatic.com/${hash}${suffix}.jpg`;
}



export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "inventory" | "trades">("profile");
  const trpc = useTRPC();

  // Fetch Steam profile using tRPC
  const profileQuery = useQuery(trpc.user.profile.queryOptions());

  // Fetch inventory using tRPC
  const inventoryQuery = useQuery(trpc.user.inventory.queryOptions());

  // Fetch bets using tRPC
  const betsQuery = useQuery(trpc.user.bets.queryOptions());

  const getStatusColor = (status: string) => {
    switch (status) {
      case "won":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "active":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "lost":
      case "cancelled":
        return "bg-rose-500/20 text-rose-400 border-rose-500/30";
      default:
        return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  };

  // Get profile data with proper typing
  const steamProfile: SteamProfile | null = profileQuery.data ?? null;

  // Get inventory items and group by classid
  const inventory = inventoryQuery.data?.items ?? [];

  // Group inventory items by classid
  const groupedInventory = inventory.reduce((acc, item) => {
    const existing = acc.find((group) => group.classid === item.classid);
    if (existing) {
      existing.count++;
    } else {
      acc.push({
        classid: item.classid,
        name: item.name,
        icon_url: item.icon_url,
        count: 1,
      });
    }
    return acc;
  }, [] as Array<{ classid: string; name: string; icon_url: string; count: number }>);

  // Combined loading state
  const isLoading = profileQuery.isLoading || inventoryQuery.isLoading || betsQuery.isLoading;

  // Combined error state
  const error = profileQuery.error?.message || inventoryQuery.error?.message || betsQuery.error?.message || null;

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-zinc-400">Loading settings...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    const isSteamNotLinked = error.includes("Steam account not linked");
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
          {isSteamNotLinked && (
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
            My Trades ({betsQuery.data?.length ?? 0})
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
                    <p className="text-sm text-zinc-500">Steam ID: {steamProfile.steamID}</p>
                    <Link
                      href={`https://steamcommunity.com/profiles/${steamProfile.steamID}`}
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
            <h2 className="text-xl font-semibold mb-4">Your Inventory ({inventory.length} items)</h2>
            {groupedInventory.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {groupedInventory.map((item) => (
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
        )}

        {/* Trades Tab */}
        {activeTab === "trades" && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Your Trades</h2>
            {betsQuery.isLoading ? (
              <p className="text-zinc-400">Loading trades...</p>
            ) : betsQuery.data && betsQuery.data.length > 0 ? (
              <div className="space-y-3">
                {betsQuery.data.map((bet) => {
                  // marketOutcome: 1=yes, 0=no
                  const sideLabel = bet.marketOutcome === 1 ? 'YES' : 'NO';
                  const sideColor = bet.marketOutcome === 1 ? 'text-emerald-400' : 'text-rose-400';
                  
                  return (
                    <div
                      key={`${bet.steamId}-${bet.marketId}`}
                      className="bg-zinc-900 border border-zinc-800 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold ${sideColor}`}>{sideLabel}</span>
                            <span className="text-zinc-600">•</span>
                            <h3 className="text-white font-medium truncate text-sm">
                              {bet.marketId}
                            </h3>
                          </div>
                          <p className="text-sm text-zinc-400 mt-1">
                            Bet: x{bet.buyIn.items.length} cases
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                            bet.status
                          )}`}
                        >
                          {bet.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-500">
                          {new Date(bet.createdAt * 1000).toLocaleDateString()}
                        </span>
                        {bet.status === "active" && (
                          <span className="text-amber-400">In Progress</span>
                        )}
                        {bet.status === "payout_pending" && (
                          <span className="text-amber-400">Ready to Claim</span>
                        )}
                        {bet.status === "paid" && (
                          <span className="text-emerald-400">Paid Out</span>
                        )}
                        {(bet.status === "lost" || bet.status === "cancelled") && (
                          <span className="text-rose-400">{bet.status === "lost" ? "Lost" : "Cancelled"}</span>
                        )}
                      </div>
                      {bet.status === 'paid' && bet.payout && (
                        <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2">
                          <p className="text-xs text-emerald-300">
                            Payout: x{bet.payout.items.length} cases received
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-zinc-400">No trades yet.</p>
                <p className="mt-2 text-xs text-zinc-600">
                  Place a bet on a market to see your trades here.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
