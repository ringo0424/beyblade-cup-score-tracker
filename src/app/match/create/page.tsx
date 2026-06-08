"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "@/hooks/useAppData";
import {
  DEFAULT_LOCATION,
  SCORE_TARGET_OPTIONS,
  TIME_SHORTCUTS,
} from "@/lib/constants";
import { generateId } from "@/lib/id";
import { generateMatchName } from "@/lib/matchName";
import { getTodayDateString } from "@/lib/storage";
import type { Match, MatchType, ScoreTarget } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function CreateMatchPage() {
  const router = useRouter();
  const { data, saveMatch } = useAppData();

  const [date, setDate] = useState(getTodayDateString());
  const [time, setTime] = useState("4:00 PM");
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [scoreTarget, setScoreTarget] = useState<ScoreTarget>(4);
  const [matchType, setMatchType] = useState<MatchType>("1v1");

  const autoName = useMemo(
    () => generateMatchName(time, location, data.matches),
    [time, location, data.matches]
  );

  const canSubmit = Boolean(time.trim() && location.trim());

  const handleSubmit = () => {
    const match: Match = {
      id: generateId(),
      eventDayId: generateId(),
      name: autoName,
      date,
      time,
      location,
      scoreTarget,
      matchType,
      players: [],
      beybladeSetups: [],
      pairings: [],
      rounds: [],
      status: "setup",
      currentPairingIndex: 0,
      winnerPlayerId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveMatch(match);
    router.push(`/match/${match.id}/setup`);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">建立新比賽</h2>
      <p className="text-sm text-gray-500 mb-4">
        建立後在下一頁新增選手名稱，並為每人填寫 3 組陀螺。
      </p>

      <Card className="mb-4">
        <label className="label-arena">日期</label>
        <input
          type="date"
          className="input-arena mb-4"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <label className="label-arena">時間快捷</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {TIME_SHORTCUTS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTime(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                time === t
                  ? "border-arena-neon bg-arena-neon/15 text-arena-neon"
                  : "border-arena-border bg-arena-black text-gray-400"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <label className="label-arena">自訂時間</label>
        <input
          className="input-arena mb-4"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          placeholder="例：4:00 PM"
        />

        <label className="label-arena">地點</label>
        <input
          className="input-arena mb-4"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />

        <label className="label-arena">比賽名稱（自動）</label>
        <p className="text-arena-neon font-bold text-lg">{autoName}</p>
      </Card>

      <Card className="mb-4">
        <label className="label-arena">計分模式</label>
        <div className="grid grid-cols-2 gap-2">
          {SCORE_TARGET_OPTIONS.map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => setScoreTarget(opt.value)}
              className={`py-3 px-2 rounded-xl text-sm border ${
                scoreTarget === opt.value
                  ? "border-arena-purple bg-arena-purple/15 text-arena-purple"
                  : "border-arena-border text-gray-400"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="mb-6">
        <label className="label-arena">比賽類型</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMatchType("1v1")}
            className={`py-3 rounded-xl border ${
              matchType === "1v1"
                ? "border-arena-neon bg-arena-neon/15 text-arena-neon"
                : "border-arena-border text-gray-400"
            }`}
          >
            1v1
          </button>
          <button
            type="button"
            onClick={() => setMatchType("roundRobin")}
            className={`py-3 rounded-xl border ${
              matchType === "roundRobin"
                ? "border-arena-neon bg-arena-neon/15 text-arena-neon"
                : "border-arena-border text-gray-400"
            }`}
          >
            多人循環賽
          </button>
        </div>
        {matchType === "roundRobin" && (
          <p className="text-xs text-gray-500 mt-2">
            至少 3 人後可開始；每人 3 組陀螺。
          </p>
        )}
        {matchType === "1v1" && (
          <p className="text-xs text-gray-500 mt-2">需 2 人後可開始。</p>
        )}
      </Card>

      <Button fullWidth disabled={!canSubmit} onClick={handleSubmit}>
        建立並設定選手
      </Button>
    </div>
  );
}
