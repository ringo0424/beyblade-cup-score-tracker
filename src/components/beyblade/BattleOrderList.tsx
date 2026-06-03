import type { BeybladeSetup } from "@/types";
import { getOrderedBeyblades, reorderBattleOrder } from "@/lib/beyblade";

export function BattleOrderList({
  setup,
  onChange,
}: {
  setup: BeybladeSetup;
  onChange: (setup: BeybladeSetup) => void;
}) {
  const ordered = getOrderedBeyblades(setup);

  return (
    <div className="card-arena">
      <h4 className="text-sm font-semibold text-gray-400 mb-2">出戰順序</h4>
      <ul className="space-y-2">
        {ordered.map((b, index) => (
          <li
            key={b.id}
            className="flex items-center gap-2 bg-arena-black/60 rounded-xl px-3 py-2 border border-arena-border"
          >
            <span className="w-6 text-arena-neon font-bold">{index + 1}</span>
            <span className="flex-1 truncate text-sm">
              {b.nickname || "未命名"}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                aria-label="上移"
                disabled={index === 0}
                className="w-9 h-9 rounded-lg bg-arena-card border border-arena-border text-arena-neon disabled:opacity-30"
                onClick={() =>
                  onChange(reorderBattleOrder(setup, index, "up"))
                }
              >
                ↑
              </button>
              <button
                type="button"
                aria-label="下移"
                disabled={index === ordered.length - 1}
                className="w-9 h-9 rounded-lg bg-arena-card border border-arena-border text-arena-neon disabled:opacity-30"
                onClick={() =>
                  onChange(reorderBattleOrder(setup, index, "down"))
                }
              >
                ↓
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
