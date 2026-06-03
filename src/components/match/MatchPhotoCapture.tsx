"use client";

import { useRef, useState } from "react";
import type { MatchCelebrationPhotos } from "@/types";
import { fileToCompressedDataUrl } from "@/lib/imageCompress";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type Slot = "champion" | "runnerUp";

function PhotoSlot({
  label,
  name,
  dataUrl,
  disabled,
  onCapture,
  onClear,
}: {
  label: string;
  name: string;
  dataUrl?: string;
  disabled?: boolean;
  onCapture: (file: File) => Promise<void>;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    setErr(null);
    setBusy(true);
    try {
      await onCapture(file);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "無法處理圖片");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <Card className="mb-3">
      <p className="text-sm font-bold text-arena-neon mb-1">{label}</p>
      <p className="text-xs text-gray-500 mb-3">{name}</p>

      {dataUrl ? (
        <div className="relative rounded-xl overflow-hidden mb-3 aspect-[4/3] bg-arena-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={dataUrl}
            alt={`${label}紀念照`}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-arena-border aspect-[4/3] flex items-center justify-center mb-3 text-gray-600 text-sm">
          尚未拍攝
        </div>
      )}

      {err && <p className="text-xs text-red-400 mb-2">{err}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        disabled={disabled || busy}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <div className="flex gap-2">
        <Button
          variant="secondary"
          className="flex-1"
          disabled={disabled || busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? "處理中…" : dataUrl ? "重拍" : "拍照 / 選圖"}
        </Button>
        {dataUrl && (
          <Button
            variant="ghost"
            disabled={disabled || busy}
            onClick={onClear}
          >
            移除
          </Button>
        )}
      </div>
    </Card>
  );
}

export function MatchPhotoCapture({
  championName,
  runnerUpName,
  photos,
  onChange,
}: {
  championName: string;
  runnerUpName?: string;
  photos?: MatchCelebrationPhotos;
  onChange: (next: MatchCelebrationPhotos) => void;
}) {
  const update = (slot: Slot, dataUrl: string | undefined) => {
    const next: MatchCelebrationPhotos = {
      ...photos,
      updatedAt: new Date().toISOString(),
    };
    if (slot === "champion") {
      if (dataUrl) next.champion = dataUrl;
      else delete next.champion;
    } else {
      if (dataUrl) next.runnerUp = dataUrl;
      else delete next.runnerUp;
    }
    if (!next.champion && !next.runnerUp) {
      onChange({});
      return;
    }
    onChange(next);
  };

  const capture = async (slot: Slot, file: File) => {
    const dataUrl = await fileToCompressedDataUrl(file);
    update(slot, dataUrl);
  };

  return (
    <div className="mb-4">
      <h3 className="text-sm font-bold text-gray-400 mb-2">比賽紀念照（背景）</h3>
      <p className="text-xs text-gray-600 mb-3">
        冠軍、亞軍各一張，作為本場比賽背景。
      </p>

      <PhotoSlot
        label="冠軍"
        name={championName}
        dataUrl={photos?.champion}
        onCapture={(file) => capture("champion", file)}
        onClear={() => update("champion", undefined)}
      />

      {runnerUpName && (
        <PhotoSlot
          label="亞軍"
          name={runnerUpName}
          dataUrl={photos?.runnerUp}
          onCapture={(file) => capture("runnerUp", file)}
          onClear={() => update("runnerUp", undefined)}
        />
      )}
    </div>
  );
}
