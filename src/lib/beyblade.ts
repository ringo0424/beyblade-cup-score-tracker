import type { Beyblade, BeybladeSetup } from "@/types";
import { generateId } from "./id";

export function createEmptyBeyblade(index: number): Beyblade {
  return {
    id: generateId(),
    nickname: `戰刃 ${index + 1}`,
    steelBlade: "",
    lockDisk: "",
    axis: "",
    emblemLock: "",
    mainBlade: "",
    xtremeBlade: "",
    metalBlade: "",
    assistBlade: "",
    notes: "",
  };
}

export function createDefaultSetup(playerId: string): BeybladeSetup {
  const beyblades = [0, 1, 2].map(createEmptyBeyblade);
  return {
    playerId,
    beyblades,
    battleOrder: [beyblades[0].id, beyblades[1].id, beyblades[2].id],
  };
}

export function reorderBattleOrder(
  setup: BeybladeSetup,
  fromIndex: number,
  direction: "up" | "down"
): BeybladeSetup {
  const order = [...setup.battleOrder];
  const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
  if (toIndex < 0 || toIndex >= order.length) return setup;
  [order[fromIndex], order[toIndex]] = [order[toIndex], order[fromIndex]];
  return { ...setup, battleOrder: order as [string, string, string] };
}

export function getOrderedBeyblades(setup: BeybladeSetup): Beyblade[] {
  return setup.battleOrder.map(
    (id) => setup.beyblades.find((b) => b.id === id)!
  );
}
