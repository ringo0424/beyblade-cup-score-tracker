import { normalizePlayerName } from "@/lib/accounts";
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
  const fromProfiles = data.fighters ?? [];
  const keys = new Set(fromProfiles.map((f) => f.nameKey));

  for (const m of data.matches) {
    for (const p of m.players) {
      const key = fighterNameKey(p.name);
      if (!keys.has(key)) {
        keys.add(key);
        fromProfiles.push({
          id: generateId(),
          nameKey: key,
          displayName: fighterDisplayName(p.name),
        });
      }
    }
  }

  return fromProfiles.sort((a, b) =>
    a.displayName.localeCompare(b.displayName, "zh-Hant")
  );
}

export function getFighterLibrary(data: AppData, nameKey: string) {
  return getUserLibrary(data, nameKey);
}
