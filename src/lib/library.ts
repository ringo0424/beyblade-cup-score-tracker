import type {
  AppData,
  Beyblade,
  LibraryBuild,
  LibraryPart,
  UserLibrary,
} from "@/types";
import { generateId } from "@/lib/id";
import { computeBeybladeStats } from "@/lib/beybladeStats";
import type { PhstudyPartCategory } from "@/lib/phstudy/types";
import { SHARED_LIBRARY_ID } from "@/lib/constants";

export function getSharedLibrary(data: AppData): UserLibrary {
  return getUserLibrary(data, SHARED_LIBRARY_ID);
}

/** ownerId = 選手 nameKey 或 SHARED_LIBRARY_ID */
export function getUserLibrary(data: AppData, ownerId: string): UserLibrary {
  return (
    data.libraries.find((l) => l.accountId === ownerId) ?? {
      accountId: ownerId,
      savedParts: [],
      builds: [],
    }
  );
}

export function upsertUserLibrary(
  data: AppData,
  library: UserLibrary
): AppData {
  const others = data.libraries.filter((l) => l.accountId !== library.accountId);
  return { ...data, libraries: [...others, library] };
}

export function addLibraryPart(
  data: AppData,
  _accountId: string,
  part: Omit<LibraryPart, "id">
): AppData {
  const lib = getSharedLibrary(data);
  if (lib.savedParts.some((p) => p.phstudyId === part.phstudyId)) {
    return data;
  }
  const savedParts = [...lib.savedParts, { ...part, id: generateId() }];
  return upsertUserLibrary(data, { ...lib, savedParts });
}

export function removeLibraryPart(
  data: AppData,
  _accountId: string,
  partId: string
): AppData {
  const lib = getSharedLibrary(data);
  return upsertUserLibrary(data, {
    ...lib,
    savedParts: lib.savedParts.filter((p) => p.id !== partId),
  });
}

export function createLibraryBuild(
  beyblade: Beyblade,
  partTypes: Partial<Record<PhstudyPartCategory, string>>
): LibraryBuild {
  const { typeLabel, ...stats } = computeBeybladeStats(beyblade, partTypes);
  return {
    id: generateId(),
    nickname: beyblade.nickname,
    steelBlade: beyblade.steelBlade,
    lockDisk: beyblade.lockDisk,
    axis: beyblade.axis,
    emblemLock: beyblade.emblemLock,
    mainBlade: beyblade.mainBlade,
    xtremeBlade: beyblade.xtremeBlade,
    metalBlade: beyblade.metalBlade,
    assistBlade: beyblade.assistBlade,
    notes: beyblade.notes,
    catalogPartIds: beyblade.catalogPartIds,
    stats,
    typeLabel,
    createdAt: new Date().toISOString(),
  };
}

export function addLibraryBuild(
  data: AppData,
  _accountId: string,
  build: LibraryBuild
): AppData {
  const lib = getSharedLibrary(data);
  return upsertUserLibrary(data, {
    ...lib,
    builds: [...lib.builds, build],
  });
}

export function removeLibraryBuild(
  data: AppData,
  _accountId: string,
  buildId: string
): AppData {
  const lib = getSharedLibrary(data);
  return upsertUserLibrary(data, {
    ...lib,
    builds: lib.builds.filter((b) => b.id !== buildId),
  });
}

export function libraryBuildToBeyblade(
  build: LibraryBuild,
  slotIndex: number,
  /** 保留既有 id，避免出戰順序 battleOrder 仍指向舊 id 而崩潰 */
  existingBeybladeId?: string
): Beyblade {
  return {
    id: existingBeybladeId ?? generateId(),
    nickname: build.nickname || `戰刃 ${slotIndex + 1}`,
    steelBlade: build.steelBlade ?? "",
    lockDisk: build.lockDisk ?? "",
    axis: build.axis ?? "",
    emblemLock: build.emblemLock ?? "",
    mainBlade: build.mainBlade ?? "",
    xtremeBlade: build.xtremeBlade ?? "",
    metalBlade: build.metalBlade ?? "",
    assistBlade: build.assistBlade ?? "",
    notes: build.notes ?? "",
    catalogPartIds: build.catalogPartIds,
  };
}
