"use client";

import { useLanguage } from "@/context/LanguageContext";
import { useSound } from "@/context/SoundContext";
import { formatRevealSummary } from "@/lib/i18n";
import { resumeAudio } from "@/lib/sounds";
import type { RevealResult } from "@/lib/types";

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

  function handleContinue() {
    resumeAudio();
    play("click");
    onContinue();
  }

  return (
    <div className="round-overlay round-overlay-result fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="round-overlay-backdrop absolute inset-0 bg-black/85 backdrop-blur-sm" />

      <div className="round-result-card relative z-10 w-full max-w-md animate-result-in">
        <p className="mb-2 text-center text-xs font-bold uppercase tracking-[0.35em] text-red-300/80">
          {translate("roundResultTitle")}
        </p>

        <div className="loser-spotlight mb-6 rounded-3xl border-2 border-red-500/60 bg-gradient-to-b from-red-950/90 to-black/80 px-6 py-8 text-center shadow-2xl shadow-red-900/50">
          <p className="text-sm font-semibold uppercase tracking-widest text-red-300/90">
            {translate("revealLoser")}
          </p>
          <p className="loser-name mt-3 text-4xl font-black text-white drop-shadow-lg sm:text-5xl">
            {result.loserName}
          </p>
          <div className="mx-auto mt-4 h-1 w-24 rounded-full bg-gradient-to-r from-transparent via-red-500 to-transparent" />
        </div>

        <div className="mb-4 space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-center text-sm text-neutral-200">
          <p>
            <span className="text-neutral-400">{translate("revealCount")}: </span>
            <span className="text-xl font-bold text-white">{result.actualCount}</span>
          </p>
          <p className="leading-relaxed">{summary}</p>
        </div>

        {result.blindRevivalName ? (
          <div className="mb-4 rounded-2xl border border-violet-400/40 bg-violet-500/15 px-4 py-3 text-center text-sm text-violet-100">
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
            className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-900/40 transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? translate("wait") : translate("revealNextRound")}
          </button>
        ) : (
          <p className="text-center text-sm text-neutral-400">{translate("revealHostWait")}</p>
        )}
      </div>
    </div>
  );
}
