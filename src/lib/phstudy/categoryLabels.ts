import type { PhstudyPartCategory } from "./types";

export const PHSTUDY_CATEGORY_LABELS: Record<PhstudyPartCategory, string> = {
  Blade: "鋼鐵戰刃",
  Ratchet: "固鎖輪盤",
  Bit: "軸心",
  LockChip: "紋章鎖",
  MainBlade: "主要戰刃",
  OverBlade: "超越戰刃",
  MetalBlade: "金屬戰刃",
  AssistBlade: "輔助戰刃",
};

export const PHSTUDY_CATEGORY_ORDER: PhstudyPartCategory[] = [
  "Blade",
  "Ratchet",
  "Bit",
  "LockChip",
  "MainBlade",
  "OverBlade",
  "MetalBlade",
  "AssistBlade",
];
