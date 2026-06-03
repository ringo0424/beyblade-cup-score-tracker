"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "@/hooks/useAppData";
import { getMatch } from "@/lib/storage";
import { createDefaultSetup } from "@/lib/beyblade";
import type { BeybladeSetup, Match } from "@/types";
import { BeybladeForm } from "@/components/beyblade/BeybladeForm";
import { BattleOrderList } from "@/components/beyblade/BattleOrderList";
import { PartsCatalogBanner } from "@/components/beyblade/PartsCatalogBanner";
import { PartsCatalogProvider } from "@/contexts/PartsCatalogContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function SetupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data, saveMatch, hydrated } = useAppData();
  const [match, setMatch] = useState<Match | null>(null);
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);

  useEffect(() => {
    if (!hydrated) return;
    const m = getMatch(data, id);
    if (!m) {
      router.replace("/");
      return;
    }
    let setups = m.beybladeSetups;
    if (setups.length !== m.players.length) {
      setups = m.players.map(
        (p) =>
          setups.find((s) => s.playerId === p.id) ?? createDefaultSetup(p.id)
      );
    }
    setMatch({ ...m, beybladeSetups: setups });
  }, [data, id, hydrated, router]);

  if (!match) {
    return <p className="text-gray-500 text-center py-8">載入中…</p>;
  }

  const player = match.players[activePlayerIndex];
  const setupIndex = match.beybladeSetups.findIndex(
    (s) => s.playerId === player.id
  );
  const setup = match.beybladeSetups[setupIndex];

  const updateSetup = (updated: BeybladeSetup) => {
    const setups = [...match.beybladeSetups];
    setups[setupIndex] = updated;
    setMatch({ ...match, beybladeSetups: setups });
  };

  const updateBeyblade = (bIndex: number, updated: BeybladeSetup["beyblades"][0]) => {
    const beyblades = [...setup.beyblades];
    beyblades[bIndex] = updated;
    updateSetup({ ...setup, beyblades });
  };

  const saveSetups = () => {
    saveMatch({ ...match, updatedAt: new Date().toISOString() });
  };

  const startMatch = () => {
    const updated: Match = {
      ...match,
      beybladeSetups: match.beybladeSetups,
      status: "inProgress",
      updatedAt: new Date().toISOString(),
    };
    saveMatch(updated);
    if (match.matchType === "roundRobin") {
      router.push(`/match/${id}/round-robin`);
    } else {
      router.push(`/match/${id}/dashboard`);
    }
  };

  return (
    <PartsCatalogProvider>
    <div>
      <h2 className="text-xl font-bold mb-1">{match.name}</h2>
      <p className="text-sm text-gray-500 mb-4">戰刃設定 — 每位選手 3 組</p>

      <PartsCatalogBanner />

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {match.players.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setActivePlayerIndex(i)}
            className={`shrink-0 px-4 py-2 rounded-xl border text-sm font-medium ${
              i === activePlayerIndex
                ? "border-arena-neon bg-arena-neon/15 text-arena-neon"
                : "border-arena-border text-gray-400"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      <Card className="mb-4" glow>
        <h3 className="font-bold text-arena-purple mb-3">{player.name}</h3>
        <BattleOrderList setup={setup} onChange={updateSetup} />
      </Card>

      {setup.beyblades.map((b, i) => (
        <BeybladeForm
          key={b.id}
          beyblade={b}
          index={i}
          onChange={(updated) => updateBeyblade(i, updated)}
        />
      ))}

      <div className="flex gap-2 mt-6 sticky bottom-20 bg-arena-black/90 py-2 -mx-1 px-1">
        {activePlayerIndex > 0 && (
          <Button
            variant="secondary"
            onClick={() => setActivePlayerIndex(activePlayerIndex - 1)}
          >
            上一位
          </Button>
        )}
        {activePlayerIndex < match.players.length - 1 ? (
          <Button
            fullWidth
            onClick={() => {
              saveSetups();
              setActivePlayerIndex(activePlayerIndex + 1);
            }}
          >
            下一位選手
          </Button>
        ) : (
          <Button fullWidth onClick={startMatch}>
            開始比賽
          </Button>
        )}
      </div>
    </div>
    </PartsCatalogProvider>
  );
}
