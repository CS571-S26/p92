'use client';

import { useState } from "react";
import { type SteamProfile } from "@/proto/steam/steam";
import { formatDate } from "@/utils/dateUtils";

const MOCK: SteamProfile = {
  steamId: "76561198123456789",
  name: "HeyDay",
  onlineState: "online",
  stateMessage: "Online",
  privacyState: "public",
  visibilityState: "3",
  avatarHash: "e8dffbe2504a7ea75ef2639f093be6e8215063e3",
  vacBanned: false,
  tradeBanState: "None",
  isLimitedAccount: false,
  customUrl: "heydaytime",
  memberSince: "2019-11-09T06:00:00.000Z",
  location: "Vatican City State (Holy See)",
  realName: "Mihir",
  summary: "",
};

const ONLINE_STATE_STYLES: Record<string, { label: string; dot: string; badge: string }> = {
  online: { label: "Online", dot: "bg-emerald-400", badge: "bg-emerald-500/20 text-emerald-400" },
  away: { label: "Away", dot: "bg-yellow-400", badge: "bg-yellow-500/20 text-yellow-400" },
  snooze: { label: "Snooze", dot: "bg-yellow-600", badge: "bg-yellow-700/20 text-yellow-500" },
  offline: { label: "Offline", dot: "bg-zinc-500", badge: "bg-zinc-700 text-zinc-400" },
  "looking to trade": { label: "Looking to Trade", dot: "bg-blue-400", badge: "bg-blue-500/20 text-blue-400" },
  "looking to play": { label: "Looking to Play", dot: "bg-purple-400", badge: "bg-purple-500/20 text-purple-400" },
};

function avatarUrl(hash: string, size?: "medium" | "full") {
  const suffix = size === "full" ? "_full" : size === "medium" ? "_medium" : "";
  return `https://avatars.steamstatic.com/${hash}${suffix}.jpg`;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-white/5 last:border-0">
      <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-zinc-200 text-right break-all">{value}</span>
    </div>
  );
}

export default function SteamProfileCard({ profile = MOCK }: { profile?: SteamProfile }) {
  const [avatarErr, setAvatarErr] = useState(false);
  const state = ONLINE_STATE_STYLES[profile.onlineState] ?? ONLINE_STATE_STYLES.offline;

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6 font-mono">
      <div className="w-full max-w-sm bg-[#111118] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/60">

        {/* Header banner */}
        <div className="relative h-24 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] overflow-hidden">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(rgba(99,179,237,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(99,179,237,0.15) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          {profile.isLimitedAccount && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded px-2 py-1">
              <span className="text-[10px] text-yellow-400 tracking-widest uppercase">Limited Account</span>
            </div>
          )}
        </div>

        {/* Avatar row */}
        <div className="relative px-5 pb-4">
          <div className="absolute -top-10 left-5">
            <div className="relative">
              <img
                src={avatarErr ? undefined : avatarUrl(profile.avatarHash, "full")}
                alt={profile.name}
                onError={() => setAvatarErr(true)}
                className="w-20 h-20 rounded-xl border-4 border-[#111118] object-cover bg-zinc-800"
              />
              <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#111118] ${state.dot}`} />
            </div>
          </div>

          <div className="pt-12">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-white text-lg font-bold tracking-tight leading-none">{profile.name}</h2>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${state.badge}`}>
                {state.label}
              </span>
            </div>
            {profile.realName && (
              <p className="text-zinc-500 text-xs mt-1">{profile.realName}</p>
            )}
          </div>
        </div>

        {/* Summary */}
        {profile.summary && (
          <div className="mx-5 mb-4 text-zinc-400 text-xs leading-relaxed border-l-2 border-zinc-700 pl-3">
            {profile.summary}
          </div>
        )}

        {/* Info table */}
        <div className="mx-5 mb-2">
          <InfoRow label="Status" value={<span className="text-zinc-400 text-xs">{profile.stateMessage}</span>} />
          <InfoRow label="Location" value={profile.location || <span className="text-zinc-600">—</span>} />
          <InfoRow
            label="Visibility"
            value={
              <span className={`text-xs px-2 py-0.5 rounded-full ${profile.privacyState === "public"
                ? "bg-blue-500/20 text-blue-400"
                : "bg-zinc-700 text-zinc-400"
                }`}>
                {profile.privacyState.charAt(0).toUpperCase() + profile.privacyState.slice(1)}
              </span>
            }
          />
          <InfoRow
            label="VAC Banned"
            value={
              profile.vacBanned
                ? <span className="text-red-400 text-xs">Yes</span>
                : <span className="text-emerald-400 text-xs">No</span>
            }
          />
          <InfoRow
            label="Trade Ban"
            value={
              <span className={`text-xs ${profile.tradeBanState === "None" ? "text-emerald-400" : "text-red-400"}`}>
                {profile.tradeBanState}
              </span>
            }
          />
          <InfoRow label="Member Since" value={formatDate(new Date(profile.memberSince).getTime() / 1000)} />
        </div>

        {/* Footer link */}
        <div className="px-5 py-4 border-t border-white/5">

          <a
            href={`https://steamcommunity.com/id/${profile.customUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-[#1b2838] hover:bg-[#2a475e] text-[#c6d4df] text-sm transition-colors duration-150 border border-white/5 hover:border-white/10"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39l3.03-6.24a3.5 3.5 0 01-1.74-4.57 3.5 3.5 0 014.57-1.74 3.5 3.5 0 011.74 4.57l3 6.18C23.3 20.1 24 16.14 24 12 24 5.37 18.63 0 12 0z" />
            </svg>
            View Steam Profile
          </a>
        </div>
      </div>
    </div>
  );
}
