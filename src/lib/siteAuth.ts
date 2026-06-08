import { SITE_PASSWORD, SITE_UNLOCK_KEY } from "@/lib/constants";

export function isSiteUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SITE_UNLOCK_KEY) === "1";
}

export function unlockSite(password: string): boolean {
  if (password.trim() !== SITE_PASSWORD) return false;
  localStorage.setItem(SITE_UNLOCK_KEY, "1");
  return true;
}

export function lockSite(): void {
  localStorage.removeItem(SITE_UNLOCK_KEY);
}
