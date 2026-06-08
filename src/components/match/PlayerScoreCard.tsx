"use client";

import { useState } from "react";
import type { BeybladeSetup, FinishType, Player } from "@/types";
import { getOrderedBeyblades } from "@/lib/beyblade";
import { FINISH_LABELS } from "@/lib/constants";
import { Card } from "@/components/ui/Card";

const finishTypes: FinishType[] = [
  "spin",
  "burst",
  "over",
  "xtreme",
  "preContactStadiumOut",
];

export function PlayerScoreCard({
  player,
  label,
  score,
  setup,
  isWinner,
  side,
  onScore,
  disabled,
}: {
  player: Player;
  label?: string;
  score: number;
  setup?: BeybladeSetup;
  isWinner?: boolean;
  side: "A" | "B";
  onScore?: (finishType: FinishType) => void;
  disabled?: boolean;
}) {
  const [showFinishes, setShowFinishes] = useState(false);
  const ordered = setup ? getOrderedBeyblades(setup) : [];
  const interactive = Boolean(onScore) && !disabled;

  const handleCardClick = () => {
    if (!interactive) return;
    setShowFinishes((v) => !v);
  };

  const handleFinish = (finishType: FinishType) => {
    onScore?.(finishType);
    setShowFinishes(false);
  };

  return (
    <Card
      className={`flex-1 ${isWinner ? "border-arena-neon shadow-neon" : ""} ${
        interactive ? "cursor-pointer active:scale-[0.99] transition-transform" : ""
      } ${showFinishes ? "ring-2 ring-arena-neon/60" : ""}`}
      glow={isWinner}
      onClick={handleCardClick}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-gray-500">選手 {side}</span>
        {isWinner && (
          <span className="text-xs text-arena-neon font-bold">領先</span>
        )}
      </div>
      <h3 className="font-bold text-lg truncate">{label ?? player.name}</h3>
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
      {interactive && !showFinishes && (
        <p className="text-xs text-gray-600 mt-3 text-center">點擊計分</p>
      )}
      {showFinishes && onScore && (
        <div
          className="mt-3 grid gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {finishTypes.map((type) => (
            <button
              key={type}
              type="button"
              className="btn-score-spin text-xs py-2"
              onClick={() => handleFinish(type)}
            >
              {FINISH_LABELS[type]}
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
