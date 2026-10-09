"use client";

import { useEffect, useId, useRef, useState } from "react";
import { LOCALES, LOCALE_NAMES, type Locale } from "@/i18n/messages";
import { Chevron, Globe } from "./icons";

export function LanguageSwitcher({
  locale,
  label,
  onChange,
}: {
  locale: Locale;
  label: string;
  onChange: (locale: Locale) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${label}: ${LOCALE_NAMES[locale]}`}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 items-center gap-1.5 rounded-[3px] px-2.5 text-[13px] font-semibold tracking-[0.08em] text-ink-2 uppercase ring-1 ring-white/15 transition-colors hover:bg-white/5 hover:text-white"
        data-testid="language-switcher"
      >
        <Globe className="h-4 w-4" />
        {locale}
        <Chevron className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute right-0 z-40 mt-2 w-48 overflow-hidden rounded-[3px] bg-mist py-1 text-navy shadow-[0_12px_32px_rgba(3,8,22,0.45)]"
        >
          {LOCALES.map((code) => (
            <li key={code} role="option" aria-selected={code === locale}>
              <button
                type="button"
                lang={code}
                onClick={() => {
                  onChange(code);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between px-4 py-3 text-left text-[15px] ${
                  code === locale ? "font-semibold" : "hover:bg-navy/5"
                }`}
                data-testid={`lang-${code}`}
              >
                {LOCALE_NAMES[code]}
                <span className="text-[12px] font-semibold tracking-[0.1em] text-navy/50 uppercase">{code}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
