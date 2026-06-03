"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { PhstudyPartOption, PhstudyPartCategory } from "@/lib/phstudy/types";
import { phstudyPartUrl } from "@/lib/phstudy/mapping";

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
      <label className="label-arena" htmlFor={listId}>
        {label}
      </label>
      <input
        id={listId}
        className="input-arena"
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
      {open && filtered.length > 0 && !disabled && (
        <ul
          className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl border border-arena-border bg-arena-card shadow-lg"
          role="listbox"
        >
          {filtered.map((opt) => (
            <li key={opt.id}>
              <button
                type="button"
                className="w-full text-left px-3 py-2.5 text-sm hover:bg-arena-neon/10 border-b border-arena-border/50 last:border-0"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(opt)}
              >
                <span className="font-medium text-gray-100">{opt.name}</span>
                {opt.type && (
                  <span className="ml-2 text-xs text-arena-purple">
                    {opt.type}
                  </span>
                )}
                <span className="block text-xs text-gray-600 truncate">
                  {opt.id}
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
