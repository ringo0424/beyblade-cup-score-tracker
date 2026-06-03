"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { PhstudyPartOption, PhstudyPartCategory } from "@/lib/phstudy/types";
import { phstudyCategoryUrl, phstudyPartUrl } from "@/lib/phstudy/mapping";
import { PartImage } from "./PartImage";

const MAX_SUGGESTIONS = 12;

export function PartCombobox({
  label,
  value,
  partId,
  category,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  partId?: string;
  category: PhstudyPartCategory;
  options: PhstudyPartOption[];
  disabled?: boolean;
  onChange: (name: string, id?: string) => void;
}) {
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);

  const selectedOption = useMemo(
    () => (partId ? options.find((o) => o.id === partId) : undefined),
    [options, partId]
  );

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, MAX_SUGGESTIONS);
    return options
      .filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q) ||
          (o.catalogTitle?.toLowerCase().includes(q) ?? false)
      )
      .slice(0, MAX_SUGGESTIONS);
  }, [options, query]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const select = (opt: PhstudyPartOption) => {
    onChange(opt.name, opt.id);
    setQuery(opt.name);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex items-center justify-between gap-2 mb-1">
        <label className="label-arena mb-0" htmlFor={listId}>
          {label}
        </label>
        <a
          href={phstudyCategoryUrl(category)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-gray-600 hover:text-arena-neon shrink-0"
        >
          phstudy 分類 →
        </a>
      </div>

      <div className="flex gap-2 items-center">
        {partId && (
          <PartImage
            partId={partId}
            category={category}
            alt={value || partId}
            size="md"
            imageUrl={selectedOption?.imageUrl}
            imageFallbackJpg={selectedOption?.imageFallbackJpg}
            imageFallbackApp={selectedOption?.imageFallbackApp}
          />
        )}
        <input
          id={listId}
          className="input-arena flex-1 min-w-0"
          value={query}
          disabled={disabled}
          autoComplete="off"
          placeholder="輸入搜尋或選擇零件…"
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value, undefined);
            setOpen(true);
          }}
        />
      </div>

      {open && filtered.length > 0 && !disabled && (
        <ul
          className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl border border-arena-border bg-arena-card shadow-lg"
          role="listbox"
        >
          {filtered.map((opt) => (
            <li key={opt.id}>
              <button
                type="button"
                className="w-full text-left px-3 py-2.5 text-sm hover:bg-arena-neon/10 border-b border-arena-border/50 last:border-0 flex gap-2.5 items-center"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(opt)}
              >
                <PartImage
                  partId={opt.id}
                  category={category}
                  alt={opt.name}
                  size="md"
                  imageUrl={opt.imageUrl}
                  imageFallbackJpg={opt.imageFallbackJpg}
                  imageFallbackApp={opt.imageFallbackApp}
                />
                <span className="min-w-0 flex-1">
                  <span className="font-medium text-gray-100 block truncate">
                    {opt.name}
                  </span>
                  {opt.type && (
                    <span className="text-xs text-arena-purple">{opt.type}</span>
                  )}
                  <span className="block text-xs text-gray-600 truncate">
                    {opt.id}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {partId && (
        <a
          href={phstudyPartUrl(partId, category)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-1 text-xs text-arena-neon hover:underline"
        >
          在 phstudy 圖鑑查看 →
        </a>
      )}
    </div>
  );
}
