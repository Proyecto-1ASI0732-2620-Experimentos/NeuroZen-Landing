import { ui, defaultLang } from "./ui";

export type Lang = keyof typeof ui;
export type UiKey = keyof (typeof ui)[typeof defaultLang];

export function getLangFromUrl(url: URL): Lang {
  const [, lang] = url.pathname.split("/");
  if (lang in ui) return lang as Lang;
  return defaultLang;
}

export function useTranslations(lang: Lang) {
  return function t(key: UiKey) {
    return ui[lang][key] || ui[defaultLang][key];
  };
}

/**
 * Páginas internas con slug distinto por idioma.
 * clave = slug en español (idioma por defecto), valor = slug en inglés.
 */
const localizedSlugs: Record<string, string> = {
  descargar: "download",
};

/** Ruta interna localizada: getLocalizedPath("en", "descargar") → "/en/download". */
export function getLocalizedPath(lang: Lang, esSlug = ""): string {
  const slug = lang === "en" ? (localizedSlugs[esSlug] ?? esSlug) : esSlug;
  if (lang === defaultLang) return slug ? `/${slug}` : "/";
  return slug ? `/${lang}/${slug}` : `/${lang}/`;
}

/** Ancla de la home en el idioma indicado: getHomeAnchor("en", "#planes") → "/en/#planes". */
export function getHomeAnchor(lang: Lang, hash: string): string {
  return `${getLocalizedPath(lang)}${hash}`;
}

/** Ruta equivalente de la página actual en el otro idioma. */
export function getAlternatePath(url: URL, targetLang: Lang): string {
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments[0] && segments[0] in ui) segments.shift();

  // Normaliza el slug al español para poder traducirlo.
  const reverse = Object.fromEntries(
    Object.entries(localizedSlugs).map(([es, en]) => [en, es]),
  );
  const first = segments[0] ?? "";
  const esSlug = reverse[first] ?? first;
  const rest = segments.slice(1).join("/");

  const base = getLocalizedPath(targetLang, esSlug);
  if (!rest) return base;
  return `${base.replace(/\/$/, "")}/${rest}`;
}
