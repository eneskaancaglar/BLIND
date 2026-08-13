"use client";

import { useLanguage } from "@/context/LanguageContext";
import { BodyPortal } from "./BodyPortal";

type RoundTransitionOverlayProps = {
  roundNumber: number;
  starterName: string;
};

export function RoundTransitionOverlay({
  roundNumber,
  starterName,
}: RoundTransitionOverlayProps) {
  const { translate } = useLanguage();

  return (
    <BodyPortal>
      <div className="round-overlay round-overlay-transition fixed inset-0 z-[200] flex items-center justify-center p-4">
        <div className="theme-overlay-backdrop absolute inset-0" />

        <div className="relative z-10 w-full max-w-sm text-center animate-transition-in">
          <div className="theme-overlay-badge mb-6 h-20 w-20">
            <span className="text-3xl font-black text-amber-200">{roundNumber}</span>
          </div>

          <h2 className="theme-overlay-title">{translate("roundTransitionTitle")}</h2>
          <p className="theme-overlay-sub mt-4 text-lg">
            {translate("roundTransitionSubtitle", {
              round: roundNumber,
              name: starterName,
            })}
          </p>

          <div className="theme-progress-track mt-8">
            <div className="theme-progress-bar transition-progress" />
          </div>
        </div>
      </div>
    </BodyPortal>
  );
}
