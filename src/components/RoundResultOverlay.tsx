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
  isHost?: boolean;
  canContinue: boolean;
  loading: boolean;
  onContinue: () => void;
  onLeave: () => void;
};

export function RoundResultOverlay({
  result,
  bidCount,
  canContinue,
  loading,
  onContinue,
  onLeave,
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

        <div className="round-result-panel pointer-events-auto relative z-10 mx-3 mb-[max(1rem,env(safe-area-inset-bottom))] max-h-[55dvh] overflow-y-auto p-4 animate-result-in sm:mx-4 sm:mb-6 sm:p-5">
          <p className="theme-overlay-kicker mb-3 text-center">
            {translate("roundResultTitle")}
          </p>

          <div className="mb-3 grid grid-cols-2 gap-2 text-center text-xs">
            <div className="theme-result-box theme-result-box--lose">
              <p className="text-[10px] uppercase tracking-wide text-red-200/85">
                {translate("revealLoser")}
              </p>
              <p className="loser-name mt-1 text-base font-bold text-white sm:text-lg">
                {result.loserName}
              </p>
            </div>
            <div className="theme-result-box theme-result-box--win">
              <p className="text-[10px] uppercase tracking-wide text-amber-100/85">
                {translate("revealWinner")}
              </p>
              <p className="mt-1 text-base font-bold text-white sm:text-lg">
                {openerLoses ? result.lastBidderName : result.openerName}
              </p>
            </div>
          </div>

          <div className="theme-result-summary mb-3 space-y-1.5 text-center text-xs sm:text-sm">
            <p className="text-slate-200">
              <span className="text-slate-400">{translate("revealCount")}: </span>
              <span className="text-lg font-bold text-white">{result.actualCount}</span>
              <span className="text-slate-500"> / </span>
              <span className="font-semibold text-amber-200">{bidCount}</span>
            </p>
            <p className="leading-relaxed text-slate-300">{summary}</p>
          </div>

          {result.blindRevivalName ? (
            <div className="theme-result-revival mb-3 px-3 py-2.5 text-center text-xs sm:text-sm">
              {translate("revealBlindRevival", {
                blind: result.blindRevivalName,
                opener: result.openerName,
              })}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2">
            {canContinue ? (
              <button
                type="button"
                disabled={loading}
                onClick={handleContinue}
                className="home-btn-start col-span-2 py-3 text-sm font-semibold disabled:opacity-50 sm:py-3.5"
              >
                {loading ? translate("wait") : translate("revealNextRound")}
              </button>
            ) : (
              <p className="col-span-2 text-center text-xs text-slate-400">
                {translate("revealHostWait")}
              </p>
            )}
            <button
              type="button"
              disabled={loading}
              onClick={onLeave}
              className="home-footer-btn col-span-2 py-2.5 text-xs font-semibold"
            >
              {translate("backToHome")}
            </button>
          </div>
        </div>
      </div>
    </BodyPortal>
  );
}
