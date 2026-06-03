"use client";

import { useCallback, useEffect, useState } from "react";
import type { AppData, Match } from "@/types";
import {
  loadAppData,
  saveAppData,
  upsertMatch,
  deleteMatch as removeMatch,
  seedSampleData,
  clearAllData,
} from "@/lib/storage";

export function useAppData() {
  const [data, setData] = useState<AppData | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setData(loadAppData());
    setHydrated(true);
  }, []);

  const persist = useCallback((next: AppData) => {
    setData(next);
    saveAppData(next);
  }, []);

  const saveMatch = useCallback(
    (match: Match) => {
      if (!data) return;
      persist(upsertMatch(data, match));
    },
    [data, persist]
  );

  const removeMatchById = useCallback(
    (matchId: string) => {
      if (!data) return;
      persist(removeMatch(data, matchId));
    },
    [data, persist]
  );

  const loadSample = useCallback(() => {
    persist(seedSampleData());
  }, [persist]);

  const resetAll = useCallback(() => {
    persist(clearAllData());
  }, [persist]);

  return {
    data: data ?? { eventDays: [], matches: [], version: 1 },
    hydrated,
    saveMatch,
    removeMatchById,
    loadSample,
    resetAll,
    setData: persist,
  };
}
