"use client";

import { useRouter } from "next/navigation";
import { useAppData } from "@/hooks/useAppData";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CloudSyncBar } from "@/components/sync/CloudSyncBar";

export default function SettingsPage() {
  const router = useRouter();
  const {
    lockSiteSession,
    toxicQuotesEnabled,
    setToxicQuotesEnabled,
    resetAll,
    data,
  } = useAppData();

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">設定</h2>
      <p className="text-sm text-gray-500 mb-4">
        網站以單一密碼保護；解鎖後所有人可建立比賽與填寫陀螺。
      </p>

      <CloudSyncBar />

      <Card className="mb-4">
        <label className="flex items-center justify-between gap-3 cursor-pointer">
          <span className="text-sm text-gray-300">賽後隨機評語</span>
          <input
            type="checkbox"
            checked={toxicQuotesEnabled}
            onChange={(e) => setToxicQuotesEnabled(e.target.checked)}
            className="w-5 h-5 accent-arena-neon"
          />
        </label>
      </Card>

      <Button
        variant="secondary"
        fullWidth
        className="mb-3"
        onClick={() => {
          lockSiteSession();
          router.push("/login");
        }}
      >
        鎖定網站
      </Button>

      {data.matches.length > 0 && (
        <Button
          variant="ghost"
          fullWidth
          className="text-red-400"
          onClick={() => {
            if (confirm("確定清除全部比賽與資料？此動作無法復原。")) {
              resetAll();
            }
          }}
        >
          清除全部資料
        </Button>
      )}
    </div>
  );
}
