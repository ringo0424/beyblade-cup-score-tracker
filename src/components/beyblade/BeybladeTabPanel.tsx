"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { Beyblade } from "@/types";
import { BeybladeForm } from "./BeybladeForm";

export function BeybladeTabPanel({
  beyblades,
  onChangeBeyblade,
  onActiveIndexChange,
  headerExtra,
}: {
  beyblades: Beyblade[];
  onChangeBeyblade: (index: number, updated: Beyblade) => void;
  onActiveIndexChange?: (index: number) => void;
  headerExtra?: ReactNode;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = beyblades[activeIndex];

  useEffect(() => {
    onActiveIndexChange?.(activeIndex);
  }, [activeIndex, onActiveIndexChange]);

  if (!active) return null;

  return (
    <div className="card-arena mb-3">
      <div
        className="grid grid-cols-3 gap-1 p-1 mb-4 rounded-xl bg-arena-black/60 border border-arena-border"
        role="tablist"
        aria-label="選擇戰刃"
      >
        {beyblades.map((b, i) => {
          const selected = i === activeIndex;
          const subtitle = (b.nickname ?? "").trim();
          return (
            <button
              key={b.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveIndex(i)}
              className={`py-2.5 px-1 rounded-lg text-sm font-semibold transition-colors ${
                selected
                  ? "bg-arena-neon/20 text-arena-neon border border-arena-neon/40"
                  : "text-gray-500 border border-transparent hover:text-gray-300"
              }`}
            >
              <span className="block">戰刃{i + 1}</span>
              {subtitle && !selected && (
                <span className="block text-[10px] font-normal truncate mt-0.5 opacity-70">
                  {subtitle}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {headerExtra}

      <div role="tabpanel">
        <BeybladeForm
          key={active.id}
          beyblade={active}
          index={activeIndex}
          onChange={(updated) => onChangeBeyblade(activeIndex, updated)}
          embedded
        />
      </div>
    </div>
  );
}
