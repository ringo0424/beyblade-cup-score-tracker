"use client";

import Link from "next/link";
import type { Match } from "@/types";
import { formatDisplayDate } from "@/lib/storage";
import { minPlayersForMatch } from "@/lib/accounts";
import { hasCelebrationPhotos } from "@/lib/matchPhotos";
import { MatchCelebrationBackground } from "@/components/match/MatchCelebrationBackground";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function MatchCard({
  match,
  onDelete,
}: {
  match: Match;
  onDelete?: (matchId: string) => void;
}) {
  const winner = match.players.find((p) => p.id === match.winnerPlayerId);

  const statusLabel =
    match.status === "completed"
      ? "已結束"
      : match.status === "inProgress"
        ? "進行中"
        : match.status === "setup"
          ? "籌備中"
          : "草稿";

  const playPath =
    match.matchType === "roundRobin"
      ? `/match/${match.id}/round-robin`
      : `/match/${match.id}/dashboard`;

  const href =
    match.status === "setup"
      ? `/match/${match.id}/setup`
      : match.status === "inProgress" || match.status === "completed"
        ? playPath
        : undefined;

  const minP = minPlayersForMatch(match);
  const withBg = hasCelebrationPhotos(match.celebrationPhotos);

  const inner = (
    <>
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-arena-neon">{match.name}</h3>
          <p className="text-sm text-gray-400 mt-1">
            {formatDisplayDate(match.date)} · {match.time} · {match.location}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {match.players.length > 0
              ? match.players.map((p) => p.name).join(" · ")
              : "尚無選手"}
          </p>
          {match.status === "setup" && (
            <p className="text-xs text-arena-neon/80 mt-1">
              {match.matchType === "1v1" ? "1v1" : "循環賽"} · 已{" "}
              {match.players.length} 人
              {match.players.length < minP
                ? `（尚缺 ${minP - match.players.length} 人）`
                : "（可開始）"}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              match.status === "completed"
                ? "bg-green-950 text-green-400"
                : match.status === "inProgress"
                  ? "bg-arena-neon/20 text-arena-neon"
                  : "bg-gray-800 text-gray-400"
            }`}
          >
            {statusLabel}
          </span>
          {onDelete && (
            <button
              type="button"
              className="text-xs text-red-400"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (
                  confirm(`確定刪除比賽「${match.name}」？此動作無法復原。`)
                ) {
                  onDelete(match.id);
                }
              }}
            >
              刪除
            </button>
          )}
        </div>
      </div>

      {winner && (
        <p className="mt-2 text-sm text-arena-purple font-medium">
          冠軍：{winner.name}
        </p>
      )}

      {match.status === "setup" && (
        <p className="text-xs text-arena-neon/80 mt-3">點擊進入設定選手與陀螺</p>
      )}
    </>
  );

  const content = (
    <Card
      className={`mb-3 overflow-hidden p-0 ${href ? "hover:border-arena-neon/40 transition-colors" : ""}`}
    >
      <MatchCelebrationBackground
        photos={withBg ? match.celebrationPhotos : undefined}
        className="p-4"
        overlayClassName="bg-arena-black/70"
      >
        {inner}
      </MatchCelebrationBackground>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
