"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppData } from "@/hooks/useAppData";
import { getMatch } from "@/lib/storage";
import {
  applyScoreRound,
  undoLastRound,
  endBattleManually,
  advanceToNextPairing,
  getTargetScore,
} from "@/lib/scoring";
import type { FinishType, Match } from "@/types";
import { PlayerScoreCard } from "@/components/match/PlayerScoreCard";
import { ScoreButtons } from "@/components/match/ScoreButtons";
import { ReplayConfirmModal } from "@/components/match/ReplayConfirmModal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function DashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data, saveMatch, hydrated } = useAppData();
  const [match, setMatch] = useState<Match | null>(null);
  const [showReplay, setShowReplay] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    const m = getMatch(data, id);
    if (!m) {
      router.replace("/");
      return;
    }
    if (m.matchType === "roundRobin") {
      router.replace(`/match/${id}/round-robin`);
      return;
    }
    setMatch(m);
  }, [data, id, hydrated, router]);

  if (!match) {
    return <p className="text-gray-500 text-center py-8">載入中…</p>;
  }

  const pairing = match.pairings[match.currentPairingIndex];
  if (!pairing) return null;

  const playerA = match.players.find((p) => p.id === pairing.playerAId)!;
  const playerB = match.players.find((p) => p.id === pairing.playerBId)!;
  const setupA = match.beybladeSetups.find((s) => s.playerId === playerA.id);
  const setupB = match.beybladeSetups.find((s) => s.playerId === playerB.id);
  const battleDone = pairing.status === "completed";
  const unlimited = match.scoreTarget === "unlimited";
  const target = getTargetScore(match.scoreTarget);

  const persist = (updated: Match) => {
    setMatch(updated);
    saveMatch(updated);
  };

  const handleScore = (side: "A" | "B", finishType: FinishType) => {
    if (battleDone) return;
    const scoringPlayerId = side === "A" ? playerA.id : playerB.id;
    const result = applyScoreRound({
      match,
      pairing,
      scoringPlayerId,
      finishType,
    });
    let updated = result.match;
    if (result.battleEnded && match.matchType === "1v1") {
      updated = {
        ...updated,
        status: "completed",
        winnerPlayerId: updated.pairings[0].winnerPlayerId,
      };
    }
    persist(updated);
    if (result.needsReplayConfirm) setShowReplay(true);
  };

  const handleUndo = () => {
    const updated = undoLastRound(match, pairing.id);
    if (updated) persist(updated);
  };

  const handleEndBattle = () => {
    let updated = endBattleManually(match, pairing);
    updated = {
      ...advanceToNextPairing(updated),
      status: "completed",
      winnerPlayerId: updated.pairings[0].winnerPlayerId,
    };
    persist(updated);
  };

  const handleEndMatch = () => {
    const winnerId =
      pairing.scoreA > pairing.scoreB
        ? pairing.playerAId
        : pairing.scoreB > pairing.scoreA
          ? pairing.playerBId
          : null;
    const updated: Match = {
      ...match,
      status: "completed",
      winnerPlayerId: winnerId,
      pairings: match.pairings.map((p) => ({
        ...p,
        status: "completed" as const,
        winnerPlayerId: winnerId,
      })),
      updatedAt: new Date().toISOString(),
    };
    persist(updated);
    router.push("/");
  };

  const targetLabel =
    match.scoreTarget === "unlimited"
      ? "無上限"
      : `先達 ${match.scoreTarget} 分`;

  return (
    <div>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-bold text-arena-neon">{match.name}</h2>
          <p className="text-sm text-gray-500">{targetLabel} · 1v1</p>
        </div>
        <Link href="/" className="text-sm text-gray-500">
          首頁
        </Link>
      </div>

      <Card className="mb-4 text-center">
        <p className="text-xs text-gray-500 uppercase">當前對戰</p>
        <p className="text-lg font-bold mt-1">
          {playerA.name}{" "}
          <span className="text-arena-purple">vs</span> {playerB.name}
        </p>
        {target !== null && (
          <p className="text-xs text-gray-600 mt-1">目標 {target} 分</p>
        )}
      </Card>

      <div className="flex gap-3 mb-4">
        <PlayerScoreCard
          side="A"
          player={playerA}
          score={pairing.scoreA}
          setup={setupA}
          isWinner={battleDone && pairing.winnerPlayerId === playerA.id}
        />
        <PlayerScoreCard
          side="B"
          player={playerB}
          score={pairing.scoreB}
          setup={setupB}
          isWinner={battleDone && pairing.winnerPlayerId === playerB.id}
        />
      </div>

      {battleDone || match.status === "completed" ? (
        <Card glow className="mb-4 text-center py-6">
          <p className="text-arena-neon font-bold text-lg">比賽已結束</p>
          {pairing.winnerPlayerId && (
            <p className="mt-2 text-arena-purple">
              勝者：
              {
                match.players.find((p) => p.id === pairing.winnerPlayerId)
                  ?.name
              }
            </p>
          )}
          <Button fullWidth className="mt-4" onClick={() => router.push("/")}>
            返回首頁
          </Button>
        </Card>
      ) : (
        <>
          <ScoreButtons
            playerAName={playerA.name}
            playerBName={playerB.name}
            onScore={handleScore}
          />

          <div className="grid grid-cols-2 gap-2 mt-4">
            <Button variant="secondary" onClick={handleUndo}>
              復原上一回合
            </Button>
            {unlimited && (
              <Button variant="secondary" onClick={handleEndBattle}>
                結束對戰
              </Button>
            )}
          </div>
        </>
      )}

      {!battleDone && match.status !== "completed" && (
        <Button
          variant="danger"
          fullWidth
          className="mt-3"
          onClick={handleEndMatch}
        >
          強制結束比賽
        </Button>
      )}

      <ReplayConfirmModal
        open={showReplay}
        onConfirm={() => setShowReplay(false)}
        onDismiss={() => setShowReplay(false)}
      />
    </div>
  );
}
