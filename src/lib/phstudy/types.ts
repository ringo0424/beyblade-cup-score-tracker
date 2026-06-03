/** Categories aligned with beyblade.phstudy.org viewer */
export type PhstudyPartCategory =
  | "Blade"
  | "Ratchet"
  | "Bit"
  | "LockChip"
  | "MainBlade"
  | "OverBlade"
  | "MetalBlade"
  | "AssistBlade";

export interface PhstudyPartOption {
  id: string;
  name: string;
  catalogTitle?: string;
  type?: string;
  imageUrl: string;
  imageFallbackJpg?: string;
  imageFallbackApp?: string;
}

export type PhstudyPartsCatalog = Record<
  PhstudyPartCategory,
  PhstudyPartOption[]
>;

export interface PhstudyPartsCatalogResponse {
  source: "beyblade.phstudy.org";
  locale: string;
  fetchedAt: string;
  categories: PhstudyPartsCatalog;
  counts: Record<PhstudyPartCategory, number>;
}

export interface PhstudyMasterJson {
  data: Record<string, Record<string, PhstudyRawPart>>;
  stat_ranges?: unknown;
}

export interface PhstudyRawPart {
  id: string;
  name: Record<string, string>;
  catalog_title?: Record<string, string>;
  type?: string;
  tags?: string[];
}
