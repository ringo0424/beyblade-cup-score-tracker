import { normalizeAccountName } from "@/lib/accounts";

export function fighterNameKey(name: string): string {
  return normalizeAccountName(name).toLowerCase();
}

export function fighterDisplayName(name: string): string {
  return normalizeAccountName(name);
}
