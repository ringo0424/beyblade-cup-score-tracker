import type { AppData, FighterProfile } from "@/types";
import { generateId } from "@/lib/id";

function normalizeAvatar(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("data:image/")) return trimmed;
  return trimmed.slice(0, 8);
}

export function setFighterIcon(
  data: AppData,
  nameKey: string,
  icon: string | undefined
): AppData {
  const normalized = normalizeAvatar(icon);
  const fighters = [...(data.fighters ?? [])];
  const idx = fighters.findIndex((f) => f.nameKey === nameKey);

  if (idx < 0) {
    if (!normalized) return data;
    fighters.push({
      id: generateId(),
      nameKey,
      displayName: nameKey,
      icon: normalized,
    });
    return { ...data, fighters };
  }

  if (!normalized) {
    fighters[idx] = { ...fighters[idx], icon: undefined };
    return { ...data, fighters };
  }

  fighters[idx] = { ...fighters[idx], icon: normalized };
  return { ...data, fighters };
}
