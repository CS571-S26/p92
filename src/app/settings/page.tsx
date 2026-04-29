"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSteamProfile, useUserInventory, useUserBets, useClaimPayout } from "@/hooks/useUser";
import { useTradeUrl } from "@/hooks/useTradeUrl";
import ProfileTab from "@/components/settings/ProfileTab";
import InventorySection from "@/components/settings/InventorySection";
import TradesSection from "@/components/settings/TradesSection";
import TradeUrlSection from "@/components/settings/TradeUrlSection";

function getValidTab(tab: string | null): "profile" | "inventory" | "trades" {
  if (tab === "inventory" || tab === "trades") return tab;
  return "profile";
}

export default function SettingsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"profile" | "inventory" | "trades">(
    getValidTab(searchParams.get("tab"))
  );
  const { tradeUrl } = useTradeUrl();

  const profileQuery = useSteamProfile();
  const inventoryQuery = useUserInventory(activeTab === "inventory");
  const betsQuery = useUserBets(activeTab === "trades");

  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimingBetId, setClaimingBetId] = useState<string | null>(null);

  const claimPayoutMutation = useClaimPayout();

  const isLoading = profileQuery.isLoading;
  const error = profileQuery.error?.message || null;

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

  const handleClaimPayout = async (marketId: string) => {
    const tradeUrlToUse = tradeUrl.trim();
    if (!tradeUrlToUse) {
      setClaimError('Please enter and save your Steam Trade URL first.');
      return;
    }

    setClaimError(null);
    setClaimingBetId(marketId);

    claimPayoutMutation.mutate(
      { marketId, tradeUrl: tradeUrlToUse },
      {
        onSuccess: () => {
          betsQuery.refetch();
          setClaimingBetId(null);
        },
        onError: (err) => {
          setClaimError(err.message || 'Failed to claim payout');
          setClaimingBetId(null);
        },
      }
    );
  };

  const inventory = inventoryQuery.data?.items ?? [];

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
            Inventory ({inventoryQuery.data?.items.length ?? 0})
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

        {activeTab === "profile" && (
          <div className="space-y-6">
            <ProfileTab user={user} steamProfile={profileQuery.data ?? null} />
            <TradeUrlSection />
          </div>
        )}

        {activeTab === "inventory" && (
          <InventorySection items={inventory} />
        )}

        {activeTab === "trades" && (
          <TradesSection
            bets={betsQuery.data ?? []}
            isLoading={betsQuery.isLoading}
            claimError={claimError}
            claimingBetId={claimingBetId}
            onClaimPayout={handleClaimPayout}
          />
        )}
      </div>
    </div>
  );
}
