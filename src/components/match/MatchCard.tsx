"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Match } from "@/types";
import { formatDisplayDate } from "@/lib/storage";
import {
  canJoinMatch,
  isJoinedMatch,
  minPlayersForMatch,
} from "@/lib/accounts";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function MatchCard({
  match,
  accountId,
  onJoin,
  canDelete,
  onDelete,
}: {
  match: Match;
  accountId?: string;
  onJoin?: (matchId: string) => void;
  canDelete?: boolean;
  onDelete?: (matchId: string) => boolean;
}) {
  const router = useRouter();
  const winner = match.players.find((p) => p.id === match.winnerPlayerId);
  const joined = accountId ? isJoinedMatch(match, accountId) : false;
  const joinable =
    accountId && onJoin ? canJoinMatch(match, accountId) : false;

  const statusLabel =
    match.status === "completed"
      ? "已結束"
      : match.status === "inProgress"
        ? "進行中"
        : match.status === "setup"
          ? "可加入"
          : "草稿";

  const playPath =
    match.matchType === "roundRobin"
      ? `/match/${match.id}/round-robin`
      : `/match/${match.id}/dashboard`;

  const href =
    match.status === "setup"
      ? joined
        ? `/match/${match.id}/setup`
        : undefined
      : joined || match.status === "completed"
        ? playPath
        : undefined;

  const minP = minPlayersForMatch(match);

  const content = (
    <Card className={`mb-3 ${href ? "hover:border-arena-neon/40 transition-colors" : ""}`}>
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
            <p className="text-xs text-gray-600 mt-1">
              {match.matchType === "1v1" ? "1v1" : "循環賽"} · 需要至少 {minP}{" "}
              人 · 已 {match.players.length} 人
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
            {joined ? "已加入" : statusLabel}
          </span>
          {canDelete && onDelete && (
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

      {joinable && onJoin && (
        <Button
          fullWidth
          className="mt-3"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onJoin(match.id);
            router.push(`/match/${match.id}/setup`);
          }}
        >
          加入比賽
        </Button>
      )}

      {joined && match.status === "setup" && (
        <Button
          variant="secondary"
          fullWidth
          className="mt-3"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            router.push(`/match/${match.id}/setup`);
          }}
        >
          填寫陀螺資料
        </Button>
      )}
    </Card>
  );

  if (href && !joinable) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
