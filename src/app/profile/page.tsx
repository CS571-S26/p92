'use client';

import SteamProfileCard from "@/components/SteamProfileCard";
import { type SteamProfile } from "@/proto/steam/steam";
import { auth } from "@/lib/firebase";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const [summary, setSummary] = useState<SteamProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const user = auth.currentUser;
        if (!user) {
          setError("Not logged in");
          setLoading(false);
          return;
        }

        // Get the ID token result which includes custom claims
        const tokenResult = await user.getIdTokenResult();
        const steamId = tokenResult.claims.steam_id as string | undefined;

        if (!steamId) {
          setError("Steam account not linked");
          setLoading(false);
          return;
        }

        // Fetch profile from Next.js API route (which calls Steam gRPC + Redis cache)
        const res = await fetch(`/api/steam/profile?steamId=${steamId}`);
        
        if (!res.ok) {
          let errorMessage = "Failed to fetch profile";
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

        const profile = await res.json();
        setSummary(profile);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        setError("Failed to fetch profile");
      } finally {
        setLoading(false);
      }
    }

    // Wait for auth state to be ready
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchProfile();
      } else {
        setError("Not logged in");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center font-mono text-zinc-500 text-sm">
        <span className="animate-pulse">Loading profile…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center font-mono text-red-500 text-sm">
        <span>{error}</span>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center font-mono text-zinc-500 text-sm">
        <span>Profile not found</span>
      </div>
    );
  }

  return <SteamProfileCard profile={summary} />;
}
