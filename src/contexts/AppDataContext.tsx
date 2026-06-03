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
import type { Account, AppData, Match } from "@/types";
import { CURRENT_ACCOUNT_STORAGE_KEY } from "@/lib/constants";
import {
  addAccount,
  findAccountById,
  findAccountByName,
  isAdminAccount,
  joinMatch as joinMatchAction,
  removeAccount,
} from "@/lib/accounts";
import {
  loadAppData,
  saveAppData,
  upsertMatch,
  deleteMatch as removeMatch,
  seedSampleData,
  clearAllData,
} from "@/lib/storage";
import { isSyncConfigured } from "@/lib/sync/supabase";
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
  syncEnabled: boolean;
  currentAccount: Account | null;
  isAdmin: boolean;
  saveMatch: (match: Match) => void;
  removeMatchById: (matchId: string) => void;
  loadSample: () => void;
  resetAll: () => void;
  setData: (next: AppData) => void;
  loginAs: (accountId: string) => void;
  logout: () => void;
  registerAccount: (name: string) => Account | null;
  deleteAccountById: (accountId: string) => boolean;
  joinMatchById: (matchId: string) => boolean;
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
  const revisionRef = useRef(0);
  const applyingRemoteRef = useRef(false);
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncEnabled = isSyncConfigured();
  const dataOrEmpty = data ?? {
    eventDays: [],
    matches: [],
    accounts: [],
    version: 2,
  };
  const currentAccount = currentAccountId
    ? findAccountById(dataOrEmpty, currentAccountId) ?? null
    : null;
  const isAdmin = isAdminAccount(currentAccount);

  const persistLocal = useCallback((next: AppData) => {
    setDataState(next);
    saveAppData(next);
  }, []);

  const scheduleCloudPush = useCallback(
    (next: AppData) => {
      if (!syncEnabled || applyingRemoteRef.current) return;
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
      pushTimerRef.current = setTimeout(async () => {
        const result = await pushGlobalState(next, revisionRef.current);
        if (result.ok) {
          revisionRef.current = result.revision;
          setSyncStatus("synced");
          setSyncError(null);
        } else if ("conflict" in result && result.conflict) {
          applyingRemoteRef.current = true;
          revisionRef.current = result.revision;
          persistLocal(result.payload);
          applyingRemoteRef.current = false;
          setSyncError("其他人剛更新，已同步最新資料");
        } else if (!result.ok) {
          setSyncStatus("error");
          setSyncError(result.error);
        }
      }, 350);
    },
    [persistLocal, syncEnabled]
  );

  const persist = useCallback(
    (next: AppData) => {
      persistLocal(next);
      if (syncEnabled) {
        setSyncStatus("synced");
        scheduleCloudPush(next);
      }
    },
    [persistLocal, scheduleCloudPush, syncEnabled]
  );

  useEffect(() => {
    const local = loadAppData();
    setDataState(local);
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
      persistLocal(result.payload);
      applyingRemoteRef.current = false;
      setSyncStatus("synced");
    });
  }, [persistLocal, syncEnabled]);

  useEffect(() => {
    if (!syncEnabled) return;

    const unsubscribe = subscribeGlobalState((payload, revision) => {
      if (revision <= revisionRef.current) return;
      applyingRemoteRef.current = true;
      revisionRef.current = revision;
      persistLocal(payload);
      applyingRemoteRef.current = false;
      setSyncStatus("synced");
    });

    return unsubscribe;
  }, [persistLocal, syncEnabled]);

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

  const loginAs = useCallback((accountId: string) => {
    localStorage.setItem(CURRENT_ACCOUNT_STORAGE_KEY, accountId);
    setCurrentAccountId(accountId);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(CURRENT_ACCOUNT_STORAGE_KEY);
    setCurrentAccountId(null);
  }, []);

  const registerAccount = useCallback(
    (name: string): Account | null => {
      if (!data) return null;
      const existing = findAccountByName(data, name);
      if (existing) {
        loginAs(existing.id);
        return existing;
      }
      const next = addAccount(data, name);
      const created = next.accounts[next.accounts.length - 1];
      persist(next);
      loginAs(created.id);
      return created;
    },
    [data, persist, loginAs]
  );

  const deleteAccountById = useCallback(
    (accountId: string): boolean => {
      if (!data || !isAdminAccount(currentAccount)) return false;
      if (accountId === currentAccount?.id) return false;
      const next = removeAccount(data, accountId);
      persist(next);
      return true;
    },
    [currentAccount, data, persist]
  );

  const joinMatchById = useCallback(
    (matchId: string): boolean => {
      if (!data || !currentAccount) return false;
      const next = joinMatchAction(data, matchId, currentAccount);
      if (next === data) return false;
      persist(next);
      return true;
    },
    [currentAccount, data, persist]
  );

  const value: AppDataContextValue = {
    data: dataOrEmpty,
    hydrated,
    syncStatus,
    syncError,
    syncEnabled,
    currentAccount,
    isAdmin,
    saveMatch,
    removeMatchById,
    loadSample,
    resetAll,
    setData: persist,
    loginAs,
    logout,
    registerAccount,
    deleteAccountById,
    joinMatchById,
  };

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error("useAppData must be used within AppDataProvider");
  }
  return ctx;
}
