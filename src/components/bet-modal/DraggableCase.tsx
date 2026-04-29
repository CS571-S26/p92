"use client";

import { useDraggable } from "@dnd-kit/core";
import type { GroupedItem } from "./types";

interface DraggableCaseProps {
  item: GroupedItem;
  availableCount: number;
}

export default function DraggableCase({ item, availableCount }: DraggableCaseProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: item.classId,
      data: { item },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`relative bg-zinc-900 border border-zinc-800 rounded-lg p-3 cursor-move hover:border-zinc-600 transition-all w-full aspect-square flex flex-col items-center justify-center ${
        isDragging ? "opacity-50 scale-105" : ""
      } ${availableCount === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <img
        src={item.iconUrl}
        alt={item.name}
        className="w-full h-full max-h-[60%] object-contain mb-2"
      />
      <p className="text-xs text-zinc-300 truncate w-full text-center px-1">
        {item.name}
      </p>
      <span className="absolute top-2 right-2 bg-zinc-800 text-zinc-400 text-[10px] px-1.5 py-0.5 rounded">
        x{availableCount}
      </span>
    </div>
  );
}
