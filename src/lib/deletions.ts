/** 雲端同步用的刪除墓碑，避免 merge 把已刪資料又合併回來 */

export function mergeDeletedIds(
  local?: string[],
  remote?: string[]
): string[] {
  return [...new Set([...(local ?? []), ...(remote ?? [])])];
}

export function deletedIdSet(ids?: string[]): Set<string> {
  return new Set(ids ?? []);
}
