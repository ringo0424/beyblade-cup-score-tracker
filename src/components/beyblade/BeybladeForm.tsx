"use client";

import type { Beyblade } from "@/types";
import { BEYBLADE_FIELD_LABELS } from "@/lib/constants";
import {
  BEYBLADE_FIELD_TO_PHSTUDY,
  CATALOG_ID_FIELD_MAP,
  type BeybladePartField,
} from "@/lib/phstudy/mapping";
import { usePartsCatalogContext } from "@/contexts/PartsCatalogContext";
import { PartCombobox } from "./PartCombobox";

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

export function BeybladeForm({
  beyblade,
  index,
  onChange,
  embedded = false,
}: {
  beyblade: Beyblade;
  index: number;
  onChange: (updated: Beyblade) => void;
  embedded?: boolean;
}) {
  const { catalog, loading } = usePartsCatalogContext();

  const setPartField = (field: BeybladePartField, name: string, id?: string) => {
    const idField = CATALOG_ID_FIELD_MAP[field];
    const catalogPartIds = { ...(beyblade.catalogPartIds ?? {}) };
    if (id) catalogPartIds[idField] = id;
    else delete catalogPartIds[idField];
    onChange({
      ...beyblade,
      [field]: name,
      catalogPartIds:
        Object.keys(catalogPartIds).length > 0 ? catalogPartIds : undefined,
    });
  };

  const inner = (
    <>
      {!embedded && (
        <h4 className="font-semibold text-arena-neon mb-3">戰刃 {index + 1}</h4>
      )}

      <div className="space-y-3">
        <div>
          <label className="label-arena">
            {BEYBLADE_FIELD_LABELS.nickname}
          </label>
          <input
            className="input-arena"
            value={beyblade.nickname}
            onChange={(e) =>
              onChange({ ...beyblade, nickname: e.target.value })
            }
          />
        </div>

        {partFields.map((field) => {
          const category = BEYBLADE_FIELD_TO_PHSTUDY[field];
          const options = catalog?.categories[category] ?? [];
          const idField = CATALOG_ID_FIELD_MAP[field];

          return (
            <PartCombobox
              key={field}
              label={BEYBLADE_FIELD_LABELS[field]}
              value={beyblade[field]}
              partId={beyblade.catalogPartIds?.[idField]}
              category={category}
              options={options}
              disabled={loading && !catalog}
              onChange={(name, id) => setPartField(field, name, id)}
            />
          );
        })}

        <div>
          <label className="label-arena">{BEYBLADE_FIELD_LABELS.notes}</label>
          <textarea
            className="input-arena min-h-[60px]"
            value={beyblade.notes}
            onChange={(e) => onChange({ ...beyblade, notes: e.target.value })}
          />
        </div>
      </div>
    </>
  );

  if (embedded) return inner;

  return <div className="card-arena mb-3">{inner}</div>;
}
