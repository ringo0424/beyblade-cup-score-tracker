"use client";

import { useMemo, useState } from "react";
import { useAppData } from "@/hooks/useAppData";
import { computeFighterStats } from "@/lib/fighters/stats";
import { fighterNameKey } from "@/lib/fighters/keys";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CloudSyncBar } from "@/components/sync/CloudSyncBar";

const ICON_PRESETS = ["🏆", "👑", "⚔️", "🔥", "💎", "🌟", "🐉", "🦅", "🎯", "💀"];

export default function FightersPage() {
  const { data, hydrated, isAdmin, setFighterIcon } = useAppData();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draftIcon, setDraftIcon] = useState("");

  const statByName = useMemo(() => {
    const map = new Map<string, ReturnType<typeof computeFighterStats>[0]>();
    for (const row of computeFighterStats(data)) {
      map.set(row.nameKey, row);
    }
    return map;
  }, [data]);

  const registered = useMemo(() => {
    return [...data.accounts]
      .filter((a) => a.passwordHash)
      .sort((a, b) => a.name.localeCompare(b.name, "zh-Hant"));
  }, [data.accounts]);

  if (!hydrated) {
    return <p className="text-gray-500 text-center py-8">載入中…</p>;
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">選手</h2>
      <p className="text-sm text-gray-500 mb-4">
        已註冊帳號（全 App 同步）· 共 {registered.length} 人
      </p>

      <CloudSyncBar />

      {registered.length === 0 ? (
        <Card>
          <p className="text-center text-gray-500 py-6 text-sm">
            尚無已註冊帳號。請先到登入頁註冊。
          </p>
        </Card>
      ) : (
        registered.map((account) => {
          const key = fighterNameKey(account.name);
          const stats = statByName.get(key);
          const icon = stats?.icon;

          return (
            <Card key={account.id} className="mb-2">
              <div className="flex items-start gap-3">
                <span className="text-2xl w-10 h-10 flex items-center justify-center shrink-0">
                  {icon || "🎮"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-arena-neon truncate">
                    {account.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    冠軍 {stats?.championCount ?? 0} · 亞軍{" "}
                    {stats?.runnerUpCount ?? 0}
                    {(stats?.matchCount ?? 0) > 0
                      ? ` · 參賽 ${stats!.matchCount} 場`
                      : ""}
                  </p>
                </div>
              </div>

              {isAdmin && (
                <div className="mt-3 pt-3 border-t border-arena-border/50">
                  {editingKey === key ? (
                    <div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {ICON_PRESETS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            className={`text-xl px-2 py-1 rounded-lg border ${
                              draftIcon === emoji
                                ? "border-arena-neon"
                                : "border-arena-border"
                            }`}
                            onClick={() => setDraftIcon(emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                      <input
                        className="input-arena mb-2"
                        maxLength={8}
                        value={draftIcon}
                        onChange={(e) => setDraftIcon(e.target.value)}
                        placeholder="Emoji 或短文字"
                      />
                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          onClick={() => {
                            setFighterIcon(account.name, draftIcon || undefined);
                            setEditingKey(null);
                          }}
                        >
                          儲存
                        </Button>
                        <Button
                          variant="secondary"
                          className="flex-1"
                          onClick={() => {
                            setFighterIcon(account.name, undefined);
                            setDraftIcon("");
                            setEditingKey(null);
                          }}
                        >
                          清除
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => setEditingKey(null)}
                        >
                          取消
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="text-xs text-arena-purple"
                      onClick={() => {
                        setEditingKey(key);
                        setDraftIcon(icon ?? "");
                      }}
                    >
                      編輯 Icon
                    </button>
                  )}
                </div>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}
