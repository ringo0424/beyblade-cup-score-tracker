import { normalizeAccountName, rebuildMatchPlayers } from "@/lib/accounts";
import { SHARED_LIBRARY_ID } from "@/lib/constants";
import { deletedIdSet, mergeDeletedIds } from "@/lib/deletions";
import { createDefaultSetup } from "@/lib/beyblade";
import type {
  AppData,
  BeybladeSetup,
  FighterProfile,
  Match,
  Player,
  UserLibrary,
} from "@/types";

function playerKey(p: Player): string {
  return normalizeAccountName(p.name).toLowerCase() || p.id;
}

function mergePlayers(a: Player[], b: Player[]): Player[] {
  const map = new Map<string, Player>();
  for (const p of a) map.set(playerKey(p), p);
  for (const p of b) {
    const key = playerKey(p);
    const existing = map.get(key);
    map.set(
      key,
      existing
        ? { ...existing, ...p, id: existing.id, name: existing.name || p.name }
        : p
    );
  }
  return Array.from(map.values());
}

function setupScore(setup: BeybladeSetup): number {
  return setup.beyblades.reduce(
    (n, b) =>
      n +
      (b.nickname ? 1 : 0) +
      (b.steelBlade ? 1 : 0) +
      (b.lockDisk ? 1 : 0),
    0
  );
}

function pickSetup(
  playerId: string,
  ...candidates: (BeybladeSetup | undefined)[]
): BeybladeSetup {
  const found = candidates.filter(Boolean) as BeybladeSetup[];
  if (found.length === 0) return createDefaultSetup(playerId);
  return found.sort((a, b) => setupScore(b) - setupScore(a))[0];
}

function mergeSingleMatch(local: Match, remote: Match): Match {
  const players = mergePlayers(local.players, remote.players);
  const base = local.updatedAt >= remote.updatedAt ? local : remote;
  const other = local.updatedAt >= remote.updatedAt ? remote : local;

  const playerCountChanged =
    players.length !== local.players.length ||
    players.length !== remote.players.length;

  let merged: Match = {
    ...base,
    players,
    rounds:
      local.rounds.length >= remote.rounds.length ? local.rounds : remote.rounds,
    updatedAt:
      local.updatedAt >= remote.updatedAt ? local.updatedAt : remote.updatedAt,
  };

  if (local.status === "inProgress" || remote.status === "inProgress") {
    merged.status =
      local.updatedAt >= remote.updatedAt ? local.status : remote.status;
    merged.currentPairingIndex =
      local.updatedAt >= remote.updatedAt
        ? local.currentPairingIndex
        : remote.currentPairingIndex;
    merged.winnerPlayerId =
      local.updatedAt >= remote.updatedAt
        ? local.winnerPlayerId
        : remote.winnerPlayerId;
    merged.pairings =
      local.updatedAt >= remote.updatedAt ? local.pairings : remote.pairings;
  }

  if (playerCountChanged && merged.status === "setup") {
    merged = rebuildMatchPlayers(merged, players);
  }

  merged.beybladeSetups = players.map((p) =>
    pickSetup(
      p.id,
      local.beybladeSetups.find((s) => s.playerId === p.id),
      remote.beybladeSetups.find((s) => s.playerId === p.id),
      other.beybladeSetups.find((s) => s.playerId === p.id),
      base.beybladeSetups.find((s) => s.playerId === p.id)
    )
  );

  return merged;
}

function mergeMatches(
  local: Match[],
  remote: Match[],
  deletedMatchIds: Set<string>
): Match[] {
  const ids = new Set([
    ...local.map((m) => m.id),
    ...remote.map((m) => m.id),
  ]);
  const result: Match[] = [];
  for (const id of ids) {
    if (deletedMatchIds.has(id)) continue;
    const l = local.find((m) => m.id === id);
    const r = remote.find((m) => m.id === id);
    if (l && r) result.push(mergeSingleMatch(l, r));
    else if (l) result.push(l);
    else if (r) result.push(r);
  }
  return result;
}

function mergeLibraries(
  local: UserLibrary[],
  remote: UserLibrary[]
): UserLibrary[] {
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
        lib.builds.length >= existing.builds.length
          ? lib.builds
          : existing.builds,
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
      title: f.title ?? existing.title,
    });
  }
  return Array.from(map.values());
}

/** 合併本機與雲端，避免較新的本機資料被舊雲端覆蓋。 */
export function mergeAppData(local: AppData, remote: AppData): AppData {
  const deletedMatchIds = mergeDeletedIds(
    local.deletedMatchIds,
    remote.deletedMatchIds
  );
  const deletedAccountIds = mergeDeletedIds(
    local.deletedAccountIds,
    remote.deletedAccountIds
  );
  const deletedFighterKeys = mergeDeletedIds(
    local.deletedFighterKeys,
    remote.deletedFighterKeys
  );
  const deletedFighters = deletedIdSet(deletedFighterKeys);

  const mergedLibs = mergeLibraries(local.libraries, remote.libraries).filter(
    (lib) => !deletedFighters.has(lib.accountId)
  );

  return {
    eventDays:
      local.eventDays.length >= remote.eventDays.length
        ? local.eventDays
        : remote.eventDays,
    matches: mergeMatches(
      local.matches,
      remote.matches,
      deletedIdSet(deletedMatchIds)
    ),
    accounts: [],
    libraries: mergedLibs,
    fighters: mergeFighters(local.fighters ?? [], remote.fighters ?? []).filter(
      (f) => !deletedFighters.has(f.nameKey)
    ),
    settings: { ...remote.settings, ...local.settings },
    deletedMatchIds,
    deletedAccountIds,
    deletedFighterKeys,
    version: Math.max(local.version ?? 0, remote.version ?? 0, 5),
  };
}

export function appDataChanged(a: AppData, b: AppData): boolean {
  return JSON.stringify(a) !== JSON.stringify(b);
}

function totalMatchPlayers(data: AppData): number {
  return data.matches.reduce((n, m) => n + m.players.length, 0);
}

/** 合併後比雲端更完整時，應回推到 Supabase */
export function shouldPushMergedToCloud(
  merged: AppData,
  remote: AppData
): boolean {
  if (totalMatchPlayers(merged) > totalMatchPlayers(remote)) return true;
  if (merged.matches.length > remote.matches.length) return true;
  return appDataChanged(
    stripForCompare(merged),
    stripForCompare(remote)
  );
}

function stripForCompare(data: AppData): AppData {
  return {
    ...data,
    matches: data.matches.map((m) => {
      const { celebrationPhotos: _, ...rest } = m;
      return rest;
    }),
  };
}
