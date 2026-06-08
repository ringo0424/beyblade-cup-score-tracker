"use client";

import { useState } from "react";
import type { Match } from "@/types";
import { getRemainingPairOptions } from "@/lib/pairings";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function PairingPicker({
  match,
  onConfirm,
}: {
  match: Match;
  onConfirm: (playerAId: string, playerBId: string) => void;
}) {
  const options = getRemainingPairOptions(match);
  const [playerAId, setPlayerAId] = useState("");
  const [playerBId, setPlayerBId] = useState("");

  const nameOf = (id: string) =>
    match.players.find((p) => p.id === id)?.name ?? "?";

  const canConfirm =
    playerAId && playerBId && playerAId !== playerBId &&
    options.some(
      ([a, b]) =>
        (a === playerAId && b === playerBId) ||
        (a === playerBId && b === playerAId)
    );

  return (
    <Card className="mb-4 border-arena-neon/30">
      <h3 className="font-bold text-arena-neon mb-2">選擇本場對戰</h3>
      <p className="text-xs text-gray-500 mb-4">
        尚餘 {options.length} 組未打。請選兩位選手進行本場對戰。
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="label-arena">選手 A</label>
          <select
            className="input-arena"
            value={playerAId}
            onChange={(e) => setPlayerAId(e.target.value)}
          >
            <option value="">— 選擇 —</option>
            {match.players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label-arena">選手 B</label>
          <select
            className="input-arena"
            value={playerBId}
            onChange={(e) => setPlayerBId(e.target.value)}
          >
            <option value="">— 選擇 —</option>
            {match.players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {playerAId && playerBId && playerAId !== playerBId && (
        <p className="text-sm text-center text-arena-purple mb-3">
          {nameOf(playerAId)} vs {nameOf(playerBId)}
        </p>
      )}

      <Button
        fullWidth
        disabled={!canConfirm}
        onClick={() => onConfirm(playerAId, playerBId)}
      >
        開始這場對戰
      </Button>
    </Card>
  );
}
