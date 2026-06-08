"use client";

import { useMemo, useState } from "react";
import { useAppData } from "@/hooks/useAppData";
import { BeybladeForm } from "@/components/beyblade/BeybladeForm";
import { AllPartsCatalog } from "@/components/beyblade/AllPartsCatalog";
import { PartsCatalogBanner } from "@/components/beyblade/PartsCatalogBanner";
import {
  PartsCatalogProvider,
  usePartsCatalogContext,
} from "@/contexts/PartsCatalogContext";
import { computeBeybladeStats } from "@/lib/beybladeStats";
import { createEmptyBeyblade } from "@/lib/beyblade";
import {
  BEYBLADE_FIELD_TO_PHSTUDY,
  CATALOG_ID_FIELD_MAP,
  type BeybladePartField,
} from "@/lib/phstudy/mapping";
import type { PhstudyPartCategory } from "@/lib/phstudy/types";
import type { Beyblade } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const partFields: BeybladePartField[] = [
  "steelBlade",
  "lockDisk",
  "axis",
  "emblemLock",
  "mainBlade",
  "xtremeBlade",
  "metalBlade",
  "assistBlade",
];

function partTypesForBeyblade(
  beyblade: Beyblade,
  catalog: ReturnType<typeof usePartsCatalogContext>["catalog"]
): Partial<Record<PhstudyPartCategory, string>> {
  const types: Partial<Record<PhstudyPartCategory, string>> = {};
  if (!catalog) return types;
  for (const field of partFields) {
    const cat = BEYBLADE_FIELD_TO_PHSTUDY[field];
    const idField = CATALOG_ID_FIELD_MAP[field];
    const id = beyblade.catalogPartIds?.[idField];
    if (!id) continue;
    const opt = catalog.categories[cat]?.find((o) => o.id === id);
    if (opt?.type) types[cat] = opt.type;
  }
  return types;
}

function BuildComposer({
  onSave,
}: {
  onSave: (b: Beyblade, t: Partial<Record<PhstudyPartCategory, string>>) => void;
}) {
  const { catalog } = usePartsCatalogContext();
  const [beyblade, setBeyblade] = useState<Beyblade>(() => createEmptyBeyblade(0));
  const partTypes = useMemo(
    () => partTypesForBeyblade(beyblade, catalog),
    [beyblade, catalog]
  );
  const preview = computeBeybladeStats(beyblade, partTypes);

  return (
    <div className="card-arena mb-4">
      <BeybladeForm beyblade={beyblade} index={0} onChange={setBeyblade} embedded />
      <Card className="mt-3 mb-3">
        <p className="text-xs text-gray-500">評分 / 類型</p>
        <p className="text-arena-neon font-bold">{preview.typeLabel}</p>
        <p className="text-xs text-gray-500">
          攻{preview.attack} 防{preview.defense} 持{preview.stamina} 總{preview.total}
        </p>
      </Card>
      <Button fullWidth onClick={() => onSave(beyblade, partTypes)}>
        存入陀螺庫
      </Button>
    </div>
  );
}

export default function LibraryPage() {
  const { sharedLibrary, saveBuildToLibrary, removeBuildFromLibrary } =
    useAppData();
  const [tab, setTab] = useState<"builds" | "parts">("builds");

  return (
    <PartsCatalogProvider>
      <div>
        <h2 className="text-xl font-bold mb-1">陀螺庫</h2>
        <p className="text-sm text-gray-500 mb-4">
          全站共用陀螺組合；比賽設定時可一鍵選用。
        </p>
        <PartsCatalogBanner />

        <div className="flex gap-2 mb-4">
          <Button
            variant={tab === "builds" ? "primary" : "secondary"}
            className="flex-1"
            onClick={() => setTab("builds")}
          >
            已組陀螺
          </Button>
          <Button
            variant={tab === "parts" ? "primary" : "secondary"}
            className="flex-1"
            onClick={() => setTab("parts")}
          >
            零件庫
          </Button>
        </div>

        {tab === "builds" && (
          <>
            {sharedLibrary.builds.map((b) => (
              <Card
                key={b.id}
                className="mb-2 flex justify-between items-start gap-2"
              >
                <div>
                  <p className="font-bold text-arena-neon">
                    {b.nickname || "未命名"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {b.typeLabel} · 總分 {b.stats.total}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-red-400 text-sm shrink-0"
                  onClick={() => removeBuildFromLibrary(b.id)}
                >
                  刪除
                </button>
              </Card>
            ))}
            <h3 className="text-sm font-bold text-gray-400 mt-4 mb-2">新增組合</h3>
            <BuildComposer onSave={saveBuildToLibrary} />
          </>
        )}

        {tab === "parts" && (
          <>
            <p className="text-sm text-gray-500 mb-3">
              phstudy 八類零件完整目錄（含圖片），可搜尋瀏覽。
            </p>
            <AllPartsCatalog />
          </>
        )}
      </div>
    </PartsCatalogProvider>
  );
}
