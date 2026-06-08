"use client";

import { useAppData } from "@/hooks/useAppData";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useState } from "react";

export function AdminLoginCard() {
  const {
    adminLoggedIn,
    loginAdminWithPassword,
    logoutAdminSession,
  } = useAppData();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleLogin = () => {
    const err = loginAdminWithPassword(password);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setPassword("");
  };

  return (
    <Card className="mb-4 border-arena-purple/30">
      <h3 className="font-bold text-arena-purple mb-1">Admin 登入</h3>
      {adminLoggedIn ? (
        <>
          <p className="text-sm text-arena-neon mb-3">已登入管理員模式</p>
          <p className="text-xs text-gray-500 mb-3">
            可於選手列表刪除選手（含陀螺庫資料）。
          </p>
          <Button variant="secondary" fullWidth onClick={logoutAdminSession}>
            登出 Admin
          </Button>
        </>
      ) : (
        <>
          <p className="text-xs text-gray-500 mb-3">
            輸入管理員密碼以刪除選手。
          </p>
          <input
            type="password"
            className="input-arena mb-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin 密碼"
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
          <Button fullWidth onClick={handleLogin}>
            登入 Admin
          </Button>
        </>
      )}
    </Card>
  );
}
