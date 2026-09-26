// Compare reachable scroll positions, including the bottom of the content.
// Choosing a raw card offset before clamping can incorrectly snap back to an earlier card.
export function getPassageSnapTarget(offsets: number[], y: number, maxScrollY: number): number {
  const max = Math.max(0, maxScrollY);
  const position = Math.max(0, Math.min(y, max));
  const targets = [0, max, ...offsets.filter(Number.isFinite).map((offset) => Math.max(0, Math.min(offset, max)))];
  return targets.reduce((best, target) =>
    Math.abs(target - position) < Math.abs(best - position) ? target : best
  );
}
