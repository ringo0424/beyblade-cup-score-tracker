import type { BeybladeSetup, Player } from "@/types";
import { getOrderedBeyblades } from "@/lib/beyblade";
import { Card } from "@/components/ui/Card";

export function PlayerScoreCard({
  player,
  score,
  setup,
  isWinner,
  side,
}: {
  player: Player;
  score: number;
  setup?: BeybladeSetup;
  isWinner?: boolean;
  side: "A" | "B";
}) {
  const ordered = setup ? getOrderedBeyblades(setup) : [];

  return (
    <Card
      className={`flex-1 ${isWinner ? "border-arena-neon shadow-neon" : ""}`}
      glow={isWinner}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-gray-500">選手 {side}</span>
        {isWinner && (
          <span className="text-xs text-arena-neon font-bold">領先</span>
        )}
      </div>
      <h3 className="font-bold text-lg truncate">{player.name}</h3>
      <p className="text-4xl font-black text-arena-neon tabular-nums mt-2">
        {score}
      </p>
      {ordered.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-gray-500">
          {ordered.map((b, i) => (
            <li key={b.id}>
              {i + 1}. {b.nickname || "未命名"}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
