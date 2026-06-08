import { isAdminAccount, normalizeAccountName } from "@/lib/accounts";
import type { Account, AppData } from "@/types";

function accountNameKey(name: string): string {
  return normalizeAccountName(name).toLowerCase();
}

function mergeAccountPair(a: Account, b: Account): Account {
  const base = a.createdAt >= b.createdAt ? a : b;
  const other = a.createdAt >= b.createdAt ? b : a;
  return {
    ...base,
    passwordHash: base.passwordHash || other.passwordHash,
    isAdmin: base.isAdmin || other.isAdmin,
  };
}

/** 合併帳號並記錄舊 id → 保留 id */
export function mergeAccountsWithRemap(
  local: Account[],
  remote: Account[],
  deletedAccountIds: Set<string>
): { accounts: Account[]; idRemap: Map<string, string> } {
  const idRemap = new Map<string, string>();
  const byId = new Map<string, Account>();

  const ingest = (incoming: Account) => {
    if (deletedAccountIds.has(incoming.id) && !isAdminAccount(incoming)) {
      return;
    }
    const byName = [...byId.values()].find(
      (x) => accountNameKey(x.name) === accountNameKey(incoming.name)
    );
    const bySameId = byId.get(incoming.id);
    const existing = bySameId ?? byName;

    if (!existing) {
      byId.set(incoming.id, incoming);
      return;
    }

    const merged = mergeAccountPair(existing, incoming);
    const canonicalId = merged.id;

    if (existing.id !== canonicalId) {
      idRemap.set(existing.id, canonicalId);
      byId.delete(existing.id);
    }
    if (incoming.id !== canonicalId) {
      idRemap.set(incoming.id, canonicalId);
    }
    byId.set(canonicalId, merged);
  };

  for (const a of remote) ingest(a);
  for (const a of local) ingest(a);

  return { accounts: Array.from(byId.values()), idRemap };
}

export function applyAccountIdRemap(
  data: AppData,
  idRemap: Map<string, string>
): AppData {
  if (idRemap.size === 0) return data;

  const remap = (id?: string) => {
    if (!id) return id;
    let current = id;
    const seen = new Set<string>();
    while (idRemap.has(current) && !seen.has(current)) {
      seen.add(current);
      current = idRemap.get(current)!;
    }
    return current;
  };

  return {
    ...data,
    libraries: data.libraries.map((l) => ({
      ...l,
      accountId: remap(l.accountId) ?? l.accountId,
    })),
    matches: data.matches.map((m) => ({
      ...m,
      hostAccountId: remap(m.hostAccountId),
      players: m.players.map((p) => ({
        ...p,
        accountId: p.accountId ? remap(p.accountId) : p.accountId,
      })),
    })),
  };
}

export function resolveRemappedAccountId(
  idRemap: Map<string, string>,
  storedId: string
): string {
  return remapId(idRemap, storedId);
}

function remapId(idRemap: Map<string, string>, id: string): string {
  let current = id;
  const seen = new Set<string>();
  while (idRemap.has(current) && !seen.has(current)) {
    seen.add(current);
    current = idRemap.get(current)!;
  }
  return current;
}
