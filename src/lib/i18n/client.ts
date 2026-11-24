"use client";

import { useCallback, useSyncExternalStore } from "react";
import { PT } from "./pt";
import { LANG_COOKIE, type Lang } from "./config";

function subscribe(onChange: () => void) {
  const mo = new MutationObserver(onChange);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-lang"] });
  return () => mo.disconnect();
}
const getLang = (): Lang => (document.documentElement.dataset.lang === "pt" ? "pt" : "en");
// The server always renders English text; hydration matches that, then React re-renders once.
const getServerLang = (): Lang => "en";

/** The active language, kept in sync with <html data-lang>. */
export function useLang(): Lang {
  return useSyncExternalStore(subscribe, getLang, getServerLang);
}

/** `t("English", "optional pt override")` → string in the active language (for attributes). */
export function useT() {
  const lang = useLang();
  return useCallback(
    (en: string, pt?: string) => (lang === "pt" ? (pt ?? PT[en] ?? en) : en),
    [lang],
  );
}

/**
 * Flip EN ⇄ pt-BR based on the live <html> state, not React state: a click that arrives while the
 * nav is still hydrating is replayed with the server snapshot ("en"), which would be stale.
 */
export function toggleLang() {
  setLang(getLang() === "pt" ? "en" : "pt");
}

/** Switch language in place: cookie (1 year) + <html> attributes. CSS and useLang() react at once. */
export function setLang(lang: Lang) {
  document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
  const html = document.documentElement;
  if (lang === "pt") html.dataset.lang = "pt";
  else delete html.dataset.lang;
  html.lang = lang === "pt" ? "pt-BR" : "en-GB";
}
