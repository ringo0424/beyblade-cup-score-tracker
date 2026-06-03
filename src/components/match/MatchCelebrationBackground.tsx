"use client";

import type { ReactNode } from "react";
import type { MatchCelebrationPhotos } from "@/types";
import { hasCelebrationPhotos } from "@/lib/matchPhotos";

export function MatchCelebrationBackground({
  photos,
  className = "",
  overlayClassName = "bg-arena-black/75",
  children,
}: {
  photos?: MatchCelebrationPhotos;
  className?: string;
  overlayClassName?: string;
  children: ReactNode;
}) {
  if (!hasCelebrationPhotos(photos)) {
    return <div className={className}>{children}</div>;
  }

  const hasChampion = Boolean(photos?.champion);
  const hasRunner = Boolean(photos?.runnerUp);
  const split = hasChampion && hasRunner;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 flex">
        {hasChampion && (
          <div
            className={`${split ? "w-1/2" : "w-full"} h-full bg-cover bg-center`}
            style={{ backgroundImage: `url(${photos!.champion})` }}
            aria-hidden
          />
        )}
        {hasRunner && (
          <div
            className={`${split ? "w-1/2" : "w-full"} h-full bg-cover bg-center`}
            style={{ backgroundImage: `url(${photos!.runnerUp})` }}
            aria-hidden
          />
        )}
      </div>
      <div className={`absolute inset-0 ${overlayClassName}`} aria-hidden />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
