import { Card } from "@/components/ui/Card";

export function Leaderboard({
  entries,
  highlightId,
}: {
  entries: { playerId: string; name: string; total: number }[];
  highlightId?: string | null;
}) {
  return (
    <Card glow className="mb-4">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        總分排行榜
      </h3>
      <ol className="space-y-2">
        {entries.map((entry, i) => (
          <li
            key={entry.playerId}
            className={`flex items-center justify-between py-2 px-3 rounded-xl ${
              entry.playerId === highlightId
                ? "bg-arena-neon/15 border border-arena-neon/40"
                : "bg-arena-black/50"
            }`}
          >
            <span className="flex items-center gap-3">
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  i === 0
                    ? "bg-arena-purple/30 text-arena-purple"
                    : "bg-gray-800 text-gray-400"
                }`}
              >
                {i + 1}
              </span>
              <span className="font-medium">{entry.name}</span>
            </span>
            <span className="text-2xl font-bold text-arena-neon tabular-nums">
              {entry.total}
            </span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
