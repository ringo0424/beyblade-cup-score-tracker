"use client";

import { useMemo, useState } from "react";
import { BeybladeForm } from "@/components/beyblade/BeybladeForm";
import { PartsCatalogBanner } from "@/components/beyblade/PartsCatalogBanner";
import {
  PartsCatalogProvider,
  usePartsCatalogContext,
} from "@/contexts/PartsCatalogContext";
import { createEmptyBeyblade } from "@/lib/beyblade";
import { computeBeybladeStats } from "@/lib/beybladeStats";
import {
  BEYBLADE_FIELD_TO_PHSTUDY,
  CATALOG_ID_FIELD_MAP,
  type BeybladePartField,
} from "@/lib/phstudy/mapping";
import type { PhstudyPartCategory } from "@/lib/phstudy/types";
import type { Beyblade, UserLibrary } from "@/types";
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
  onSave: (
    b: Beyblade,
    t: Partial<Record<PhstudyPartCategory, string>>
  ) => void;
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
          攻{preview.attack} 防{preview.defense} 持{preview.stamina} 總
          {preview.total}
        </p>
      </Card>
      <Button fullWidth onClick={() => onSave(beyblade, partTypes)}>
        存入陀螺庫
      </Button>
    </div>
  );
}

export function FighterLibraryEditor({
  displayName,
  library,
  onSaveBuild,
  onRemoveBuild,
}: {
  displayName: string;
  library: UserLibrary;
  onSaveBuild: (
    beyblade: Beyblade,
    partTypes: Partial<Record<PhstudyPartCategory, string>>
  ) => void;
  onRemoveBuild: (buildId: string) => void;
}) {
  return (
    <PartsCatalogProvider>
      <PartsCatalogBanner />
      <h3 className="text-sm font-bold text-arena-purple mb-2">
        {displayName} 的陀螺庫（{library.builds.length} 組）
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
                onClick={() => onRemoveBuild(b.id)}
              >
                刪除
              </button>
            </div>
          </Card>
        ))
      )}
      <h3 className="text-sm font-bold text-gray-400 mt-4 mb-2">新增陀螺組合</h3>
      <BuildComposer onSave={onSaveBuild} />
    </PartsCatalogProvider>
  );
}
