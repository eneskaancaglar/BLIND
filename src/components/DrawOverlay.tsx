"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { BodyPortal } from "./BodyPortal";

type DrawOverlayProps = {
  onHome: () => void;
};

export function DrawOverlay({ onHome }: DrawOverlayProps) {
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
          <h2 className="theme-overlay-title">{translate("drawGame")}</h2>
          <p className="theme-overlay-sub mt-3 text-lg">{translate("drawBlindRevival")}</p>
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
