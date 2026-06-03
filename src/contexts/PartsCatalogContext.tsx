"use client";

import { createContext, useContext, type ReactNode } from "react";
import { usePartsCatalog } from "@/hooks/usePartsCatalog";
import type { PhstudyPartsCatalogResponse } from "@/lib/phstudy/types";

type PartsCatalogContextValue = {
  catalog: PhstudyPartsCatalogResponse | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<PhstudyPartsCatalogResponse | null>;
};

const PartsCatalogContext = createContext<PartsCatalogContextValue | null>(
  null
);

export function PartsCatalogProvider({ children }: { children: ReactNode }) {
  const value = usePartsCatalog();
  return (
    <PartsCatalogContext.Provider value={value}>
      {children}
    </PartsCatalogContext.Provider>
  );
}

export function usePartsCatalogContext(): PartsCatalogContextValue {
  const ctx = useContext(PartsCatalogContext);
  if (!ctx) {
    throw new Error("usePartsCatalogContext must be used within PartsCatalogProvider");
  }
  return ctx;
}
