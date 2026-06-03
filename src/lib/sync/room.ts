import type { AppData } from "@/types";
import { getSupabase, type SyncRoomRow } from "./supabase";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export async function createSyncRoom(
  payload: AppData
): Promise<{ code: string; revision: number } | { error: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { error: "尚未設定 Supabase（請在 Vercel 加入環境變數）" };
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = randomCode();
    const { data, error } = await supabase
      .from("sync_rooms")
      .insert({
        code,
        payload,
        revision: 1,
      })
      .select("code, revision")
      .single();

    if (!error && data) {
      return { code: data.code as string, revision: data.revision as number };
    }
    if (error?.code !== "23505") {
      return { error: error?.message ?? "建立同步房間失敗" };
    }
  }

  return { error: "無法產生房間代碼，請再試一次" };
}

export async function fetchSyncRoom(
  codeInput: string
): Promise<
  | { code: string; payload: AppData; revision: number }
  | { error: string }
> {
  const supabase = getSupabase();
  if (!supabase) {
    return { error: "尚未設定 Supabase（請在 Vercel 加入環境變數）" };
  }

  const code = normalizeCode(codeInput);
  if (code.length < 4) {
    return { error: "房間代碼太短" };
  }

  const { data, error } = await supabase
    .from("sync_rooms")
    .select("code, payload, revision")
    .eq("code", code)
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: "找不到此房間代碼" };

  return {
    code: data.code as string,
    payload: data.payload as AppData,
    revision: data.revision as number,
  };
}

export type PushSyncResult =
  | { ok: true; revision: number }
  | { ok: false; error: string }
  | { ok: false; conflict: true; payload: AppData; revision: number };

export async function pushSyncRoom(
  codeInput: string,
  payload: AppData,
  expectedRevision: number
): Promise<PushSyncResult> {
  const supabase = getSupabase();
  if (!supabase) {
    return { ok: false, error: "尚未設定 Supabase" };
  }

  const code = normalizeCode(codeInput);
  const nextRevision = expectedRevision + 1;

  const { data, error } = await supabase
    .from("sync_rooms")
    .update({
      payload,
      revision: nextRevision,
      updated_at: new Date().toISOString(),
    })
    .eq("code", code)
    .eq("revision", expectedRevision)
    .select("revision")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data) {
    const latest = await fetchSyncRoom(code);
    if ("error" in latest) return { ok: false, error: latest.error };
    return {
      ok: false,
      conflict: true,
      payload: latest.payload,
      revision: latest.revision,
    };
  }

  return { ok: true, revision: data.revision as number };
}

export function subscribeSyncRoom(
  codeInput: string,
  onUpdate: (payload: AppData, revision: number) => void
): () => void {
  const supabase = getSupabase();
  if (!supabase) return () => {};

  const code = normalizeCode(codeInput);
  const channel = supabase
    .channel(`sync-room-${code}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "sync_rooms",
        filter: `code=eq.${code}`,
      },
      (payload) => {
        const row = payload.new as SyncRoomRow;
        if (row?.payload) {
          onUpdate(row.payload as AppData, row.revision);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export { normalizeCode };
