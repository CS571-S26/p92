import Link from "next/link";
import type { User } from "firebase/auth";
import type { SteamProfile } from "@skinshi/steam-service/schemas";

function avatarUrl(hash: string, size?: "medium" | "full") {
  const suffix = size === "full" ? "_full" : size === "medium" ? "_medium" : "";
  return `https://avatars.steamstatic.com/${hash}${suffix}.jpg`;
}

interface ProfileTabProps {
  user: User;
  steamProfile: SteamProfile | null;
}

export default function ProfileTab({ user, steamProfile }: ProfileTabProps) {
  return (
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
              <p className="text-sm text-zinc-400">Steam ID: {steamProfile.steamID}</p>
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
    </div>
  );
}
