import bcrypt from "bcryptjs";
import { generateId } from "@/lib/id";
import type { Account } from "@/types";
import { ADMIN_ACCOUNT_NAME, normalizeAccountName } from "@/lib/accounts";

/** Bootstrap admin password — change after first login in production */
const RINGO_BOOTSTRAP_PASSWORD =
  process.env.RINGO_BOOTSTRAP_PASSWORD ?? "99913579";

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  if (!hash) return false;
  return bcrypt.compareSync(password, hash);
}

export function createRingoSeedAccount(): Account {
  return {
    id: generateId(),
    name: ADMIN_ACCOUNT_NAME,
    passwordHash: hashPassword(RINGO_BOOTSTRAP_PASSWORD),
    isAdmin: true,
    createdAt: new Date().toISOString(),
  };
}

export function createAccountWithPassword(
  name: string,
  password: string
): Account {
  return {
    id: generateId(),
    name: normalizeAccountName(name),
    passwordHash: hashPassword(password),
    isAdmin: false,
    createdAt: new Date().toISOString(),
  };
}

export function ensureRingoAccount(accounts: Account[]): Account[] {
  let list = accounts.map((a) => {
    if (a.name.trim().toUpperCase() === ADMIN_ACCOUNT_NAME) {
      return {
        ...a,
        isAdmin: true,
        passwordHash: a.passwordHash || hashPassword(RINGO_BOOTSTRAP_PASSWORD),
      };
    }
    return a;
  });

  const hasRingo = list.some(
    (a) => a.name.trim().toUpperCase() === ADMIN_ACCOUNT_NAME
  );
  if (!hasRingo) {
    list = [...list, createRingoSeedAccount()];
  }
  return list;
}
