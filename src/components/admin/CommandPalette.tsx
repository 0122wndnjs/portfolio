"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/components/admin/api";
import { SEARCH_LABELS, searchHref, type SearchResult } from "./redesign-utils";

export type Command = { id: string; label: string; hint?: string; href: string };

export default function CommandPalette({
  open,
  onClose,
  commands,
}: {
  open: boolean;
  onClose: () => void;
  commands: Command[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [found, setFound] = useState<{ q: string; rows: Command[] }>({ q: "", rows: [] });
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    let active = true;
    const timer = setTimeout(() => {
      api<SearchResult[]>(`/api/admin/search?q=${encodeURIComponent(q)}`)
        .then((rows) => {
          if (active) setFound({ q, rows: rows.slice(0, 20).map((row) => ({ id: `s-${row.type}-${row.id}`, label: row.title, hint: SEARCH_LABELS[row.type] || row.type, href: searchHref(row) })) });
        })
        .catch(() => active && setFound({ q, rows: [] }));
    }, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const local = (q ? commands.filter((command) => `${command.label} ${command.hint || ""}`.toLowerCase().includes(q)) : commands).slice(0, 12);
    const remote = q.length >= 2 && found.q.toLowerCase() === q ? found.rows.filter((row) => !local.some((item) => item.href === row.href)) : [];
    return [...local, ...remote];
  }, [commands, query, found]);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  if (!open) return null;

  function close() {
    setQuery("");
    setIndex(0);
    onClose();
  }

  function run(command: Command | undefined) {
    if (!command) return;
    close();
    router.push(command.href);
  }

  return (
    <div className="rd-cmdk-backdrop" onMouseDown={(event) => event.target === event.currentTarget && close()}>
      <div className="rd-cmdk" role="dialog" aria-modal="true" aria-label="검색 및 이동">
        <input
          ref={inputRef}
          value={query}
          placeholder="메뉴·프로젝트·작업·미팅·견적·입금 검색…"
          aria-label="명령 검색"
          role="combobox"
          aria-expanded="true"
          aria-controls="rd-cmdk-list"
          aria-activedescendant={results[index] ? `rd-cmd-${results[index].id}` : undefined}
          onChange={(event) => {
            setQuery(event.target.value);
            setIndex(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") close();
            else if (event.key === "ArrowDown") {
              event.preventDefault();
              setIndex((value) => Math.min(value + 1, results.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setIndex((value) => Math.max(value - 1, 0));
            } else if (event.key === "Enter") {
              event.preventDefault();
              run(results[index]);
            }
          }}
        />
        <ul id="rd-cmdk-list" role="listbox">
          {results.map((command, i) => (
            <li key={command.id} role="presentation">
              <button
                id={`rd-cmd-${command.id}`}
                type="button"
                role="option"
                aria-selected={i === index}
                onMouseEnter={() => setIndex(i)}
                onClick={() => run(command)}
              >
                <span>{command.label}</span>
                {command.hint && <small>{command.hint}</small>}
              </button>
            </li>
          ))}
          {results.length === 0 && <li className="rd-empty">결과가 없어요.</li>}
        </ul>
      </div>
    </div>
  );
}
