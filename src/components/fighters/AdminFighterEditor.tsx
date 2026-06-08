"use client";

import { useState } from "react";
import type { FighterProfile } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function AdminFighterEditor({
  fighter,
  onSave,
}: {
  fighter: FighterProfile;
  onSave: (patch: { displayName: string; title: string }) => void;
}) {
  const [name, setName] = useState(fighter.displayName);
  const [title, setTitle] = useState(fighter.title ?? "");

  return (
    <Card className="mb-4 border-arena-purple/30">
      <h3 className="font-bold text-arena-purple mb-2">Admin · 編輯選手</h3>
      <label className="label-arena">選手名</label>
      <input
        className="input-arena mb-3"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="選手名"
      />
      <label className="label-arena">稱號</label>
      <input
        className="input-arena mb-3"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="稱號（選填）"
      />
      <Button
        fullWidth
        variant="secondary"
        disabled={!name.trim()}
        onClick={() => onSave({ displayName: name.trim(), title: title.trim() })}
      >
        儲存選手名與稱號
      </Button>
    </Card>
  );
}
