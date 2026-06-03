import type { Match, MatchCelebrationPhotos } from "@/types";

export function hasCelebrationPhotos(
  photos: MatchCelebrationPhotos | undefined
): boolean {
  return Boolean(photos?.champion || photos?.runnerUp);
}

export function normalizeMatchPhotos(match: Match): Match {
  if (!match.celebrationPhotos) return match;
  const { champion, runnerUp, updatedAt } = match.celebrationPhotos;
  const cleaned: MatchCelebrationPhotos = {};
  if (champion) cleaned.champion = champion;
  if (runnerUp) cleaned.runnerUp = runnerUp;
  if (updatedAt) cleaned.updatedAt = updatedAt;
  if (!hasCelebrationPhotos(cleaned)) {
    return { ...match, celebrationPhotos: undefined };
  }
  return { ...match, celebrationPhotos: cleaned };
}

export function applyCelebrationPhotos(
  match: Match,
  photos: MatchCelebrationPhotos
): Match {
  return normalizeMatchPhotos({
    ...match,
    celebrationPhotos: photos,
    updatedAt: new Date().toISOString(),
  });
}
