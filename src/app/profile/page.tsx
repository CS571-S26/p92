"use client";

import SteamProfileCard from "@/components/SteamProfileCard";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

export default function ProfilePage() {
  const trpc = useTRPC();
  const profileQuery = useQuery(trpc.user.profile.queryOptions());

  if (profileQuery.isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center font-mono text-zinc-500 text-sm">
        <span className="animate-pulse">Loading profile…</span>
      </div>
    );
  }

  if (profileQuery.error) {
    const errorMessage = profileQuery.error.message;

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

  if (!profileQuery.data) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center font-mono text-zinc-500 text-sm">
        <span>Profile not found</span>
      </div>
    );
  }

  return <SteamProfileCard profile={profileQuery.data} />;
}
