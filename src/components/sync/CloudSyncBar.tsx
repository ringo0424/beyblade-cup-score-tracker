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
        <p className="text-sm font-medium text-amber-400 mb-2">
          未設定 Supabase，僅本機儲存
        </p>
        <p className="text-xs text-amber-500/90 mb-3 leading-relaxed">
          每位使用者各自一份資料。需在部署平台設定環境變數並重新部署後，全員才會共用同一份雲端資料。
        </p>
        <ol className="text-xs text-gray-400 space-y-2 list-decimal list-inside leading-relaxed">
          <li>
            至{" "}
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-arena-neon underline"
            >
              Supabase
            </a>{" "}
            建立專案，在 SQL Editor 執行專案內{" "}
            <code className="text-gray-500">supabase/schema.sql</code>
          </li>
          <li>
            Project Settings → API，複製 Project URL 與 anon public key
          </li>
          <li>
            在{" "}
            <a
              href="https://vercel.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-arena-neon underline"
            >
              Vercel
            </a>{" "}
            開啟本專案 → Settings → Environment Variables，新增{" "}
            <code className="text-gray-500">NEXT_PUBLIC_SUPABASE_URL</code>、
            <code className="text-gray-500">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
            （Production 與 Preview 都建議勾選）
          </li>
          <li>Deployments → 對最新部署按 Redeploy，全員強制重新整理頁面</li>
        </ol>
        <p className="text-xs text-gray-600 mt-3">
          本機開發請複製 <code className="text-gray-500">.env.example</code> 為{" "}
          <code className="text-gray-500">.env.local</code> 並填入相同變數後重啟{" "}
          <code className="text-gray-500">npm run dev</code>。
        </p>
      </Card>
    );
  }

  const playerCount = data.matches.reduce((n, m) => n + m.players.length, 0);

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
            比賽 {data.matches.length} · 選手 {playerCount}
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
