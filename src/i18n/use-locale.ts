"use client";

import { useCallback, useSyncExternalStore } from "react";
import { DEFAULT_LOCALE, detectLocale, isLocale, MESSAGES, type Locale } from "./messages";

const STORAGE_KEY = "ba_locale";
const listeners = new Set<() => void>();
let current: Locale | null = null;

function read(): Locale {
  if (current) return current;
  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    stored = null;
  }
  current = isLocale(stored) ? stored : detectLocale(navigator.languages?.length ? navigator.languages : [navigator.language]);
  return current;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Guest language: saved choice → phone language (mk/en/sv/sq/tr) → Macedonian.
 * The server render uses Macedonian; the browser switches before any copy is shown.
 */
export function useGuestLocale() {
  const locale = useSyncExternalStore(subscribe, read, () => DEFAULT_LOCALE);
  const setLocale = useCallback((next: Locale) => {
    current = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private mode: the choice still applies for this visit.
    }
    document.documentElement.lang = next;
    listeners.forEach((l) => l());
  }, []);
  return { locale, t: MESSAGES[locale], setLocale };
}
