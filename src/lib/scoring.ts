import type {
  BattlePairing,
  FinishType,
  Match,
  RoundResult,
  ScoreRule,
  ScoreTarget,
} from "@/types";
import { DEFAULT_SCORE_RULE } from "@/types";
import { generateId } from "./id";
import { isRoundRobinScheduleComplete } from "./pairings";

export function getPointsForFinish(
  finishType: FinishType,
  rule: ScoreRule = DEFAULT_SCORE_RULE
): number {
  return rule[finishType];
}

export function getTargetScore(target: ScoreTarget): number | null {
  if (target === "unlimited") return null;
  return target;
}

export function isBattleWon(
  scoreA: number,
  scoreB: number,
  scoreTarget: ScoreTarget
): { won: boolean; winnerId: string | null; isA: boolean; isB: boolean } {
  const target = getTargetScore(scoreTarget);
  if (target === null) {
    return { won: false, winnerId: null, isA: false, isB: false };
  }
  const aWon = scoreA >= target;
  const bWon = scoreB >= target;
  if (aWon && !bWon) return { won: true, winnerId: "A", isA: true, isB: false };
  if (bWon && !aWon) return { won: true, winnerId: "B", isA: false, isB: true };
  if (aWon && bWon) {
    return scoreA > scoreB
      ? { won: true, winnerId: "A", isA: true, isB: false }
      : { won: true, winnerId: "B", isA: false, isB: true };
  }
  return { won: false, winnerId: null, isA: false, isB: false };
}

export interface ScoreRoundInput {
  match: Match;
  pairing: BattlePairing;
  scoringPlayerId: string;
  finishType: FinishType;
}

export interface ScoreRoundResult {
  match: Match;
  round: RoundResult;
  battleEnded: boolean;
  needsReplayConfirm: boolean;
}

export function applyScoreRound(input: ScoreRoundInput): ScoreRoundResult {
  const { match, pairing, scoringPlayerId, finishType } = input;
  const rule = DEFAULT_SCORE_RULE;
  const isPreContact = finishType === "preContactStadiumOut";
  const opponentId =
    pairing.playerAId === scoringPlayerId
      ? pairing.playerBId
      : pairing.playerAId;
  const recipientId = isPreContact ? opponentId : scoringPlayerId;
  const points = getPointsForFinish(finishType, rule);

  const round: RoundResult = {
    id: generateId(),
    battlePairingId: pairing.id,
    winnerPlayerId: isPreContact ? null : scoringPlayerId,
    loserPlayerId: isPreContact ? null : opponentId,
    finishType,
    pointsAwarded: points,
    recipientPlayerId: recipientId,
    isReplay: isPreContact,
    createdAt: new Date().toISOString(),
  };

  let scoreA = pairing.scoreA;
  let scoreB = pairing.scoreB;
  if (recipientId === pairing.playerAId) scoreA += points;
  else scoreB += points;

  const winCheck = isBattleWon(scoreA, scoreB, match.scoreTarget);
  let winnerPlayerId: string | null = pairing.winnerPlayerId;
  let status = pairing.status;

  if (winCheck.won && winCheck.winnerId) {
    winnerPlayerId =
      winCheck.winnerId === "A" ? pairing.playerAId : pairing.playerBId;
    status = "completed";
  }

  const updatedPairing: BattlePairing = {
    ...pairing,
    scoreA,
    scoreB,
    winnerPlayerId,
    status,
  };

  const pairings = match.pairings.map((p) =>
    p.id === pairing.id ? updatedPairing : p
  );

  const updatedMatch: Match = {
    ...match,
    pairings,
    rounds: [...match.rounds, round],
    updatedAt: new Date().toISOString(),
  };

  return {
    match: updatedMatch,
    round,
    battleEnded: status === "completed",
    needsReplayConfirm: isPreContact,
  };
}

export function undoLastRound(match: Match, pairingId: string): Match | null {
  const pairingRounds = match.rounds.filter(
    (r) => r.battlePairingId === pairingId
  );
  if (pairingRounds.length === 0) return null;

  const lastRound = pairingRounds[pairingRounds.length - 1];
  const rounds = match.rounds.filter((r) => r.id !== lastRound.id);

  const pairing = match.pairings.find((p) => p.id === pairingId);
  if (!pairing) return null;

  let scoreA = pairing.scoreA;
  let scoreB = pairing.scoreB;
  if (lastRound.recipientPlayerId === pairing.playerAId) {
    scoreA = Math.max(0, scoreA - lastRound.pointsAwarded);
  } else {
    scoreB = Math.max(0, scoreB - lastRound.pointsAwarded);
  }

  const updatedPairing: BattlePairing = {
    ...pairing,
    scoreA,
    scoreB,
    winnerPlayerId: null,
    status: "inProgress",
  };

  return {
    ...match,
    pairings: match.pairings.map((p) =>
      p.id === pairingId ? updatedPairing : p
    ),
    rounds,
    updatedAt: new Date().toISOString(),
  };
}

export function endBattleManually(
  match: Match,
  pairing: BattlePairing
): Match {
  const winnerPlayerId =
    pairing.scoreA > pairing.scoreB
      ? pairing.playerAId
      : pairing.scoreB > pairing.scoreA
        ? pairing.playerBId
        : pairing.scoreA === pairing.scoreB
          ? null
          : pairing.scoreA >= pairing.scoreB
            ? pairing.playerAId
            : pairing.playerBId;

  const updatedPairing: BattlePairing = {
    ...pairing,
    winnerPlayerId,
    status: "completed",
  };

  return {
    ...match,
    pairings: match.pairings.map((p) =>
      p.id === pairing.id ? updatedPairing : p
    ),
    updatedAt: new Date().toISOString(),
  };
}

export function advanceToNextPairing(match: Match): Match {
  const active = match.pairings.find((p) => p.status === "inProgress");
  const currentIndex = active
    ? match.pairings.indexOf(active)
    : match.currentPairingIndex;

  const pairings = match.pairings.map((p, i) => {
    if (i === currentIndex && p.status === "inProgress") {
      return { ...p, status: "completed" as const };
    }
    if (
      match.matchType !== "roundRobin" &&
      i === currentIndex + 1
    ) {
      return { ...p, status: "inProgress" as const };
    }
    return p;
  });

  const allDone =
    match.matchType === "roundRobin"
      ? isRoundRobinScheduleComplete({ ...match, pairings })
      : pairings.every((p) => p.status === "completed");

  const nextIndex =
    match.matchType === "roundRobin" && !allDone
      ? pairings.length
      : Math.min(currentIndex + 1, Math.max(0, pairings.length - 1));

  let winnerPlayerId = match.winnerPlayerId;
  if (allDone && match.matchType === "roundRobin") {
    winnerPlayerId = computeRoundRobinWinner(match.players, pairings);
  } else if (allDone && match.matchType === "1v1") {
    const p = pairings[0];
    winnerPlayerId = p.winnerPlayerId;
  }

  return {
    ...match,
    pairings,
    currentPairingIndex: nextIndex,
    status: allDone ? "completed" : match.status,
    winnerPlayerId,
    updatedAt: new Date().toISOString(),
  };
}

export function computeRoundRobinWinner(
  players: { id: string; name: string }[],
  pairings: BattlePairing[]
): string | null {
  const totals = new Map<string, number>();
  for (const player of players) totals.set(player.id, 0);

  for (const p of pairings) {
    totals.set(p.playerAId, (totals.get(p.playerAId) ?? 0) + p.scoreA);
    totals.set(p.playerBId, (totals.get(p.playerBId) ?? 0) + p.scoreB);
  }

  let max = -1;
  let winnerId: string | null = null;
  for (const [id, score] of totals) {
    if (score > max) {
      max = score;
      winnerId = id;
    }
  }
  return winnerId;
}

export function getLeaderboard(
  players: { id: string; name: string }[],
  pairings: BattlePairing[]
): { playerId: string; name: string; total: number }[] {
  const totals = new Map<string, number>();
  for (const player of players) totals.set(player.id, 0);

  for (const p of pairings) {
    totals.set(p.playerAId, (totals.get(p.playerAId) ?? 0) + p.scoreA);
    totals.set(p.playerBId, (totals.get(p.playerBId) ?? 0) + p.scoreB);
  }

  return players
    .map((pl) => ({
      playerId: pl.id,
      name: pl.name,
      total: totals.get(pl.id) ?? 0,
    }))
    .sort((a, b) => b.total - a.total);
}
