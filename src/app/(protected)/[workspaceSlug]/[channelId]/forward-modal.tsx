"use client";

import { useState } from "react";
import type { Socket } from "socket.io-client";

interface ForwardModalProps {
  message: { id: string; content: string; channelId: string };
  channels: Array<{ id: string; name: string }>;
  onClose: () => void;
  socket: Socket | null;
}

export default function ForwardModal({
  message,
  channels,
  onClose,
  socket,
}: ForwardModalProps) {
  const [filter, setFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [forwarding, setForwarding] = useState(false);
  const [forwarded, setForwarded] = useState(false);

  const filtered = channels
    .filter((c) => c.id !== message.channelId)
    .filter((c) => c.name.toLowerCase().includes(filter.toLowerCase()));

  function handleForward() {
    if (!selectedId || !socket) return;
    setForwarding(true);

    socket.emit("forward_message", {
      messageId: message.id,
      fromChannelId: message.channelId,
      toChannelId: selectedId,
    });

    setForwarded(true);
    setTimeout(() => onClose(), 1200);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl">
        <h3 className="text-sm font-semibold text-[#2D2D2D]">
          Forward message
        </h3>

        {/* Message preview */}
        <div className="mt-3 rounded-md border border-[#EEEEED] bg-[#F8F8F7] p-3">
          <p className="text-sm text-[#6B6B6B] line-clamp-3">
            {message.content}
          </p>
        </div>

        {/* Channel filter */}
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search channels..."
          className="mt-3 w-full rounded-md border border-[#EEEEED] px-3 py-2 text-sm text-[#2D2D2D] focus:border-[#4F46E5] focus:outline-none focus:ring-1 focus:ring-[#4F46E5]"
          autoFocus
          disabled={forwarded}
        />

        {/* Channel list */}
        <div className="mt-2 max-h-40 overflow-y-auto rounded-md border border-[#EEEEED]">
          {filtered.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedId(c.id)}
              disabled={forwarded}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                selectedId === c.id
                  ? "bg-[#4F46E5] text-white"
                  : "text-[#2D2D2D] hover:bg-[#F8F8F7]"
              }`}
            >
              <span
                className={
                  selectedId === c.id ? "text-white/70" : "text-[#A3A3A3]"
                }
              >
                #
              </span>
              {c.name}
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-3 py-2 text-sm text-[#A3A3A3]">
              No channels found
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm text-[#6B6B6B] hover:bg-[#F8F8F7]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleForward}
            disabled={!selectedId || forwarding || forwarded}
            className={`rounded-md px-3 py-1.5 text-sm font-medium text-white ${
              forwarded
                ? "bg-[#22C55E]"
                : "bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-50"
            }`}
          >
            {forwarded
              ? "Forwarded!"
              : forwarding
                ? "Forwarding..."
                : "Forward"}
          </button>
        </div>
      </div>
    </div>
  );
}
