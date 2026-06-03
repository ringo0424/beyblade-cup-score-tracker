import type { AppData } from "@/types";
import { getSupabase } from "./supabase";

export const GLOBAL_STATE_ID = "main";

export interface GlobalStateRow {
  id: string;
  payload: unknown;
  revision: number;
  updated_at: string;
}

import { normalizeAppData } from "@/lib/storage";
import { ensureRingoAccount } from "@/lib/auth/password";

const EMPTY_PAYLOAD: AppData = normalizeAppData({
  eventDays: [],
  matches: [],
  accounts: [],
  libraries: [],
  fighters: [],
  settings: {},
  version: 4,
});

export async function fetchGlobalState(): Promise<
  { payload: AppData; revision: number } | { error: string }
> {
  const supabase = getSupabase();
  if (!supabase) {
    return { error: "尚未設定 Supabase" };
  }

  const { data, error } = await supabase
    .from("app_global")
    .select("payload, revision")
    .eq("id", GLOBAL_STATE_ID)
    .maybeSingle();

  if (error) return { error: error.message };

  if (!data) {
    const seeded = await supabase.from("app_global").insert({
      id: GLOBAL_STATE_ID,
      payload: EMPTY_PAYLOAD,
      revision: 0,
    });
    if (seeded.error) return { error: seeded.error.message };
    return { payload: EMPTY_PAYLOAD, revision: 0 };
  }

  return {
    payload: normalizePayload(data.payload),
    revision: data.revision as number,
  };
}

function normalizePayload(raw: unknown): AppData {
  return normalizeAppData(raw as Partial<AppData>);
}

export type PushGlobalResult =
  | { ok: true; revision: number }
  | { ok: false; error: string }
  | { ok: false; conflict: true; payload: AppData; revision: number };

export async function pushGlobalState(
  payload: AppData,
  expectedRevision: number
): Promise<PushGlobalResult> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "尚未設定 Supabase" };

  const nextRevision = expectedRevision + 1;
  const { data, error } = await supabase
    .from("app_global")
    .update({
      payload,
      revision: nextRevision,
      updated_at: new Date().toISOString(),
    })
    .eq("id", GLOBAL_STATE_ID)
    .eq("revision", expectedRevision)
    .select("revision")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data) {
    const latest = await fetchGlobalState();
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

export function subscribeGlobalState(
  onUpdate: (payload: AppData, revision: number) => void
): () => void {
  const supabase = getSupabase();
  if (!supabase) return () => {};

  const channel = supabase
    .channel("app-global-main")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "app_global",
        filter: `id=eq.${GLOBAL_STATE_ID}`,
      },
      (payload) => {
        const row = payload.new as GlobalStateRow;
        if (row?.payload) {
          onUpdate(normalizePayload(row.payload), row.revision);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
