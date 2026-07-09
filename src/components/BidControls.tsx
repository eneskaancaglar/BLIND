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
    <div className={`home-panel-light rounded-lg ${compact ? "bid-panel-compact p-1.5" : "rounded-2xl p-4"}`}>
      {!compact ? (
        <p className="mb-3 text-center text-sm font-medium text-slate-200">
          {translate("bidYourMove")}
        </p>
      ) : null}

      <div className={`flex items-center justify-center ${compact ? "mb-1 gap-1.5" : "mb-4 gap-4"}`}>
        <button
          type="button"
          disabled={disabled || loading || count <= 1}
          onClick={() => setCount((c) => Math.max(1, c - 1))}
          className={`game-chip flex items-center justify-center font-medium text-slate-100 ${
            compact ? "h-7 w-7 text-sm" : "h-11 w-11 text-2xl"
          }`}
        >
          −
        </button>
        <div className="text-center">
          {!compact ? (
            <p className="text-[10px] uppercase text-slate-400">{translate("bidCount")}</p>
          ) : null}
          <p className={`font-semibold text-white ${compact ? "text-lg leading-none" : "text-4xl font-light"}`}>
            {count}
          </p>
        </div>
        <button
          type="button"
          disabled={disabled || loading || count >= maxCount}
          onClick={() => setCount((c) => c + 1)}
          className={`game-chip flex items-center justify-center font-medium text-slate-100 ${
            compact ? "h-7 w-7 text-sm" : "h-11 w-11 text-2xl"
          }`}
        >
          +
        </button>
      </div>

      <div className={`grid grid-cols-6 ${compact ? "mb-1 gap-0.5" : "mb-2 gap-1.5"}`}>
        {RANKS.map((r) => (
          <button
            key={r}
            type="button"
            disabled={disabled || loading}
            onClick={() => setRank(r)}
            className={`home-chip font-semibold transition ${
              compact ? "rounded py-0.5 text-[10px]" : "rounded-lg py-2 text-sm"
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

      <div className="grid grid-cols-2 gap-1">
        <button
          type="button"
          disabled={disabled || loading || !valid}
          onClick={handleBid}
          className={`home-btn-join w-full rounded-lg font-semibold disabled:opacity-50 ${
            compact ? "py-1.5 text-[11px]" : "rounded-xl py-3.5 text-sm"
          }`}
        >
          {translate("bidPlace")}
        </button>
        <button
          type="button"
          disabled={disabled || loading || !canOpen}
          onClick={handleOpen}
          className={`w-full rounded-lg border border-red-400/25 bg-red-950/35 font-semibold text-red-100 transition hover:bg-red-950/50 disabled:opacity-50 ${
            compact ? "py-1.5 text-[11px]" : "rounded-xl py-3.5 text-sm"
          }`}
        >
          {translate("bidOpen")}
        </button>
      </div>
    </div>
  );
}
