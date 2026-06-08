"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AppData, Beyblade, LibraryBuild, LibraryPart, Match } from "@/types";
import { SHARED_LIBRARY_ID } from "@/lib/constants";
import {
  addPlayerToMatch,
  listFighterNames,
  removePlayerFromMatch,
} from "@/lib/accounts";
import {
  deleteFighter,
  getFighterLibrary,
  listRegisteredFighters,
  registerFighter,
  updateFighter,
} from "@/lib/fighters/registry";
import {
  isAdminLoggedIn,
  loginAdmin,
  logoutAdmin,
} from "@/lib/adminAuth";
import {
  loadAppData,
  normalizeAppData,
  saveAppData,
  upsertMatch,
  deleteMatch as removeMatch,
  seedSampleData,
  clearAllData,
} from "@/lib/storage";
import {
  addLibraryBuild,
  addLibraryPart,
  createLibraryBuild,
  getSharedLibrary,
  libraryBuildToBeyblade,
  removeLibraryBuild,
  removeLibraryPart,
} from "@/lib/library";
import { setFighterIcon as setFighterIconAction } from "@/lib/fighters/profiles";
import type { PhstudyPartCategory } from "@/lib/phstudy/types";
import { isSiteUnlocked, lockSite, unlockSite } from "@/lib/siteAuth";
import { isSyncConfigured } from "@/lib/sync/supabase";
import {
  attachLocalPhotos,
  stripPhotosForCloudSync,
  syncPhotoMapFromAppData,
} from "@/lib/matchPhotosStorage";
import {
  appDataChanged,
  mergeAppData,
  shouldPushMergedToCloud,
} from "@/lib/sync/mergeAppData";
import {
  fetchGlobalState,
  pushGlobalState,
  subscribeGlobalState,
} from "@/lib/sync/global";

export type SyncStatus = "local" | "connecting" | "synced" | "error";

interface AppDataContextValue {
  data: AppData;
  hydrated: boolean;
  siteUnlocked: boolean;
  syncStatus: SyncStatus;
  syncError: string | null;
  syncRefreshing: boolean;
  refreshCloudSync: () => Promise<string>;
  syncEnabled: boolean;
  sharedLibrary: ReturnType<typeof getSharedLibrary>;
  fighterNames: string[];
  registeredFighters: ReturnType<typeof listRegisteredFighters>;
  registerFighterByName: (name: string, title?: string) => void;
  updateFighterProfile: (
    nameKey: string,
    patch: { displayName: string; title?: string }
  ) => string | null;
  getLibraryForFighter: (nameKey: string) => ReturnType<typeof getFighterLibrary>;
  saveMatch: (match: Match) => void;
  removeMatchById: (matchId: string) => void;
  addPlayerToMatchById: (matchId: string, name: string) => boolean;
  removePlayerFromMatchById: (matchId: string, playerId: string) => boolean;
  loadSample: () => void;
  resetAll: () => void;
  setData: (next: AppData) => void;
  unlockSiteWithPassword: (password: string) => string | null;
  lockSiteSession: () => void;
  addPartToLibrary: (part: Omit<LibraryPart, "id">) => void;
  removePartFromLibrary: (partId: string) => void;
  saveBuildToLibrary: (
    beyblade: Beyblade,
    partTypes: Partial<Record<PhstudyPartCategory, string>>,
    ownerId?: string
  ) => void;
  removeBuildFromLibrary: (buildId: string, ownerId?: string) => void;
  toxicQuotesEnabled: boolean;
  setToxicQuotesEnabled: (enabled: boolean) => void;
  setFighterIcon: (nameKey: string, icon: string | undefined) => void;
  adminLoggedIn: boolean;
  loginAdminWithPassword: (password: string) => string | null;
  logoutAdminSession: () => void;
  deleteFighterByNameKey: (nameKey: string) => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setDataState] = useState<AppData | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [siteUnlocked, setSiteUnlocked] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("local");
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncRefreshing, setSyncRefreshing] = useState(false);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const revisionRef = useRef(0);
  const applyingRemoteRef = useRef(false);
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataRef = useRef<AppData | null>(null);

  const syncEnabled = isSyncConfigured();
  const dataOrEmpty = data ?? normalizeAppData({});
  dataRef.current = data;
  const toxicQuotesEnabled = Boolean(dataOrEmpty.settings?.toxicQuotesEnabled);
  const sharedLibrary = getSharedLibrary(dataOrEmpty);
  const fighterNames = listFighterNames(dataOrEmpty);
  const registeredFighters = listRegisteredFighters(dataOrEmpty);

  const persistLocal = useCallback((next: AppData) => {
    const normalized = attachLocalPhotos(normalizeAppData(next));
    syncPhotoMapFromAppData(normalized);
    setDataState(normalized);
    saveAppData(normalized);
  }, []);

  const scheduleCloudPush = useCallback(
    (next: AppData) => {
      if (!syncEnabled || applyingRemoteRef.current) return;
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
      pushTimerRef.current = setTimeout(async () => {
        const cloudPayload = stripPhotosForCloudSync(next);
        const result = await pushGlobalState(cloudPayload, revisionRef.current);
        if (result.ok) {
          revisionRef.current = result.revision;
          setSyncStatus("synced");
          setSyncError(null);
        } else if ("conflict" in result && result.conflict) {
          applyingRemoteRef.current = true;
          revisionRef.current = result.revision;
          const localNow = attachLocalPhotos(normalizeAppData(next));
          const merged = mergeAppData(localNow, result.payload);
          persistLocal(merged);
          applyingRemoteRef.current = false;
          setSyncError("已與雲端合併最新資料（保留本機較新紀錄）");
          if (shouldPushMergedToCloud(merged, result.payload)) {
            scheduleCloudPush(merged);
          }
        } else if (!result.ok && "error" in result) {
          setSyncStatus("error");
          setSyncError(result.error);
        }
      }, 350);
    },
    [persistLocal, syncEnabled]
  );

  type AppDataUpdater = AppData | ((prev: AppData) => AppData);

  const mutate = useCallback(
    (updater: AppDataUpdater) => {
      const prev = dataRef.current ?? loadAppData();
      const next =
        typeof updater === "function" ? updater(prev) : updater;
      const normalized = normalizeAppData(next);
      persistLocal(normalized);
      if (syncEnabled && !applyingRemoteRef.current) {
        setSyncStatus("synced");
        scheduleCloudPush(normalized);
      }
      return normalized;
    },
    [persistLocal, scheduleCloudPush, syncEnabled]
  );

  const forcePushToCloud = useCallback(
    async (payload: AppData): Promise<{ ok: true } | { ok: false; error: string }> => {
      let current = payload;
      for (let attempt = 0; attempt < 6; attempt++) {
        const result = await pushGlobalState(
          stripPhotosForCloudSync(current),
          revisionRef.current
        );
        if (result.ok) {
          revisionRef.current = result.revision;
          return { ok: true };
        }
        if ("conflict" in result && result.conflict) {
          revisionRef.current = result.revision;
          const local = attachLocalPhotos(dataRef.current ?? loadAppData());
          current = mergeAppData(local, result.payload);
          applyingRemoteRef.current = true;
          persistLocal(current);
          applyingRemoteRef.current = false;
          continue;
        }
        const err =
          "error" in result && result.error
            ? result.error
            : "無法上傳到雲端";
        return { ok: false, error: err };
      }
      return { ok: false, error: "同步衝突次數過多，請稍後再試" };
    },
    [persistLocal]
  );

  const refreshCloudSync = useCallback(async (): Promise<string> => {
    if (!syncEnabled) {
      return "未設定雲端同步（僅本機模式）";
    }

    if (pushTimerRef.current) {
      clearTimeout(pushTimerRef.current);
      pushTimerRef.current = null;
    }

    setSyncRefreshing(true);
    setSyncError(null);
    setSyncStatus("connecting");

    try {
      const fetched = await fetchGlobalState();
      if ("error" in fetched) {
        setSyncStatus("error");
        setSyncError(fetched.error);
        return `讀取失敗：${fetched.error}`;
      }

      const local = attachLocalPhotos(dataRef.current ?? loadAppData());
      const remote = attachLocalPhotos(fetched.payload);
      const merged = mergeAppData(local, remote);

      applyingRemoteRef.current = true;
      revisionRef.current = fetched.revision;
      persistLocal(merged);
      applyingRemoteRef.current = false;

      const pushResult = await forcePushToCloud(merged);
      const players = merged.matches.reduce((n, m) => n + m.players.length, 0);

      if (pushResult.ok) {
        setSyncStatus("synced");
        setSyncError(null);
        return `同步完成：${merged.matches.length} 場比賽、${players} 位選手（已合併並上傳雲端）`;
      }

      setSyncStatus("error");
      setSyncError(pushResult.error);
      return `已合併本機資料，但上傳失敗：${pushResult.error}`;
    } finally {
      setSyncRefreshing(false);
    }
  }, [forcePushToCloud, persistLocal, syncEnabled]);

  useEffect(() => {
    const local = attachLocalPhotos(loadAppData());
    setDataState(local);
    syncPhotoMapFromAppData(local);
    setSiteUnlocked(isSiteUnlocked());
    setAdminLoggedIn(isAdminLoggedIn());
    setHydrated(true);

    if (!syncEnabled) return;

    setSyncStatus("connecting");
    fetchGlobalState().then((result) => {
      if ("error" in result) {
        setSyncStatus("error");
        setSyncError(result.error);
        return;
      }
      applyingRemoteRef.current = true;
      revisionRef.current = result.revision;
      const remote = attachLocalPhotos(result.payload);
      const merged = mergeAppData(local, remote);
      persistLocal(merged);
      applyingRemoteRef.current = false;
      setSyncStatus("synced");
      if (shouldPushMergedToCloud(merged, remote)) {
        scheduleCloudPush(merged);
      }
    });
  }, [persistLocal, scheduleCloudPush, syncEnabled]);

  useEffect(() => {
    if (!syncEnabled) return;
    return subscribeGlobalState((payload, revision) => {
      if (revision <= revisionRef.current) return;
      applyingRemoteRef.current = true;
      revisionRef.current = revision;
      const local = attachLocalPhotos(dataRef.current ?? loadAppData());
      const remote = attachLocalPhotos(normalizeAppData(payload));
      const merged = mergeAppData(local, remote);
      persistLocal(merged);
      applyingRemoteRef.current = false;
      setSyncStatus("synced");
      if (shouldPushMergedToCloud(merged, remote)) {
        scheduleCloudPush(merged);
      }
    });
  }, [persistLocal, scheduleCloudPush, syncEnabled]);

  const unlockSiteWithPassword = useCallback((password: string): string | null => {
    if (!unlockSite(password)) return "密碼錯誤";
    setSiteUnlocked(true);
    return null;
  }, []);

  const lockSiteSession = useCallback(() => {
    lockSite();
    setSiteUnlocked(false);
  }, []);

  const saveMatch = useCallback(
    (match: Match) => {
      mutate((d) => upsertMatch(d, match));
    },
    [mutate]
  );

  const removeMatchById = useCallback(
    (matchId: string) => {
      mutate((d) => removeMatch(d, matchId));
    },
    [mutate]
  );

  const addPlayerToMatchById = useCallback(
    (matchId: string, name: string): boolean => {
      let ok = false;
      mutate((d) => {
        const next = addPlayerToMatch(d, matchId, name);
        if (next === d) return d;
        ok = true;
        return next;
      });
      return ok;
    },
    [mutate]
  );

  const removePlayerFromMatchById = useCallback(
    (matchId: string, playerId: string): boolean => {
      let ok = false;
      mutate((d) => {
        const next = removePlayerFromMatch(d, matchId, playerId);
        if (next === d) return d;
        ok = true;
        return next;
      });
      return ok;
    },
    [mutate]
  );

  const loadSample = useCallback(() => {
    mutate(seedSampleData());
  }, [mutate]);

  const resetAll = useCallback(() => {
    mutate(clearAllData());
  }, [mutate]);

  const addPartToLibrary = useCallback(
    (part: Omit<LibraryPart, "id">) => {
      mutate((d) => addLibraryPart(d, SHARED_LIBRARY_ID, part));
    },
    [mutate]
  );

  const removePartFromLibrary = useCallback(
    (partId: string) => {
      mutate((d) => removeLibraryPart(d, SHARED_LIBRARY_ID, partId));
    },
    [mutate]
  );

  const registerFighterByName = useCallback(
    (name: string, title?: string) => {
      mutate((d) => registerFighter(d, name, title));
    },
    [mutate]
  );

  const updateFighterProfile = useCallback(
    (nameKey: string, patch: { displayName: string; title?: string }): string | null => {
      const trimmed = patch.displayName.trim();
      if (!trimmed) return "選手名不可為空";
      mutate((d) => updateFighter(d, nameKey, patch));
      return null;
    },
    [mutate]
  );

  const getLibraryForFighter = useCallback(
    (nameKey: string) => getFighterLibrary(dataRef.current ?? dataOrEmpty, nameKey),
    [dataOrEmpty]
  );

  const saveBuildToLibrary = useCallback(
    (
      beyblade: Beyblade,
      partTypes: Partial<Record<PhstudyPartCategory, string>>,
      ownerId: string = SHARED_LIBRARY_ID
    ) => {
      const build = createLibraryBuild(beyblade, partTypes);
      mutate((d) => addLibraryBuild(d, ownerId, build));
    },
    [mutate]
  );

  const removeBuildFromLibrary = useCallback(
    (buildId: string, ownerId: string = SHARED_LIBRARY_ID) => {
      mutate((d) => removeLibraryBuild(d, ownerId, buildId));
    },
    [mutate]
  );

  const setToxicQuotesEnabled = useCallback(
    (enabled: boolean) => {
      mutate((d) => ({
        ...d,
        settings: { ...d.settings, toxicQuotesEnabled: enabled },
      }));
    },
    [mutate]
  );

  const setFighterIcon = useCallback(
    (nameKey: string, icon: string | undefined) => {
      mutate((d) => setFighterIconAction(d, nameKey, icon));
    },
    [mutate]
  );

  const loginAdminWithPassword = useCallback((password: string): string | null => {
    if (!loginAdmin(password)) return "密碼錯誤";
    setAdminLoggedIn(true);
    return null;
  }, []);

  const logoutAdminSession = useCallback(() => {
    logoutAdmin();
    setAdminLoggedIn(false);
  }, []);

  const deleteFighterByNameKey = useCallback(
    (nameKey: string) => {
      mutate((d) => deleteFighter(d, nameKey));
    },
    [mutate]
  );

  const value: AppDataContextValue = {
    data: dataOrEmpty,
    hydrated,
    siteUnlocked,
    syncStatus,
    syncError,
    syncRefreshing,
    refreshCloudSync,
    syncEnabled,
    sharedLibrary,
    fighterNames,
    registeredFighters,
    registerFighterByName,
    updateFighterProfile,
    getLibraryForFighter,
    saveMatch,
    removeMatchById,
    addPlayerToMatchById,
    removePlayerFromMatchById,
    loadSample,
    resetAll,
    setData: mutate,
    unlockSiteWithPassword,
    lockSiteSession,
    addPartToLibrary,
    removePartFromLibrary,
    saveBuildToLibrary,
    removeBuildFromLibrary,
    toxicQuotesEnabled,
    setToxicQuotesEnabled,
    setFighterIcon,
    adminLoggedIn,
    loginAdminWithPassword,
    logoutAdminSession,
    deleteFighterByNameKey,
  };

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error("useAppData must be used within AppDataProvider");
  }
  return ctx;
}

export { libraryBuildToBeyblade };
