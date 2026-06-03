import type { PhstudyPartCategory } from "./types";

const PHSTUDY_ORIGIN = "https://beyblade.phstudy.org";

/** Same folder rules as beyblade.phstudy.org viewer.js */
const APP_FOLDER_MAP: Record<PhstudyPartCategory, string> = {
  Blade: "Big",
  Ratchet: "Ratchet",
  Bit: "Bit",
  LockChip: "LockChip",
  MainBlade: "MainBlade",
  OverBlade: "OverBlade",
  MetalBlade: "MetalBlade",
  AssistBlade: "AssistBlade",
};

const SITE_FOLDER_MAP: Record<PhstudyPartCategory, string> = {
  Blade: "Blade",
  Ratchet: "Ratchet",
  Bit: "Bit",
  LockChip: "LockChip",
  MainBlade: "MainBlade",
  OverBlade: "OverBlade",
  MetalBlade: "MetalBlade",
  AssistBlade: "AssistBlade",
};

export interface PhstudyImagePaths {
  primary: string;
  fallbackJpg: string;
  fallbackApp: string;
}

export function getPhstudyImagePaths(
  category: PhstudyPartCategory,
  partId: string
): PhstudyImagePaths {
  const siteFolder = SITE_FOLDER_MAP[category];
  const appFolder = APP_FOLDER_MAP[category];
  const base = `${PHSTUDY_ORIGIN}/images`;
  return {
    primary: `${base}/site/${siteFolder}/${partId}.png`,
    fallbackJpg: `${base}/site/${siteFolder}/${partId}.jpg`,
    fallbackApp: `${base}/app/${appFolder}/${partId}.png`,
  };
}
