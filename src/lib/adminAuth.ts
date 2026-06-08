import { ADMIN_PASSWORD, ADMIN_SESSION_KEY } from "@/lib/constants";

export function isAdminLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === "1";
}

export function loginAdmin(password: string): boolean {
  if (password.trim() !== ADMIN_PASSWORD) return false;
  sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
  return true;
}

export function logoutAdmin(): void {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
}
