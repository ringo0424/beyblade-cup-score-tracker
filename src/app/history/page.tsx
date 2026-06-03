"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAppData } from "@/hooks/useAppData";
import { formatDisplayDate } from "@/lib/storage";
import type { Match } from "@/types";
import { Card } from "@/components/ui/Card";

export default function HistoryPage() {
  const { data, hydrated, isAdmin, removeMatchById } = useAppData();
  const [filterDate, setFilterDate] = useState("");

  const sorted = useMemo(() => {
    return [...data.matches].sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt)
    );
  }, [data.matches]);

  const filtered = filterDate
    ? sorted.filter((m) => m.date === filterDate)
    : sorted;

  const dates = useMemo(() => {
    const set = new Set(data.matches.map((m) => m.date));
    return Array.from(set).sort().reverse();
  }, [data.matches]);

  if (!hydrated) {
    return <p className="text-gray-500 text-center py-8">載入中…</p>;
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">比賽紀錄</h2>
      {isAdmin && (
        <p className="text-xs text-arena-purple mb-4">
          管理員可刪除比賽紀錄
        </p>
      )}

      {dates.length > 0 && (
        <div className="flex gap-2 overflow-x-auto mb-4 pb-1">
          <button
            type="button"
            onClick={() => setFilterDate("")}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm border ${
              !filterDate
                ? "border-arena-neon text-arena-neon"
                : "border-arena-border text-gray-500"
            }`}
          >
            全部
          </button>
          {dates.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setFilterDate(d)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm border ${
                filterDate === d
                  ? "border-arena-neon text-arena-neon"
                  : "border-arena-border text-gray-500"
              }`}
            >
              {formatDisplayDate(d)}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <Card>
          <p className="text-center text-gray-500 py-6">尚無紀錄</p>
        </Card>
      ) : (
        filtered.map((m) => (
          <HistoryRow
            key={m.id}
            match={m}
            canDelete={isAdmin}
            onDelete={removeMatchById}
          />
        ))
      )}
    </div>
  );
}

function HistoryRow({
  match,
  canDelete,
  onDelete,
}: {
  match: Match;
  canDelete?: boolean;
  onDelete?: (matchId: string) => boolean;
}) {
  const winner = match.players.find((p) => p.id === match.winnerPlayerId);
  const typeLabel = match.matchType === "1v1" ? "1v1" : "循環賽";

  const href =
    match.status === "setup"
      ? `/match/${match.id}/setup`
      : match.matchType === "roundRobin"
        ? `/match/${match.id}/round-robin`
        : `/match/${match.id}/dashboard`;

  const handleDelete = () => {
    if (!onDelete) return;
    if (!confirm(`確定刪除比賽「${match.name}」？此動作無法復原。`)) return;
    onDelete(match.id);
  };

  return (
    <Card className="mb-3 hover:border-arena-purple/40 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <Link href={href} className="min-w-0 flex-1">
          <h3 className="font-bold text-arena-neon">{match.name}</h3>
          <p className="text-sm text-gray-400 mt-1">
            {formatDisplayDate(match.date)} · {match.time} · {match.location}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {typeLabel} · {match.players.map((p) => p.name).join(", ")}
          </p>
          {winner && (
            <p className="text-sm text-arena-purple mt-2 font-medium">
              冠軍：{winner.name}
            </p>
          )}
        </Link>
        {canDelete && onDelete && (
          <button
            type="button"
            className="text-sm text-red-400 shrink-0 px-2 py-1"
            onClick={handleDelete}
          >
            刪除
          </button>
        )}
      </div>
    </Card>
  );
}
