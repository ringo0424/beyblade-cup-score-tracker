"use client";

import { useState } from "react";
import { useAppData } from "@/hooks/useAppData";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function CloudSyncBar() {
  const {
    syncEnabled,
    syncStatus,
    syncError,
    syncRefreshing,
    refreshCloudSync,
    data,
  } = useAppData();
  const [notice, setNotice] = useState<string | null>(null);

  if (!syncEnabled) {
    return (
      <Card className="mb-4 border-amber-900/40">
        <p className="text-xs text-amber-500">
          未設定 Supabase，僅本機儲存，無法與其他人同步。
        </p>
      </Card>
    );
  }

  const accountCount = data.accounts.filter((a) => a.passwordHash).length;

  const handleRefresh = async () => {
    setNotice(null);
    const msg = await refreshCloudSync();
    setNotice(msg);
  };

  return (
    <Card className="mb-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-gray-500 mb-1">雲端同步</p>
          <p className="text-sm text-gray-300">
            帳號 {accountCount} · 比賽 {data.matches.length}
          </p>
          <p
            className={`text-xs mt-1 ${
              syncStatus === "synced"
                ? "text-arena-neon"
                : syncStatus === "error"
                  ? "text-red-400"
                  : "text-gray-500"
            }`}
          >
            {syncRefreshing
              ? "正在重新同步…"
              : syncStatus === "synced"
                ? "已連線"
                : syncStatus}
          </p>
        </div>
        <Button
          variant="secondary"
          className="shrink-0"
          disabled={syncRefreshing}
          onClick={handleRefresh}
        >
          {syncRefreshing ? "同步中…" : "重新同步"}
        </Button>
      </div>
      {notice && (
        <p className="text-xs text-arena-neon mt-3 leading-relaxed">{notice}</p>
      )}
      {syncError && !syncRefreshing && (
        <p className="text-xs text-amber-500 mt-2">{syncError}</p>
      )}
      <p className="text-xs text-gray-600 mt-2">
        看不到其他人資料時，請每人各按一次「重新同步」。
      </p>
    </Card>
  );
}
