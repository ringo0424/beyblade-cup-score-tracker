"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { APP_NAME } from "@/lib/constants";
import { useAppData } from "@/hooks/useAppData";

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentAccount, logout, isAdmin } = useAppData();
  const isLoginPage = pathname === "/login";

  const handleLogout = () => {
    logout();
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
        {!isLoginPage && currentAccount && (
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/account"
              className="text-sm text-arena-neon hover:underline max-w-[8rem] truncate"
            >
              {currentAccount.name}
              {isAdmin && (
                <span className="text-arena-purple text-xs ml-1">管理</span>
              )}
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-arena-border text-gray-400 hover:text-white hover:border-gray-500"
            >
              登出
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
