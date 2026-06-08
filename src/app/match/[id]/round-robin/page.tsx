"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppData } from "@/hooks/useAppData";
import { resolveMatch } from "@/lib/storage";
import {
  addChosenPairing,
  getActivePairing,
  getRemainingPairOptions,
  needsPairingPick,
} from "@/lib/pairings";
import { applyCelebrationPhotos } from "@/lib/matchPhotos";
import {
  applyScoreRound,
  undoLastRound,
  endBattleManually,
  advanceToNextPairing,
  getLeaderboard,
} from "@/lib/scoring";
import type { FinishType, Match } from "@/types";
import { PlayerScoreCard } from "@/components/match/PlayerScoreCard";
import { Leaderboard } from "@/components/match/Leaderboard";
import { MatchEndScreen } from "@/components/match/MatchEndScreen";
import { PairingPicker } from "@/components/match/PairingPicker";
import { ReplayConfirmModal } from "@/components/match/ReplayConfirmModal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function RoundRobinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data, saveMatch, hydrated, toxicQuotesEnabled } = useAppData();
  const [match, setMatch] = useState<Match | null>(null);
  const [showReplay, setShowReplay] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    const m = resolveMatch(data, id);
    if (!m) {
      router.replace("/");
      return;
    }
    if (m.matchType !== "roundRobin") {
      router.replace(`/match/${id}/dashboard`);
      return;
    }
    setMatch(m);
  }, [data, id, hydrated, router]);

  if (!match) {
    return <p className="text-gray-500 text-center py-8">載入中…</p>;
  }

  const pairing = getActivePairing(match);
  const leaderboard = getLeaderboard(match.players, match.pairings);
  const completedCount = match.pairings.filter(
    (p) => p.status === "completed"
  ).length;
  const allDone = match.status === "completed";
  const pickNext = needsPairingPick(match);
  const remainingCount = getRemainingPairOptions(match).length;

  const persist = (updated: Match) => {
    setMatch(updated);
    saveMatch(updated);
  };

  if (allDone) {
    return (
      <MatchEndScreen
        match={match}
        data={data}
        toxicQuotesEnabled={toxicQuotesEnabled}
        onPhotosChange={(photos) => persist(applyCelebrationPhotos(match, photos))}
        onHome={() => router.push("/")}
      >
        <h3 className="text-sm font-semibold text-gray-500 mb-2 mt-4">
          對戰組合
        </h3>
        {match.pairings.map((p) => {
          const a = match.players.find((x) => x.id === p.playerAId)!;
          const b = match.players.find((x) => x.id === p.playerBId)!;
          return (
            <Card key={p.id} className="mb-2 text-sm">
              {a.name} vs {b.name} — {p.scoreA}:{p.scoreB}
            </Card>
          );
        })}
      </MatchEndScreen>
    );
  }

  if (pickNext) {
    return (
      <div>
        <h2 className="text-lg font-bold text-arena-neon mb-2">{match.name}</h2>
        <p className="text-xs text-gray-500 mb-4">
          循環賽 · 已完成 {completedCount} 場 · 尚餘 {remainingCount} 組
        </p>
        <Leaderboard entries={leaderboard} />
        <PairingPicker
          match={match}
          onConfirm={(a, b) => persist(addChosenPairing(match, a, b))}
        />
        <Link href="/" className="block text-center text-sm text-gray-500 mt-4">
          返回首頁
        </Link>
      </div>
    );
  }

  if (!pairing && !allDone) return null;

  const playerA = match.players.find((p) => p.id === pairing!.playerAId)!;
  const playerB = match.players.find((p) => p.id === pairing!.playerBId)!;
  const setupA = match.beybladeSetups.find((s) => s.playerId === playerA.id);
  const setupB = match.beybladeSetups.find((s) => s.playerId === playerB.id);
  const battleDone = pairing!.status === "completed";
  const unlimited = match.scoreTarget === "unlimited";

  const handleScore = (side: "A" | "B", finishType: FinishType) => {
    if (battleDone) return;
    const scoringPlayerId = side === "A" ? playerA.id : playerB.id;
    const result = applyScoreRound({
      match,
      pairing: pairing!,
      scoringPlayerId,
      finishType,
    });
    let updated = result.match;
    if (result.battleEnded) {
      updated = advanceToNextPairing(updated);
    }
    persist(updated);
    if (result.needsReplayConfirm) setShowReplay(true);
    if (updated.status === "completed") return;
  };

  const handleUndo = () => {
    const updated = undoLastRound(match, pairing!.id);
    if (updated) persist(updated);
  };

  const handleEndBattle = () => {
    let updated = endBattleManually(match, pairing!);
    updated = advanceToNextPairing(updated);
    persist(updated);
  };

  const targetLabel =
    match.scoreTarget === "unlimited"
      ? "無上限"
      : `先達 ${match.scoreTarget} 分`;

  return (
    <div>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h2 className="text-lg font-bold text-arena-neon">{match.name}</h2>
          <p className="text-xs text-gray-500">
            循環賽 · {targetLabel} · {completedCount}/{match.pairings.length}{" "}
            場完成
          </p>
        </div>
        <Link href="/" className="text-sm text-gray-500">
          首頁
        </Link>
      </div>

      <Leaderboard entries={leaderboard} />

      <Card className="mb-3">
        <p className="text-xs text-gray-500">當前組合 (#{match.currentPairingIndex + 1})</p>
        <p className="text-lg font-bold">
          {playerA.name}{" "}
          <span className="text-arena-purple">vs</span> {playerB.name}
        </p>
      </Card>

      <div className="flex gap-3 mb-4">
        <PlayerScoreCard
          side="A"
          player={playerA}
          score={pairing!.scoreA}
          setup={setupA}
          isWinner={battleDone && pairing!.winnerPlayerId === playerA.id}
          disabled={battleDone}
          onScore={(finishType) => handleScore("A", finishType)}
        />
        <PlayerScoreCard
          side="B"
          player={playerB}
          score={pairing!.scoreB}
          setup={setupB}
          isWinner={battleDone && pairing!.winnerPlayerId === playerB.id}
          disabled={battleDone}
          onScore={(finishType) => handleScore("B", finishType)}
        />
      </div>

      {battleDone ? (
        <Card className="mb-4 text-center py-4">
          <p className="text-arena-neon font-medium">本組合已結束</p>
          <Button fullWidth className="mt-3" onClick={handleEndBattle}>
            {remainingCount > 0 ? "選擇下一場對戰" : "完成比賽"}
          </Button>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <Button variant="secondary" onClick={handleUndo}>
              復原
            </Button>
            {unlimited && (
              <Button variant="secondary" onClick={handleEndBattle}>
                結束本組合
              </Button>
            )}
          </div>
        </>
      )}

      <details className="mt-4">
        <summary className="text-sm text-gray-500 cursor-pointer">
          全部組合 ({match.pairings.length})
        </summary>
        <ul className="mt-2 space-y-1 text-sm">
          {match.pairings.map((p, i) => {
            const a = match.players.find((x) => x.id === p.playerAId)!;
            const b = match.players.find((x) => x.id === p.playerBId)!;
            return (
              <li
                key={p.id}
                className={`py-2 px-3 rounded-lg ${
                  i === match.currentPairingIndex
                    ? "bg-arena-neon/10 border border-arena-neon/30"
                    : "bg-arena-card"
                }`}
              >
                {a.name} vs {b.name} — {p.scoreA}:{p.scoreB}{" "}
                <span className="text-gray-600">({p.status})</span>
              </li>
            );
          })}
        </ul>
      </details>

      <ReplayConfirmModal
        open={showReplay}
        onConfirm={() => setShowReplay(false)}
        onDismiss={() => setShowReplay(false)}
      />
    </div>
  );
}
