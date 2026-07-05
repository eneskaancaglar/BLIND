"use client";

type HowToPlayModalProps = {
  open: boolean;
  onClose: () => void;
};

const RULES = [
  "Her oyuncu kendi kartlarını görür; rakiplerin kartları kapalıdır (sayısı görünür).",
  "Sıra sende: adet + rütbe iddia et (ör. 3 tane 6). Rütbe sırası: 3 → As. 2 iddia edilemez.",
  "İstersen Aç de — tüm kartlar açılır. Sayım = iddia edilen rütbe + tüm 2'ler (joker).",
  "Sayım ≥ iddia → açan kaybeder. Sayım < iddia → son iddia eden kaybeder.",
  "Kaybeden sonraki elde +1 kart alır. 6 kartta tekrar kaybederse BLIND olur (kartlarını göremez).",
  "BLIND iken kaybederse elenir. Kartı kalan son oyuncu kazanır.",
  "BLIND kuralı: BLIND oyuncu iddia eder. Hemen sonraki oyuncu iddiayı yükseltip devam ederse oyun normal sürer — ekstra bir şey olmaz.",
  "Ama BLIND'den hemen sonraki oyuncu Aç derse ve iddia doğru çıkarsa: BLIND oyuncu 5 kartla oyuna geri döner (kartlarını tekrar görür), açan ise +1 kart cezası alır (5 kartı varsa BLIND olur).",
];

export function HowToPlayModal({ open, onClose }: HowToPlayModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-3xl border border-violet-400/30 bg-gradient-to-b from-[#1a1035] to-[#0f172a] p-6 shadow-2xl shadow-violet-900/40"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="rules-title"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-300">
              BLIND
            </p>
            <h2 id="rules-title" className="text-2xl font-bold text-white">
              Nasıl Oynanır?
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/10 px-3 py-1 text-sm text-white hover:bg-white/20"
          >
            Kapat
          </button>
        </div>

        <ol className="space-y-4">
          {RULES.map((rule, index) => (
            <li key={rule} className="flex gap-3 text-sm leading-relaxed text-violet-100/90">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 text-xs font-bold text-white">
                {index + 1}
              </span>
              <span className="pt-0.5">{rule}</span>
            </li>
          ))}
        </ol>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 to-violet-600 py-3.5 font-bold text-white shadow-lg"
        >
          Anladım
        </button>
      </div>
    </div>
  );
}
