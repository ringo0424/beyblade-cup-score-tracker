"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppData } from "@/contexts/AppDataContext";

export function SiteGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { hydrated, siteUnlocked } = useAppData();

  const isUnlockPage = pathname === "/login";

  useEffect(() => {
    if (!hydrated || isUnlockPage) return;
    if (!siteUnlocked) {
      router.replace("/login");
    }
  }, [hydrated, isUnlockPage, router, siteUnlocked]);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-gray-500">
        載入中…
      </div>
    );
  }

  if (!siteUnlocked && !isUnlockPage) {
    return null;
  }

  return <>{children}</>;
}
