"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { BodyPortal } from "./BodyPortal";

type WinnerOverlayProps = {
  winnerName: string;
  isMe: boolean;
  onHome: () => void;
};

export function WinnerOverlay({ winnerName, isMe, onHome }: WinnerOverlayProps) {
  const { translate } = useLanguage();
  const [leaving, setLeaving] = useState(false);

  function handleHome() {
    if (leaving) return;
    setLeaving(true);
    onHome();
  }

  return (
    <BodyPortal>
      <div className="round-overlay round-overlay-transition pointer-events-auto fixed inset-0 z-[200] flex items-center justify-center p-4">
        <div className="round-transition-backdrop absolute inset-0 bg-gradient-to-b from-emerald-950/95 via-black/90 to-black/95" />

        <div className="relative z-10 w-full max-w-sm px-4 text-center animate-transition-in">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.35em] text-emerald-300/85">
            {translate("gameOver")}
          </p>

          {isMe ? (
            <>
              <div className="mx-auto mb-5 inline-flex h-20 w-20 items-center justify-center rounded-full border-2 border-emerald-400/50 bg-emerald-500/20 text-4xl">
                🏆
              </div>
              <h2 className="text-3xl font-black text-white">{translate("youWon")}</h2>
              <p className="mt-3 text-lg text-emerald-100/80">{translate("gameYouWonSubtitle")}</p>
            </>
          ) : (
            <>
              <div className="mx-auto mb-5 inline-flex h-20 w-20 items-center justify-center rounded-full border-2 border-emerald-400/50 bg-emerald-500/20">
                <span className="text-2xl font-black text-emerald-200">★</span>
              </div>
              <h2 className="text-2xl font-black leading-tight text-white sm:text-3xl">
                {translate("gameWonBy", { name: winnerName })}
              </h2>
              <p className="mt-4 text-3xl font-black text-emerald-300">{winnerName}</p>
            </>
          )}

          <button
            type="button"
            disabled={leaving}
            onClick={handleHome}
            className="home-btn-start mt-8 w-full rounded-2xl py-4 text-lg font-bold disabled:opacity-70"
          >
            {translate("backToHome")}
          </button>
        </div>
      </div>
    </BodyPortal>
  );
}
