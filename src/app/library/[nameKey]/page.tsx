"use client";

import { use } from "react";
import Link from "next/link";
import { useAppData } from "@/hooks/useAppData";
import { FighterAvatar } from "@/components/fighters/FighterAvatar";
import { FighterName } from "@/components/fighters/FighterName";
import { FighterLibraryEditor } from "@/components/fighters/FighterLibraryEditor";

export default function FighterLibraryPage({
  params,
}: {
  params: Promise<{ nameKey: string }>;
}) {
  const { nameKey: rawKey } = use(params);
  const nameKey = decodeURIComponent(rawKey);
  const {
    data,
    hydrated,
    registeredFighters,
    getLibraryForFighter,
    saveBuildToLibrary,
    removeBuildFromLibrary,
  } = useAppData();

  const profile = registeredFighters.find((f) => f.nameKey === nameKey);
  const displayName = profile?.displayName ?? nameKey;
  const library = getLibraryForFighter(nameKey);
  const icon =
    data.fighters?.find((f) => f.nameKey === nameKey)?.icon ?? profile?.icon;

  if (!hydrated) {
    return <p className="text-gray-500 text-center py-8">載入中…</p>;
  }

  if (!profile) {
    return (
      <div>
        <Link href="/library" className="text-sm text-gray-500 hover:text-arena-neon">
          ← 陀螺庫
        </Link>
        <p className="text-center text-gray-500 py-8">找不到此選手</p>
      </div>
    );
  }

  return (
    <div>
      <Link href="/library" className="text-sm text-gray-500 hover:text-arena-neon">
        ← 選擇選手
      </Link>
      <h2 className="text-xl font-bold mt-2 mb-1 flex items-center gap-2">
        <FighterAvatar icon={icon} name={displayName} size="sm" />
        <FighterName name={displayName} title={profile.title} />
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        為此選手管理陀螺 SET UP 與零件組合。
      </p>

      <FighterLibraryEditor
        displayName={displayName}
        library={library}
        onSaveBuild={(beyblade, partTypes) =>
          saveBuildToLibrary(beyblade, partTypes, nameKey)
        }
        onRemoveBuild={(buildId) => removeBuildFromLibrary(buildId, nameKey)}
      />
    </div>
  );
}
