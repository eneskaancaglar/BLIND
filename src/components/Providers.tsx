"use client";

import { LanguageProvider } from "@/context/LanguageContext";
import { SoundProvider } from "@/context/SoundContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <SoundProvider>{children}</SoundProvider>
    </LanguageProvider>
  );
}
