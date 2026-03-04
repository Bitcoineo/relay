"use client";

import { useState, useRef, useEffect } from "react";
import { EMOJI_CATEGORIES } from "@/lib/emoji";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-full right-0 mb-2 w-72 rounded-lg border border-[#EEEEED] bg-white shadow-lg"
    >
      {/* Category tabs */}
      <div className="flex border-b border-[#EEEEED] px-1 pt-1">
        {EMOJI_CATEGORIES.map((cat, i) => (
          <button
            key={cat.name}
            type="button"
            onClick={() => setActiveCategory(i)}
            className={`flex-1 rounded-t px-1 py-1.5 text-[10px] font-medium transition-colors ${
              i === activeCategory
                ? "bg-[#F8F8F7] text-[#4F46E5]"
                : "text-[#A3A3A3] hover:text-[#2D2D2D]"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div className="h-48 overflow-y-auto p-2">
        <div className="grid grid-cols-8 gap-0.5">
          {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                onSelect(emoji);
                onClose();
              }}
              className="flex h-8 w-8 items-center justify-center rounded text-lg transition-colors hover:bg-[#F8F8F7]"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
