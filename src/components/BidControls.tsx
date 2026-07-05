"use client";

import { useEffect, useMemo, useState } from "react";
import { getMinimumBid, isValidBid } from "@/lib/gameLogic";
import { Bid, RANKS, RANK_LABELS, Rank } from "@/lib/types";

type BidControlsProps = {
  currentBid: Bid | null;
  activePlayerCount: number;
  disabled?: boolean;
  onBid: (count: number, rank: Rank) => Promise<void>;
  onOpen: () => Promise<void>;
  canOpen: boolean;
};

export function BidControls({
  currentBid,
  activePlayerCount,
  disabled,
  onBid,
  onOpen,
  canOpen,
}: BidControlsProps) {
  const minimum = useMemo(() => getMinimumBid(currentBid), [currentBid]);
  const [count, setCount] = useState(minimum.count);
  const [rank, setRank] = useState<Rank>(minimum.rank);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setCount(minimum.count);
    setRank(minimum.rank);
  }, [minimum.count, minimum.rank]);

  const valid = isValidBid({ count, rank }, currentBid, activePlayerCount);

  async function handleBid() {
    setLoading(true);
    setError("");
    try {
      await onBid(count, rank);
    } catch (err) {
      setError(err instanceof Error ? err.message : "İddia verilemedi.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOpen() {
    setLoading(true);
    setError("");
    try {
      await onOpen();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Açma başarısız.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-emerald-800/50 bg-black/50 p-4 backdrop-blur-md">
      <p className="mb-3 text-center text-sm font-semibold text-emerald-100">Hamlen</p>

      {/* Adet seçici */}
      <div className="mb-4 flex items-center justify-center gap-4">
        <button
          type="button"
          disabled={disabled || loading || count <= 1}
          onClick={() => setCount((c) => Math.max(1, c - 1))}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-800 text-2xl font-bold text-white"
        >
          −
        </button>
        <div className="text-center">
          <p className="text-[10px] uppercase text-neutral-400">Adet</p>
          <p className="text-4xl font-black text-white">{count}</p>
        </div>
        <button
          type="button"
          disabled={disabled || loading || count >= activePlayerCount * 4}
          onClick={() => setCount((c) => c + 1)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-800 text-2xl font-bold text-white"
        >
          +
        </button>
      </div>

      {/* Rütbe seçici — kart gibi */}
      <p className="mb-2 text-center text-[10px] uppercase tracking-wider text-neutral-400">
        Rütbe seç (2 yok)
      </p>
      <div className="mb-4 grid grid-cols-4 gap-1.5 sm:grid-cols-6">
        {RANKS.map((r) => (
          <button
            key={r}
            type="button"
            disabled={disabled || loading}
            onClick={() => setRank(r)}
            className={`rounded-lg border py-2 text-sm font-bold transition ${
              rank === r
                ? "border-emerald-400 bg-emerald-600 text-white shadow-lg shadow-emerald-900/50"
                : "border-neutral-600 bg-neutral-900/80 text-neutral-200 hover:border-neutral-400"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <p className="mb-3 text-center text-xs text-emerald-200/60">
        İddia: <span className="font-bold text-white">{count}× {RANK_LABELS[rank]}</span>
      </p>

      {!valid ? (
        <p className="mb-2 text-center text-xs text-amber-300">
          Daha yüksek iddia seç
        </p>
      ) : null}

      {error ? <p className="mb-2 text-center text-xs text-red-400">{error}</p> : null}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={disabled || loading || !valid}
          onClick={handleBid}
          className="rounded-xl bg-emerald-600 py-3.5 text-base font-bold text-white shadow-lg shadow-emerald-950/50"
        >
          İddia Ver
        </button>
        <button
          type="button"
          disabled={disabled || loading || !canOpen}
          onClick={handleOpen}
          className="rounded-xl bg-red-600 py-3.5 text-base font-bold text-white shadow-lg shadow-red-950/50"
        >
          Aç!
        </button>
      </div>
    </div>
  );
}
