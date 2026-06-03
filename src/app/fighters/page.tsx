"use client";

import { useMemo, useState } from "react";
import { useAppData } from "@/hooks/useAppData";
import { computeFighterStats } from "@/lib/fighters/stats";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const ICON_PRESETS = ["🏆", "👑", "⚔️", "🔥", "💎", "🌟", "🐉", "🦅", "🎯", "💀"];

export default function FightersPage() {
  const {
    data,
    hydrated,
    isAdmin,
    toxicQuotesEnabled,
    setToxicQuotesEnabled,
    setFighterIcon,
  } = useAppData();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draftIcon, setDraftIcon] = useState("");

  const rows = useMemo(() => computeFighterStats(data), [data]);

  if (!hydrated) {
    return <p className="text-gray-500 text-center py-8">載入中…</p>;
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">選手</h2>
      <p className="text-sm text-gray-500 mb-4">
        依已完成比賽統計冠軍、亞軍次數；管理員可設定 Icon。
      </p>

      <Card className="mb-4">
        <label className="flex items-center justify-between gap-3 cursor-pointer">
          <span className="text-sm">毒舌評語（比賽結束時可能出現）</span>
          <input
            type="checkbox"
            checked={toxicQuotesEnabled}
            onChange={(e) => setToxicQuotesEnabled(e.target.checked)}
            className="h-5 w-5 accent-arena-neon"
          />
        </label>
      </Card>

      {rows.length === 0 ? (
        <Card>
          <p className="text-center text-gray-500 py-6 text-sm">
            尚無選手紀錄，完成比賽後會自動出現。
          </p>
        </Card>
      ) : (
        rows.map((row) => (
          <Card key={row.nameKey} className="mb-2">
            <div className="flex items-start gap-3">
              <span className="text-2xl w-10 text-center shrink-0">
                {row.icon || "🎮"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-arena-neon truncate">
                  {row.displayName}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  冠軍 {row.championCount} · 亞軍 {row.runnerUpCount} · 參賽{" "}
                  {row.matchCount} 場
                </p>
              </div>
            </div>

            {isAdmin && (
              <div className="mt-3 pt-3 border-t border-arena-border/50">
                {editingKey === row.nameKey ? (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">選擇或輸入 Icon</p>
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
                          setFighterIcon(row.displayName, draftIcon || undefined);
                          setEditingKey(null);
                        }}
                      >
                        儲存
                      </Button>
                      <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={() => {
                          setFighterIcon(row.displayName, undefined);
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
                      setEditingKey(row.nameKey);
                      setDraftIcon(row.icon ?? "");
                    }}
                  >
                    編輯 Icon
                  </button>
                )}
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
