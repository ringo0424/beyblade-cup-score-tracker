import type { AppData, Account, FighterProfile, Match, UserLibrary } from "@/types";

function pickNewerMatch(a: Match, b: Match): Match {
  return a.updatedAt >= b.updatedAt ? a : b;
}

function mergeMatches(local: Match[], remote: Match[]): Match[] {
  const map = new Map<string, Match>();
  for (const m of remote) map.set(m.id, m);
  for (const m of local) {
    const existing = map.get(m.id);
    map.set(m.id, existing ? pickNewerMatch(m, existing) : m);
  }
  return Array.from(map.values());
}

function mergeAccounts(local: Account[], remote: Account[]): Account[] {
  const map = new Map<string, Account>();
  for (const a of remote) map.set(a.id, a);
  for (const a of local) {
    const existing = map.get(a.id);
    if (!existing) {
      map.set(a.id, a);
      continue;
    }
    const preferLocal =
      Boolean(a.passwordHash) && !existing.passwordHash
        ? true
        : a.createdAt >= existing.createdAt;
    map.set(a.id, preferLocal ? a : existing);
  }
  return Array.from(map.values());
}

function mergeLibraries(local: UserLibrary[], remote: UserLibrary[]): UserLibrary[] {
  const map = new Map<string, UserLibrary>();
  for (const lib of remote) map.set(lib.accountId, lib);
  for (const lib of local) {
    const existing = map.get(lib.accountId);
    if (!existing) {
      map.set(lib.accountId, lib);
      continue;
    }
    map.set(lib.accountId, {
      accountId: lib.accountId,
      savedParts:
        lib.savedParts.length >= existing.savedParts.length
          ? lib.savedParts
          : existing.savedParts,
      builds:
        lib.builds.length >= existing.builds.length ? lib.builds : existing.builds,
    });
  }
  return Array.from(map.values());
}

function mergeFighters(
  local: FighterProfile[],
  remote: FighterProfile[]
): FighterProfile[] {
  const map = new Map<string, FighterProfile>();
  for (const f of remote) map.set(f.nameKey, f);
  for (const f of local) {
    const existing = map.get(f.nameKey);
    if (!existing) {
      map.set(f.nameKey, f);
      continue;
    }
    map.set(f.nameKey, {
      ...existing,
      ...f,
      icon: f.icon ?? existing.icon,
    });
  }
  return Array.from(map.values());
}

/** 合併本機與雲端，避免較新的本機資料被舊雲端覆蓋。 */
export function mergeAppData(local: AppData, remote: AppData): AppData {
  return {
    eventDays:
      local.eventDays.length >= remote.eventDays.length
        ? local.eventDays
        : remote.eventDays,
    matches: mergeMatches(local.matches, remote.matches),
    accounts: mergeAccounts(local.accounts, remote.accounts),
    libraries: mergeLibraries(local.libraries, remote.libraries),
    fighters: mergeFighters(local.fighters ?? [], remote.fighters ?? []),
    settings: { ...remote.settings, ...local.settings },
    version: Math.max(local.version ?? 0, remote.version ?? 0, 4),
  };
}

export function appDataChanged(a: AppData, b: AppData): boolean {
  return JSON.stringify(a) !== JSON.stringify(b);
}
