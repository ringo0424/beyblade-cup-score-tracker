"use client";

import Link from "next/link";
import { useAppData } from "@/hooks/useAppData";
import { getTodayMatches, getTodayDateString, formatDisplayDate } from "@/lib/storage";
import { MatchCard } from "@/components/match/MatchCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function HomePage() {
  const { data, hydrated, loadSample, resetAll } = useAppData();
  const today = getTodayDateString();
  const todayMatches = getTodayMatches(data);
  const inProgress = data.matches.filter((m) => m.status === "inProgress");

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-gray-500">
        載入中…
      </div>
    );
  }

  return (
    <div>
      <section className="mb-6">
        <h2 className="text-xl font-bold mb-1">今日賽事</h2>
        <p className="text-sm text-gray-500 mb-4">
          {formatDisplayDate(today)}
        </p>
        <Link href="/match/create">
          <Button fullWidth className="mb-4">
            ＋ 建立新比賽 / 杯賽
          </Button>
        </Link>
        {todayMatches.length === 0 ? (
          <Card>
            <p className="text-gray-500 text-center py-4">今日尚無比賽紀錄</p>
          </Card>
        ) : (
          todayMatches.map((m) => <MatchCard key={m.id} match={m} />)
        )}
      </section>

      {inProgress.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold text-arena-neon mb-3">進行中</h2>
          {inProgress.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </section>
      )}

      <section className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold">快速連結</h2>
        </div>
        <Link href="/history">
          <Button variant="secondary" fullWidth>
            查看全部比賽紀錄
          </Button>
        </Link>
      </section>

      {data.matches.length === 0 && (
        <section className="border-t border-arena-border pt-4 mt-4">
          <p className="text-xs text-gray-600 mb-2">開發 / 測試</p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={loadSample} className="text-sm flex-1">
              載入範例資料
            </Button>
            <Button variant="ghost" onClick={resetAll} className="text-sm flex-1">
              清除全部
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
