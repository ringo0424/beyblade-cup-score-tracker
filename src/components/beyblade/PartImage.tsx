"use client";

import { useCallback, useState } from "react";
import type { PhstudyPartCategory } from "@/lib/phstudy/types";
import { getPhstudyImagePaths } from "@/lib/phstudy/images";

type ImageSize = "sm" | "md";

const sizeClass: Record<ImageSize, string> = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
};

export function PartImage({
  partId,
  category,
  alt,
  size = "sm",
  className = "",
  imageUrl,
  imageFallbackJpg,
  imageFallbackApp,
}: {
  partId: string;
  category: PhstudyPartCategory;
  alt: string;
  size?: ImageSize;
  className?: string;
  imageUrl?: string;
  imageFallbackJpg?: string;
  imageFallbackApp?: string;
}) {
  const paths = getPhstudyImagePaths(category, partId);
  const primary = imageUrl ?? paths.primary;
  const jpg = imageFallbackJpg ?? paths.fallbackJpg;
  const app = imageFallbackApp ?? paths.fallbackApp;

  const [stage, setStage] = useState(0);
  const [hidden, setHidden] = useState(false);

  const src =
    stage === 0 ? primary : stage === 1 ? jpg : stage === 2 ? app : "";

  const onError = useCallback(() => {
    setStage((s) => {
      if (s < 2) return s + 1;
      setHidden(true);
      return s;
    });
  }, []);

  if (hidden || !src) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-lg bg-arena-border/40 text-[10px] text-gray-600 ${sizeClass[size]} ${className}`}
        aria-hidden
      >
        —
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={onError}
      className={`shrink-0 rounded-lg bg-arena-black object-contain ${sizeClass[size]} ${className}`}
    />
  );
}
