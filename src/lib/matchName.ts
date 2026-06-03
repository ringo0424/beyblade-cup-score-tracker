import type { Match } from "@/types";

function normalizeTimeForName(time: string): string {
  const t = time.trim().toLowerCase();
  return t.replace(/\s+/g, "");
}

export function formatMatchNameBase(time: string, location: string): string {
  const timePart = normalizeTimeForName(time);
  const loc = location.trim() || "EOS";
  return `${timePart} ${loc}杯`;
}

export function generateMatchName(
  time: string,
  location: string,
  existingMatches: Match[],
  excludeMatchId?: string
): string {
  const base = formatMatchNameBase(time, location);
  const sameSlot = existingMatches.filter(
    (m) =>
      m.id !== excludeMatchId &&
      normalizeTimeForName(m.time) === normalizeTimeForName(time) &&
      m.location.trim().toLowerCase() === location.trim().toLowerCase()
  );

  if (sameSlot.length === 0) return base;

  const usedNumbers = new Set<number>();
  for (const m of sameSlot) {
    if (m.name === base) {
      usedNumbers.add(1);
      continue;
    }
    const match = m.name.match(new RegExp(`^${escapeRegex(base)}(\\d+)$`));
    if (match) usedNumbers.add(parseInt(match[1], 10));
  }

  let n = 2;
  while (usedNumbers.has(n)) n++;
  return `${base}${n}`;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
