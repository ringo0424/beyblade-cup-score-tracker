import { QUOTES_BY_POOL } from "./catalog";
import type { QuotePool } from "./types";
import {
  championHadPerfectRun,
  championWasUpsetCandidate,
  getChampionPlayer,
  getLastPlacePlayer,
  isEosMatch,
  matchHasXtremeFinish,
  pickRandomLoser,
} from "./matchContext";
import type { Match } from "@/types";

function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fillPlayerName(text: string, playerName: string): string {
  return text.replace(/\{playerName\}/g, playerName);
}

type WeightedPool = { pool: QuotePool; weight: number };

export interface PickedQuote {
  text: string;
  pool: QuotePool;
}

export function pickMatchEndQuote(
  match: Match,
  options?: { toxicEnabled?: boolean }
): PickedQuote {
  const champion = getChampionPlayer(match);
  const last = getLastPlacePlayer(match);
  const loser = pickRandomLoser(match);

  const weights: WeightedPool[] = [
    { pool: "winner", weight: champion ? 22 : 0 },
    { pool: "god", weight: champion ? 8 : 0 },
    { pool: "upset", weight: champion && championWasUpsetCandidate(match) ? 14 : 4 },
    { pool: "loser", weight: loser ? 12 : 0 },
    { pool: "last", weight: last && last.id !== champion?.id ? 10 : 0 },
    { pool: "xtreme", weight: matchHasXtremeFinish(match) ? 14 : 3 },
    {
      pool: "perfect",
      weight: champion && championHadPerfectRun(match) ? 12 : 0,
    },
    { pool: "eos", weight: isEosMatch(match) ? 12 : 2 },
    { pool: "random", weight: 10 },
    { pool: "toxic", weight: options?.toxicEnabled && loser ? 8 : 0 },
  ];

  const total = weights.reduce((s, w) => s + w.weight, 0);
  let roll = Math.random() * total;
  let chosen: QuotePool = "random";
  for (const w of weights) {
    roll -= w.weight;
    if (roll <= 0) {
      chosen = w.pool;
      break;
    }
  }

  const templates = QUOTES_BY_POOL[chosen];
  const template = pickOne(templates);

  let name = champion?.name ?? loser?.name ?? last?.name ?? "選手";
  if (chosen === "loser" || chosen === "toxic") {
    name = loser?.name ?? name;
  } else if (chosen === "last") {
    name = last?.name ?? name;
  } else if (template.text.includes("{playerName}") && champion) {
    name = champion.name;
  }

  return {
    pool: chosen,
    text: fillPlayerName(template.text, name),
  };
}
