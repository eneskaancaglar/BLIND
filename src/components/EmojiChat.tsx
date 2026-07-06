"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useSound } from "@/context/SoundContext";
import { isFirebaseConfigured } from "@/lib/firebase";
import { attachMessageSync, sendEmojiMessage } from "@/lib/roomService";
import { ChatMessage, EMOJI_REACTIONS } from "@/lib/types";

type EmojiChatProps = {
  roomCode: string;
  playerId: string;
  playerName: string;
  onMessagesChange?: (messages: ChatMessage[]) => void;
};

export function EmojiChat({
  roomCode,
  playerId,
  playerName,
  onMessagesChange,
}: EmojiChatProps) {
  const { translate } = useLanguage();
  const { play } = useSound();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onMessagesChange?.(messages);
  }, [messages, onMessagesChange]);

  useEffect(() => {
    if (!roomCode || !isFirebaseConfigured()) return;

    const detach = attachMessageSync(roomCode, {
      onMessages: setMessages,
    });

    return detach;
  }, [roomCode]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open]);

  async function handleSend(emoji: string) {
    if (!playerId || !playerName || sending) return;
    setSending(true);
    play("click");
    try {
      await sendEmojiMessage(roomCode, playerId, playerName, emoji);
    } finally {
      setSending(false);
    }
  }

  const recent = messages.slice(-12);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="game-chip flex h-8 w-8 items-center justify-center text-sm"
        aria-expanded={open}
        aria-label={translate("chatToggle")}
      >
        💬
      </button>

      {open ? (
        <div className="emoji-chat-panel absolute right-0 top-10 z-30 w-56 rounded-xl p-3 sm:w-64">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
            {translate("chatTitle")}
          </p>

          <div
            ref={listRef}
            className="mb-3 max-h-28 space-y-1.5 overflow-y-auto pr-0.5"
          >
            {recent.length === 0 ? (
              <p className="py-2 text-center text-xs text-slate-500">{translate("chatEmpty")}</p>
            ) : (
              recent.map((msg) => (
                <div key={msg.id} className="emoji-chat-msg flex items-center gap-2 px-2 py-1.5">
                  <span className="text-base leading-none">{msg.emoji}</span>
                  <span className="truncate text-xs text-slate-300">
                    {msg.playerId === playerId ? translate("you") : msg.playerName}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {EMOJI_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                disabled={sending || !playerName}
                onClick={() => void handleSend(emoji)}
                className="emoji-reaction-btn h-9 w-full"
                aria-label={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function getRecentReaction(
  messages: ChatMessage[],
  targetPlayerId: string,
  maxAgeMs = 3200
): ChatMessage | null {
  const cutoff = Date.now() - maxAgeMs;
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i];
    if (msg.playerId === targetPlayerId && msg.createdAt >= cutoff) {
      return msg;
    }
  }
  return null;
}
