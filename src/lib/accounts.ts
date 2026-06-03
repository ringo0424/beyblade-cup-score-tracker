import type { Account, AppData, Match, Player } from "@/types";
import { generateId } from "./id";
import { getMatch, upsertMatch } from "./storage";
import {
  createAccountWithPassword,
  verifyPassword,
} from "@/lib/auth/password";
import {
  create1v1Pairing,
  generateRoundRobinPairings,
} from "./pairings";
import { createDefaultSetup } from "./beyblade";

export const ADMIN_ACCOUNT_NAME = "RINGO";

export function isAdminAccount(account: Account | null | undefined): boolean {
  if (!account) return false;
  return (
    account.isAdmin === true ||
    account.name.trim().toUpperCase() === ADMIN_ACCOUNT_NAME
  );
}

export function normalizeAccountName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export function findAccountById(
  data: AppData,
  accountId: string
): Account | undefined {
  return data.accounts.find((a) => a.id === accountId);
}

export function findAccountByName(
  data: AppData,
  name: string
): Account | undefined {
  const target = normalizeAccountName(name).toLowerCase();
  return data.accounts.find(
    (a) => normalizeAccountName(a.name).toLowerCase() === target
  );
}

export function addAccount(
  data: AppData,
  name: string,
  password: string
): AppData {
  const normalized = normalizeAccountName(name);
  if (!normalized || !password.trim()) return data;
  if (findAccountByName(data, normalized)) return data;
  return {
    ...data,
    accounts: [
      ...data.accounts,
      createAccountWithPassword(normalized, password),
    ],
  };
}

export function authenticateAccount(
  data: AppData,
  name: string,
  password: string
): Account | null {
  const account = findAccountByName(data, name);
  if (!account || !verifyPassword(password, account.passwordHash)) {
    return null;
  }
  return account;
}

export function removeAccount(data: AppData, accountId: string): AppData {
  const accounts = data.accounts.filter((a) => a.id !== accountId);
  const matches = data.matches.map((match) => {
    const players = match.players.filter((p) => p.accountId !== accountId);
    if (players.length === match.players.length) return match;
    return rebuildMatchPlayers(match, players);
  });
  const libraries = data.libraries.filter((l) => l.accountId !== accountId);
  return { ...data, accounts, matches, libraries };
}

export function rebuildMatchPlayers(match: Match, players: Player[]): Match {
  const pairings =
    match.matchType === "1v1" && players.length === 2
      ? create1v1Pairing(players[0].id, players[1].id)
      : players.length >= 3
        ? generateRoundRobinPairings(players)
        : [];

  const beybladeSetups = players.map(
    (p) =>
      match.beybladeSetups.find((s) => s.playerId === p.id) ??
      createDefaultSetup(p.id)
  );

  return {
    ...match,
    players,
    pairings,
    beybladeSetups,
    updatedAt: new Date().toISOString(),
  };
}

export function getPlayerForAccount(
  match: Match,
  accountId: string
): Player | undefined {
  return match.players.find((p) => p.accountId === accountId);
}

export function isJoinedMatch(match: Match, accountId: string): boolean {
  return Boolean(getPlayerForAccount(match, accountId));
}

export function canJoinMatch(match: Match, accountId: string): boolean {
  if (match.status !== "setup") return false;
  if (isJoinedMatch(match, accountId)) return false;
  const max = match.matchType === "1v1" ? 2 : 8;
  return match.players.length < max;
}

export function joinMatch(
  data: AppData,
  matchId: string,
  account: Account
): AppData {
  const match = getMatch(data, matchId);
  if (!match || !canJoinMatch(match, account.id)) return data;

  const player: Player = {
    id: generateId(),
    name: account.name,
    accountId: account.id,
  };
  const players = [...match.players, player];
  const updated = rebuildMatchPlayers(match, players);

  return upsertMatch(data, updated);
}

export function minPlayersForMatch(match: Match): number {
  return match.matchType === "1v1" ? 2 : 3;
}

export function openJoinableMatches(data: AppData, accountId: string): Match[] {
  return data.matches
    .filter((m) => m.status === "setup" && canJoinMatch(m, accountId))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** 已建立或已加入、仍在籌備中的比賽 */
export function setupMatchesForAccount(
  data: AppData,
  accountId: string
): Match[] {
  return data.matches
    .filter(
      (m) =>
        m.status === "setup" &&
        (m.hostAccountId === accountId || isJoinedMatch(m, accountId))
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
