"use client";

import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 bg-arena-black/90 backdrop-blur border-b border-arena-border px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className="min-w-0">
          <h1 className="text-lg font-bold bg-gradient-to-r from-arena-neon to-arena-purple bg-clip-text text-transparent truncate">
            {APP_NAME}
          </h1>
        </Link>
        <Link
          href="/account"
          className="text-xs text-gray-500 hover:text-arena-neon shrink-0"
        >
          設定
        </Link>
      </div>
    </header>
  );
}
