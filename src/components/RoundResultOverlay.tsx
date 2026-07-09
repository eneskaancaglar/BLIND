"use client";

import { useLanguage } from "@/context/LanguageContext";
import { useSound } from "@/context/SoundContext";
import { formatRevealSummary } from "@/lib/i18n";
import { resumeAudio } from "@/lib/sounds";
import type { RevealResult } from "@/lib/types";
import { BodyPortal } from "./BodyPortal";

type RoundResultOverlayProps = {
  result: RevealResult;
  bidCount: number;
  isHost: boolean;
  loading: boolean;
  onContinue: () => void;
};

export function RoundResultOverlay({
  result,
  bidCount,
  isHost,
  loading,
  onContinue,
}: RoundResultOverlayProps) {
  const { translate, language } = useLanguage();
  const { play } = useSound();
  const summary = formatRevealSummary(language, result, bidCount);
  const openerLoses = result.actualCount >= bidCount;

  function handleContinue() {
    resumeAudio();
    play("click");
    onContinue();
  }

  return (
    <BodyPortal>
      <div className="round-overlay round-overlay-result pointer-events-none fixed inset-0 z-[200] flex flex-col justify-end">
        <div className="round-overlay-backdrop pointer-events-auto absolute inset-0" />

        <div className="round-result-panel pointer-events-auto relative z-10 mx-3 mb-[max(1rem,env(safe-area-inset-bottom))] max-h-[55dvh] overflow-y-auto rounded-2xl p-4 animate-result-in sm:mx-4 sm:mb-6 sm:p-5">
          <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">
            {translate("roundResultTitle")}
          </p>

          <div className="mb-3 grid grid-cols-2 gap-2 text-center text-xs">
            <div className="rounded-xl border border-red-400/30 bg-red-950/50 px-2 py-2.5">
              <p className="text-[10px] uppercase tracking-wide text-red-200/80">
                {translate("revealLoser")}
              </p>
              <p className="loser-name mt-1 text-base font-bold text-white sm:text-lg">
                {result.loserName}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-400/25 bg-emerald-950/35 px-2 py-2.5">
              <p className="text-[10px] uppercase tracking-wide text-emerald-200/80">
                {translate("revealWinner")}
              </p>
              <p className="mt-1 text-base font-bold text-white sm:text-lg">
                {openerLoses ? result.lastBidderName : result.openerName}
              </p>
            </div>
          </div>

          <div className="mb-3 space-y-1.5 rounded-xl border border-white/10 bg-black/30 p-3 text-center text-xs text-slate-200 sm:text-sm">
            <p>
              <span className="text-slate-400">{translate("revealCount")}: </span>
              <span className="text-lg font-bold text-white">{result.actualCount}</span>
              <span className="text-slate-500"> / </span>
              <span className="font-semibold text-amber-200">{bidCount}</span>
            </p>
            <p className="leading-relaxed text-slate-300">{summary}</p>
          </div>

          {result.blindRevivalName ? (
            <div className="mb-3 rounded-xl border border-violet-400/35 bg-violet-950/40 px-3 py-2.5 text-center text-xs text-violet-100 sm:text-sm">
              {translate("revealBlindRevival", {
                blind: result.blindRevivalName,
                opener: result.openerName,
              })}
            </div>
          ) : null}

          {isHost ? (
            <button
              type="button"
              disabled={loading}
              onClick={handleContinue}
              className="home-btn-start w-full rounded-xl py-3 text-sm font-semibold disabled:opacity-50 sm:py-3.5"
            >
              {loading ? translate("wait") : translate("revealNextRound")}
            </button>
          ) : (
            <p className="text-center text-xs text-slate-400">{translate("revealHostWait")}</p>
          )}
        </div>
      </div>
    </BodyPortal>
  );
}
