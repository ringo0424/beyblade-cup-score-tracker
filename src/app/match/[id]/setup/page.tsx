"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "@/hooks/useAppData";
import { resolveMatch } from "@/lib/storage";
import {
  canAddPlayerToMatch,
  maxPlayersForMatch,
  minPlayersForMatch,
} from "@/lib/accounts";
import { createDefaultSetup } from "@/lib/beyblade";
import type { BeybladeSetup, Match } from "@/types";
import { BeybladeTabPanel } from "@/components/beyblade/BeybladeTabPanel";
import { libraryBuildToBeyblade } from "@/contexts/AppDataContext";
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
  const {
    data,
    saveMatch,
    hydrated,
    sharedLibrary,
    addPlayerToMatchById,
    removePlayerFromMatchById,
  } = useAppData();
  const [match, setMatch] = useState<Match | null>(null);
  const [activeSlot, setActiveSlot] = useState(0);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [newPlayerName, setNewPlayerName] = useState("");

  useEffect(() => {
    if (!hydrated) return;
    const m = resolveMatch(data, id);
    if (!m) {
      router.replace("/");
      return;
    }

    const setups = m.players.map(
      (p) =>
        m.beybladeSetups.find((s) => s.playerId === p.id) ??
        createDefaultSetup(p.id)
    );

    setMatch((prev) => {
      if (!prev) {
        const firstId = m.players[0]?.id ?? null;
        if (firstId) setEditingPlayerId(firstId);
        return { ...m, beybladeSetups: setups };
      }

      const prevIds = prev.players.map((p) => p.id).join(",");
      const nextIds = m.players.map((p) => p.id).join(",");
      if (prevIds !== nextIds) {
        setEditingPlayerId((current) => {
          if (current && m.players.some((p) => p.id === current)) return current;
          return m.players[0]?.id ?? null;
        });
        return { ...m, beybladeSetups: setups };
      }

      return {
        ...m,
        beybladeSetups: m.players.map((p) => {
          const kept = prev.beybladeSetups.find((s) => s.playerId === p.id);
          const fromData = setups.find((s) => s.playerId === p.id)!;
          return kept ?? fromData;
        }),
      };
    });
  }, [data, hydrated, id, router]);

  if (!match) {
    return <p className="text-gray-500 text-center py-8">載入中…</p>;
  }

  const minPlayers = minPlayersForMatch(match);
  const maxPlayers = maxPlayersForMatch(match);
  const editingPlayer = match.players.find((p) => p.id === editingPlayerId);
  const setupIndex = editingPlayer
    ? match.beybladeSetups.findIndex((s) => s.playerId === editingPlayer.id)
    : -1;
  const setup =
    setupIndex >= 0
      ? match.beybladeSetups[setupIndex]
      : editingPlayer
        ? createDefaultSetup(editingPlayer.id)
        : null;

  const updateSetup = (updated: BeybladeSetup) => {
    if (setupIndex < 0) return;
    const setups = [...match.beybladeSetups];
    setups[setupIndex] = updated;
    setMatch({ ...match, beybladeSetups: setups });
  };

  const updateBeyblade = (
    bIndex: number,
    updated: BeybladeSetup["beyblades"][0]
  ) => {
    if (!setup) return;
    const beyblades = [...setup.beyblades];
    beyblades[bIndex] = updated;
    updateSetup({ ...setup, beyblades });
  };

  const saveSetups = () => {
    saveMatch({ ...match, updatedAt: new Date().toISOString() });
  };

  const startMatch = () => {
    if (match.players.length < minPlayers) return;
    const updated: Match = {
      ...match,
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

  const handleAddPlayer = () => {
    const name = newPlayerName.trim();
    if (!name) return;
    if (addPlayerToMatchById(match.id, name)) {
      setNewPlayerName("");
    } else {
      alert("無法新增選手（名稱重複或人數已滿）");
    }
  };

  return (
    <PartsCatalogProvider>
      <div>
        <h2 className="text-xl font-bold mb-1">{match.name}</h2>
        <p className="text-sm text-gray-500 mb-4">
          新增選手後，選擇要編輯的選手並填寫 3 組陀螺（任何人都可代填）。
        </p>

        <PartsCatalogBanner />

        <Card className="mb-4">
          <p className="text-xs text-gray-500 mb-2">
            選手（{match.players.length} / {maxPlayers}）
          </p>
          {match.players.length === 0 ? (
            <p className="text-sm text-gray-600 mb-3">尚無選手，請先新增。</p>
          ) : (
            <div className="flex flex-wrap gap-2 mb-3">
              {match.players.map((p) => (
                <div key={p.id} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditingPlayerId(p.id)}
                    className={`px-3 py-1.5 rounded-full text-sm border ${
                      editingPlayerId === p.id
                        ? "border-arena-neon text-arena-neon bg-arena-neon/10"
                        : "border-arena-border text-gray-400"
                    }`}
                  >
                    {p.name}
                  </button>
                  <button
                    type="button"
                    className="text-xs text-red-400 px-1"
                    aria-label={`移除 ${p.name}`}
                    onClick={() => {
                      if (!confirm(`移除選手「${p.name}」？`)) return;
                      removePlayerFromMatchById(match.id, p.id);
                      if (editingPlayerId === p.id) setEditingPlayerId(null);
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          {canAddPlayerToMatch(match) && (
            <div className="flex gap-2">
              <input
                className="input-arena flex-1"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="選手名稱"
                onKeyDown={(e) => e.key === "Enter" && handleAddPlayer()}
              />
              <Button type="button" onClick={handleAddPlayer}>
                新增
              </Button>
            </div>
          )}
          <p className="text-xs text-gray-600 mt-2">
            最少 {minPlayers} 人可開始比賽
          </p>
        </Card>

        {editingPlayer && setup ? (
          <>
            <Card className="mb-4" glow>
              <h3 className="font-bold text-arena-purple mb-1">
                {editingPlayer.name} · 出戰順序
              </h3>
              <BattleOrderList setup={setup} onChange={updateSetup} />
            </Card>

            <BeybladeTabPanel
              beyblades={setup.beyblades}
              onChangeBeyblade={updateBeyblade}
              onActiveIndexChange={setActiveSlot}
              headerExtra={
                sharedLibrary.builds.length > 0 ? (
                  <div className="mb-4">
                    <label className="label-arena">
                      從陀螺庫選擇（戰刃 {activeSlot + 1}）
                    </label>
                    <select
                      className="input-arena"
                      defaultValue=""
                      onChange={(e) => {
                        const build = sharedLibrary.builds.find(
                          (b) => b.id === e.target.value
                        );
                        if (build) {
                          updateBeyblade(
                            activeSlot,
                            libraryBuildToBeyblade(
                              build,
                              activeSlot,
                              setup.beyblades[activeSlot]?.id
                            )
                          );
                        }
                        e.target.value = "";
                      }}
                    >
                      <option value="">— 手動填寫 —</option>
                      {sharedLibrary.builds.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.nickname || "未命名"} ({b.typeLabel})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null
              }
            />
          </>
        ) : (
          <Card className="mb-4">
            <p className="text-gray-500 text-center py-4 text-sm">
              請先新增選手，再選擇要填寫陀螺的人。
            </p>
          </Card>
        )}

        <div className="flex flex-col gap-2 mt-6 sticky bottom-20 bg-arena-black/90 py-2 -mx-1 px-1">
          <Button fullWidth onClick={saveSetups} disabled={!editingPlayer}>
            儲存陀螺資料
          </Button>
          {match.players.length >= minPlayers ? (
            <Button fullWidth variant="secondary" onClick={startMatch}>
              開始比賽
            </Button>
          ) : (
            <p className="text-xs text-center text-gray-600">
              尚缺 {minPlayers - match.players.length} 位選手才能開始
            </p>
          )}
        </div>
      </div>
    </PartsCatalogProvider>
  );
}
