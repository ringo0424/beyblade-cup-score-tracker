import { getLeaderboard } from "@/lib/scoring";
import { normalizeAccountName } from "@/lib/accounts";
import type { AppData, FighterProfile, Match } from "@/types";
import { fighterDisplayName, fighterNameKey } from "./keys";

export interface FighterStatRow {
  nameKey: string;
  displayName: string;
  accountId?: string;
  icon?: string;
  championCount: number;
  runnerUpCount: number;
  matchCount: number;
  signedUp: boolean;
}

function ensureRow(
  map: Map<string, FighterStatRow>,
  name: string,
  accountId?: string
): FighterStatRow {
  const key = fighterNameKey(name);
  let row = map.get(key);
  if (!row) {
    row = {
      nameKey: key,
      displayName: fighterDisplayName(name),
      championCount: 0,
      runnerUpCount: 0,
      matchCount: 0,
      signedUp: false,
    };
    map.set(key, row);
  }
  if (accountId) {
    row.accountId = accountId;
    row.signedUp = true;
  }
  return row;
}

function runnerUpId(match: Match): string | null {
  const championId = match.winnerPlayerId;
  if (!championId) return null;

  if (match.matchType === "roundRobin" && match.players.length >= 2) {
    const board = getLeaderboard(match.players, match.pairings);
    const second = board[1];
    if (second && second.playerId !== championId) return second.playerId;
    return null;
  }

  if (match.players.length === 2) {
    const other = match.players.find((p) => p.id !== championId);
    return other?.id ?? null;
  }
  return null;
}

function applyProfileIcons(
  map: Map<string, FighterStatRow>,
  profiles: FighterProfile[]
): void {
  for (const p of profiles) {
    const row = map.get(p.nameKey);
    if (row) {
      if (p.icon) row.icon = p.icon;
      if (p.accountId) row.accountId = p.accountId;
      row.displayName = p.displayName || row.displayName;
    } else if (p.icon) {
      map.set(p.nameKey, {
        nameKey: p.nameKey,
        displayName: p.displayName,
        accountId: p.accountId,
        icon: p.icon,
        championCount: 0,
        runnerUpCount: 0,
        matchCount: 0,
        signedUp: Boolean(p.accountId),
      });
    }
  }
}

export function computeFighterStats(data: AppData): FighterStatRow[] {
  const map = new Map<string, FighterStatRow>();

  for (const account of data.accounts) {
    if (!account.passwordHash) continue;
    ensureRow(map, normalizeAccountName(account.name), account.id);
  }

  for (const match of data.matches) {
    if (match.status !== "completed") continue;

    const rId = runnerUpId(match);

    for (const p of match.players) {
      const row = ensureRow(map, p.name, p.accountId);
      row.matchCount += 1;
      if (match.winnerPlayerId === p.id) row.championCount += 1;
      if (rId === p.id) row.runnerUpCount += 1;
    }
  }

  applyProfileIcons(map, data.fighters ?? []);

  return Array.from(map.values()).sort((a, b) => {
    if (a.signedUp !== b.signedUp) return a.signedUp ? -1 : 1;
    if (b.championCount !== a.championCount) {
      return b.championCount - a.championCount;
    }
    if (b.runnerUpCount !== a.runnerUpCount) {
      return b.runnerUpCount - a.runnerUpCount;
    }
    return a.displayName.localeCompare(b.displayName, "zh-Hant");
  });
}

export function getFighterIcon(
  data: AppData,
  nameKey: string
): string | undefined {
  return data.fighters?.find((f) => f.nameKey === nameKey)?.icon;
}
