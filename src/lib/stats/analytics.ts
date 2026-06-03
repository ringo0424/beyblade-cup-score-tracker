import type { Match } from "@/types";

export interface PeriodPoints {
  period: string;
  label: string;
  points: number;
  matches: number;
}

export interface PlayerPeriodStat {
  playerId: string;
  playerName: string;
  points: number;
  wins: number;
  matches: number;
}

export interface PartUsageStat {
  partName: string;
  category: string;
  count: number;
}

function isoWeekKey(isoDate: string): string {
  const d = new Date(isoDate + "T12:00:00");
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7);
}

function pointsForPlayerInMatch(match: Match, playerId: string): number {
  return match.rounds
    .filter((r) => r.recipientPlayerId === playerId)
    .reduce((sum, r) => sum + r.pointsAwarded, 0);
}

export function aggregateWeeklyPoints(matches: Match[]): PeriodPoints[] {
  const map = new Map<string, PeriodPoints>();
  for (const m of matches) {
    if (m.status !== "completed" && m.status !== "inProgress") continue;
    const key = isoWeekKey(m.date);
    const entry = map.get(key) ?? {
      period: key,
      label: key,
      points: 0,
      matches: 0,
    };
    entry.matches += 1;
    for (const p of m.players) {
      entry.points += pointsForPlayerInMatch(m, p.id);
    }
    map.set(key, entry);
  }
  return Array.from(map.values()).sort((a, b) =>
    a.period.localeCompare(b.period)
  );
}

export function aggregateMonthlyPoints(matches: Match[]): PeriodPoints[] {
  const map = new Map<string, PeriodPoints>();
  for (const m of matches) {
    if (m.status !== "completed" && m.status !== "inProgress") continue;
    const key = monthKey(m.date);
    const entry = map.get(key) ?? {
      period: key,
      label: key,
      points: 0,
      matches: 0,
    };
    entry.matches += 1;
    for (const p of m.players) {
      entry.points += pointsForPlayerInMatch(m, p.id);
    }
    map.set(key, entry);
  }
  return Array.from(map.values()).sort((a, b) =>
    a.period.localeCompare(b.period)
  );
}

export function playerStatsForPeriod(
  matches: Match[],
  period: "week" | "month"
): PlayerPeriodStat[] {
  const map = new Map<string, PlayerPeriodStat>();
  const now = new Date();
  const currentWeek = isoWeekKey(now.toISOString().slice(0, 10));
  const currentMonth = monthKey(now.toISOString().slice(0, 10));

  for (const m of matches) {
    if (m.status !== "completed" && m.status !== "inProgress") continue;
    const key = period === "week" ? isoWeekKey(m.date) : monthKey(m.date);
    const current = period === "week" ? currentWeek : currentMonth;
    if (key !== current) continue;

    for (const p of m.players) {
      const stat = map.get(p.id) ?? {
        playerId: p.id,
        playerName: p.name,
        points: 0,
        wins: 0,
        matches: 0,
      };
      stat.points += pointsForPlayerInMatch(m, p.id);
      stat.wins += m.winnerPlayerId === p.id ? 1 : 0;
      stat.matches += 1;
      map.set(p.id, stat);
    }
  }

  return Array.from(map.values()).sort((a, b) => b.points - a.points);
}

export function topPartsFromWinners(matches: Match[]): PartUsageStat[] {
  const map = new Map<string, PartUsageStat>();
  for (const m of matches) {
    if (!m.winnerPlayerId) continue;
    const setup = m.beybladeSetups.find((s) => s.playerId === m.winnerPlayerId);
    if (!setup) continue;
    for (const b of setup.beyblades) {
      const parts = [
        { name: b.steelBlade, cat: "Blade" },
        { name: b.lockDisk, cat: "Ratchet" },
        { name: b.axis, cat: "Bit" },
        { name: b.mainBlade, cat: "MainBlade" },
      ];
      for (const part of parts) {
        if (!part.name.trim()) continue;
        const key = `${part.cat}::${part.name}`;
        const entry = map.get(key) ?? {
          partName: part.name,
          category: part.cat,
          count: 0,
        };
        entry.count += 1;
        map.set(key, entry);
      }
    }
  }
  return Array.from(map.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

export function topBuildNicknames(
  matches: Match[]
): { name: string; count: number }[] {
  const map = new Map<string, number>();
  for (const m of matches) {
    if (!m.winnerPlayerId) continue;
    const setup = m.beybladeSetups.find((s) => s.playerId === m.winnerPlayerId);
    if (!setup) continue;
    for (const b of setup.beyblades) {
      const name = b.nickname.trim() || "未命名";
      map.set(name, (map.get(name) ?? 0) + 1);
    }
  }
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}
