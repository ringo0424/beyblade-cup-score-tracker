"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "@/hooks/useAppData";
import { getMatch } from "@/lib/storage";
import {
  canJoinMatch,
  getPlayerForAccount,
  isJoinedMatch,
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
    currentAccount,
    joinMatchById,
    userLibrary,
  } = useAppData();
  const [match, setMatch] = useState<Match | null>(null);
  const [activeSlot, setActiveSlot] = useState(0);

  useEffect(() => {
    if (!hydrated || !currentAccount) return;
    const m = getMatch(data, id);
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
      if (!prev) return { ...m, beybladeSetups: setups };

      const prevIds = prev.players.map((p) => p.id).join(",");
      const nextIds = m.players.map((p) => p.id).join(",");
      if (prevIds !== nextIds) {
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
  }, [currentAccount, data, id, hydrated, router]);

  if (!match || !currentAccount) {
    return <p className="text-gray-500 text-center py-8">載入中…</p>;
  }

  const joined = isJoinedMatch(match, currentAccount.id);
  const myPlayer = getPlayerForAccount(match, currentAccount.id);
  const canJoin = canJoinMatch(match, currentAccount.id);
  const isHost = match.hostAccountId === currentAccount.id;
  const minPlayers = minPlayersForMatch(match);

  if (!joined && canJoin) {
    return (
      <div>
        <h2 className="text-xl font-bold mb-2">{match.name}</h2>
        <Card className="mb-4">
          <p className="text-gray-400 mb-4">
            你已登入為 {currentAccount.name}，加入後可填寫自己的 3 組陀螺。
          </p>
          <Button
            fullWidth
            onClick={() => {
              if (joinMatchById(match.id)) {
                router.refresh();
              }
            }}
          >
            加入這場比賽
          </Button>
        </Card>
        <Button variant="secondary" fullWidth onClick={() => router.push("/")}>
          返回首頁
        </Button>
      </div>
    );
  }

  if (!joined) {
    return (
      <div>
        <h2 className="text-xl font-bold mb-2">{match.name}</h2>
        <Card>
          <p className="text-gray-500 text-center py-4">
            這場比賽已滿或未開放加入
          </p>
        </Card>
        <Button
          variant="secondary"
          fullWidth
          className="mt-4"
          onClick={() => router.push("/")}
        >
          返回首頁
        </Button>
      </div>
    );
  }

  const setupIndex = match.beybladeSetups.findIndex(
    (s) => s.playerId === myPlayer!.id
  );
  const setup = match.beybladeSetups[setupIndex];

  const updateSetup = (updated: BeybladeSetup) => {
    const setups = [...match.beybladeSetups];
    setups[setupIndex] = updated;
    setMatch({ ...match, beybladeSetups: setups });
  };

  const updateBeyblade = (
    bIndex: number,
    updated: BeybladeSetup["beyblades"][0]
  ) => {
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

  return (
    <PartsCatalogProvider>
      <div>
        <h2 className="text-xl font-bold mb-1">{match.name}</h2>
        <p className="text-sm text-gray-500 mb-4">
          填寫你的陀螺（{currentAccount.name}）
        </p>

        <PartsCatalogBanner />

        <Card className="mb-4">
          <p className="text-xs text-gray-500 mb-2">已加入選手</p>
          <p className="text-sm text-gray-300">
            {match.players.map((p) => p.name).join(" · ")}
          </p>
          <p className="text-xs text-gray-600 mt-2">
            {match.players.length} / {minPlayers} 人（最少需 {minPlayers} 人才能開始）
          </p>
        </Card>

        <Card className="mb-4" glow>
          <h3 className="font-bold text-arena-purple mb-3">我的出戰順序</h3>
          <BattleOrderList setup={setup} onChange={updateSetup} />
        </Card>

        <BeybladeTabPanel
          beyblades={setup.beyblades}
          onChangeBeyblade={updateBeyblade}
          onActiveIndexChange={setActiveSlot}
          headerExtra={
            userLibrary.builds.length > 0 ? (
              <div className="mb-4">
                <label className="label-arena">
                  從陀螺庫選擇（戰刃 {activeSlot + 1}）
                </label>
                <select
                  className="input-arena"
                  defaultValue=""
                  onChange={(e) => {
                    const build = userLibrary.builds.find(
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
                  {userLibrary.builds.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nickname || "未命名"} ({b.typeLabel})
                    </option>
                  ))}
                </select>
              </div>
            ) : null
          }
        />

        <div className="flex flex-col gap-2 mt-6 sticky bottom-20 bg-arena-black/90 py-2 -mx-1 px-1">
          <Button fullWidth onClick={saveSetups}>
            儲存我的陀螺資料
          </Button>
          {isHost && match.players.length >= minPlayers && (
            <Button fullWidth variant="secondary" onClick={startMatch}>
              開始比賽
            </Button>
          )}
          {isHost && match.players.length < minPlayers && (
            <p className="text-xs text-center text-gray-600">
              等待更多選手加入…
            </p>
          )}
        </div>
      </div>
    </PartsCatalogProvider>
  );
}
