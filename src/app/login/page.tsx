"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** 已改為免密碼直接進入；保留路由避免舊連結失效 */
export default function LoginRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
  }, [router]);
  return <p className="text-gray-500 text-center py-8">載入中…</p>;
}
