import { normalizePlayerName } from "@/lib/accounts";
import { deletedIdSet } from "@/lib/deletions";
import { generateId } from "@/lib/id";
import { getUserLibrary, upsertUserLibrary } from "@/lib/library";
import type { AppData, FighterProfile } from "@/types";
import { fighterDisplayName, fighterNameKey } from "./keys";

function normalizeTitle(title?: string): string | undefined {
  const trimmed = title?.trim();
  return trimmed || undefined;
}

export function registerFighter(
  data: AppData,
  name: string,
  title?: string
): AppData {
  const display = fighterDisplayName(normalizePlayerName(name));
  if (!display) return data;
  const key = fighterNameKey(display);
  const fighters = [...(data.fighters ?? [])];
  const idx = fighters.findIndex((f) => f.nameKey === key);
  const normalizedTitle = normalizeTitle(title);

  if (idx >= 0) {
    fighters[idx] = {
      ...fighters[idx],
      displayName: display,
      title: normalizedTitle ?? fighters[idx].title,
    };
  } else {
    fighters.push({
      id: generateId(),
      nameKey: key,
      displayName: display,
      title: normalizedTitle,
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

export function updateFighter(
  data: AppData,
  nameKey: string,
  patch: { displayName?: string; title?: string }
): AppData {
  const fighters = [...(data.fighters ?? [])];
  const idx = fighters.findIndex((f) => f.nameKey === nameKey);
  if (idx < 0) return data;

  const current = fighters[idx];
  const newName =
    patch.displayName !== undefined
      ? fighterDisplayName(normalizePlayerName(patch.displayName))
      : current.displayName;
  if (!newName) return data;

  const newTitle =
    patch.title !== undefined ? normalizeTitle(patch.title) : current.title;
  const newKey = fighterNameKey(newName);

  const updated: FighterProfile = {
    ...current,
    nameKey: newKey,
    displayName: newName,
    title: newTitle,
  };

  let libraries = [...data.libraries];
  let matches = data.matches;

  if (newKey !== nameKey) {
    const lib = getUserLibrary(data, nameKey);
    libraries = libraries.filter((l) => l.accountId !== nameKey);
    if (lib.builds.length > 0 || lib.savedParts.length > 0) {
      libraries = upsertUserLibrary(
        { ...data, libraries },
        { ...lib, accountId: newKey }
      ).libraries;
    }

    matches = matches.map((m) => ({
      ...m,
      players: m.players.map((p) =>
        fighterNameKey(p.name) === nameKey ? { ...p, name: newName } : p
      ),
    }));

    fighters.splice(idx, 1);
    const dupIdx = fighters.findIndex((f) => f.nameKey === newKey);
    if (dupIdx >= 0) {
      fighters[dupIdx] = {
        ...fighters[dupIdx],
        ...updated,
        id: fighters[dupIdx].id,
        icon: updated.icon ?? fighters[dupIdx].icon,
      };
    } else {
      fighters.push(updated);
    }
  } else {
    fighters[idx] = updated;
  }

  return { ...data, fighters, libraries, matches };
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
