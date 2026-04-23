"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export default function LinkSteamPage() {
  const trpc = useTRPC();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Query for steam initiation - disabled by default, enabled on button click
  const steamInitiate = useQuery({
    ...trpc.steam.initiate.queryOptions(),
    enabled: isRedirecting,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Handle redirect when data is available
  useEffect(() => {
    if (steamInitiate.data?.redirectUrl) {
      window.location.href = steamInitiate.data.redirectUrl;
    }
  }, [steamInitiate.data]);

  // Disable query after fetch completes (success or error) to prevent refetching
  useEffect(() => {
    if (steamInitiate.data || steamInitiate.error) {
      setIsRedirecting(false);
    }
  }, [steamInitiate.data, steamInitiate.error]);

  // Handle error - show alert when error occurs
  useEffect(() => {
    if (steamInitiate.error) {
      alert(steamInitiate.error.message);
    }
  }, [steamInitiate.error]);

  function handleSteamLogin() {
    setIsRedirecting(true);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#141721] p-8 shadow-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">Link Steam</h1>
        <p className="mt-3 text-sm text-zinc-400">
          Connect your account to Steam to load your profile and CS2 cases.
        </p>

        {steamInitiate.isError && (
          <div className="mt-4 rounded-lg border border-red-400/50 bg-red-500/20 px-4 py-3 text-sm text-red-100">
            {steamInitiate.error.message}
          </div>
        )}

        <button
          type="button"
          onClick={handleSteamLogin}
          disabled={isRedirecting || steamInitiate.isLoading}
          className="mt-6 w-full rounded-lg border border-emerald-400/50 bg-emerald-500/20 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRedirecting || steamInitiate.isLoading
            ? "Redirecting to Steam..."
            : "Connect your account to Steam"}
        </button>
      </div>
    </div>
  );
}
