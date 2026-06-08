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
import type { Account, AppData, Beyblade, LibraryBuild, LibraryPart, Match } from "@/types";
import {
  CURRENT_ACCOUNT_NAME_STORAGE_KEY,
  CURRENT_ACCOUNT_STORAGE_KEY,
} from "@/lib/constants";
import { resolveRemappedAccountId } from "@/lib/accountRemap";
import {
  addAccount,
  authenticateAccount,
  findAccountById,
  findAccountByName,
  isAdminAccount,
  joinMatch as joinMatchAction,
  removeAccount,
} from "@/lib/accounts";
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
  getUserLibrary,
  libraryBuildToBeyblade,
  removeLibraryBuild,
  removeLibraryPart,
} from "@/lib/library";
import { setFighterIcon as setFighterIconAction } from "@/lib/fighters/profiles";
import type { PhstudyPartCategory } from "@/lib/phstudy/types";
import { isSyncConfigured } from "@/lib/sync/supabase";
import {
  attachLocalPhotos,
  stripPhotosForCloudSync,
  syncPhotoMapFromAppData,
} from "@/lib/matchPhotosStorage";
import {
  appDataChanged,
  mergeAppDataWithMeta,
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
  syncStatus: SyncStatus;
  syncError: string | null;
  syncRefreshing: boolean;
  refreshCloudSync: () => Promise<string>;
  syncEnabled: boolean;
  currentAccount: Account | null;
  isAdmin: boolean;
  userLibrary: ReturnType<typeof getUserLibrary>;
  saveMatch: (match: Match) => void;
  removeMatchById: (matchId: string) => boolean;
  loadSample: () => void;
  resetAll: () => void;
  setData: (next: AppData) => void;
  loginWithPassword: (name: string, password: string) => string | null;
  registerWithPassword: (name: string, password: string) => string | null;
  logout: () => void;
  deleteAccountById: (accountId: string) => boolean;
  joinMatchById: (matchId: string) => boolean;
  addPartToLibrary: (part: Omit<LibraryPart, "id">) => void;
  removePartFromLibrary: (partId: string) => void;
  saveBuildToLibrary: (
    beyblade: Beyblade,
    partTypes: Partial<Record<PhstudyPartCategory, string>>
  ) => void;
  removeBuildFromLibrary: (buildId: string) => void;
  toxicQuotesEnabled: boolean;
  setToxicQuotesEnabled: (enabled: boolean) => void;
  setFighterIcon: (displayName: string, icon: string | undefined) => boolean;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

function readStoredAccountId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CURRENT_ACCOUNT_STORAGE_KEY);
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setDataState] = useState<AppData | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [currentAccountId, setCurrentAccountId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("local");
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncRefreshing, setSyncRefreshing] = useState(false);
  const revisionRef = useRef(0);
  const applyingRemoteRef = useRef(false);
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataRef = useRef<AppData | null>(null);

  const syncEnabled = isSyncConfigured();
  const dataOrEmpty = data ?? normalizeAppData({});
  dataRef.current = data;
  const currentAccount = (() => {
    if (currentAccountId) {
      const byId = findAccountById(dataOrEmpty, currentAccountId);
      if (byId) return byId;
    }
    if (typeof window === "undefined") return null;
    const storedName = localStorage.getItem(CURRENT_ACCOUNT_NAME_STORAGE_KEY);
    if (storedName) {
      return findAccountByName(dataOrEmpty, storedName) ?? null;
    }
    return null;
  })();
  const isAdmin = isAdminAccount(currentAccount);
  const toxicQuotesEnabled = Boolean(dataOrEmpty.settings?.toxicQuotesEnabled);
  const userLibrary = currentAccount
    ? getUserLibrary(dataOrEmpty, currentAccount.id)
    : { accountId: "", savedParts: [], builds: [] };

  const persistLocal = useCallback((next: AppData) => {
    const normalized = attachLocalPhotos(normalizeAppData(next));
    syncPhotoMapFromAppData(normalized);
    setDataState(normalized);
    saveAppData(normalized);
  }, []);

  const applyMergeResult = useCallback((local: AppData, remote: AppData) => {
    const { data: merged, accountIdRemap } = mergeAppDataWithMeta(
      local,
      remote
    );
    const storedId = readStoredAccountId();
    if (storedId && accountIdRemap.size > 0) {
      const remapped = resolveRemappedAccountId(accountIdRemap, storedId);
      if (remapped !== storedId) {
        localStorage.setItem(CURRENT_ACCOUNT_STORAGE_KEY, remapped);
        setCurrentAccountId(remapped);
      }
    }
    const resolvedId = storedId
      ? resolveRemappedAccountId(accountIdRemap, storedId)
      : null;
    const account = resolvedId
      ? (findAccountById(merged, resolvedId) ??
        (typeof window !== "undefined"
          ? findAccountByName(
              merged,
              localStorage.getItem(CURRENT_ACCOUNT_NAME_STORAGE_KEY) ?? ""
            )
          : undefined))
      : undefined;
    if (account) {
      localStorage.setItem(CURRENT_ACCOUNT_NAME_STORAGE_KEY, account.name);
    }
    return merged;
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
          const merged = applyMergeResult(localNow, result.payload);
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
    [applyMergeResult, persistLocal, syncEnabled]
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
          current = applyMergeResult(local, result.payload);
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
    [applyMergeResult, persistLocal]
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
      const merged = applyMergeResult(local, remote);

      applyingRemoteRef.current = true;
      revisionRef.current = fetched.revision;
      persistLocal(merged);
      applyingRemoteRef.current = false;

      const pushResult = await forcePushToCloud(merged);
      const accounts = merged.accounts.filter((a) => a.passwordHash).length;

      if (pushResult.ok) {
        setSyncStatus("synced");
        setSyncError(null);
        return `同步完成：${accounts} 個帳號、${merged.matches.length} 場比賽（已合併並上傳雲端）`;
      }

      setSyncStatus("error");
      setSyncError(pushResult.error);
      return `已合併本機資料（${accounts} 帳號），但上傳失敗：${pushResult.error}`;
    } finally {
      setSyncRefreshing(false);
    }
  }, [applyMergeResult, forcePushToCloud, persistLocal, syncEnabled]);

  useEffect(() => {
    const local = attachLocalPhotos(loadAppData());
    setDataState(local);
    syncPhotoMapFromAppData(local);
    setCurrentAccountId(readStoredAccountId());
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
      const merged = applyMergeResult(local, remote);
      persistLocal(merged);
      applyingRemoteRef.current = false;
      setSyncStatus("synced");
      if (shouldPushMergedToCloud(merged, remote)) {
        scheduleCloudPush(merged);
      }
    });
  }, [applyMergeResult, persistLocal, scheduleCloudPush, syncEnabled]);

  useEffect(() => {
    if (!syncEnabled) return;
    return subscribeGlobalState((payload, revision) => {
      if (revision <= revisionRef.current) return;
      applyingRemoteRef.current = true;
      revisionRef.current = revision;
      const local = attachLocalPhotos(
        dataRef.current ?? loadAppData()
      );
      const remote = attachLocalPhotos(normalizeAppData(payload));
      const merged = applyMergeResult(local, remote);
      persistLocal(merged);
      applyingRemoteRef.current = false;
      setSyncStatus("synced");
      if (shouldPushMergedToCloud(merged, remote)) {
        scheduleCloudPush(merged);
      }
    });
  }, [applyMergeResult, persistLocal, scheduleCloudPush, syncEnabled]);

  const loginAs = useCallback((accountId: string, accountName?: string) => {
    localStorage.setItem(CURRENT_ACCOUNT_STORAGE_KEY, accountId);
    if (accountName) {
      localStorage.setItem(CURRENT_ACCOUNT_NAME_STORAGE_KEY, accountName);
    }
    setCurrentAccountId(accountId);
  }, []);

  const saveMatch = useCallback(
    (match: Match) => {
      mutate((d) => upsertMatch(d, match));
    },
    [mutate]
  );

  const removeMatchById = useCallback(
    (matchId: string): boolean => {
      if (!isAdminAccount(currentAccount)) return false;
      mutate((d) => removeMatch(d, matchId));
      return true;
    },
    [currentAccount, mutate]
  );

  const loadSample = useCallback(() => {
    mutate(seedSampleData());
  }, [mutate]);

  const resetAll = useCallback(() => {
    mutate(clearAllData());
  }, [mutate]);

  const logout = useCallback(() => {
    localStorage.removeItem(CURRENT_ACCOUNT_STORAGE_KEY);
    localStorage.removeItem(CURRENT_ACCOUNT_NAME_STORAGE_KEY);
    setCurrentAccountId(null);
  }, []);

  const loginWithPassword = useCallback(
    (name: string, password: string): string | null => {
      if (!hydrated) return "載入中";
      const snapshot = dataRef.current ?? loadAppData();
      const account = authenticateAccount(snapshot, name, password);
      if (!account) return "帳號或密碼錯誤";
      loginAs(account.id, account.name);
      return null;
    },
    [hydrated, loginAs]
  );

  const registerWithPassword = useCallback(
    (name: string, password: string): string | null => {
      if (!hydrated) return "載入中";
      if (password.length < 4) return "密碼至少 4 字";

      const snapshot = dataRef.current ?? loadAppData();
      const existingLogin = authenticateAccount(snapshot, name, password);
      if (existingLogin) {
        loginAs(existingLogin.id, existingLogin.name);
        return null;
      }
      const dup = snapshot.accounts.find(
        (a) => a.name.toLowerCase() === name.trim().toLowerCase()
      );
      if (dup) return "此帳號已存在，請直接登入";

      let createdId = "";
      mutate((d) => {
        const next = addAccount(d, name, password);
        createdId = next.accounts[next.accounts.length - 1].id;
        return next;
      });
      loginAs(createdId, name.trim());
      return null;
    },
    [hydrated, loginAs, mutate]
  );

  const deleteAccountById = useCallback(
    (accountId: string): boolean => {
      if (!isAdminAccount(currentAccount)) return false;
      const target = findAccountById(dataRef.current ?? dataOrEmpty, accountId);
      if (!target || isAdminAccount(target)) return false;
      if (accountId === currentAccount?.id) return false;
      mutate((d) => removeAccount(d, accountId));
      return true;
    },
    [currentAccount, dataOrEmpty, mutate]
  );

  const joinMatchById = useCallback(
    (matchId: string): boolean => {
      if (!currentAccount) return false;
      let ok = false;
      mutate((d) => {
        const next = joinMatchAction(d, matchId, currentAccount);
        if (next === d) return d;
        ok = true;
        return next;
      });
      return ok;
    },
    [currentAccount, mutate]
  );

  const addPartToLibrary = useCallback(
    (part: Omit<LibraryPart, "id">) => {
      if (!currentAccount) return;
      mutate((d) => addLibraryPart(d, currentAccount.id, part));
    },
    [currentAccount, mutate]
  );

  const removePartFromLibrary = useCallback(
    (partId: string) => {
      if (!currentAccount) return;
      mutate((d) => removeLibraryPart(d, currentAccount.id, partId));
    },
    [currentAccount, mutate]
  );

  const saveBuildToLibrary = useCallback(
    (
      beyblade: Beyblade,
      partTypes: Partial<Record<PhstudyPartCategory, string>>
    ) => {
      if (!currentAccount) return;
      const build = createLibraryBuild(beyblade, partTypes);
      mutate((d) => addLibraryBuild(d, currentAccount.id, build));
    },
    [currentAccount, mutate]
  );

  const removeBuildFromLibrary = useCallback(
    (buildId: string) => {
      if (!currentAccount) return;
      mutate((d) => removeLibraryBuild(d, currentAccount.id, buildId));
    },
    [currentAccount, mutate]
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
    (displayName: string, icon: string | undefined): boolean => {
      if (!isAdminAccount(currentAccount)) return false;
      mutate((d) => setFighterIconAction(d, displayName, icon));
      return true;
    },
    [currentAccount, mutate]
  );

  const value: AppDataContextValue = {
    data: dataOrEmpty,
    hydrated,
    syncStatus,
    syncError,
    syncRefreshing,
    refreshCloudSync,
    syncEnabled,
    currentAccount,
    isAdmin,
    userLibrary,
    saveMatch,
    removeMatchById,
    loadSample,
    resetAll,
    setData: mutate,
    loginWithPassword,
    registerWithPassword,
    logout,
    deleteAccountById,
    joinMatchById,
    addPartToLibrary,
    removePartFromLibrary,
    saveBuildToLibrary,
    removeBuildFromLibrary,
    toxicQuotesEnabled,
    setToxicQuotesEnabled,
    setFighterIcon,
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
