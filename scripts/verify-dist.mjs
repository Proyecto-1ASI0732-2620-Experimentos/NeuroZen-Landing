#!/usr/bin/env node
/**
 * Verificación estática del build de producción (dist/).
 * Uso: pnpm build && pnpm verify
 *
 * Comprueba:
 *  - Que ninguna página tenga enlaces vacíos, "#" o "javascript:".
 *  - Que los enlaces internos apunten a archivos existentes y las anclas a ids reales.
 *  - Que los enlaces externos solo apunten a rutas conocidas de la Web App.
 *  - Que <html lang> coincida con el idioma de la ruta.
 *  - Que el APK exista, no esté vacío y sea un APK válido (ZIP con AndroidManifest.xml y classes.dex).
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const DIST = join(process.cwd(), "dist");
const WEB_APP = "https://neurozen-web-frontend.vercel.app";
const WEB_APP_ROUTES = new Set([
  "/", "/register", "/login", "/subscriptions", "/subscriptions/purchase", "/book-session", "/therapists",
]);
const APK = join(DIST, "downloads", "NeuroZen.apk");

let failures = 0;
const fail = (msg) => { failures++; console.error(`✗ ${msg}`); };
const pass = (msg) => console.log(`✓ ${msg}`);

if (!existsSync(DIST)) {
  console.error("No existe dist/. Ejecuta primero `pnpm build`.");
  process.exit(1);
}

const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
const htmlFiles = walk(DIST).filter((f) => f.endsWith(".html"));

const resolveInternal = (pathname) => {
  const clean = decodeURIComponent(pathname).replace(/^\//, "");
  const candidates = [clean, join(clean, "index.html"), `${clean}.html`];
  return candidates.map((c) => join(DIST, c)).find((c) => existsSync(c) && statSync(c).isFile());
};

const idsOf = (html) => new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));

for (const file of htmlFiles) {
  const rel = "/" + relative(DIST, file).split(sep).join("/");
  const html = readFileSync(file, "utf8");
  const isRedirect = /http-equiv="refresh"/.test(html) && !/<main/.test(html);
  const expectedLang = rel.startsWith("/en/") ? "en" : "es";
  const lang = html.match(/<html[^>]*\slang="([^"]+)"/)?.[1];
  if (!isRedirect && lang !== expectedLang) fail(`${rel}: <html lang="${lang}"> (esperado "${expectedLang}")`);

  const hrefs = [...html.matchAll(/<a\b[^>]*?\shref="([^"]*)"/g)].map((m) => m[1].replace(/&amp;/g, "&"));
  for (const href of hrefs) {
    if (!href || href === "#" || href.startsWith("javascript:")) { fail(`${rel}: enlace sin destino (${JSON.stringify(href)})`); continue; }
    if (href.startsWith("#")) {
      if (!idsOf(html).has(href.slice(1))) fail(`${rel}: ancla ${href} sin id de destino`);
      continue;
    }
    const url = new URL(href, "https://local.test" + rel);
    if (url.origin === "https://local.test") {
      const target = resolveInternal(url.pathname);
      if (!target) { fail(`${rel}: enlace interno roto ${href}`); continue; }
      if (url.hash.length > 1 && target.endsWith(".html") && !idsOf(readFileSync(target, "utf8")).has(url.hash.slice(1))) {
        fail(`${rel}: ancla ${href} no existe en el destino`);
      }
    } else if (url.origin === WEB_APP) {
      if (!WEB_APP_ROUTES.has(url.pathname)) fail(`${rel}: ruta de la Web App no verificada ${href}`);
    } else {
      fail(`${rel}: enlace externo inesperado ${href}`);
    }
  }
}
if (!failures) pass(`${htmlFiles.length} páginas: enlaces, anclas e idioma correctos`);

// APK
if (!existsSync(APK)) {
  fail("dist/downloads/NeuroZen.apk no existe");
} else {
  const buf = readFileSync(APK);
  const isZip = buf.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
  const hasManifest = buf.includes(Buffer.from("AndroidManifest.xml"));
  const hasDex = buf.includes(Buffer.from("classes.dex"));
  const hasV2Sig = buf.includes(Buffer.from("APK Sig Block 42"));
  if (buf.length === 0) fail("El APK está vacío");
  else if (!isZip || !hasManifest || !hasDex) fail("El archivo no parece un APK válido");
  else {
    pass(`APK válido: ${(buf.length / 1048576).toFixed(1)} MB, firma v2: ${hasV2Sig ? "sí" : "no"}`);
    pass(`SHA-256: ${createHash("sha256").update(buf).digest("hex")}`);
  }
}

if (failures) {
  console.error(`\n${failures} problema(s) encontrado(s).`);
  process.exit(1);
}
console.log("\nVerificación completada sin errores.");
