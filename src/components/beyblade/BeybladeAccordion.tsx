"use client";

import { useState } from "react";
import type { Beyblade } from "@/types";
import { BeybladeForm } from "./BeybladeForm";

export function BeybladeAccordion({
  beyblade,
  index,
  onChange,
}: {
  beyblade: Beyblade;
  index: number;
  onChange: (updated: Beyblade) => void;
}) {
  const [open, setOpen] = useState(index === 0);
  const label = beyblade.nickname.trim() || `陀螺 ${index + 1}`;

  return (
    <div className="card-arena mb-3 overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between gap-3 px-1 py-1 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="font-semibold text-arena-neon">陀螺 {index + 1}</span>
        <span className="text-sm text-gray-400 truncate flex-1 text-right">
          {open ? "▲ 收合" : label}
        </span>
      </button>

      {open && (
        <div className="pt-3 border-t border-arena-border/60 mt-2">
          <BeybladeForm
            beyblade={beyblade}
            index={index}
            onChange={onChange}
            embedded
          />
        </div>
      )}
    </div>
  );
}
