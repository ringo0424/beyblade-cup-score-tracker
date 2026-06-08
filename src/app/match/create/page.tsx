"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "@/hooks/useAppData";
import { normalizePlayerName } from "@/lib/accounts";
import { createDefaultSetup } from "@/lib/beyblade";
import {
  DEFAULT_LOCATION,
  SCORE_TARGET_OPTIONS,
  TIME_SHORTCUTS,
} from "@/lib/constants";
import { generateId } from "@/lib/id";
import { generateMatchName } from "@/lib/matchName";
import { getTodayDateString } from "@/lib/storage";
import type { Match, MatchType, Player, ScoreTarget } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

function parsePlayerNames(raw: string): string[] {
  const names = raw
    .split(/[,，\n]/)
    .map((s) => normalizePlayerName(s))
    .filter(Boolean);
  return [...new Set(names.map((n) => n.toLowerCase()))].map((lower) =>
    names.find((n) => n.toLowerCase() === lower)!
  );
}

export default function CreateMatchPage() {
  const router = useRouter();
  const { data, saveMatch, registerFighterByName, fighterNames } = useAppData();

  const [date, setDate] = useState(getTodayDateString());
  const [time, setTime] = useState("4:00 PM");
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [scoreTarget, setScoreTarget] = useState<ScoreTarget>(4);
  const [matchType, setMatchType] = useState<MatchType>("1v1");
  const [playerInput, setPlayerInput] = useState("");
  const [selectedNames, setSelectedNames] = useState<string[]>([]);

  const autoName = useMemo(
    () => generateMatchName(time, location, data.matches),
    [time, location, data.matches]
  );

  const canSubmit = Boolean(time.trim() && location.trim());

  const addName = (name: string) => {
    const n = normalizePlayerName(name);
    if (!n || selectedNames.some((x) => x.toLowerCase() === n.toLowerCase())) {
      return;
    }
    setSelectedNames((prev) => [...prev, n]);
    setPlayerInput("");
  };

  const handleSubmit = () => {
    const fromInput = parsePlayerNames(playerInput);
    const allNames = [
      ...selectedNames,
      ...fromInput.filter(
        (n) => !selectedNames.some((s) => s.toLowerCase() === n.toLowerCase())
      ),
    ];

    const players: Player[] = allNames.map((name) => ({
      id: generateId(),
      name,
    }));
    const beybladeSetups = players.map((p) => createDefaultSetup(p.id));

    const match: Match = {
      id: generateId(),
      eventDayId: generateId(),
      name: autoName,
      date,
      time,
      location,
      scoreTarget,
      matchType,
      players,
      beybladeSetups,
      pairings: [],
      rounds: [],
      status: "setup",
      currentPairingIndex: 0,
      winnerPlayerId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveMatch(match);
    for (const name of allNames) registerFighterByName(name);
    router.push(`/match/${match.id}/setup`);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">建立新比賽</h2>
      <p className="text-sm text-gray-500 mb-4">
        可直接加入選手名稱，建立後為每人填寫陀螺；循環賽開始後可自選每場對戰組合。
      </p>

      <Card className="mb-4">
        <label className="label-arena">選手（可選，逗號或換行分隔）</label>
        <textarea
          className="input-arena min-h-[72px] mb-2"
          value={playerInput}
          onChange={(e) => setPlayerInput(e.target.value)}
          placeholder="例：小明, 小華, 阿強"
        />
        <div className="flex flex-wrap gap-2 mb-2">
          {fighterNames.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => addName(name)}
              className="text-xs px-2.5 py-1 rounded-full border border-arena-border text-gray-400 hover:border-arena-neon hover:text-arena-neon"
            >
              ＋ {name}
            </button>
          ))}
        </div>
        {selectedNames.length > 0 && (
          <p className="text-xs text-arena-neon">
            已選：{selectedNames.join(" · ")}
          </p>
        )}
      </Card>

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
            至少 3 人；每場對戰由你現場選擇（如 A vs C → B vs C → A vs B）。
          </p>
        )}
      </Card>

      <Button fullWidth disabled={!canSubmit} onClick={handleSubmit}>
        建立並設定陀螺
      </Button>
    </div>
  );
}
