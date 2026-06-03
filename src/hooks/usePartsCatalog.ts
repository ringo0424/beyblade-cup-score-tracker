"use client";

import { useCallback, useEffect, useState } from "react";
import type { PhstudyPartsCatalogResponse } from "@/lib/phstudy/types";

export const PARTS_CATALOG_STORAGE_KEY = "beyblade-phstudy-catalog-v2";
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

interface CachedCatalog {
  savedAt: string;
  data: PhstudyPartsCatalogResponse;
}

function loadCached(): PhstudyPartsCatalogResponse | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PARTS_CATALOG_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedCatalog;
    if (Date.now() - new Date(parsed.savedAt).getTime() > CACHE_MAX_AGE_MS) {
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function saveCached(data: PhstudyPartsCatalogResponse): void {
  const payload: CachedCatalog = { savedAt: new Date().toISOString(), data };
  localStorage.setItem(PARTS_CATALOG_STORAGE_KEY, JSON.stringify(payload));
}

export function usePartsCatalog() {
  const [catalog, setCatalog] = useState<PhstudyPartsCatalogResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCatalog = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);

    if (!force) {
      const cached = loadCached();
      if (cached) {
        setCatalog(cached);
        setLoading(false);
        return cached;
      }
    }

    try {
      const res = await fetch("/api/parts-catalog?locale=zh-TW");
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { error?: string }).error ?? `HTTP ${res.status}`
        );
      }
      const data = (await res.json()) as PhstudyPartsCatalogResponse;
      saveCached(data);
      setCatalog(data);
      return data;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "無法載入零件資料";
      setError(msg);
      const stale = loadCached();
      if (stale) {
        setCatalog(stale);
        setError(`${msg}（使用本機快取）`);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalog(false);
  }, [fetchCatalog]);

  return {
    catalog,
    loading,
    error,
    refresh: () => fetchCatalog(true),
  };
}
