import { getLeaderboard } from "@/lib/scoring";
import type { Match, Player } from "@/types";

export function getChampionPlayer(match: Match): Player | undefined {
  if (!match.winnerPlayerId) return undefined;
  return match.players.find((p) => p.id === match.winnerPlayerId);
}

export function getRunnerUpPlayer(match: Match): Player | undefined {
  if (match.status !== "completed") return undefined;
  const champion = getChampionPlayer(match);
  if (!champion) return undefined;

  if (match.matchType === "roundRobin" && match.players.length >= 2) {
    const board = getLeaderboard(match.players, match.pairings);
    const second = board[1];
    if (!second || second.playerId === champion.id) return undefined;
    return match.players.find((p) => p.id === second.playerId);
  }

  if (match.players.length === 2) {
    return match.players.find((p) => p.id !== champion.id);
  }
  return undefined;
}

export function getLastPlacePlayer(match: Match): Player | undefined {
  if (match.status !== "completed" || match.players.length < 2) return undefined;
  const board = getLeaderboard(match.players, match.pairings);
  const last = board[board.length - 1];
  if (!last) return undefined;
  return match.players.find((p) => p.id === last.playerId);
}

export function matchHasXtremeFinish(match: Match): boolean {
  return match.rounds.some((r) => r.finishType === "xtreme");
}

export function isEosMatch(match: Match): boolean {
  return /EOS/i.test(match.name) || /EOS/i.test(match.location);
}

export function championHadPerfectRun(match: Match): boolean {
  const champion = getChampionPlayer(match);
  if (!champion) return false;

  const involved = match.pairings.filter(
    (p) => p.playerAId === champion.id || p.playerBId === champion.id
  );
  if (involved.length === 0) return false;
  return involved.every(
    (p) => p.status === "completed" && p.winnerPlayerId === champion.id
  );
}

/** 中場時冠軍是否仍在後段名次（爆冷） */
export function championWasUpsetCandidate(match: Match): boolean {
  const champion = getChampionPlayer(match);
  if (!champion || match.matchType !== "roundRobin") return false;

  const completed = match.pairings.filter((p) => p.status === "completed");
  if (completed.length < 2) return false;

  const mid = Math.floor(completed.length / 2);
  const snapshotPairings = match.pairings.map((p, i) =>
    i < mid ? { ...p, status: "completed" as const } : { ...p, status: "pending" as const }
  );
  const board = getLeaderboard(match.players, snapshotPairings);
  const rank = board.findIndex((e) => e.playerId === champion.id);
  return rank >= Math.floor(match.players.length / 2);
}

export function pickRandomLoser(match: Match): Player | undefined {
  const champion = getChampionPlayer(match);
  const losers = match.players.filter((p) => p.id !== champion?.id);
  if (losers.length === 0) return undefined;
  return losers[Math.floor(Math.random() * losers.length)];
}
