import { hasCelebrationPhotos } from "@/lib/matchPhotos";
import type { AppData, Match, MatchCelebrationPhotos } from "@/types";

const PHOTOS_STORAGE_KEY = "beyblade-match-celebration-photos-v1";

type PhotoMap = Record<string, MatchCelebrationPhotos>;

function loadPhotoMap(): PhotoMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PHOTOS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as PhotoMap;
  } catch {
    return {};
  }
}

function savePhotoMap(map: PhotoMap): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PHOTOS_STORAGE_KEY, JSON.stringify(map));
}

export function syncPhotoMapFromAppData(data: AppData): void {
  const map = loadPhotoMap();
  const activeIds = new Set(data.matches.map((m) => m.id));

  for (const id of Object.keys(map)) {
    if (!activeIds.has(id)) delete map[id];
  }

  for (const m of data.matches) {
    if (hasCelebrationPhotos(m.celebrationPhotos)) {
      map[m.id] = m.celebrationPhotos!;
    }
  }

  savePhotoMap(map);
}

export function attachLocalPhotos(data: AppData): AppData {
  const map = loadPhotoMap();
  return {
    ...data,
    matches: data.matches.map((m) => ({
      ...m,
      celebrationPhotos: map[m.id] ?? m.celebrationPhotos,
    })),
  };
}

/** 雲端同步用：移除大型 base64，避免覆寫失敗導致整包資料回滾。 */
export function stripPhotosForCloudSync(data: AppData): AppData {
  return {
    ...data,
    matches: data.matches.map(stripMatchPhotos),
  };
}

function stripMatchPhotos(match: Match): Match {
  if (!match.celebrationPhotos) return match;
  const { celebrationPhotos: _, ...rest } = match;
  return rest;
}
