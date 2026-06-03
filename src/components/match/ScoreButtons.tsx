import type { FinishType } from "@/types";
import { FINISH_LABELS } from "@/lib/constants";

const finishConfig: {
  type: FinishType;
  className: string;
}[] = [
  { type: "spin", className: "btn-score-spin" },
  { type: "burst", className: "btn-score-burst" },
  { type: "over", className: "btn-score-over" },
  { type: "xtreme", className: "btn-score-xtreme" },
  { type: "preContactStadiumOut", className: "btn-score-out" },
];

export function ScoreButtons({
  onScore,
  playerAName,
  playerBName,
  disabled,
}: {
  onScore: (scoringPlayerId: "A" | "B", finishType: FinishType) => void;
  playerAName: string;
  playerBName: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-4">
      {(["A", "B"] as const).map((side) => {
        const name = side === "A" ? playerAName : playerBName;
        return (
          <div key={side}>
            <p className="text-sm font-semibold text-arena-purple mb-2">
              {name} 得分
            </p>
            <div className="grid gap-2">
              {finishConfig.map(({ type, className }) => (
                <button
                  key={`${side}-${type}`}
                  type="button"
                  disabled={disabled}
                  className={className}
                  onClick={() => onScore(side, type)}
                >
                  {FINISH_LABELS[type]}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
