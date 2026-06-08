"use client";

import { useRef, useState } from "react";
import { fileToAvatarDataUrl } from "@/lib/imageCompress";
import { FighterAvatar } from "@/components/fighters/FighterAvatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function AvatarUploader({
  displayName,
  icon,
  onSave,
  onClear,
}: {
  displayName: string;
  icon?: string;
  onSave: (dataUrl: string) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | undefined>(icon);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      setPreview(dataUrl);
      onSave(dataUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "上傳失敗");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="mb-4">
      <p className="text-xs text-gray-500 mb-3">選手頭像（PNG / JPG / GIF）</p>
      <div className="flex items-center gap-4 mb-3">
        <FighterAvatar icon={preview ?? icon} name={displayName} size="lg" />
        <div className="flex-1 min-w-0">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif"
            className="hidden"
            onChange={(e) => {
              void handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="secondary"
            fullWidth
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? "處理中…" : "上傳頭像"}
          </Button>
          {(preview || icon) && (
            <Button
              type="button"
              variant="ghost"
              fullWidth
              className="mt-2 text-red-400"
              onClick={() => {
                setPreview(undefined);
                onClear();
              }}
            >
              移除頭像
            </Button>
          )}
        </div>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </Card>
  );
}
