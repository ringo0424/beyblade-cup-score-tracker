"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppData } from "@/hooks/useAppData";
import { AvatarUploader } from "@/components/fighters/AvatarUploader";
import { FighterAvatar } from "@/components/fighters/FighterAvatar";
import { computeFighterStats } from "@/lib/fighters/stats";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function FighterDetailPage({
  params,
}: {
  params: Promise<{ nameKey: string }>;
}) {
  const { nameKey: rawKey } = use(params);
  const nameKey = decodeURIComponent(rawKey);
  const router = useRouter();
  const {
    data,
    hydrated,
    registeredFighters,
    getLibraryForFighter,
    setFighterIcon,
    adminLoggedIn,
    deleteFighterByNameKey,
  } = useAppData();

  const profile = registeredFighters.find((f) => f.nameKey === nameKey);
  const displayName = profile?.displayName ?? nameKey;
  const library = getLibraryForFighter(nameKey);

  const stats = useMemo(() => {
    return computeFighterStats(data).find((r) => r.nameKey === nameKey);
  }, [data, nameKey]);

  const icon = stats?.icon ?? profile?.icon;

  if (!hydrated) {
    return <p className="text-gray-500 text-center py-8">載入中…</p>;
  }

  if (!profile) {
    return (
      <div>
        <Link href="/fighters" className="text-sm text-gray-500 hover:text-arena-neon">
          ← 選手列表
        </Link>
        <p className="text-center text-gray-500 py-8">找不到此選手</p>
      </div>
    );
  }

  return (
    <div>
      <Link href="/fighters" className="text-sm text-gray-500 hover:text-arena-neon">
        ← 選手列表
      </Link>
      <h2 className="text-xl font-bold mt-2 mb-1 flex items-center gap-2">
        <FighterAvatar icon={icon} name={displayName} size="md" />
        {displayName}
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        冠軍 {stats?.championCount ?? 0} · 亞軍 {stats?.runnerUpCount ?? 0}
        {(stats?.matchCount ?? 0) > 0 ? ` · 參賽 ${stats!.matchCount} 場` : ""}
      </p>

      <AvatarUploader
        displayName={displayName}
        icon={icon}
        onSave={(dataUrl) => setFighterIcon(displayName, dataUrl)}
        onClear={() => setFighterIcon(displayName, undefined)}
      />

      <Card className="mb-4">
        <p className="text-xs text-gray-500 mb-2">陀螺庫</p>
        <p className="text-sm text-gray-300 mb-3">
          已儲存 {library.builds.length} 組陀螺組合
        </p>
        <Link href={`/library/${encodeURIComponent(nameKey)}`}>
          <Button fullWidth variant="secondary">
            編輯此選手陀螺庫
          </Button>
        </Link>
      </Card>

      {library.builds.length > 0 && (
        <Card className="mb-4">
          <p className="text-xs text-gray-500 mb-2">已儲存 SET UP</p>
          <ul className="space-y-2 text-sm">
            {library.builds.map((b) => (
              <li key={b.id} className="border-b border-arena-border/50 pb-2 last:border-0">
                <p className="font-medium text-arena-neon">
                  {b.nickname || "未命名"}
                </p>
                <p className="text-xs text-gray-500">
                  {b.typeLabel} · 攻{b.stats.attack} 防{b.stats.defense} 總
                  {b.stats.total}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {adminLoggedIn && (
        <Button
          variant="ghost"
          fullWidth
          className="text-red-400"
          onClick={() => {
            if (
              confirm(
                `確定刪除選手「${displayName}」？陀螺庫資料一併移除。`
              )
            ) {
              deleteFighterByNameKey(nameKey);
              router.push("/fighters");
            }
          }}
        >
          刪除選手（Admin）
        </Button>
      )}
    </div>
  );
}
