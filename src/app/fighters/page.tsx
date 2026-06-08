"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAppData } from "@/hooks/useAppData";
import { computeFighterStats } from "@/lib/fighters/stats";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CloudSyncBar } from "@/components/sync/CloudSyncBar";

export default function FightersPage() {
  const { data, hydrated, registeredFighters, registerFighterByName } =
    useAppData();
  const [newName, setNewName] = useState("");

  const statByName = useMemo(() => {
    const map = new Map<string, ReturnType<typeof computeFighterStats>[0]>();
    for (const row of computeFighterStats(data)) {
      map.set(row.nameKey, row);
    }
    return map;
  }, [data]);

  if (!hydrated) {
    return <p className="text-gray-500 text-center py-8">載入中…</p>;
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">選手</h2>
      <p className="text-sm text-gray-500 mb-4">
        點選手可查看戰績、零件庫與陀螺組合（全員可編輯）。
      </p>

      <CloudSyncBar />

      <Card className="mb-4">
        <label className="label-arena">新增選手</label>
        <div className="flex gap-2">
          <input
            className="input-arena flex-1"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="選手名稱"
            onKeyDown={(e) => {
              if (e.key === "Enter" && newName.trim()) {
                registerFighterByName(newName.trim());
                setNewName("");
              }
            }}
          />
          <Button
            type="button"
            onClick={() => {
              if (!newName.trim()) return;
              registerFighterByName(newName.trim());
              setNewName("");
            }}
          >
            新增
          </Button>
        </div>
      </Card>

      {registeredFighters.length === 0 ? (
        <Card>
          <p className="text-center text-gray-500 py-6 text-sm">
            尚無選手。請新增或於建立比賽時加入名稱。
          </p>
        </Card>
      ) : (
        registeredFighters.map((fighter) => {
          const stats = statByName.get(fighter.nameKey);
          const icon = stats?.icon ?? fighter.icon;

          return (
            <Link key={fighter.nameKey} href={`/fighters/${fighter.nameKey}`}>
              <Card className="mb-2 hover:border-arena-neon/40 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-2xl w-10 h-10 flex items-center justify-center shrink-0">
                    {icon || "🎮"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-arena-neon truncate">
                      {fighter.displayName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      冠軍 {stats?.championCount ?? 0} · 亞軍{" "}
                      {stats?.runnerUpCount ?? 0}
                      {(stats?.matchCount ?? 0) > 0
                        ? ` · 參賽 ${stats!.matchCount} 場`
                        : ""}
                    </p>
                  </div>
                  <span className="text-xs text-gray-600 shrink-0">詳情 →</span>
                </div>
              </Card>
            </Link>
          );
        })
      )}
    </div>
  );
}
