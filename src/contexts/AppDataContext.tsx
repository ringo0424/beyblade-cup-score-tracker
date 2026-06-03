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
import { CURRENT_ACCOUNT_STORAGE_KEY } from "@/lib/constants";
import {
  addAccount,
  authenticateAccount,
  findAccountById,
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
  const revisionRef = useRef(0);
  const applyingRemoteRef = useRef(false);
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncEnabled = isSyncConfigured();
  const dataOrEmpty = data ?? normalizeAppData({});
  const currentAccount = currentAccountId
    ? findAccountById(dataOrEmpty, currentAccountId) ?? null
    : null;
  const isAdmin = isAdminAccount(currentAccount);
  const toxicQuotesEnabled = Boolean(dataOrEmpty.settings?.toxicQuotesEnabled);
  const userLibrary = currentAccount
    ? getUserLibrary(dataOrEmpty, currentAccount.id)
    : { accountId: "", savedParts: [], builds: [] };

  const persistLocal = useCallback((next: AppData) => {
    const normalized = normalizeAppData(next);
    setDataState(normalized);
    saveAppData(normalized);
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
        } else if (!result.ok && "error" in result) {
          setSyncStatus("error");
          setSyncError(result.error);
        }
      }, 350);
    },
    [persistLocal, syncEnabled]
  );

  const persist = useCallback(
    (next: AppData) => {
      const normalized = normalizeAppData(next);
      persistLocal(normalized);
      if (syncEnabled) {
        setSyncStatus("synced");
        scheduleCloudPush(normalized);
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
    return subscribeGlobalState((payload, revision) => {
      if (revision <= revisionRef.current) return;
      applyingRemoteRef.current = true;
      revisionRef.current = revision;
      persistLocal(payload);
      applyingRemoteRef.current = false;
      setSyncStatus("synced");
    });
  }, [persistLocal, syncEnabled]);

  const loginAs = useCallback((accountId: string) => {
    localStorage.setItem(CURRENT_ACCOUNT_STORAGE_KEY, accountId);
    setCurrentAccountId(accountId);
  }, []);

  const saveMatch = useCallback(
    (match: Match) => {
      if (!data) return;
      persist(upsertMatch(data, match));
    },
    [data, persist]
  );

  const removeMatchById = useCallback(
    (matchId: string): boolean => {
      if (!data || !isAdminAccount(currentAccount)) return false;
      persist(removeMatch(data, matchId));
      return true;
    },
    [currentAccount, data, persist]
  );

  const loadSample = useCallback(() => {
    persist(seedSampleData());
  }, [persist]);

  const resetAll = useCallback(() => {
    persist(clearAllData());
  }, [persist]);

  const logout = useCallback(() => {
    localStorage.removeItem(CURRENT_ACCOUNT_STORAGE_KEY);
    setCurrentAccountId(null);
  }, []);

  const loginWithPassword = useCallback(
    (name: string, password: string): string | null => {
      if (!data) return "載入中";
      const account = authenticateAccount(data, name, password);
      if (!account) return "帳號或密碼錯誤";
      loginAs(account.id);
      return null;
    },
    [data, loginAs]
  );

  const registerWithPassword = useCallback(
    (name: string, password: string): string | null => {
      if (!data) return "載入中";
      if (password.length < 4) return "密碼至少 4 字";
      if (authenticateAccount(data, name, password)) {
        loginAs(authenticateAccount(data, name, password)!.id);
        return null;
      }
      const existing = data.accounts.find(
        (a) => a.name.toLowerCase() === name.trim().toLowerCase()
      );
      if (existing) return "此帳號已存在，請直接登入";
      const next = addAccount(data, name, password);
      const created = next.accounts[next.accounts.length - 1];
      persist(next);
      loginAs(created.id);
      return null;
    },
    [data, loginAs, persist]
  );

  const deleteAccountById = useCallback(
    (accountId: string): boolean => {
      if (!data || !isAdminAccount(currentAccount)) return false;
      if (accountId === currentAccount?.id) return false;
      persist(removeAccount(data, accountId));
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

  const addPartToLibrary = useCallback(
    (part: Omit<LibraryPart, "id">) => {
      if (!data || !currentAccount) return;
      persist(addLibraryPart(data, currentAccount.id, part));
    },
    [currentAccount, data, persist]
  );

  const removePartFromLibrary = useCallback(
    (partId: string) => {
      if (!data || !currentAccount) return;
      persist(removeLibraryPart(data, currentAccount.id, partId));
    },
    [currentAccount, data, persist]
  );

  const saveBuildToLibrary = useCallback(
    (
      beyblade: Beyblade,
      partTypes: Partial<Record<PhstudyPartCategory, string>>
    ) => {
      if (!data || !currentAccount) return;
      const build = createLibraryBuild(beyblade, partTypes);
      persist(addLibraryBuild(data, currentAccount.id, build));
    },
    [currentAccount, data, persist]
  );

  const removeBuildFromLibrary = useCallback(
    (buildId: string) => {
      if (!data || !currentAccount) return;
      persist(removeLibraryBuild(data, currentAccount.id, buildId));
    },
    [currentAccount, data, persist]
  );

  const setToxicQuotesEnabled = useCallback(
    (enabled: boolean) => {
      if (!data) return;
      persist({
        ...data,
        settings: { ...data.settings, toxicQuotesEnabled: enabled },
      });
    },
    [data, persist]
  );

  const setFighterIcon = useCallback(
    (displayName: string, icon: string | undefined): boolean => {
      if (!data || !isAdminAccount(currentAccount)) return false;
      persist(setFighterIconAction(data, displayName, icon));
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
    userLibrary,
    saveMatch,
    removeMatchById,
    loadSample,
    resetAll,
    setData: persist,
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
