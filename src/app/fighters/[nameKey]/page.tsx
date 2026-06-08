"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useAppData } from "@/hooks/useAppData";
import { computeFighterStats } from "@/lib/fighters/stats";
import { BeybladeForm } from "@/components/beyblade/BeybladeForm";
import { PartsCatalogProvider } from "@/contexts/PartsCatalogContext";
import { PartsCatalogBanner } from "@/components/beyblade/PartsCatalogBanner";
import { createEmptyBeyblade } from "@/lib/beyblade";
import { computeBeybladeStats } from "@/lib/beybladeStats";
import type { PhstudyPartCategory } from "@/lib/phstudy/types";
import type { Beyblade } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function FighterDetailPage({
  params,
}: {
  params: Promise<{ nameKey: string }>;
}) {
  const { nameKey: rawKey } = use(params);
  const nameKey = decodeURIComponent(rawKey);
  const {
    data,
    hydrated,
    getLibraryForFighter,
    saveBuildToLibrary,
    removeBuildFromLibrary,
    setFighterIcon,
    registeredFighters,
  } = useAppData();

  const profile = registeredFighters.find((f) => f.nameKey === nameKey);
  const displayName = profile?.displayName ?? nameKey;
  const library = getLibraryForFighter(nameKey);

  const stats = useMemo(() => {
    return computeFighterStats(data).find((r) => r.nameKey === nameKey);
  }, [data, nameKey]);

  const [beyblade, setBeyblade] = useState<Beyblade>(() =>
    createEmptyBeyblade(0)
  );
  const [draftIcon, setDraftIcon] = useState(profile?.icon ?? stats?.icon ?? "");

  if (!hydrated) {
    return <p className="text-gray-500 text-center py-8">載入中…</p>;
  }

  const partTypes: Partial<Record<PhstudyPartCategory, string>> = {};

  const handleSaveBuild = () => {
    saveBuildToLibrary(beyblade, partTypes, nameKey);
    setBeyblade(createEmptyBeyblade(0));
  };

  return (
    <PartsCatalogProvider>
      <div>
        <Link href="/fighters" className="text-sm text-gray-500 hover:text-arena-neon">
          ← 選手列表
        </Link>
        <h2 className="text-xl font-bold mt-2 mb-1 flex items-center gap-2">
          <span className="text-2xl">{stats?.icon ?? profile?.icon ?? "🎮"}</span>
          {displayName}
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          冠軍 {stats?.championCount ?? 0} · 亞軍 {stats?.runnerUpCount ?? 0}
          {(stats?.matchCount ?? 0) > 0 ? ` · 參賽 ${stats!.matchCount} 場` : ""}
        </p>

        <PartsCatalogBanner />

        <Card className="mb-4">
          <p className="text-xs text-gray-500 mb-2">選手 Icon</p>
          <input
            className="input-arena mb-2"
            maxLength={8}
            value={draftIcon}
            onChange={(e) => setDraftIcon(e.target.value)}
            placeholder="Emoji"
          />
          <Button
            variant="secondary"
            fullWidth
            onClick={() => setFighterIcon(displayName, draftIcon || undefined)}
          >
            儲存 Icon
          </Button>
        </Card>

        <h3 className="text-sm font-bold text-arena-purple mb-2">
          陀螺庫（{library.builds.length} 組）
        </h3>
        {library.builds.length === 0 ? (
          <Card className="mb-4">
            <p className="text-sm text-gray-500 text-center py-3">尚無儲存組合</p>
          </Card>
        ) : (
          library.builds.map((b) => (
            <Card key={b.id} className="mb-2">
              <div className="flex justify-between gap-2">
                <div>
                  <p className="font-bold text-arena-neon">
                    {b.nickname || "未命名"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {b.typeLabel} · 攻{b.stats.attack} 防{b.stats.defense} 總
                    {b.stats.total}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {[b.steelBlade, b.lockDisk, b.axis].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-red-400 text-sm shrink-0"
                  onClick={() => removeBuildFromLibrary(b.id, nameKey)}
                >
                  刪除
                </button>
              </div>
            </Card>
          ))
        )}

        <h3 className="text-sm font-bold text-gray-400 mt-4 mb-2">新增陀螺組合</h3>
        <div className="card-arena mb-4">
          <BeybladeForm
            beyblade={beyblade}
            index={0}
            onChange={setBeyblade}
            embedded
          />
          <Card className="mt-3 mb-3">
            <p className="text-xs text-gray-500">評分預覽</p>
            <p className="text-arena-neon font-bold">
              {computeBeybladeStats(beyblade, partTypes).typeLabel}
            </p>
          </Card>
          <Button fullWidth onClick={handleSaveBuild}>
            存入此選手陀螺庫
          </Button>
        </div>
      </div>
    </PartsCatalogProvider>
  );
}
