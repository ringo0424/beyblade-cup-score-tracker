export const APP_NAME = "Beyblade Cup Score Tracker";
export const STORAGE_KEY = "beyblade-cup-score-tracker-v1";
export const CURRENT_ACCOUNT_STORAGE_KEY = "beyblade-current-account-id-v1";
export const CURRENT_ACCOUNT_NAME_STORAGE_KEY =
  "beyblade-current-account-name-v1";
export const DEFAULT_LOCATION = "EOS";
export const TIME_SHORTCUTS = ["12:00 PM", "4:00 PM", "6:30 PM"] as const;

export const SCORE_TARGET_OPTIONS: {
  value: 4 | 7 | 10 | "unlimited";
  label: string;
}[] = [
  { value: 4, label: "先達 4 分" },
  { value: 7, label: "先達 7 分" },
  { value: 10, label: "先達 10 分" },
  { value: "unlimited", label: "無上限（最高分獲勝）" },
];

export const FINISH_LABELS: Record<string, string> = {
  spin: "Spin Finish +1",
  burst: "Burst Finish +2",
  over: "Over Finish +2",
  xtreme: "Xtreme Finish +3",
  preContactStadiumOut: "碰對手前出界 +1（重賽）",
};

export const PHSTUDY_ATTRIBUTION_URL = "https://beyblade.phstudy.org/index.html";

export const BEYBLADE_FIELD_LABELS: Record<string, string> = {
  nickname: "暱稱 / 名稱",
  steelBlade: "鋼鐵戰刃",
  lockDisk: "固鎖輪盤",
  axis: "軸心",
  emblemLock: "紋章鎖",
  mainBlade: "主要戰刃",
  xtremeBlade: "超越戰刃",
  metalBlade: "金屬戰刃",
  assistBlade: "輔助戰刃",
  notes: "備註",
};
