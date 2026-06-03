"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppData } from "@/contexts/AppDataContext";

export function AccountGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { hydrated, currentAccount } = useAppData();

  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (!hydrated || isLoginPage) return;
    if (!currentAccount) {
      router.replace("/login");
    }
  }, [currentAccount, hydrated, isLoginPage, router]);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-gray-500">
        載入中…
      </div>
    );
  }

  if (!currentAccount && !isLoginPage) {
    return null;
  }

  return <>{children}</>;
}
