import type { AppData, EventDay, Match } from "@/types";
import { STORAGE_KEY } from "./constants";
import { generateId } from "./id";
import { sampleAppData } from "./sampleData";

import { SHARED_LIBRARY_ID } from "@/lib/constants";
import { deletedIdSet } from "@/lib/deletions";

const DATA_VERSION = 5;

function mergeLibrariesToShared(
  libraries: AppData["libraries"]
): AppData["libraries"] {
  const shared = libraries.find((l) => l.accountId === SHARED_LIBRARY_ID);
  if (shared && libraries.length === 1) return libraries;

  const partIds = new Set<string>();
  const buildIds = new Set<string>();
  const savedParts = [...(shared?.savedParts ?? [])];
  const builds = [...(shared?.builds ?? [])];

  for (const lib of libraries) {
    if (lib.accountId === SHARED_LIBRARY_ID) continue;
    for (const p of lib.savedParts) {
      if (!partIds.has(p.id)) {
        partIds.add(p.id);
        savedParts.push(p);
      }
    }
    for (const b of lib.builds) {
      if (!buildIds.has(b.id)) {
        buildIds.add(b.id);
        builds.push(b);
      }
    }
  }

  return [{ accountId: SHARED_LIBRARY_ID, savedParts, builds }];
}

function emptyData(): AppData {
  return {
    eventDays: [],
    matches: [],
    accounts: [],
    libraries: [{ accountId: SHARED_LIBRARY_ID, savedParts: [], builds: [] }],
    fighters: [],
    settings: {},
    deletedMatchIds: [],
    deletedAccountIds: [],
    version: DATA_VERSION,
  };
}

export function normalizeAppData(raw: Partial<AppData>): AppData {
  const deletedMatches = deletedIdSet(raw.deletedMatchIds);
  const libraries = mergeLibrariesToShared(raw.libraries ?? []);
  return {
    eventDays: raw.eventDays ?? [],
    matches: (raw.matches ?? []).filter((m) => !deletedMatches.has(m.id)),
    accounts: [],
    libraries,
    fighters: raw.fighters ?? [],
    settings: raw.settings ?? {},
    deletedMatchIds: raw.deletedMatchIds ?? [],
    deletedAccountIds: raw.deletedAccountIds ?? [],
    version: DATA_VERSION,
  };
}

export function loadAppData(): AppData {
  if (typeof window === "undefined") return emptyData();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return normalizeAppData(parsed);
  } catch {
    return emptyData();
  }
}

export function saveAppData(data: AppData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, version: DATA_VERSION }));
}

export function getMatch(data: AppData, id: string): Match | undefined {
  return data.matches.find((m) => m.id === id);
}

/** React 狀態可能尚未更新時，從 localStorage 再查一次 */
export function resolveMatch(data: AppData, id: string): Match | undefined {
  const fromState = getMatch(data, id);
  if (fromState) return fromState;
  if (typeof window === "undefined") return undefined;
  return getMatch(loadAppData(), id);
}

export function upsertMatch(data: AppData, match: Match): AppData {
  const exists = data.matches.some((m) => m.id === match.id);
  const matches = exists
    ? data.matches.map((m) => (m.id === match.id ? match : m))
    : [...data.matches, match];

  let eventDays = [...data.eventDays];
  const dayKey = match.date;
  let day = eventDays.find((e) => e.date === dayKey);
  if (!day) {
    day = {
      id: generateId(),
      date: dayKey,
      location: match.location,
      matchIds: [match.id],
      createdAt: new Date().toISOString(),
    };
    eventDays.push(day);
  } else if (!day.matchIds.includes(match.id)) {
    day = { ...day, matchIds: [...day.matchIds, match.id] };
    eventDays = eventDays.map((e) => (e.id === day!.id ? day! : e));
  }

  const linkedMatch = { ...match, eventDayId: day.id };
  const finalMatches = exists
    ? matches.map((m) => (m.id === match.id ? linkedMatch : m))
    : [...matches.slice(0, -1), linkedMatch];

  return { ...data, matches: finalMatches, eventDays };
}

export function deleteMatch(data: AppData, matchId: string): AppData {
  const deletedMatchIds = [
    ...new Set([...(data.deletedMatchIds ?? []), matchId]),
  ];
  const matches = data.matches.filter((m) => m.id !== matchId);
  const eventDays = data.eventDays.map((e) => ({
    ...e,
    matchIds: e.matchIds.filter((id) => id !== matchId),
  }));
  return { ...data, matches, eventDays, deletedMatchIds };
}

export function getTodayDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatDisplayDate(isoDate: string): string {
  try {
    const [y, m, d] = isoDate.split("-").map(Number);
    return `${y}/${m}/${d}`;
  } catch {
    return isoDate;
  }
}

export function getMatchesForDate(data: AppData, date: string): Match[] {
  return data.matches
    .filter((m) => m.date === date)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getTodayMatches(data: AppData): Match[] {
  return getMatchesForDate(data, getTodayDateString());
}

export function seedSampleData(): AppData {
  saveAppData(sampleAppData);
  return sampleAppData;
}

export function clearAllData(): AppData {
  const empty = emptyData();
  saveAppData(empty);
  return empty;
}
