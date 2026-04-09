export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] font-mono text-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="h-8 w-48 bg-zinc-800 rounded animate-pulse mb-6" />
        
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-[#111118] border border-white/10 rounded-xl p-4"
            >
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-zinc-800 rounded-lg animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 w-3/4 bg-zinc-800 rounded animate-pulse mb-2" />
                  <div className="h-4 w-1/2 bg-zinc-800 rounded animate-pulse mb-3" />
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
