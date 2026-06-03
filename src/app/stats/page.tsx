"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAppData } from "@/hooks/useAppData";
import {
  aggregateMonthlyPoints,
  aggregateWeeklyPoints,
  playerStatsForPeriod,
  topBuildNicknames,
  topPartsFromWinners,
} from "@/lib/stats/analytics";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function StatsPage() {
  const { data } = useAppData();
  const [period, setPeriod] = useState<"week" | "month">("week");

  const weekly = useMemo(
    () => aggregateWeeklyPoints(data.matches),
    [data.matches]
  );
  const monthly = useMemo(
    () => aggregateMonthlyPoints(data.matches),
    [data.matches]
  );
  const players = useMemo(
    () => playerStatsForPeriod(data.matches, period),
    [data.matches, period]
  );
  const topParts = useMemo(
    () => topPartsFromWinners(data.matches),
    [data.matches]
  );
  const topBuilds = useMemo(
    () => topBuildNicknames(data.matches),
    [data.matches]
  );

  const chartData = period === "week" ? weekly.slice(-8) : monthly.slice(-6);

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">比賽數據</h2>
      <p className="text-sm text-gray-500 mb-4">
        依週 / 月統計得分、選手、冠軍常用零件與陀螺組合。
      </p>

      <div className="flex gap-2 mb-4">
        <Button
          variant={period === "week" ? "primary" : "secondary"}
          className="flex-1"
          onClick={() => setPeriod("week")}
        >
          本週
        </Button>
        <Button
          variant={period === "month" ? "primary" : "secondary"}
          className="flex-1"
          onClick={() => setPeriod("month")}
        >
          本月
        </Button>
      </div>

      <Card className="mb-4 h-56">
        <p className="text-xs text-gray-500 mb-2">
          {period === "week" ? "每週" : "每月"}總得分
        </p>
        {chartData.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-8">尚無比賽數據</p>
        ) : (
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="label" tick={{ fill: "#888", fontSize: 10 }} />
              <YAxis tick={{ fill: "#888", fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  background: "#1a1a24",
                  border: "1px solid #333",
                }}
              />
              <Bar dataKey="points" fill="#00f0ff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card className="mb-4">
        <h3 className="font-bold text-arena-purple mb-2">
          {period === "week" ? "本週" : "本月"}選手排行
        </h3>
        {players.length === 0 ? (
          <p className="text-gray-600 text-sm">尚無資料</p>
        ) : (
          players.map((p, i) => (
            <div
              key={p.playerId}
              className="flex justify-between text-sm py-1 border-b border-arena-border/30 last:border-0"
            >
              <span>
                {i + 1}. {p.playerName}
              </span>
              <span className="text-arena-neon">
                {p.points} 分 · {p.wins} 勝
              </span>
            </div>
          ))
        )}
      </Card>

      <Card className="mb-4">
        <h3 className="font-bold text-arena-purple mb-2">冠軍常用零件</h3>
        {topParts.length === 0 ? (
          <p className="text-gray-600 text-sm">尚無資料</p>
        ) : (
          topParts.map((p) => (
            <div key={`${p.category}-${p.partName}`} className="text-sm py-1">
              {p.partName}{" "}
              <span className="text-gray-600">({p.category}) ×{p.count}</span>
            </div>
          ))
        )}
      </Card>

      <Card>
        <h3 className="font-bold text-arena-purple mb-2">冠軍陀螺暱稱</h3>
        {topBuilds.length === 0 ? (
          <p className="text-gray-600 text-sm">尚無資料</p>
        ) : (
          topBuilds.map((b) => (
            <div key={b.name} className="text-sm py-1">
              {b.name} <span className="text-gray-600">×{b.count}</span>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
