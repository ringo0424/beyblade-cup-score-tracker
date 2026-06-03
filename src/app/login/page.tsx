"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "@/hooks/useAppData";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function LoginPage() {
  const router = useRouter();
  const {
    data,
    hydrated,
    currentAccount,
    loginAs,
    registerAccount,
    syncEnabled,
    syncStatus,
  } = useAppData();
  const [newName, setNewName] = useState("");

  if (!hydrated) {
    return <p className="text-gray-500 text-center py-8">載入中…</p>;
  }

  if (currentAccount) {
    router.replace("/");
    return null;
  }

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    registerAccount(name);
    router.push("/");
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">選擇帳號</h2>
      <p className="text-sm text-gray-500 mb-4">
        不用密碼，點名字即可登入。資料會與所有使用者即時同步。
      </p>

      {syncEnabled && (
        <p className="text-xs text-arena-neon mb-4">
          雲端同步：{syncStatus === "synced" ? "已連線" : syncStatus}
        </p>
      )}

      <Card className="mb-4">
        <label className="label-arena">新建帳號</label>
        <div className="flex gap-2">
          <input
            className="input-arena flex-1"
            placeholder="你的名字"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <Button onClick={handleCreate} disabled={!newName.trim()}>
            建立
          </Button>
        </div>
      </Card>

      <h3 className="text-sm font-bold text-gray-400 mb-2">已有帳號</h3>
      {data.accounts.length === 0 ? (
        <Card>
          <p className="text-gray-500 text-center py-4 text-sm">
            尚無帳號，請先建立
          </p>
        </Card>
      ) : (
        data.accounts.map((account) => (
          <Card key={account.id} className="mb-2 flex items-center gap-2">
            <button
              type="button"
              className="w-full text-left font-semibold text-arena-neon py-1"
              onClick={() => {
                loginAs(account.id);
                router.push("/");
              }}
            >
              {account.name}
            </button>
          </Card>
        ))
      )}

      <p className="text-xs text-gray-600 mt-6">
        登入為 <strong className="text-arena-purple">RINGO</strong>{" "}
        後，可在「帳號」頁面刪除其他帳號。
      </p>
    </div>
  );
}
