"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAppData } from "@/hooks/useAppData";
import { FighterAvatar } from "@/components/fighters/FighterAvatar";
import { FighterName } from "@/components/fighters/FighterName";
import { formatFighterProfile } from "@/lib/fighters/label";
import { computeFighterStats } from "@/lib/fighters/stats";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CloudSyncBar } from "@/components/sync/CloudSyncBar";

export default function FightersPage() {
  const {
    data,
    hydrated,
    registeredFighters,
    registerFighterByName,
    adminLoggedIn,
    deleteFighterByNameKey,
    getLibraryForFighter,
  } = useAppData();
  const [newName, setNewName] = useState("");
  const [newTitle, setNewTitle] = useState("");

  const statByName = useMemo(() => {
    const map = new Map<string, ReturnType<typeof computeFighterStats>[0]>();
    for (const row of computeFighterStats(data)) {
      map.set(row.nameKey, row);
    }
    return map;
  }, [data]);

  const addFighter = () => {
    if (!newName.trim()) return;
    registerFighterByName(newName.trim(), newTitle.trim() || undefined);
    setNewName("");
    setNewTitle("");
  };

  if (!hydrated) {
    return <p className="text-gray-500 text-center py-8">載入中…</p>;
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">選手</h2>
      <p className="text-sm text-gray-500 mb-4">
        選手名＋稱號；陀螺庫請至底部「陀螺庫」分頁選選手編輯。
      </p>

      <CloudSyncBar />

      <Card className="mb-4">
        <label className="label-arena">新增選手</label>
        <input
          className="input-arena mb-2"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="選手名"
          onKeyDown={(e) => e.key === "Enter" && addFighter()}
        />
        <input
          className="input-arena mb-2"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="稱號（選填）"
          onKeyDown={(e) => e.key === "Enter" && addFighter()}
        />
        <Button type="button" fullWidth onClick={addFighter} disabled={!newName.trim()}>
          新增
        </Button>
      </Card>

      {registeredFighters.length === 0 ? (
        <Card>
          <p className="text-center text-gray-500 py-6 text-sm">
            尚無選手。請新增或於比賽設定頁加入。
          </p>
        </Card>
      ) : (
        registeredFighters.map((fighter) => {
          const stats = statByName.get(fighter.nameKey);
          const icon = stats?.icon ?? fighter.icon;
          const title = fighter.title ?? stats?.title;
          const buildCount = getLibraryForFighter(fighter.nameKey).builds.length;

          return (
            <Card key={fighter.nameKey} className="mb-2">
              <div className="flex items-center gap-3">
                <Link
                  href={`/fighters/${encodeURIComponent(fighter.nameKey)}`}
                  className="flex items-center gap-3 min-w-0 flex-1"
                >
                  <FighterAvatar icon={icon} name={fighter.displayName} />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-arena-neon truncate">
                      <FighterName name={fighter.displayName} title={title} />
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      冠軍 {stats?.championCount ?? 0} · 亞軍{" "}
                      {stats?.runnerUpCount ?? 0}
                      {(stats?.matchCount ?? 0) > 0
                        ? ` · 參賽 ${stats!.matchCount} 場`
                        : ""}
                      {buildCount > 0 ? ` · ${buildCount} 組陀螺` : ""}
                    </p>
                  </div>
                  <span className="text-xs text-gray-600 shrink-0">詳情 →</span>
                </Link>
                {adminLoggedIn && (
                  <button
                    type="button"
                    className="text-xs text-red-400 shrink-0 px-2 py-1"
                    onClick={() => {
                      if (
                        confirm(
                          `確定刪除選手「${formatFighterProfile(fighter)}」？陀螺庫資料一併移除。`
                        )
                      ) {
                        deleteFighterByNameKey(fighter.nameKey);
                      }
                    }}
                  >
                    刪除
                  </button>
                )}
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}
