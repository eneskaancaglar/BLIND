import { Card as CardType } from "@/lib/types";
import { PlayingCard, CardSize } from "./PlayingCard";

type CardFanProps = {
  cards?: CardType[];
  count?: number;
  hidden?: boolean;
  blind?: boolean;
  size?: CardSize;
  spread?: "tight" | "normal" | "wide";
};

export function CardFan({
  cards = [],
  count,
  hidden,
  blind,
  size = "md",
  spread = "normal",
}: CardFanProps) {
  const total = count ?? cards.length;
  if (total === 0) return null;

  const overlap =
    spread === "tight" ? 18 : spread === "wide" ? 28 : size === "xl" ? 34 : 22;
  const maxRotate = spread === "wide" ? 12 : 8;

  const items = hidden || blind
    ? Array.from({ length: total })
    : cards.map((card, index) => ({ card, index }));

  return (
    <div
      className="flex items-end justify-center"
      style={{ minHeight: size === "xl" ? "10rem" : size === "lg" ? "8rem" : "5rem" }}
    >
      {items.map((item, i) => {
        const center = (total - 1) / 2;
        const rotate = (i - center) * (maxRotate / Math.max(center, 1));
        const lift = Math.abs(i - center) * 2;

        return (
          <PlayingCard
            key={hidden || blind ? `back-${i}` : `card-${(item as { index: number }).index}`}
            card={hidden || blind ? undefined : (item as { card: CardType }).card}
            hidden={hidden && !blind}
            blind={blind}
            size={size}
            style={{
              marginLeft: i === 0 ? 0 : -overlap,
              transform: `rotate(${rotate}deg) translateY(${lift}px)`,
              zIndex: i,
            }}
          />
        );
      })}
    </div>
  );
}
