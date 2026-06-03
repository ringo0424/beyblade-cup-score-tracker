import type { AppData, Match } from "@/types";
import { generateId } from "./id";
import { getTodayDateString } from "./storage";
import { createDefaultSetup } from "./beyblade";
import { create1v1Pairing } from "./pairings";

const today = getTodayDateString();

const playerA = { id: generateId(), name: "小明" };
const playerB = { id: generateId(), name: "小華" };

const sampleMatch: Match = {
  id: generateId(),
  eventDayId: generateId(),
  name: "4:00pm EOS杯",
  date: today,
  time: "4:00 PM",
  location: "EOS",
  scoreTarget: 4,
  matchType: "1v1",
  players: [playerA, playerB],
  beybladeSetups: [
    createDefaultSetup(playerA.id),
    createDefaultSetup(playerB.id),
  ],
  pairings: create1v1Pairing(playerA.id, playerB.id),
  rounds: [],
  status: "completed",
  currentPairingIndex: 0,
  winnerPlayerId: playerA.id,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

sampleMatch.pairings[0].scoreA = 4;
sampleMatch.pairings[0].scoreB = 2;
sampleMatch.pairings[0].winnerPlayerId = playerA.id;
sampleMatch.pairings[0].status = "completed";

export const sampleAppData: AppData = {
  version: 3,
  accounts: [],
  libraries: [],
  eventDays: [
    {
      id: sampleMatch.eventDayId,
      date: today,
      location: "EOS",
      matchIds: [sampleMatch.id],
      createdAt: sampleMatch.createdAt,
    },
  ],
  matches: [sampleMatch],
};
