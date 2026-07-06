"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  isSoundEnabled,
  playSound,
  resumeAudio,
  setSoundEnabled,
  type SoundName,
} from "@/lib/sounds";

type SoundContextValue = {
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  play: (name: SoundName) => void;
};

const SoundContext = createContext<SoundContextValue | null>(null);

export function SoundProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState(true);

  useEffect(() => {
    setEnabledState(isSoundEnabled());
  }, []);

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
    setSoundEnabled(value);
  }, []);

  const play = useCallback(
    (name: SoundName) => {
      if (!enabled) return;
      resumeAudio();
      playSound(name);
    },
    [enabled]
  );

  const value = useMemo(() => ({ enabled, setEnabled, play }), [enabled, setEnabled, play]);

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

export function useSound() {
  const ctx = useContext(SoundContext);
  if (!ctx) {
    throw new Error("useSound must be used within SoundProvider");
  }
  return ctx;
}
