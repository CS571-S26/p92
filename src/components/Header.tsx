"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";

// Helper to construct avatar URLs from avatarHash
function avatarUrl(hash: string) {
  return `https://avatars.steamstatic.com/${hash}.jpg`;
}

export default function Header() {
  const { user, loading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const trpc = useTRPC();

  // Fetch Steam profile using tRPC
  const profileQuery = useQuery({
    ...trpc.user.profile.queryOptions(),
    enabled: !!user, // Only fetch when user is logged in
  });

  const handleLogout = async () => {
    await auth.signOut();
    setIsMenuOpen(false);
    window.location.href = "/";
  };

  return (
    <header className="border-b border-zinc-900 bg-black">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold tracking-tight text-white hover:text-zinc-300 transition-colors">
          skinshi
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-4">
          {!loading && (
            <>
              {user ? (
                // Logged in - show user menu
                <div className="relative">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center gap-2 hover:bg-zinc-900 rounded-lg px-3 py-2 transition-colors"
                    aria-expanded={isMenuOpen}
                    aria-haspopup="menu"
                    aria-label="Account menu"
                  >
                    {profileQuery.data?.avatarHash ? (
                      <img
                        src={avatarUrl(profileQuery.data.avatarHash)}
                        alt={profileQuery.data.name}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                        <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                    <span className="text-sm text-white hidden sm:block">
                      {profileQuery.data?.name || "Account"}
                    </span>
                    <svg
                      className={`w-4 h-4 text-zinc-400 transition-transform ${isMenuOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl z-50 py-1">
                        <Link
                          href="/settings"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-zinc-900 transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Settings
                        </Link>
                        <div className="border-t border-zinc-800 my-1" />
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-rose-400 hover:bg-zinc-900 transition-colors w-full text-left"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Logout
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                // Logged out - show login button
                <Link
                  href="/login"
                  className="px-4 py-2 rounded bg-zinc-900 text-white border border-zinc-800 hover:bg-zinc-800 transition-colors text-sm font-medium"
                >
                  Login
                </Link>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
