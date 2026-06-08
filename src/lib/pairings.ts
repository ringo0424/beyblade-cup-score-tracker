import type { BattlePairing, Match, Player } from "@/types";
import { generateId } from "./id";

export function pairKey(aId: string, bId: string): string {
  return [aId, bId].sort().join(":");
}

export function create1v1Pairing(
  playerAId: string,
  playerBId: string
): BattlePairing[] {
  return [
    {
      id: generateId(),
      playerAId,
      playerBId,
      scoreA: 0,
      scoreB: 0,
      status: "inProgress",
      winnerPlayerId: null,
      order: 0,
    },
  ];
}

export function createPairing(
  playerAId: string,
  playerBId: string,
  order: number
): BattlePairing {
  return {
    id: generateId(),
    playerAId,
    playerBId,
    scoreA: 0,
    scoreB: 0,
    status: "inProgress",
    winnerPlayerId: null,
    order,
  };
}

/** 循環賽所有應打的組合 */
export function allRoundRobinPairKeys(players: Player[]): string[] {
  const keys: string[] = [];
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      keys.push(pairKey(players[i].id, players[j].id));
    }
  }
  return keys;
}

export function getRemainingPairOptions(match: Match): [string, string][] {
  const required = new Set(allRoundRobinPairKeys(match.players));
  for (const p of match.pairings) {
    if (p.status === "completed") {
      required.delete(pairKey(p.playerAId, p.playerBId));
    }
  }
  const options: [string, string][] = [];
  for (const key of required) {
    const [a, b] = key.split(":");
    options.push([a, b]);
  }
  return options;
}

export function isRoundRobinScheduleComplete(match: Match): boolean {
  if (match.matchType !== "roundRobin") return false;
  const required = allRoundRobinPairKeys(match.players);
  if (required.length === 0) return false;
  const completed = match.pairings.filter((p) => p.status === "completed");
  if (completed.length < required.length) return false;
  const doneKeys = new Set(
    completed.map((p) => pairKey(p.playerAId, p.playerBId))
  );
  return required.every((k) => doneKeys.has(k));
}

export function getActivePairing(match: Match): BattlePairing | undefined {
  return match.pairings.find((p) => p.status === "inProgress");
}

export function needsPairingPick(match: Match): boolean {
  if (match.matchType !== "roundRobin" || match.status !== "inProgress") {
    return false;
  }
  if (getActivePairing(match)) return false;
  return !isRoundRobinScheduleComplete(match);
}

export function addChosenPairing(
  match: Match,
  playerAId: string,
  playerBId: string
): Match {
  const key = pairKey(playerAId, playerBId);
  const already = match.pairings.some(
    (p) =>
      pairKey(p.playerAId, p.playerBId) === key &&
      (p.status === "completed" || p.status === "inProgress")
  );
  if (already) return match;

  const order = match.pairings.length;
  const pairing = createPairing(playerAId, playerBId, order);
  return {
    ...match,
    pairings: [...match.pairings, pairing],
    currentPairingIndex: order,
    updatedAt: new Date().toISOString(),
  };
}

/** @deprecated 全自動順序；新比賽改為現場自選對戰 */
export function generateRoundRobinPairings(players: Player[]): BattlePairing[] {
  const pairings: BattlePairing[] = [];
  let order = 0;
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      pairings.push({
        id: generateId(),
        playerAId: players[i].id,
        playerBId: players[j].id,
        scoreA: 0,
        scoreB: 0,
        status: order === 0 ? "inProgress" : "pending",
        winnerPlayerId: null,
        order,
      });
      order++;
    }
  }
  return pairings;
}
