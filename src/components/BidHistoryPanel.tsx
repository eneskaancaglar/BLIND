"use client";

import { useLanguage } from "@/context/LanguageContext";
import { formatBid } from "@/lib/gameLogic";
import type { Bid } from "@/lib/types";
import { CurrentBidDisplay } from "./CurrentBidDisplay";

type BidHistoryPanelProps = {
  open: boolean;
  onClose: () => void;
  bids: Bid[];
  roundNumber: number;
};

export function BidHistoryPanel({ open, onClose, bids, roundNumber }: BidHistoryPanelProps) {
  const { translate } = useLanguage();

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="bid-history-backdrop fixed inset-0 z-40 cursor-default"
        aria-label={translate("close")}
        onClick={onClose}
      />
      <div
        className="bid-history-panel fixed right-2 top-11 z-50 w-[min(18rem,calc(100vw-1rem))] rounded-2xl border border-white/15 bg-slate-950/96 p-3 shadow-2xl backdrop-blur-md sm:top-12 sm:right-3"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-label={translate("bidHistory")}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            {translate("bidHistory")}
          </p>
          <span className="text-[10px] text-slate-500">
            {translate("round")} {roundNumber}
          </span>
        </div>

        {bids.length === 0 ? (
          <p className="py-4 text-center text-xs text-slate-500">{translate("bidHistoryEmpty")}</p>
        ) : (
          <ol className="bid-history-list max-h-[min(42dvh,16rem)] space-y-2 overflow-y-auto pr-0.5">
            {bids.map((bid, index) => (
              <li
                key={`${bid.playerId}-${index}-${bid.count}-${bid.rank}`}
                className="flex items-center justify-between gap-2 rounded-xl border border-white/8 bg-white/5 px-2.5 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-slate-100">{bid.playerName}</p>
                  <p className="text-[10px] text-slate-400">{formatBid(bid)}</p>
                </div>
                <div className="shrink-0 scale-75 origin-right">
                  <CurrentBidDisplay bid={bid} compact />
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </>
  );
}

type BidHistoryButtonProps = {
  onClick: () => void;
  bidCount: number;
  active?: boolean;
};

export function BidHistoryButton({ onClick, bidCount, active = false }: BidHistoryButtonProps) {
  const { translate } = useLanguage();

  return (
    <button
      type="button"
      onClick={onClick}
      className={`bid-history-btn home-footer-btn relative !min-h-7 !px-2 !py-1 text-[10px] ${
        active ? "bid-history-btn-active" : ""
      }`}
      aria-label={translate("bidHistory")}
      title={translate("bidHistory")}
    >
      <span className="flex items-center gap-1">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 6h16M4 12h10M4 18h14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <span className="hidden min-[380px]:inline">{translate("bidHistoryShort")}</span>
      </span>
      {bidCount > 0 ? (
        <span className="bid-history-count absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-violet-500 px-0.5 text-[8px] font-bold text-white">
          {bidCount > 9 ? "9+" : bidCount}
        </span>
      ) : null}
    </button>
  );
}
