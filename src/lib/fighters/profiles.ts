import type { AppData, FighterProfile } from "@/types";
import { generateId } from "@/lib/id";
import { fighterDisplayName, fighterNameKey } from "./keys";

export function setFighterIcon(
  data: AppData,
  displayName: string,
  icon: string | undefined,
  accountId?: string
): AppData {
  const nameKey = fighterNameKey(displayName);
  const trimmedIcon = icon?.trim().slice(0, 8) || undefined;
  const fighters = [...(data.fighters ?? [])];
  const idx = fighters.findIndex((f) => f.nameKey === nameKey);

  if (!trimmedIcon) {
    if (idx >= 0) {
      const next = { ...fighters[idx], icon: undefined };
      fighters[idx] = next;
    }
    return { ...data, fighters };
  }

  const profile: FighterProfile = {
    id: idx >= 0 ? fighters[idx].id : generateId(),
    nameKey,
    displayName: fighterDisplayName(displayName),
    accountId: accountId ?? fighters[idx]?.accountId,
    icon: trimmedIcon,
  };

  if (idx >= 0) fighters[idx] = profile;
  else fighters.push(profile);

  return { ...data, fighters };
}
