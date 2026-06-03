"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "@/hooks/useAppData";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function LoginPage() {
  const router = useRouter();
  const {
    hydrated,
    currentAccount,
    loginWithPassword,
    registerWithPassword,
    syncEnabled,
    syncStatus,
  } = useAppData();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!hydrated) {
    return <p className="text-gray-500 text-center py-8">載入中…</p>;
  }

  if (currentAccount) {
    router.replace("/");
    return null;
  }

  const submit = () => {
    setError(null);
    if (mode === "register" && password !== confirm) {
      setError("兩次密碼不一致");
      return;
    }
    const err =
      mode === "login"
        ? loginWithPassword(name, password)
        : registerWithPassword(name, password);
    if (err) {
      setError(err);
      return;
    }
    router.push("/");
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">
        {mode === "login" ? "登入" : "註冊帳號"}
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        每位選手需設定帳號與密碼。管理員 RINGO 可刪除帳號與比賽。
      </p>

      {syncEnabled && (
        <p className="text-xs text-arena-neon mb-4">
          雲端同步：{syncStatus === "synced" ? "已連線" : syncStatus}
        </p>
      )}

      <div className="flex gap-2 mb-4">
        <Button
          variant={mode === "login" ? "primary" : "secondary"}
          className="flex-1"
          onClick={() => setMode("login")}
        >
          登入
        </Button>
        <Button
          variant={mode === "register" ? "primary" : "secondary"}
          className="flex-1"
          onClick={() => setMode("register")}
        >
          註冊
        </Button>
      </div>

      <Card className="mb-4 space-y-3">
        <div>
          <label className="label-arena">帳號名稱</label>
          <input
            className="input-arena"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="你的名字"
          />
        </div>
        <div>
          <label className="label-arena">密碼</label>
          <input
            type="password"
            className="input-arena"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="至少 4 字"
          />
        </div>
        {mode === "register" && (
          <div>
            <label className="label-arena">確認密碼</label>
            <input
              type="password"
              className="input-arena"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button fullWidth onClick={submit}>
          {mode === "login" ? "登入" : "建立帳號"}
        </Button>
      </Card>

      <p className="text-xs text-gray-600">
        管理員帳號 <strong className="text-arena-purple">RINGO</strong>{" "}
        初始密碼為 <strong>99913579</strong>（可在 Vercel 以{" "}
        <code className="text-arena-neon">RINGO_BOOTSTRAP_PASSWORD</code>{" "}
        環境變數更改）。
      </p>
    </div>
  );
}
