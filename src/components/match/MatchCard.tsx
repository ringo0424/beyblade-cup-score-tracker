import Link from "next/link";
import type { Match } from "@/types";
import { formatDisplayDate } from "@/lib/storage";
import { Card } from "@/components/ui/Card";

export function MatchCard({ match }: { match: Match }) {
  const winner = match.players.find((p) => p.id === match.winnerPlayerId);
  const statusLabel =
    match.status === "completed"
      ? "已結束"
      : match.status === "inProgress"
        ? "進行中"
        : match.status === "setup"
          ? "設定中"
          : "草稿";

  const playPath =
    match.matchType === "roundRobin"
      ? `/match/${match.id}/round-robin`
      : `/match/${match.id}/dashboard`;

  const href =
    match.status === "setup"
      ? `/match/${match.id}/setup`
      : playPath;

  return (
    <Link href={href}>
      <Card className="hover:border-arena-neon/40 transition-colors mb-3">
        <div className="flex justify-between items-start gap-2">
          <div>
            <h3 className="font-bold text-arena-neon">{match.name}</h3>
            <p className="text-sm text-gray-400 mt-1">
              {formatDisplayDate(match.date)} · {match.time} · {match.location}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {match.players.map((p) => p.name).join(" vs ")}
            </p>
          </div>
          <span
            className={`text-xs px-2 py-1 rounded-full shrink-0 ${
              match.status === "completed"
                ? "bg-green-950 text-green-400"
                : match.status === "inProgress"
                  ? "bg-arena-neon/20 text-arena-neon"
                  : "bg-gray-800 text-gray-400"
            }`}
          >
            {statusLabel}
          </span>
        </div>
        {winner && (
          <p className="mt-2 text-sm text-arena-purple font-medium">
            冠軍：{winner.name}
          </p>
        )}
      </Card>
    </Link>
  );
}
