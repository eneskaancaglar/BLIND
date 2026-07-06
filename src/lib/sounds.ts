export type SoundName =
  | "click"
  | "deal"
  | "card"
  | "open"
  | "win"
  | "lose"
  | "transition";

const STORAGE_KEY = "blind_sound_enabled";

let audioContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    audioContext = new Ctx();
  }
  return audioContext;
}

function tone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.06,
  attack = 0.01,
  decay = 0.08
) {
  const ctx = getContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    void ctx.resume();
  }

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + attack);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + decay);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + decay + 0.02);
}

function swoosh() {
  const ctx = getContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    void ctx.resume();
  }

  noiseBurst(0.022, 0.045);

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(680, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + 0.07);
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.028, ctx.currentTime + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.09);
}

function noiseBurst(volume = 0.025, duration = 0.04) {
  const ctx = getContext();
  if (!ctx) return;

  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }

  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  source.buffer = buffer;
  filter.type = "lowpass";
  filter.frequency.value = 900;
  gain.gain.value = volume;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored !== "false";
}

export function setSoundEnabled(enabled: boolean): void {
  localStorage.setItem(STORAGE_KEY, enabled ? "true" : "false");
}

export function playSound(name: SoundName): void {
  if (!isSoundEnabled()) return;

  switch (name) {
    case "click":
      tone(620, 0.05, "triangle", 0.04, 0.005, 0.04);
      break;
    case "deal":
      tone(340, 0.06, "sine", 0.035, 0.005, 0.05);
      noiseBurst(0.012, 0.03);
      break;
    case "card":
      swoosh();
      break;
    case "open":
      tone(220, 0.1, "sawtooth", 0.025, 0.01, 0.12);
      tone(440, 0.08, "sine", 0.02, 0.02, 0.1);
      break;
    case "win":
      tone(523, 0.1, "sine", 0.05, 0.01, 0.12);
      window.setTimeout(() => tone(659, 0.1, "sine", 0.045, 0.01, 0.14), 90);
      window.setTimeout(() => tone(784, 0.14, "sine", 0.04, 0.01, 0.18), 180);
      break;
    case "lose":
      tone(280, 0.12, "triangle", 0.04, 0.01, 0.14);
      window.setTimeout(() => tone(200, 0.14, "triangle", 0.035, 0.01, 0.16), 100);
      break;
    case "transition":
      tone(390, 0.08, "sine", 0.03, 0.01, 0.1);
      break;
    default:
      break;
  }
}

export function resumeAudio(): void {
  const ctx = getContext();
  if (ctx?.state === "suspended") {
    void ctx.resume();
  }
}
