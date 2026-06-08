"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "@/hooks/useAppData";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function UnlockPage() {
  const router = useRouter();
  const { hydrated, siteUnlocked, unlockSiteWithPassword, syncEnabled, syncStatus } =
    useAppData();

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!hydrated) {
    return <p className="text-gray-500 text-center py-8">載入中…</p>;
  }

  if (siteUnlocked) {
    router.replace("/");
    return null;
  }

  const submit = () => {
    setError(null);
    const err = unlockSiteWithPassword(password);
    if (err) {
      setError(err);
      return;
    }
    router.push("/");
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">進入計分系統</h2>
      <p className="text-sm text-gray-500 mb-4">
        輸入網站密碼即可使用。不需個人帳號，所有人可建立比賽並為選手填寫陀螺。
      </p>

      {syncEnabled && (
        <p className="text-xs text-arena-neon mb-4">
          雲端同步：{syncStatus === "synced" ? "已連線" : syncStatus}
        </p>
      )}

      <Card className="mb-4 space-y-3">
        <div>
          <label className="label-arena">網站密碼</label>
          <input
            type="password"
            className="input-arena"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="輸入密碼"
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button fullWidth onClick={submit}>
          進入
        </Button>
      </Card>
    </div>
  );
}
