// Pruebas E2E de la landing NeuroZen sobre el build de producción.
//
// Requisitos (no incluidos como dependencias del proyecto):
//   npm i -D playwright axe-core && npx playwright install chromium
// Uso:
//   pnpm build && pnpm preview --port 4321   (en otra terminal)
//   node tests/e2e.cjs
// Variables opcionales: BASE_URL (por defecto http://127.0.0.1:4321).
const { chromium, devices } = require("playwright");
const fs = require("fs");
const crypto = require("crypto");
const path = require("path");

const BASE = process.env.BASE_URL || "http://127.0.0.1:4321";
const SHOTS = path.join(__dirname, "screenshots");
fs.mkdirSync(SHOTS, { recursive: true });
const APK_SHA = "91664fb6d238fb47808ebaa7d3072e6e21f549c8994599f711c891c10c9e6108";
const APK_SIZE = 29122399;
const WEBAPP = "https://neurozen-web-frontend.vercel.app";
const VERIFIED_ROUTES = ["/", "/register", "/login", "/subscriptions", "/subscriptions/purchase", "/book-session", "/therapists"];
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

const results = [];
const ok = (name, pass, detail = "") => {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
};

const PAGES = ["/", "/en/", "/descargar/", "/en/download/", "/404"];

(async () => {
  const browser = await chromium.launch();

  // ---------- 1. Enlaces, consola, idioma y accesibilidad por página ----------
  const allLinks = new Map(); // href -> [page, text]
  for (const p of PAGES) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(e.message));
    // Bloquea iframes externos de Google Drive para no depender de terceros
    await page.route(/drive\.google\.com/, (r) => r.abort());
    await page.goto(BASE + p, { waitUntil: "networkidle" });
    const relevant = errors.filter((e) => !/drive\.google|ERR_FAILED|net::ERR_BLOCKED|404 \(Not Found\)/.test(e));
    ok(`[${p}] sin errores de consola`, relevant.length === 0, relevant.join(" | "));

    const lang = await page.getAttribute("html", "lang");
    const expectLang = p.startsWith("/en") ? "en" : "es";
    ok(`[${p}] <html lang="${expectLang}">`, lang === expectLang, `lang=${lang}`);

    const links = await page.$$eval("a", (as) =>
      as.map((a) => ({ href: a.getAttribute("href"), abs: a.href, text: (a.innerText || a.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ") })),
    );
    const bad = links.filter((l) => !l.href || l.href === "#" || l.href.startsWith("javascript"));
    ok(`[${p}] sin enlaces vacíos o "#"`, bad.length === 0, bad.map((b) => b.text).join(", "));
    for (const l of links) if (!allLinks.has(l.abs)) allLinks.set(l.abs, [p, l.text]);

    // Anclas internas: el id de destino debe existir
    const hashes = links.filter((l) => l.href && l.href.startsWith("#") && l.href.length > 1);
    for (const h of hashes) {
      const exists = await page.$(h.href);
      if (!exists) ok(`[${p}] ancla ${h.href} existe`, false);
    }

    // axe-core: reglas WCAG 2.1 A/AA
    await page.addScriptTag({ content: AXE });
    const axe = await page.evaluate(async () => {
      // @ts-ignore
      const r = await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } });
      return r.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, sample: v.nodes.slice(0, 3).map((n) => n.target.join(" ") + " :: " + (n.failureSummary || "").split("\n")[1]) }));
    });
    ok(`[${p}] axe WCAG 2.1 AA sin violaciones`, axe.length === 0, JSON.stringify(axe));
    await ctx.close();
  }

  // ---------- 2. Destinos de todos los enlaces ----------
  const req = await (await browser.newContext()).request;
  for (const [abs, [from, text]] of allLinks) {
    const u = new URL(abs);
    if (u.origin === BASE) {
      const res = await req.get(u.origin + u.pathname, { maxRedirects: 0 }).catch((e) => ({ status: () => 0 }));
      const status = res.status();
      ok(`enlace interno ${u.pathname}${u.hash} («${text}» en ${from})`, status === 200, `HTTP ${status}`);
      if (u.hash && u.hash.length > 1) {
        const html = await (await req.get(u.origin + u.pathname)).text();
        ok(`  ancla ${u.hash} existe en ${u.pathname}`, html.includes(`id="${u.hash.slice(1)}"`));
      }
    } else if (u.origin === WEBAPP) {
      const known = VERIFIED_ROUTES.includes(u.pathname);
      // curl usa el proxy HTTPS del entorno (el cliente de Playwright no)
      const code = require("child_process").execFileSync("curl", ["-s", "-o", "/dev/null", "-w", "%{http_code}", abs]).toString();
      ok(`Web App ${u.pathname}${u.search} («${text}» en ${from})`, known && code === "200", `ruta verificada en el router=${known}, HTTP ${code}`);
    } else {
      ok(`externo ${abs} («${text}» en ${from})`, false, "origen no esperado");
    }
  }

  // ---------- 3. Descarga real del APK (Android) ----------
  {
    const ctx = await browser.newContext({ ...devices["Pixel 7"], acceptDownloads: true });
    const page = await ctx.newPage();
    await page.goto(BASE + "/descargar/", { waitUntil: "networkidle" });
    ok("Android: aviso de escritorio oculto", !(await page.isVisible("#apk-desktop")));
    const warning = await page.textContent("#apk-warning");
    ok("advertencia APK (ES) presente", warning.includes("Esta aplicación se instala mediante un archivo APK externo a Google Play. Es posible que Android solicite autorización para instalar aplicaciones desde esta fuente."));
    const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 30000 }), page.click("#apk-download")]);
    const file = await dl.path();
    const buf = fs.readFileSync(file);
    ok("nombre del archivo descargado = NeuroZen.apk", dl.suggestedFilename() === "NeuroZen.apk", dl.suggestedFilename());
    ok("tamaño del archivo descargado", buf.length === APK_SIZE, `${buf.length} bytes`);
    ok("SHA-256 idéntico al APK original", crypto.createHash("sha256").update(buf).digest("hex") === APK_SHA);
    ok("cabecera ZIP (PK\\x03\\x04) del APK", buf.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04])));
    await page.waitForTimeout(300);
    const status = await page.textContent("#apk-status");
    ok("mensaje de descarga iniciada", /La descarga ha comenzado/.test(status), status);
    const shown = await page.textContent("main");
    ok("huella SHA-256 mostrada en la página", shown.includes(APK_SHA));
    ok("no afirma estar en Google Play", !/Disponible en Google Play|Get it on Google Play|Descargar en Google Play/i.test(shown));
    await page.screenshot({ path: `${SHOTS}/download-android.png`, fullPage: true });
    await ctx.close();
  }

  // ---------- 4. APK no disponible → mensaje de error ----------
  {
    const ctx = await browser.newContext({ ...devices["Pixel 7"], acceptDownloads: true });
    const page = await ctx.newPage();
    await page.route("**/downloads/NeuroZen.apk", (r) => r.fulfill({ status: 404, contentType: "text/html", body: "<h1>404</h1>" }));
    await page.goto(BASE + "/en/download/", { waitUntil: "networkidle" });
    let downloaded = false;
    page.on("download", () => (downloaded = true));
    await page.click("#apk-download");
    await page.waitForSelector("#apk-status:not(.hidden)");
    await page.waitForTimeout(500);
    const msg = await page.textContent("#apk-status");
    ok("EN: error visible si el APK no está disponible", /not available right now/.test(msg), msg);
    ok("EN: no se descarga un archivo inválido", !downloaded);
    const warning = await page.textContent("#apk-warning");
    ok("advertencia APK (EN) presente", warning.includes("This application is installed using an APK file outside Google Play. Android may ask you to authorize installations from this source."));
    await page.screenshot({ path: `${SHOTS}/download-error-en.png` });
    await ctx.close();
  }

  // ---------- 5. Escritorio: aviso de dispositivo no Android ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE + "/descargar/", { waitUntil: "networkidle" });
    ok("escritorio: aviso de dispositivo no Android visible", await page.isVisible("#apk-desktop"));
    await page.screenshot({ path: `${SHOTS}/download-desktop.png`, fullPage: true });
    await ctx.close();
  }

  // ---------- 6. Menú móvil (teclado y enlaces) ----------
  {
    const ctx = await browser.newContext({ ...devices["iPhone SE"] });
    const page = await ctx.newPage();
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    ok("móvil: menú cerrado e inerte al cargar", (await page.getAttribute("#mobile-menu", "inert")) !== null);
    await page.click("#hamburger-btn");
    await page.waitForTimeout(400);
    ok("móvil: aria-expanded=true al abrir", (await page.getAttribute("#hamburger-btn", "aria-expanded")) === "true");
    ok("móvil: foco en botón cerrar", await page.evaluate(() => document.activeElement?.id === "close-menu"));
    const menuLinks = await page.$$eval("#mobile-menu a", (as) => as.map((a) => [a.textContent.trim().replace(/\s+/g, " "), a.getAttribute("href")]));
    const has = (txt, href) => menuLinks.some(([t, h]) => t === txt && h === href);
    ok("móvil: 'Crear cuenta' → /register", has("Crear cuenta", WEBAPP + "/register"));
    ok("móvil: 'Iniciar sesión' → /login", has("Iniciar sesión", WEBAPP + "/login"));
    ok("móvil: 'Descargar aplicación Android' → /descargar", has("Descargar aplicación Android", "/descargar"));
    await page.screenshot({ path: `${SHOTS}/mobile-menu.png` });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
    ok("móvil: Escape cierra el menú", (await page.getAttribute("#mobile-menu", "inert")) !== null);
    // Navegación por ancla desde el menú
    await page.click("#hamburger-btn");
    await page.waitForTimeout(400);
    await page.click('#mobile-menu a[href="#planes"]');
    await page.waitForTimeout(900);
    const top = await page.evaluate(() => document.getElementById("planes").getBoundingClientRect().top);
    ok("móvil: ancla #planes navega a la sección", top < 200 && top > -50, `top=${Math.round(top)}`);
    await ctx.close();
  }

  // ---------- 7. Cambio de idioma ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE + "/descargar/", { waitUntil: "networkidle" });
    await Promise.all([page.waitForNavigation(), page.click("[data-lang-switch]")]);
    ok("idioma: /descargar → /en/download", new URL(page.url()).pathname === "/en/download/" || new URL(page.url()).pathname === "/en/download", page.url());
    await Promise.all([page.waitForNavigation(), page.click("[data-lang-switch]")]);
    ok("idioma: /en/download → /descargar", /\/descargar\/?$/.test(new URL(page.url()).pathname), page.url());
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await Promise.all([page.waitForNavigation(), page.click("[data-lang-switch]")]);
    ok("idioma: / → /en/", /^\/en\/?$/.test(new URL(page.url()).pathname), page.url());
    // Sin textos en español en la versión inglesa
    const enText = await page.evaluate(() => document.body.innerText);
    const spanish = ["Comenzar", "Iniciar sesión", "Crear cuenta", "Descargar", "Beneficios", "Planes", "Psicólogos", "Elegir plan", "Agendar", "Sobre Nosotros", "Todos los derechos"];
    const found = spanish.filter((w) => enText.includes(w));
    ok("EN: sin textos en español visibles", found.length === 0, found.join(", "));
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    const esText = await page.evaluate(() => document.body.innerText);
    const english = ["Get started", "Log in", "Create account", "Download Android", "Choose plan", "Schedule appointment", "All rights reserved"];
    const foundEn = english.filter((w) => esText.includes(w));
    ok("ES: sin textos en inglés visibles", foundEn.length === 0, foundEn.join(", "));
    await ctx.close();
  }

  // ---------- 8. CTA principales (texto y destino) ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    for (const [p, primary, secondary, dlPath, login, register] of [
      ["/", "Comenzar gratis", "Descargar aplicación Android", "/descargar", "Iniciar sesión", "Crear cuenta"],
      ["/en/", "Get started for free", "Download Android app", "/en/download", "Log in", "Create account"],
    ]) {
      await page.goto(BASE + p, { waitUntil: "networkidle" });
      const heroLinks = await page.$$eval("#hero a", (as) => as.map((a) => [a.innerText.trim().replace(/\s+/g, " "), a.getAttribute("href")]));
      ok(`[${p}] hero: '${primary}' → /register`, heroLinks.some(([t, h]) => t === primary && h === WEBAPP + "/register"), JSON.stringify(heroLinks));
      ok(`[${p}] hero: '${secondary}' → ${dlPath}`, heroLinks.some(([t, h]) => t === secondary && h === dlPath));
      const headerLinks = await page.$$eval("#site-header a", (as) => as.map((a) => [a.innerText.trim(), a.getAttribute("href")]));
      ok(`[${p}] header: '${login}' → /login`, headerLinks.some(([t, h]) => t === login && h === WEBAPP + "/login"));
      ok(`[${p}] header: '${register}' → /register`, headerLinks.some(([t, h]) => t === register && h === WEBAPP + "/register"));
      const plans = await page.$$eval("#planes article a", (as) => as.map((a) => a.getAttribute("href")));
      ok(`[${p}] planes: destinos correctos`, JSON.stringify(plans) === JSON.stringify([WEBAPP + "/register", WEBAPP + "/subscriptions/purchase?plan=advanced", WEBAPP + "/subscriptions/purchase?plan=professional"]), JSON.stringify(plans));
      const book = await page.$$eval("#psicologos article a", (as) => [...new Set(as.map((a) => a.getAttribute("href")))]);
      ok(`[${p}] psicólogos: 'Agendar cita' → /book-session`, JSON.stringify(book) === JSON.stringify([WEBAPP + "/book-session"]), JSON.stringify(book));
      const btnColor = await page.$eval("#hero a.btn-primary", (a) => getComputedStyle(a).backgroundColor);
      ok(`[${p}] CTA principal con fondo sólido #2D5A4A`, btnColor === "rgb(45, 90, 74)", btnColor);
    }
    await ctx.close();
  }

  // ---------- 9. Redirecciones de páginas antiguas ----------
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.route(WEBAPP + "/**", (r) => r.fulfill({ status: 200, contentType: "text/html", body: "webapp" }));
    for (const [src, dest] of [
      ["/compra?plan=Avanzado&price=$3.50", WEBAPP + "/subscriptions/purchase?plan=advanced"],
      ["/en/compra?plan=Professional (Zen%2B)", WEBAPP + "/subscriptions/purchase?plan=professional"],
      ["/compra?plan=B%C3%A1sico", WEBAPP + "/register"],
      ["/compra", WEBAPP + "/subscriptions"],
    ]) {
      await page.goto(BASE + src);
      await page.waitForURL((u) => u.origin === WEBAPP, { timeout: 8000 }).catch(() => {});
      ok(`redirección ${src} → ${dest.replace(WEBAPP, "")}`, page.url() === dest, page.url());
    }
    await page.goto(BASE + "/playstore");
    await page.waitForURL(/descargar/, { timeout: 8000 }).catch(() => {});
    ok("redirección /playstore → /descargar", /\/descargar\/?$/.test(new URL(page.url()).pathname), page.url());
    await page.goto(BASE + "/en/no-existe");
    ok("404 bajo /en/ se muestra en inglés", (await page.textContent("h1")).includes("Page not found"));
    await ctx.close();
  }

  // ---------- 9b. Teclado: skip link y foco visible ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.keyboard.press("Tab");
    const skip = await page.evaluate(() => { const a = document.activeElement; const r = a.getBoundingClientRect(); return { text: a.textContent.trim(), visible: r.width > 1 && r.height > 1 }; });
    ok("teclado: primer Tab = 'Saltar al contenido principal' visible", skip.text === "Saltar al contenido principal" && skip.visible, JSON.stringify(skip));
    const seen = [];
    for (let i = 0; i < 14; i++) {
      await page.keyboard.press("Tab");
      seen.push(await page.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return { t: (a.textContent || a.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ").slice(0, 30), outline: cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) >= 2 }; }));
      if (i === 8) await page.screenshot({ path: `${SHOTS}/focus.png`, clip: { x: 0, y: 0, width: 1440, height: 420 } });
    }
    const noRing = seen.filter((x) => !x.outline);
    ok("teclado: todos los elementos enfocados muestran indicador de foco", noRing.length === 0, JSON.stringify(seen.map((x) => x.t)));
    await ctx.close();
  }

  // ---------- 10. Responsive: sin desbordamiento horizontal + capturas ----------
  for (const [name, vp] of [["320", { width: 320, height: 640 }], ["375", { width: 375, height: 667 }], ["768", { width: 768, height: 1024 }], ["1024", { width: 1024, height: 768 }], ["1440", { width: 1440, height: 900 }], ["1920", { width: 1920, height: 1080 }]]) {
    for (const p of ["/", "/en/", "/descargar/"]) {
      const ctx = await browser.newContext({ viewport: vp });
      const page = await ctx.newPage();
      await page.route(/drive\.google\.com/, (r) => r.fulfill({ status: 200, body: "" }));
      await page.goto(BASE + p, { waitUntil: "networkidle" });
      const overflow = await page.evaluate(() => {
        const w = document.documentElement.clientWidth;
        const offenders = [...document.querySelectorAll("body *")].filter((el) => {
          const r = el.getBoundingClientRect();
          if (r.width === 0) return false;
          let n = el.parentElement; // ignora contenido dentro de contenedores con scroll/overflow propio
          while (n && n !== document.body) { const s = getComputedStyle(n); if (["auto", "hidden", "scroll", "clip"].includes(s.overflowX)) return false; n = n.parentElement; }
          const cs = getComputedStyle(el); if (cs.position === "fixed" && cs.visibility === "hidden") return false;
          return r.right > w + 1;
        }).slice(0, 5).map((el) => el.tagName + "." + [...el.classList].slice(0, 3).join("."));
        return { scroll: document.documentElement.scrollWidth, w, offenders };
      });
      ok(`responsive ${name}px ${p}: sin scroll horizontal`, overflow.scroll <= overflow.w && overflow.offenders.length === 0, JSON.stringify(overflow));
      // Botones/enlaces principales con objetivo táctil ≥ 24px (WCAG 2.2 AA 2.5.8)
      const small = await page.$$eval("a.btn, button", (els) => els.filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.height < 24 || r.width < 24); }).map((e) => e.outerHTML.slice(0, 60)));
      ok(`responsive ${name}px ${p}: objetivos táctiles ≥ 24px`, small.length === 0, small.join(" | "));
      await page.screenshot({ path: `${SHOTS}/${p.replace(/\//g, "_") || "_"}${name}.png`, fullPage: name !== "1920" });
      await ctx.close();
    }
  }

  await browser.close();
  const failed = results.filter((r) => !r.pass);
  console.log(`\nTOTAL: ${results.length}  PASS: ${results.length - failed.length}  FAIL: ${failed.length}`);
  fs.writeFileSync(path.join(SHOTS, "e2e-results.json"), JSON.stringify(results, null, 2));
  process.exit(failed.length ? 1 : 0);
})();
