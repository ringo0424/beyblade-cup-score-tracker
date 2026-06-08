"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAppData } from "@/hooks/useAppData";
import { FighterAvatar } from "@/components/fighters/FighterAvatar";
import { FighterName } from "@/components/fighters/FighterName";
import { computeFighterStats } from "@/lib/fighters/stats";
import { Card } from "@/components/ui/Card";
import { CloudSyncBar } from "@/components/sync/CloudSyncBar";

export default function LibraryPage() {
  const { data, hydrated, registeredFighters, getLibraryForFighter } =
    useAppData();

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
      <h2 className="text-xl font-bold mb-1">陀螺庫</h2>
      <p className="text-sm text-gray-500 mb-4">
        先選擇選手，再為該選手設定陀螺組合與零件庫。
      </p>

      <CloudSyncBar />

      {registeredFighters.length === 0 ? (
        <Card>
          <p className="text-center text-gray-500 py-6 text-sm">
            尚無選手。請先到「選手」頁新增，或於比賽設定頁加入。
          </p>
          <Link
            href="/fighters"
            className="block text-center text-sm text-arena-neon mt-2"
          >
            前往選手頁 →
          </Link>
        </Card>
      ) : (
        registeredFighters.map((fighter) => {
          const stats = statByName.get(fighter.nameKey);
          const icon = stats?.icon ?? fighter.icon;
          const buildCount = getLibraryForFighter(fighter.nameKey).builds.length;

          return (
            <Link
              key={fighter.nameKey}
              href={`/library/${encodeURIComponent(fighter.nameKey)}`}
            >
              <Card className="mb-2 hover:border-arena-neon/40 transition-colors">
                <div className="flex items-center gap-3">
                  <FighterAvatar
                    icon={icon}
                    name={fighter.displayName}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-arena-neon truncate">
                      <FighterName
                        name={fighter.displayName}
                        title={fighter.title ?? stats?.title}
                      />
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      已儲存 {buildCount} 組陀螺
                    </p>
                  </div>
                  <span className="text-xs text-gray-600 shrink-0">編輯 →</span>
                </div>
              </Card>
            </Link>
          );
        })
      )}
    </div>
  );
}
