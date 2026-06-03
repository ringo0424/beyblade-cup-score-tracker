export type FinishType =
  | "spin"
  | "burst"
  | "over"
  | "xtreme"
  | "preContactStadiumOut";

export type ScoreTarget = 4 | 7 | 10 | "unlimited";

export type MatchType = "1v1" | "roundRobin";

export type MatchStatus =
  | "draft"
  | "setup"
  | "inProgress"
  | "completed";

export type BattleStatus = "pending" | "inProgress" | "completed";

export interface ScoreRule {
  spin: number;
  burst: number;
  over: number;
  xtreme: number;
  preContactStadiumOut: number;
}

export const DEFAULT_SCORE_RULE: ScoreRule = {
  spin: 1,
  burst: 2,
  over: 2,
  xtreme: 3,
  preContactStadiumOut: 1,
};

export interface BeybladeCatalogPartIds {
  steelBlade?: string;
  lockDisk?: string;
  axis?: string;
  emblemLock?: string;
  mainBlade?: string;
  xtremeBlade?: string;
  metalBlade?: string;
  assistBlade?: string;
}

export interface Beyblade {
  id: string;
  nickname: string;
  steelBlade: string;
  lockDisk: string;
  axis: string;
  emblemLock: string;
  mainBlade: string;
  xtremeBlade: string;
  metalBlade: string;
  assistBlade: string;
  notes: string;
  /** Optional part IDs from beyblade.phstudy.org for deep links */
  catalogPartIds?: BeybladeCatalogPartIds;
}

export interface BeybladeSetup {
  playerId: string;
  beyblades: Beyblade[];
  battleOrder: [string, string, string];
}

export interface Player {
  id: string;
  name: string;
  /** Logged-in account that owns this slot */
  accountId?: string;
}

export interface RoundResult {
  id: string;
  battlePairingId: string;
  winnerPlayerId: string | null;
  loserPlayerId: string | null;
  finishType: FinishType;
  pointsAwarded: number;
  recipientPlayerId: string;
  isReplay: boolean;
  createdAt: string;
}

/** 比賽結束後冠軍／亞軍紀念照（JPEG data URL，用於背景） */
export interface MatchCelebrationPhotos {
  champion?: string;
  runnerUp?: string;
  updatedAt?: string;
}

export interface BattlePairing {
  id: string;
  playerAId: string;
  playerBId: string;
  scoreA: number;
  scoreB: number;
  status: BattleStatus;
  winnerPlayerId: string | null;
  order: number;
}

export interface Match {
  id: string;
  eventDayId: string;
  name: string;
  date: string;
  time: string;
  location: string;
  scoreTarget: ScoreTarget;
  matchType: MatchType;
  players: Player[];
  beybladeSetups: BeybladeSetup[];
  pairings: BattlePairing[];
  rounds: RoundResult[];
  status: MatchStatus;
  currentPairingIndex: number;
  winnerPlayerId: string | null;
  /** Account that created the match */
  hostAccountId?: string;
  /** 冠軍／亞軍紀念照，作為比賽背景 */
  celebrationPhotos?: MatchCelebrationPhotos;
  createdAt: string;
  updatedAt: string;
}

export interface BeybladeStats {
  attack: number;
  defense: number;
  stamina: number;
  dash: number;
  burst: number;
  height: number;
  weight: number;
  total: number;
}

export interface LibraryPart {
  id: string;
  phstudyId: string;
  category: string;
  name: string;
  partType?: string;
}

export interface LibraryBuild {
  id: string;
  nickname: string;
  steelBlade: string;
  lockDisk: string;
  axis: string;
  emblemLock: string;
  mainBlade: string;
  xtremeBlade: string;
  metalBlade: string;
  assistBlade: string;
  notes: string;
  catalogPartIds?: BeybladeCatalogPartIds;
  stats: BeybladeStats;
  typeLabel: string;
  createdAt: string;
}

export interface UserLibrary {
  accountId: string;
  savedParts: LibraryPart[];
  builds: LibraryBuild[];
}

export interface Account {
  id: string;
  name: string;
  passwordHash: string;
  isAdmin?: boolean;
  createdAt: string;
}

/** 選手檔案（Icon 等；冠亞軍次數由比賽紀錄計算） */
export interface FighterProfile {
  id: string;
  nameKey: string;
  displayName: string;
  accountId?: string;
  /** Emoji 或短文字，最多 8 字元 */
  icon?: string;
}

export interface AppSettings {
  /** 毒舌評語池（可選） */
  toxicQuotesEnabled?: boolean;
}

export interface EventDay {
  id: string;
  date: string;
  location: string;
  matchIds: string[];
  createdAt: string;
}

export interface AppData {
  eventDays: EventDay[];
  matches: Match[];
  accounts: Account[];
  libraries: UserLibrary[];
  fighters?: FighterProfile[];
  settings?: AppSettings;
  version: number;
}
