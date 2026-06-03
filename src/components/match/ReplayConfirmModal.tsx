"use client";

import { Button } from "@/components/ui/Button";

export function ReplayConfirmModal({
  open,
  onConfirm,
  onDismiss,
}: {
  open: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4">
      <div className="card-arena w-full max-w-lg border-amber-500/40">
        <h3 className="text-lg font-bold text-amber-300 mb-2">重賽標記</h3>
        <p className="text-gray-400 text-sm mb-4">
          對手已因碰對手前出界獲得 +1 分。此回合已標記為重賽，請確認是否進行重賽後再繼續下一輪。
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" fullWidth onClick={onDismiss}>
            繼續比賽
          </Button>
          <Button variant="primary" fullWidth onClick={onConfirm}>
            確認重賽
          </Button>
        </div>
      </div>
    </div>
  );
}
