"use client";

import { useLanguage } from "@/context/LanguageContext";
import { BodyPortal } from "./BodyPortal";

type WinnerOverlayProps = {
  winnerName: string;
  isMe: boolean;
  onHome: () => void;
};

export function WinnerOverlay({ winnerName, isMe, onHome }: WinnerOverlayProps) {
  const { translate } = useLanguage();

  return (
    <BodyPortal>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/92 backdrop-blur-md" />
        <div className="winner-overlay-panel relative z-10 w-full max-w-sm animate-result-in rounded-3xl border border-emerald-400/35 p-8 text-center shadow-2xl shadow-emerald-900/50">
          <div className="winner-overlay-glow pointer-events-none absolute inset-0 rounded-3xl" aria-hidden />

          <p className="relative mb-2 text-xs font-bold uppercase tracking-[0.35em] text-emerald-300/85">
            {translate("gameOver")}
          </p>

          {isMe ? (
            <>
              <p className="relative text-4xl" aria-hidden>
                🏆
              </p>
              <h2 className="relative mt-2 text-3xl font-black text-white">{translate("youWon")}</h2>
              <p className="relative mt-2 text-sm text-emerald-100/75">{translate("gameYouWonSubtitle")}</p>
            </>
          ) : (
            <>
              <h2 className="relative text-2xl font-black leading-tight text-white sm:text-3xl">
                {translate("gameWonBy", { name: winnerName })}
              </h2>
              <p className="relative mt-4 text-4xl font-black text-emerald-300">{winnerName}</p>
            </>
          )}

          <button
            type="button"
            onClick={onHome}
            className="relative mt-8 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 py-4 text-lg font-bold text-white shadow-lg transition hover:brightness-110"
          >
            {translate("backToHome")}
          </button>
        </div>
      </div>
    </BodyPortal>
  );
}
