"use client";

import { useDroppable } from "@dnd-kit/core";
import type { PoolItem } from "./types";

interface DroppablePoolProps {
  pool: PoolItem[];
  onRemove: (classId: string) => void;
  onUpdateQuantity: (classId: string, delta: number) => void;
}

export default function DroppablePool({ pool, onRemove, onUpdateQuantity }: DroppablePoolProps) {
  const { setNodeRef, isOver } = useDroppable({ id: "pool" });

  const totalCases = pool.reduce((sum, item) => sum + item.assetIds.length, 0);

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[200px] bg-zinc-950 border-2 border-dashed rounded-lg p-4 transition-colors ${
        isOver ? "border-emerald-500 bg-emerald-500/10" : "border-zinc-700"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-zinc-400">Your Bet Pool</h4>
        <span className="text-sm text-emerald-400">{totalCases} cases</span>
      </div>

      {pool.length === 0 ? (
        <div className="h-32 flex items-center justify-center text-zinc-400 text-sm">
          Drag cases here
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {pool.map((item) => (
            <div
              key={item.classId}
              className="relative bg-zinc-900 border border-emerald-500/30 rounded-lg p-2"
            >
              <img
                src={item.iconUrl}
                alt={item.name}
                className="w-full h-12 object-contain mb-1"
              />
              <p className="text-xs text-zinc-400 truncate">{item.name}</p>

              <span className="absolute top-1 right-1 bg-emerald-500 text-black text-[10px] font-bold px-1.5 rounded">
                x{item.assetIds.length}
              </span>

              <div className="flex items-center justify-center gap-1 mt-1">
                <button
                  onClick={() => onUpdateQuantity(item.classId, -1)}
                  className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-xs"
                  aria-label="Remove one"
                >
                  -
                </button>
                <span className="text-xs text-white w-4 text-center">
                  {item.assetIds.length}
                </span>
                <button
                  onClick={() => onUpdateQuantity(item.classId, 1)}
                  className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-xs"
                  aria-label="Add one"
                >
                  +
                </button>
              </div>

              <button
                onClick={() => onRemove(item.classId)}
                className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] hover:bg-rose-600 flex items-center justify-center"
                aria-label={`Remove ${item.name}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
