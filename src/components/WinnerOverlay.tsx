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
        <div className="theme-overlay-backdrop absolute inset-0" />

        <div className="relative z-10 w-full max-w-sm px-4 text-center animate-transition-in">
          <p className="theme-overlay-kicker mb-3">{translate("gameOver")}</p>

          {isMe ? (
            <>
              <div className="theme-overlay-badge mx-auto mb-5 h-20 w-20 text-4xl">🏆</div>
              <h2 className="theme-overlay-title">{translate("youWon")}</h2>
              <p className="theme-overlay-sub mt-3 text-lg">{translate("gameYouWonSubtitle")}</p>
            </>
          ) : (
            <>
              <div className="theme-overlay-badge mx-auto mb-5 h-20 w-20">
                <span className="text-2xl font-black text-amber-200">★</span>
              </div>
              <h2 className="theme-overlay-title text-2xl leading-tight sm:text-3xl">
                {translate("gameWonBy", { name: winnerName })}
              </h2>
              <p className="mt-4 text-3xl font-black text-amber-200">{winnerName}</p>
            </>
          )}

          <button
            type="button"
            disabled={leaving}
            onClick={handleHome}
            className="home-btn-start mt-8 w-full py-4 text-lg font-bold disabled:opacity-70"
          >
            {translate("backToHome")}
          </button>
        </div>
      </div>
    </BodyPortal>
  );
}
