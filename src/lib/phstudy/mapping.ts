import type { Beyblade } from "@/types";
import type { PhstudyPartCategory } from "./types";

/** phstudy.org data keys → viewer categories */
export const PHSTUDY_CATEGORY_SOURCES: {
  key: string;
  category: PhstudyPartCategory;
}[] = [
  { key: "BeybladePartsBlade", category: "Blade" },
  { key: "BeybladePartsRatchet", category: "Ratchet" },
  { key: "BeybladePartsBit", category: "Bit" },
  { key: "BeybladePartsLockChip", category: "LockChip" },
  { key: "BeybladePartsMainBlade", category: "MainBlade" },
  { key: "BeybladePartsOverBlade", category: "OverBlade" },
  { key: "BeybladePartsMetalBlade", category: "MetalBlade" },
  { key: "BeybladePartsAssistBlade", category: "AssistBlade" },
];

export type BeybladePartField = keyof Pick<
  Beyblade,
  | "steelBlade"
  | "lockDisk"
  | "axis"
  | "emblemLock"
  | "mainBlade"
  | "xtremeBlade"
  | "metalBlade"
  | "assistBlade"
>;

export const BEYBLADE_FIELD_TO_PHSTUDY: Record<
  BeybladePartField,
  PhstudyPartCategory
> = {
  steelBlade: "Blade",
  lockDisk: "Ratchet",
  axis: "Bit",
  emblemLock: "LockChip",
  mainBlade: "MainBlade",
  xtremeBlade: "OverBlade",
  metalBlade: "MetalBlade",
  assistBlade: "AssistBlade",
};

export type BeybladeCatalogIdField = keyof NonNullable<
  Beyblade["catalogPartIds"]
>;

export const CATALOG_ID_FIELD_MAP: Record<
  BeybladePartField,
  BeybladeCatalogIdField
> = {
  steelBlade: "steelBlade",
  lockDisk: "lockDisk",
  axis: "axis",
  emblemLock: "emblemLock",
  mainBlade: "mainBlade",
  xtremeBlade: "xtremeBlade",
  metalBlade: "metalBlade",
  assistBlade: "assistBlade",
};

export const PHSTUDY_DATA_BASE = "https://beyblade.phstudy.org/data";
export const PHSTUDY_VIEWER_URL = "https://beyblade.phstudy.org/index.html";

/** Open a specific part in phstudy viewer (modal deep link). */
export function phstudyPartUrl(
  partId: string,
  category: PhstudyPartCategory
): string {
  const params = new URLSearchParams({
    part: partId,
    cat: category,
  });
  return `${PHSTUDY_VIEWER_URL}?${params.toString()}`;
}

/** Browse a part category in phstudy (same as index.html?category=Blade). */
export function phstudyCategoryUrl(category: PhstudyPartCategory): string {
  const params = new URLSearchParams({ category });
  return `${PHSTUDY_VIEWER_URL}?${params.toString()}`;
}
