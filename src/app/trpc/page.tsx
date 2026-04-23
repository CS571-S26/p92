"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { PlaceBetSchema } from "../../../../../workers/auth/src/schemas/bet";

export default function TrpcPage() {
  const trpc = useTRPC();
  const [slug, setSlug] = useState("");
  const [id, setId] = useState("");
  const [outcome, setOutcome] = useState("yes");

  const marketQuery = useQuery(
    trpc.polymarket.market.queryOptions({
      slug: slug || "largest-company-end-of-april-738",
      id: id || "1487054",
    }),
  );

  const tradeQuery = useMutation(
    trpc.bet.trade.mutationOptions({
      onSuccess: (data) => console.log(data),
      onError: (err) => console.error(err),
    }),
  );

  const addMarketMutation = useMutation(
    trpc.admin.addMarket.mutationOptions({
      onSuccess: (data) => console.log("Market added:", data),
      onError: (err) => console.error("Add market error:", err),
    }),
  );

  const resolveMarketMutation = useMutation(
    trpc.admin.resolveMarket.mutationOptions({
      onSuccess: (data) => console.log("Market resolved:", data),
      onError: (err) => console.error("Resolve market error:", err),
    }),
  );

  const deleteMarketMutation = useMutation(
    trpc.admin.deleteMarket.mutationOptions({
      onSuccess: () => console.log("Market deleted"),
      onError: (err) => console.error("Delete market error:", err),
    }),
  );

  const syncBetsMutation = useMutation(
    trpc.admin.syncBets.mutationOptions({
      onSuccess: (data) => console.log("Bets synced:", data),
      onError: (err) => console.error("Sync bets error:", err),
    }),
  );

  const handleTrade = async () => {
    tradeQuery.mutate(
      PlaceBetSchema.parse({
        slug: "largest-company-end-of-april-738",
        id: "1487054",
        tradeUrl:
          "https://steamcommunity.com/tradeoffer/new/?partner=123456789&token=abcd1234",
        message: "Here's a trade offer!",
        items: [
          { appid: 2, contextid: "730", assetid: "1" },
          { appid: 2, contextid: "730", assetid: "2" },
        ],
      }),
    );

    console.log("Trade mutation status:", tradeQuery.status);
    console.log("Trade mutation data:", tradeQuery.data);
  };

  const handleResolveMarket = () => {
    resolveMarketMutation.mutate({
      slug,
      id,
      outcome: outcome as "yes" | "no" | "cancelled",
    });
  };

  const handleAddMarket = () => {
    addMarketMutation.mutate({ slug, id });
  };

  const handleDeleteMarket = () => {
    deleteMarketMutation.mutate({ slug, id });
  };

  const handleSyncBets = () => {
    syncBetsMutation.mutate();
  };

  const userBetsQuery = useQuery(trpc.user.bets.queryOptions());

  console.log("User bets query status:", userBetsQuery.status);
  console.log("User bets query data:", userBetsQuery.data);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">tRPC Market Test</h1>

      <div className="mb-6 space-y-4 bg-zinc-900 p-4 rounded">
        <div>
          <label className="block text-sm font-medium mb-1">Slug</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="e.g., largest-company-end-of-april-738"
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">ID</label>
          <input
            type="text"
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="e.g., 1487054"
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Outcome (for Resolve)
          </label>
          <select
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white"
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
      </div>

      {marketQuery.isLoading && <p>Loading market...</p>}

      {marketQuery.error && (
        <div className="text-red-500">
          <strong>Error:</strong> {marketQuery.error.message}
        </div>
      )}

      {marketQuery.data && (
        <pre className="bg-zinc-900 p-4 rounded overflow-auto text-sm mb-6">
          {JSON.stringify(marketQuery.data, null, 2)}
        </pre>
      )}

      <div className="flex gap-4">
        <button
          onClick={handleResolveMarket}
          disabled={!slug || !id || resolveMarketMutation.isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resolveMarketMutation.isPending ? "Resolving..." : "Resolve Market"}
        </button>

        <button
          onClick={handleAddMarket}
          disabled={!slug || !id || addMarketMutation.isPending}
          className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {addMarketMutation.isPending ? "Adding..." : "Add Market"}
        </button>
        <button
          onClick={handleDeleteMarket}
          disabled={!slug || !id || deleteMarketMutation.isPending}
          className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {deleteMarketMutation.isPending ? "Deleting..." : "Delete Market"}
        </button>

        <button
          onClick={handleTrade}
          className="px-4 py-2 bg-purple-600 text-white rounded"
        >
          Test Trade Mutation
        </button>

        <button
          onClick={handleSyncBets}
          disabled={syncBetsMutation.isPending}
          className="px-4 py-2 bg-orange-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {syncBetsMutation.isPending ? "Syncing..." : "Sync Bets"}
        </button>
      </div>
    </div>
  );
}
