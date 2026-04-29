"use client";

import { useState } from "react";
import type { GroupedItem } from "./types";

interface QuantityPopupProps {
  item: GroupedItem | null;
  maxQuantity: number;
  onConfirm: (quantity: number) => void;
  onClose: () => void;
}

export default function QuantityPopup({
  item,
  maxQuantity,
  onConfirm,
  onClose,
}: QuantityPopupProps) {
  const [quantity, setQuantity] = useState(1);

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-sm w-full">
        <h3 className="text-lg font-semibold text-white mb-4">
          Add to Bet Pool
        </h3>

        <div className="flex items-center gap-4 mb-6">
          <img
            src={item.iconUrl}
            alt={item.name}
            className="w-16 h-16 object-contain"
          />
          <div>
            <p className="text-white font-medium">{item.name}</p>
            <p className="text-zinc-400 text-sm">{maxQuantity} available</p>
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="bet-quantity" className="text-sm text-zinc-400 mb-2 block">Quantity</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-10 h-10 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white"
              aria-label="Decrease quantity"
            >
              -
            </button>
            <input
              id="bet-quantity"
              type="number"
              min={1}
              max={maxQuantity}
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1;
                setQuantity(Math.max(1, Math.min(maxQuantity, val)));
              }}
              className="flex-1 h-10 bg-zinc-950 border border-zinc-700 rounded-lg text-center text-white"
            />
            <button
              onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
              className="w-10 h-10 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <input
            type="range"
            min={1}
            max={maxQuantity}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value))}
            className="w-full mt-3 accent-emerald-500"
            aria-label="Quantity slider"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setQuantity(1);
              onClose();
            }}
            className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm(quantity);
              setQuantity(1);
            }}
            className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-medium rounded-lg transition-colors"
          >
            Add {quantity} to Pool
          </button>
        </div>
      </div>
    </div>
  );
}
