export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-[#111118] border border-white/10 rounded-xl overflow-hidden">
        <div className="w-full aspect-video bg-zinc-800 animate-pulse" />
        <div className="p-4 space-y-3">
          <div className="h-4 w-16 bg-zinc-800 rounded-full animate-pulse" />
          <div className="h-4 w-3/4 bg-zinc-800 rounded animate-pulse" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-3 flex-1 bg-zinc-800 rounded animate-pulse" />
                <div className="h-1.5 flex-1 bg-zinc-800 rounded-full animate-pulse" />
                <div className="h-3 w-8 bg-zinc-800 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
