"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAME } from "@/lib/constants";

const navItems = [
  { href: "/", label: "首頁", icon: "🏠" },
  { href: "/match/create", label: "新賽", icon: "⚔️" },
  { href: "/history", label: "紀錄", icon: "📋" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNav =
    pathname.includes("/setup") ||
    pathname.includes("/dashboard") ||
    pathname.includes("/round-robin");

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto w-full">
      <header className="sticky top-0 z-40 bg-arena-black/90 backdrop-blur border-b border-arena-border px-4 py-3">
        <Link href="/" className="block">
          <h1 className="text-lg font-bold bg-gradient-to-r from-arena-neon to-arena-purple bg-clip-text text-transparent">
            {APP_NAME}
          </h1>
        </Link>
      </header>

      <main className="flex-1 px-4 py-4 pb-24">{children}</main>

      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-arena-card/95 backdrop-blur border-t border-arena-border safe-area-pb">
          <div className="max-w-lg mx-auto flex justify-around py-2">
            {navItems.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-colors ${
                    active
                      ? "text-arena-neon"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <span className="text-xl" aria-hidden>
                    {item.icon}
                  </span>
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
