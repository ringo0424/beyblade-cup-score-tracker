import { normalizePlayerName } from "@/lib/accounts";
import { deletedIdSet } from "@/lib/deletions";
import { generateId } from "@/lib/id";
import { getUserLibrary, upsertUserLibrary } from "@/lib/library";
import type { AppData, FighterProfile } from "@/types";
import { fighterDisplayName, fighterNameKey } from "./keys";

export function registerFighter(data: AppData, name: string): AppData {
  const display = fighterDisplayName(normalizePlayerName(name));
  if (!display) return data;
  const key = fighterNameKey(display);
  const fighters = [...(data.fighters ?? [])];
  if (!fighters.some((f) => f.nameKey === key)) {
    fighters.push({
      id: generateId(),
      nameKey: key,
      displayName: display,
    });
  }
  let next: AppData = { ...data, fighters };
  if (!data.libraries.some((l) => l.accountId === key)) {
    next = upsertUserLibrary(next, {
      accountId: key,
      savedParts: [],
      builds: [],
    });
  }
  return next;
}

export function listRegisteredFighters(data: AppData): FighterProfile[] {
  const deleted = deletedIdSet(data.deletedFighterKeys);
  const fromProfiles = (data.fighters ?? []).filter(
    (f) => !deleted.has(f.nameKey)
  );
  const keys = new Set(fromProfiles.map((f) => f.nameKey));

  for (const m of data.matches) {
    for (const p of m.players) {
      const key = fighterNameKey(p.name);
      if (deleted.has(key) || keys.has(key)) continue;
      keys.add(key);
      fromProfiles.push({
        id: generateId(),
        nameKey: key,
        displayName: fighterDisplayName(p.name),
      });
    }
  }

  return fromProfiles.sort((a, b) =>
    a.displayName.localeCompare(b.displayName, "zh-Hant")
  );
}

export function deleteFighter(data: AppData, nameKey: string): AppData {
  const deletedFighterKeys = [
    ...new Set([...(data.deletedFighterKeys ?? []), nameKey]),
  ];
  return {
    ...data,
    fighters: (data.fighters ?? []).filter((f) => f.nameKey !== nameKey),
    libraries: data.libraries.filter((l) => l.accountId !== nameKey),
    deletedFighterKeys,
  };
}

export function getFighterLibrary(data: AppData, nameKey: string) {
  return getUserLibrary(data, nameKey);
}
