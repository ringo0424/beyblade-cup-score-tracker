import type { AppData, FighterProfile } from "@/types";
import { generateId } from "@/lib/id";
import { fighterDisplayName, fighterNameKey } from "./keys";

function normalizeAvatar(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("data:image/")) return trimmed;
  return trimmed.slice(0, 8);
}

export function setFighterIcon(
  data: AppData,
  displayName: string,
  icon: string | undefined,
  accountId?: string
): AppData {
  const nameKey = fighterNameKey(displayName);
  const normalized = normalizeAvatar(icon);
  const fighters = [...(data.fighters ?? [])];
  const idx = fighters.findIndex((f) => f.nameKey === nameKey);

  if (!normalized) {
    if (idx >= 0) {
      fighters[idx] = { ...fighters[idx], icon: undefined };
    }
    return { ...data, fighters };
  }

  const profile: FighterProfile = {
    id: idx >= 0 ? fighters[idx].id : generateId(),
    nameKey,
    displayName: fighterDisplayName(displayName),
    accountId: accountId ?? fighters[idx]?.accountId,
    icon: normalized,
  };

  if (idx >= 0) fighters[idx] = profile;
  else fighters.push(profile);

  return { ...data, fighters };
}
