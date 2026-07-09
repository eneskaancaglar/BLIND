"use client";

import { useLanguage } from "@/context/LanguageContext";
import type { RevealResult } from "@/lib/types";

type RevealPotSummaryProps = {
  result: RevealResult;
  bidCount: number;
  gameWinnerName?: string | null;
};

export function RevealPotSummary({ result, bidCount, gameWinnerName }: RevealPotSummaryProps) {
  const { translate } = useLanguage();
  const openerLoses = result.actualCount >= bidCount;
  const winnerName = openerLoses ? result.lastBidderName : result.openerName;

  return (
    <div className="reveal-pot-summary space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/90">
        {translate("roundResultTitle")}
      </p>
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
        {translate("cardsRevealed")}
      </p>
      <p className="text-sm text-slate-200">
        <span className="text-slate-400">{translate("revealCount")}: </span>
        <span className="text-lg font-bold text-white">{result.actualCount}</span>
        <span className="text-slate-500"> / {bidCount}</span>
      </p>
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm">
        <p>
          <span className="text-red-300/90">{translate("revealLoser")}: </span>
          <span className="font-bold text-white">{result.loserName}</span>
        </p>
        <span className="text-slate-600">·</span>
        <p>
          <span className="text-emerald-300/90">{translate("revealWinner")}: </span>
          <span className="font-bold text-white">{winnerName}</span>
        </p>
      </div>
      {result.blindRevivalName ? (
        <p className="text-[11px] text-violet-200/90">
          {translate("revealBlindRevival", {
            blind: result.blindRevivalName,
            opener: result.openerName,
          })}
        </p>
      ) : null}
      {gameWinnerName ? (
        <p className="pt-1 text-sm font-semibold text-emerald-200">
          {translate("gameOver")}: {gameWinnerName}
        </p>
      ) : null}
    </div>
  );
}
