"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { APP_NAME } from "@/lib/constants";
import { useAppData } from "@/hooks/useAppData";

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { siteUnlocked, lockSiteSession } = useAppData();
  const isUnlockPage = pathname === "/login";

  const handleLock = () => {
    lockSiteSession();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 bg-arena-black/90 backdrop-blur border-b border-arena-border px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className="min-w-0">
          <h1 className="text-lg font-bold bg-gradient-to-r from-arena-neon to-arena-purple bg-clip-text text-transparent truncate">
            {APP_NAME}
          </h1>
        </Link>
        {!isUnlockPage && siteUnlocked && (
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/account"
              className="text-xs text-gray-500 hover:text-arena-neon"
            >
              設定
            </Link>
            <button
              type="button"
              onClick={handleLock}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-arena-border text-gray-400 hover:text-white hover:border-gray-500"
            >
              鎖定
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
