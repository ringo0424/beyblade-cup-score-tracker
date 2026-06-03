import type {
  PhstudyMasterJson,
  PhstudyPartOption,
  PhstudyPartsCatalog,
  PhstudyPartsCatalogResponse,
  PhstudyPartCategory,
  PhstudyRawPart,
} from "./types";
import { PHSTUDY_CATEGORY_SOURCES } from "./mapping";
import { getPhstudyImagePaths } from "./images";

const DEFAULT_LOCALE = "zh-TW";

function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, "").trim();
}

function pickLocaleName(
  names: Record<string, string> | undefined,
  locale: string
): string {
  if (!names) return "";
  const raw =
    names[locale] ??
    names["zh-HK"] ??
    names["zh-TW"] ??
    names["ja-JP"] ??
    names["en-US"] ??
    Object.values(names)[0] ??
    "";
  return stripHtml(raw);
}

function toPartOption(
  item: PhstudyRawPart,
  locale: string,
  category: PhstudyPartCategory
): PhstudyPartOption | null {
  if (!item?.id) return null;
  const name = pickLocaleName(item.name, locale);
  if (!name) return null;
  const catalogTitle = pickLocaleName(item.catalog_title, locale);
  const images = getPhstudyImagePaths(category, item.id);
  return {
    id: item.id,
    name,
    catalogTitle: catalogTitle || undefined,
    type: item.type || undefined,
    imageUrl: images.primary,
    imageFallbackJpg: images.fallbackJpg,
    imageFallbackApp: images.fallbackApp,
  };
}

export function mergeMasterdata(
  target: PhstudyMasterJson,
  source: PhstudyMasterJson | null
): void {
  if (!source?.data) return;
  for (const [key, items] of Object.entries(source.data)) {
    if (!target.data[key]) target.data[key] = {};
    for (const [id, entry] of Object.entries(items)) {
      if (!(id in target.data[key])) {
        target.data[key][id] = entry;
      }
    }
  }
}

export function buildPartsCatalog(
  masterdata: PhstudyMasterJson,
  locale = DEFAULT_LOCALE
): PhstudyPartsCatalog {
  const empty = (): PhstudyPartsCatalog => ({
    Blade: [],
    Ratchet: [],
    Bit: [],
    LockChip: [],
    MainBlade: [],
    OverBlade: [],
    MetalBlade: [],
    AssistBlade: [],
  });

  const catalog = empty();

  for (const { key, category } of PHSTUDY_CATEGORY_SOURCES) {
    const items = Object.values(masterdata.data[key] || {});
    const options: PhstudyPartOption[] = [];
    for (const item of items) {
      const opt = toPartOption(item, locale, category);
      if (opt) options.push(opt);
    }
    options.sort((a, b) => a.name.localeCompare(b.name, "zh-Hant"));
    catalog[category] = options;
  }

  return catalog;
}

export function toCatalogResponse(
  categories: PhstudyPartsCatalog,
  locale: string,
  fetchedAt: string
): PhstudyPartsCatalogResponse {
  const counts = {} as PhstudyPartsCatalogResponse["counts"];
  for (const cat of Object.keys(categories) as (keyof PhstudyPartsCatalog)[]) {
    counts[cat] = categories[cat].length;
  }
  return {
    source: "beyblade.phstudy.org",
    locale,
    fetchedAt,
    categories,
    counts,
  };
}

export async function fetchPhstudyMasterdata(): Promise<PhstudyMasterJson> {
  const [mainRes, hardcodedRes] = await Promise.all([
    fetch(`${process.env.PHSTUDY_DATA_BASE ?? "https://beyblade.phstudy.org/data"}/main.json`, {
      next: { revalidate: 86400 },
    }),
    fetch(
      `${process.env.PHSTUDY_DATA_BASE ?? "https://beyblade.phstudy.org/data"}/hardcoded.json`,
      { next: { revalidate: 86400 } }
    ).catch(() => null),
  ]);

  if (!mainRes.ok) {
    throw new Error(`phstudy main.json failed: ${mainRes.status}`);
  }

  const masterdata = (await mainRes.json()) as PhstudyMasterJson;

  if (hardcodedRes?.ok) {
    const hardcoded = (await hardcodedRes.json()) as PhstudyMasterJson;
    mergeMasterdata(masterdata, hardcoded);
  }

  return masterdata;
}
