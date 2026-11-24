import { PT } from "@/lib/i18n/pt";

/**
 * Translatable text for server AND client components (ADR-018). Renders both languages; CSS in
 * globals.css hides the inactive one based on <html data-lang>, which the pre-paint script sets.
 * So pages stay static (no cookie read on the server) and there is no flash of the wrong language.
 *
 * `children` is the English source; pt-BR comes from `pt` or the PT dictionary. No translation →
 * plain English. For attributes (aria-label, alt, placeholder) use `useT()` from "@/lib/i18n/client".
 */
export function T({ children, pt }: { children: string; pt?: string }) {
  const tr = pt ?? PT[children];
  if (tr === undefined || tr === children) return <>{children}</>;
  return (
    <>
      <span data-l="en">{children}</span>
      <span data-l="pt" lang="pt-BR">
        {tr}
      </span>
    </>
  );
}

/** Plain-string lookup (no markup), for server code that needs a pt-BR string. */
export function ptOf(en: string) {
  return PT[en] ?? en;
}
