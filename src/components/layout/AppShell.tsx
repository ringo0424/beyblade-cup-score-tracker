"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppDataProvider } from "@/contexts/AppDataContext";
import { SiteGate } from "@/components/auth/SiteGate";
import { AppHeader } from "@/components/layout/AppHeader";

const navItems = [
  { href: "/", label: "首頁", icon: "🏠" },
  { href: "/fighters", label: "選手", icon: "🎖️" },
  { href: "/library", label: "陀螺庫", icon: "📦" },
  { href: "/stats", label: "數據", icon: "📊" },
  { href: "/history", label: "紀錄", icon: "📋" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNav =
    pathname.includes("/setup") ||
    pathname.includes("/dashboard") ||
    pathname.includes("/round-robin");

  return (
    <AppDataProvider>
      <SiteGate>
      <div className="flex flex-col min-h-screen max-w-lg mx-auto w-full">
      <AppHeader />

      <main className="flex-1 px-4 py-4 pb-24">{children}</main>

      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-arena-card/95 backdrop-blur border-t border-arena-border safe-area-pb">
          <div className="max-w-lg mx-auto flex justify-around py-2 px-1">
            {navItems.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-colors min-w-0 ${
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
      </SiteGate>
    </AppDataProvider>
  );
}
