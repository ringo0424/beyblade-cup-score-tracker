import type { AppData, Match, Player } from "@/types";
import { registerFighter } from "@/lib/fighters/registry";
import { generateId } from "./id";
import { getMatch, upsertMatch } from "./storage";
import { create1v1Pairing } from "./pairings";
import { createDefaultSetup } from "./beyblade";

export function normalizePlayerName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

/** @deprecated 沿用舊名稱 */
export const normalizeAccountName = normalizePlayerName;

export function rebuildMatchPlayers(match: Match, players: Player[]): Match {
  const pairings =
    match.matchType === "1v1" && players.length === 2
      ? create1v1Pairing(players[0].id, players[1].id)
      : match.status === "inProgress" || match.status === "completed"
        ? match.pairings
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

export function minPlayersForMatch(match: Match): number {
  return match.matchType === "1v1" ? 2 : 3;
}

export function maxPlayersForMatch(match: Match): number {
  return match.matchType === "1v1" ? 2 : 8;
}

export function canAddPlayerToMatch(match: Match): boolean {
  if (match.status !== "setup") return false;
  return match.players.length < maxPlayersForMatch(match);
}

export function playerNameTaken(match: Match, name: string): boolean {
  const key = normalizePlayerName(name).toLowerCase();
  return match.players.some(
    (p) => normalizePlayerName(p.name).toLowerCase() === key
  );
}

export function addPlayerToMatch(
  data: AppData,
  matchId: string,
  name: string
): AppData {
  const match = getMatch(data, matchId);
  const normalized = normalizePlayerName(name);
  if (!match || !normalized || !canAddPlayerToMatch(match)) return data;
  if (playerNameTaken(match, normalized)) return data;

  const player: Player = {
    id: generateId(),
    name: normalized,
  };
  const withPlayer = rebuildMatchPlayers(match, [...match.players, player]);
  return registerFighter(upsertMatch(data, withPlayer), normalized);
}

export function removePlayerFromMatch(
  data: AppData,
  matchId: string,
  playerId: string
): AppData {
  const match = getMatch(data, matchId);
  if (!match || match.status !== "setup") return data;
  const players = match.players.filter((p) => p.id !== playerId);
  if (players.length === match.players.length) return data;
  const updated = rebuildMatchPlayers(match, players);
  return upsertMatch(data, updated);
}

export function setupMatches(data: AppData): Match[] {
  return data.matches
    .filter((m) => m.status === "setup")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function listFighterNames(data: AppData): string[] {
  const names = new Set<string>();
  for (const m of data.matches) {
    for (const p of m.players) {
      const n = normalizePlayerName(p.name);
      if (n) names.add(n);
    }
  }
  return Array.from(names).sort((a, b) => a.localeCompare(b, "zh-Hant"));
}
