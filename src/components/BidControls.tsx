"use client";

import { useMemo, useState } from "react";
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
    <div className="space-y-4 rounded-2xl border border-neutral-700 bg-neutral-900 p-4">
      <div>
        <h3 className="mb-1 text-lg font-semibold">İddia Ver</h3>
        <p className="text-sm text-neutral-400">
          Format: adet + rütbe. 2 iddia edilemez; açılınca joker sayılır.
        </p>
      </div>

      {currentBid ? (
        <p className="rounded-xl bg-neutral-800 px-3 py-2 text-sm">
          Son iddia:{" "}
          <span className="font-semibold text-green-400">
            {currentBid.count} tane {RANK_LABELS[currentBid.rank]} ({currentBid.rank})
          </span>{" "}
          — {currentBid.playerName}
        </p>
      ) : (
        <p className="text-sm text-neutral-400">Henüz iddia yok. İlk iddiayı sen ver.</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-2">
          <span className="text-sm text-neutral-400">Adet</span>
          <input
            type="number"
            min={1}
            max={activePlayerCount * 4}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-full rounded-xl border border-neutral-600 bg-neutral-950 px-4 py-3 text-lg outline-none focus:border-green-500"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm text-neutral-400">Rütbe</span>
          <select
            value={rank}
            onChange={(e) => setRank(e.target.value as Rank)}
            className="w-full rounded-xl border border-neutral-600 bg-neutral-950 px-4 py-3 text-lg outline-none focus:border-green-500"
          >
            {RANKS.map((r) => (
              <option key={r} value={r}>
                {RANK_LABELS[r]} ({r})
              </option>
            ))}
          </select>
        </label>
      </div>

      {!valid ? (
        <p className="text-sm text-amber-300">
          Bu iddia geçersiz. Daha yüksek adet veya aynı adette daha yüksek rütbe seçin.
        </p>
      ) : null}

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={disabled || loading || !valid}
          onClick={handleBid}
          className="rounded-2xl bg-green-600 px-4 py-4 text-lg font-semibold text-white transition hover:bg-green-500 disabled:hover:bg-green-600"
        >
          İddia Ver
        </button>
        <button
          type="button"
          disabled={disabled || loading || !canOpen}
          onClick={handleOpen}
          className="rounded-2xl bg-red-600 px-4 py-4 text-lg font-semibold text-white transition hover:bg-red-500 disabled:hover:bg-red-600"
        >
          Aç
        </button>
      </div>
    </div>
  );
}
