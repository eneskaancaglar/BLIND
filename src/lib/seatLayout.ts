export type SeatPosition = "top" | "top-left" | "top-right" | "left" | "right" | "bottom";

export type HandOrientation = "up" | "down" | "left" | "right";

export function getOpponentSeatPosition(index: number, total: number): SeatPosition {
  if (total <= 1) return "top";
  if (total === 2) return index === 0 ? "top-left" : "top-right";
  if (total === 3) return (["top-left", "top", "top-right"] as const)[index] ?? "top";
  if (total === 4) {
    return (["left", "top-left", "top-right", "right"] as const)[index] ?? "top";
  }
  const positions: SeatPosition[] = ["left", "top-left", "top", "top-right", "right"];
  return positions[index % positions.length] ?? "top";
}

export function getHandOrientation(seat: SeatPosition): HandOrientation {
  switch (seat) {
    case "bottom":
      return "up";
    case "top":
      return "down";
    case "top-left":
    case "left":
      return "right";
    case "top-right":
    case "right":
      return "left";
    default:
      return "down";
  }
}
