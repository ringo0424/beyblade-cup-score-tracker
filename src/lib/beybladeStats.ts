import type { Beyblade, BeybladeStats } from "@/types";
import type { PhstudyPartCategory } from "@/lib/phstudy/types";
import {
  BEYBLADE_FIELD_TO_PHSTUDY,
  type BeybladePartField,
} from "@/lib/phstudy/mapping";

const TYPE_WEIGHT: Record<
  string,
  Pick<BeybladeStats, "attack" | "defense" | "stamina" | "dash">
> = {
  attack: { attack: 25, defense: 8, stamina: 10, dash: 12 },
  defense: { attack: 8, defense: 25, stamina: 12, dash: 8 },
  stamina: { attack: 10, defense: 12, stamina: 25, dash: 8 },
  balance: { attack: 16, defense: 16, stamina: 16, dash: 10 },
};

const PART_FIELDS: BeybladePartField[] = [
  "steelBlade",
  "lockDisk",
  "axis",
  "emblemLock",
  "mainBlade",
  "xtremeBlade",
  "metalBlade",
  "assistBlade",
];

function partContribution(type?: string): BeybladeStats {
  const w = TYPE_WEIGHT[type ?? "balance"] ?? TYPE_WEIGHT.balance;
  return {
    attack: w.attack,
    defense: w.defense,
    stamina: w.stamina,
    dash: w.dash,
    burst: type === "attack" ? 3 : 1,
    height: 5,
    weight: 2,
    total: 0,
  };
}

function sumStats(parts: BeybladeStats[]): BeybladeStats {
  const base = {
    attack: 0,
    defense: 0,
    stamina: 0,
    dash: 0,
    burst: 0,
    height: 0,
    weight: 0,
    total: 0,
  };
  for (const p of parts) {
    base.attack += p.attack;
    base.defense += p.defense;
    base.stamina += p.stamina;
    base.dash += p.dash;
    base.burst += p.burst;
    base.height += p.height;
    base.weight += p.weight;
  }
  base.total = base.attack + base.defense + base.stamina + base.dash;
  return base;
}

export function inferTypeLabel(stats: BeybladeStats): string {
  const { attack, defense, stamina, dash } = stats;
  const max = Math.max(attack, defense, stamina, dash);
  if (max === attack) return "攻擊型";
  if (max === defense) return "防禦型";
  if (max === stamina) return "持久型";
  if (max === dash) return "加速型";
  return "平衡型";
}

export function computeBeybladeStats(
  beyblade: Pick<Beyblade, BeybladePartField | "catalogPartIds">,
  partTypes: Partial<Record<PhstudyPartCategory, string>>
): BeybladeStats & { typeLabel: string } {
  const contribs: BeybladeStats[] = [];

  for (const field of PART_FIELDS) {
    const name = beyblade[field]?.trim();
    if (!name) continue;
    const category = BEYBLADE_FIELD_TO_PHSTUDY[field];
    const type = partTypes[category];
    contribs.push(partContribution(type));
  }

  const stats = sumStats(contribs.length ? contribs : [partContribution("balance")]);
  return { ...stats, typeLabel: inferTypeLabel(stats) };
}
