export interface PersonaState {
  label: string;
  color: string;
}

export const PERSONA_STATES: Record<number, PersonaState> = {
  0: { label: "Offline", color: "bg-zinc-600 text-zinc-300" },
  1: { label: "Online", color: "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40" },
  2: { label: "Busy", color: "bg-red-500/20 text-red-400 ring-1 ring-red-500/40" },
  3: { label: "Away", color: "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/40" },
  4: { label: "Snooze", color: "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/40" },
  5: { label: "Looking to Trade", color: "bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/40" },
  6: { label: "Looking to Play", color: "bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/40" },
};

export const ONLINE_DOT_COLOR: Record<number, string> = {
  0: "bg-zinc-500",
  1: "bg-emerald-400",
};

export function getOnlineDotColor(personastate: number): string {
  return ONLINE_DOT_COLOR[personastate] ?? "bg-amber-400";
}
