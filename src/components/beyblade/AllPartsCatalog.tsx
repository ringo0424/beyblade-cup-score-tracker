"use client";

import { useMemo, useState } from "react";
import { usePartsCatalogContext } from "@/contexts/PartsCatalogContext";
import {
  PHSTUDY_CATEGORY_LABELS,
  PHSTUDY_CATEGORY_ORDER,
} from "@/lib/phstudy/categoryLabels";
import { phstudyPartUrl } from "@/lib/phstudy/mapping";
import type { PhstudyPartCategory } from "@/lib/phstudy/types";
import { PartImage } from "./PartImage";
import { Card } from "@/components/ui/Card";

const PAGE_SIZE = 40;

export function AllPartsCatalog() {
  const { catalog, loading, error } = usePartsCatalogContext();
  const [category, setCategory] = useState<PhstudyPartCategory>("Blade");
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(PAGE_SIZE);

  const options = catalog?.categories[category] ?? [];
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return options;
    return options.filter(
      (o) =>
        o.name.toLowerCase().includes(needle) ||
        o.id.toLowerCase().includes(needle) ||
        (o.catalogTitle?.toLowerCase().includes(needle) ?? false) ||
        (o.type?.toLowerCase().includes(needle) ?? false)
    );
  }, [options, q]);

  const visible = filtered.slice(0, shown);
  const totalInCategory = options.length;

  if (loading && !catalog) {
    return <p className="text-sm text-gray-500 py-4">載入零件資料中…</p>;
  }
  if (error) {
    return <p className="text-sm text-red-400 py-4">{error}</p>;
  }
  if (!catalog) {
    return <p className="text-sm text-gray-500 py-4">尚無零件資料</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {PHSTUDY_CATEGORY_ORDER.map((cat) => {
          const count = catalog.counts[cat] ?? 0;
          const active = category === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setCategory(cat);
                setQ("");
                setShown(PAGE_SIZE);
              }}
              className={`shrink-0 px-2.5 py-1.5 rounded-full text-xs border ${
                active
                  ? "border-arena-neon text-arena-neon bg-arena-neon/10"
                  : "border-arena-border text-gray-500"
              }`}
            >
              {PHSTUDY_CATEGORY_LABELS[cat]}
              <span className="text-gray-600 ml-1">{count}</span>
            </button>
          );
        })}
      </div>

      <label className="label-arena">搜尋 {PHSTUDY_CATEGORY_LABELS[category]}</label>
      <input
        className="input-arena mb-3"
        value={q}
        placeholder="名稱、型號、類型…"
        onChange={(e) => {
          setQ(e.target.value);
          setShown(PAGE_SIZE);
        }}
      />

      <p className="text-xs text-gray-600 mb-3">
        共 {totalInCategory} 項
        {q.trim() ? ` · 符合 ${filtered.length} 項` : ""}
      </p>

      {visible.length === 0 ? (
        <Card>
          <p className="text-center text-gray-500 py-6 text-sm">沒有符合的零件</p>
        </Card>
      ) : (
        visible.map((part) => (
          <Card
            key={part.id}
            className="mb-2 flex items-center gap-3 py-2"
          >
            <PartImage
              partId={part.id}
              category={category}
              alt={part.name}
              size="md"
              imageUrl={part.imageUrl}
              imageFallbackJpg={part.imageFallbackJpg}
              imageFallbackApp={part.imageFallbackApp}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{part.name}</p>
              {part.type && (
                <p className="text-xs text-gray-500 truncate">{part.type}</p>
              )}
            </div>
            <a
              href={phstudyPartUrl(part.id, category)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-arena-purple shrink-0"
            >
              詳情
            </a>
          </Card>
        ))
      )}

      {shown < filtered.length && (
        <button
          type="button"
          className="w-full py-3 text-sm text-arena-neon border border-arena-border rounded-xl mt-2"
          onClick={() => setShown((n) => n + PAGE_SIZE)}
        >
          載入更多（還有 {filtered.length - shown} 項）
        </button>
      )}
    </div>
  );
}
