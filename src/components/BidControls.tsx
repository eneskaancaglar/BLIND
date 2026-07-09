"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useSound } from "@/context/SoundContext";
import { getMinimumBid, isValidBid } from "@/lib/gameLogic";
import { rankLabel } from "@/lib/i18n";
import { Bid, RANKS, Rank } from "@/lib/types";

type BidControlsProps = {
  currentBid: Bid | null;
  activePlayerCount: number;
  deckCount?: 1 | 2;
  disabled?: boolean;
  compact?: boolean;
  onBid: (count: number, rank: Rank) => Promise<void>;
  onOpen: () => Promise<void>;
  canOpen: boolean;
};

export function BidControls({
  currentBid,
  activePlayerCount,
  deckCount = 1,
  disabled,
  compact = false,
  onBid,
  onOpen,
  canOpen,
}: BidControlsProps) {
  const { translate, language } = useLanguage();
  const { play } = useSound();
  const minimum = useMemo(() => getMinimumBid(currentBid), [currentBid]);
  const [count, setCount] = useState(minimum.count);
  const [rank, setRank] = useState<Rank>(minimum.rank);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setCount(minimum.count);
    setRank(minimum.rank);
  }, [minimum.count, minimum.rank]);

  const valid = isValidBid({ count, rank }, currentBid, activePlayerCount, deckCount);
  const maxCount = activePlayerCount * 4 * deckCount;

  async function handleBid() {
    setLoading(true);
    setError("");
    play("click");
    try {
      await onBid(count, rank);
    } catch (err) {
      setError(err instanceof Error ? err.message : translate("bidFail"));
    } finally {
      setLoading(false);
    }
  }

  async function handleOpen() {
    setLoading(true);
    setError("");
    play("open");
    try {
      await onOpen();
    } catch (err) {
      setError(err instanceof Error ? err.message : translate("bidOpenFail"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`home-panel-light rounded-xl ${compact ? "p-2.5" : "rounded-2xl p-4"}`}>
      <p className={`text-center font-medium text-slate-200 ${compact ? "mb-2 text-xs" : "mb-3 text-sm"}`}>
        {translate("bidYourMove")}
      </p>

      <div className={`flex items-center justify-center ${compact ? "mb-2 gap-3" : "mb-4 gap-4"}`}>
        <button
          type="button"
          disabled={disabled || loading || count <= 1}
          onClick={() => setCount((c) => Math.max(1, c - 1))}
          className={`game-chip flex items-center justify-center font-medium text-slate-100 ${
            compact ? "h-9 w-9 text-lg" : "h-11 w-11 text-2xl"
          }`}
        >
          −
        </button>
        <div className="text-center">
          <p className="text-[10px] uppercase text-slate-400">{translate("bidCount")}</p>
          <p className={`font-light text-white ${compact ? "text-2xl" : "text-4xl"}`}>{count}</p>
        </div>
        <button
          type="button"
          disabled={disabled || loading || count >= maxCount}
          onClick={() => setCount((c) => c + 1)}
          className={`game-chip flex items-center justify-center font-medium text-slate-100 ${
            compact ? "h-9 w-9 text-lg" : "h-11 w-11 text-2xl"
          }`}
        >
          +
        </button>
      </div>

      <p className="mb-1.5 text-center text-[10px] uppercase tracking-wider text-slate-400">
        {translate("bidRank")}
      </p>
      <div className={`mb-2 grid grid-cols-6 ${compact ? "gap-1" : "gap-1.5"}`}>
        {RANKS.map((r) => (
          <button
            key={r}
            type="button"
            disabled={disabled || loading}
            onClick={() => setRank(r)}
            className={`home-chip rounded-md font-semibold transition ${
              compact ? "py-1.5 text-xs" : "rounded-lg py-2 text-sm"
            } ${rank === r ? "home-chip-active" : ""}`}
          >
            {r}
          </button>
        ))}
      </div>

      {!compact ? (
        <p className="mb-2 text-center text-xs text-slate-400">
          {translate("bidLabel", {
            count,
            rank: rankLabel(language, rank),
          })}
        </p>
      ) : null}

      {!valid ? (
        <p className="mb-1.5 text-center text-[10px] text-slate-300">{translate("bidHigher")}</p>
      ) : null}

      {error ? (
        <p className="mb-1.5 text-center text-[10px] text-red-300/90">{error}</p>
      ) : null}

      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          disabled={disabled || loading || !valid}
          onClick={handleBid}
          className={`home-btn-join w-full rounded-xl font-semibold disabled:opacity-50 ${
            compact ? "py-2.5 text-xs" : "py-3.5 text-sm"
          }`}
        >
          {translate("bidPlace")}
        </button>
        <button
          type="button"
          disabled={disabled || loading || !canOpen}
          onClick={handleOpen}
          className={`w-full rounded-xl border border-red-400/25 bg-red-950/35 font-semibold text-red-100 transition hover:bg-red-950/50 disabled:opacity-50 ${
            compact ? "py-2.5 text-xs" : "py-3.5 text-sm"
          }`}
        >
          {translate("bidOpen")}
        </button>
      </div>
    </div>
  );
}
