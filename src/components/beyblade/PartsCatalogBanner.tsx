"use client";

import { PHSTUDY_ATTRIBUTION_URL } from "@/lib/constants";
import { usePartsCatalogContext } from "@/contexts/PartsCatalogContext";
import { Button } from "@/components/ui/Button";

export function PartsCatalogBanner() {
  const { catalog, loading, error, refresh } = usePartsCatalogContext();

  return (
    <div className="mb-4 p-3 rounded-xl bg-arena-black/60 border border-arena-border/80">
      <p className="text-xs text-gray-400 leading-relaxed">
        配件選項來自{" "}
        <a
          href={PHSTUDY_ATTRIBUTION_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-arena-neon hover:underline"
        >
          beyblade.phstudy.org
        </a>{" "}
        零件資料庫（繁中）。資料經本 App API 同步後快取於本機。
      </p>
      {loading && (
        <p className="text-xs text-arena-purple mt-2">載入零件資料中…</p>
      )}
      {error && <p className="text-xs text-amber-400 mt-2">{error}</p>}
      {catalog && !loading && (
        <p className="text-xs text-gray-500 mt-2">
          已載入 {Object.values(catalog.counts).reduce((a, b) => a + b, 0)}{" "}
          項零件
        </p>
      )}
      {(error || catalog) && (
        <Button
          variant="ghost"
          className="mt-2 text-xs py-2"
          onClick={() => refresh()}
        >
          重新同步零件資料
        </Button>
      )}
    </div>
  );
}
