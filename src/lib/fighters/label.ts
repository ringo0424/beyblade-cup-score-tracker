import type { AppData, FighterProfile } from "@/types";
import { fighterDisplayName, fighterNameKey } from "./keys";

export function formatFighterLabel(
  name: string,
  title?: string | null
): string {
  const display = fighterDisplayName(name);
  const trimmedTitle = title?.trim();
  if (!trimmedTitle) return display;
  return `${display}「${trimmedTitle}」`;
}

export function formatFighterProfile(profile: Pick<FighterProfile, "displayName" | "title">): string {
  return formatFighterLabel(profile.displayName, profile.title);
}

export function findFighterProfile(
  data: AppData,
  nameKey: string
): FighterProfile | undefined {
  return data.fighters?.find((f) => f.nameKey === nameKey);
}

export function findFighterProfileByName(
  data: AppData,
  playerName: string
): FighterProfile | undefined {
  return findFighterProfile(data, fighterNameKey(playerName));
}

export function resolveFighterLabel(data: AppData, playerName: string): string {
  const profile = findFighterProfileByName(data, playerName);
  if (profile) return formatFighterProfile(profile);
  return fighterDisplayName(playerName);
}
