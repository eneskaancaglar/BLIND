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
        <div className="round-transition-backdrop absolute inset-0 bg-gradient-to-b from-emerald-950/95 via-black/90 to-black/95" />

        <div className="relative z-10 w-full max-w-sm text-center animate-transition-in">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full border-2 border-emerald-400/50 bg-emerald-500/20">
            <span className="text-3xl font-black text-emerald-300">{roundNumber}</span>
          </div>

          <h2 className="text-3xl font-black text-white">{translate("roundTransitionTitle")}</h2>
          <p className="mt-4 text-lg text-emerald-100/80">
            {translate("roundTransitionSubtitle", {
              round: roundNumber,
              name: starterName,
            })}
          </p>

          <div className="mx-auto mt-8 h-1 w-32 overflow-hidden rounded-full bg-white/10">
            <div className="transition-progress h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" />
          </div>
        </div>
      </div>
    </BodyPortal>
  );
}
