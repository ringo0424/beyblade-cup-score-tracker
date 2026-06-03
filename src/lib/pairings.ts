import type { BattlePairing, Player } from "@/types";
import { generateId } from "./id";

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

export function create1v1Pairing(playerAId: string, playerBId: string): BattlePairing[] {
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
