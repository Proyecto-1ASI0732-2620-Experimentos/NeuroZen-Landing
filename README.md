# 🧠 NeuroZen Landing Page

Landing page de NeuroZen, la plataforma que transforma el bienestar laboral mediante la tecnología. Construida con **Astro 5** y **Tailwind CSS 4**, con soporte bilingüe (español / inglés).

## ✨ Funcionalidades

- 🌍 **i18n ES/EN**: todos los textos están en `src/i18n/ui.ts` (192 claves por idioma).
- 🔐 **Accesos a la Web App**: «Iniciar sesión» y «Crear cuenta» en el header y en el menú móvil.
- 🚀 **CTA principal claro**: «Comenzar gratis» → registro en la Web App.
- 📱 **Descarga Android (APK)**: ficha de la app en `/descargar` (`/en/download`) con descarga directa del APK.
- 💳 **Planes**: cada botón lleva a su destino real (registro gratuito o compra en la Web App).
- 👩‍⚕️ **Psicólogos**: «Agendar cita» → reserva en la Web App.
- ♿ **Accesibilidad**: contraste WCAG 2.1 AA, foco visible, navegación por teclado y lectores de pantalla.
- ⚡ **Rendimiento**: imágenes optimizadas a WebP con `astro:assets`, carga diferida.

## 🔗 Destinos de la Web App

Todas las rutas están centralizadas en `src/consts/links.ts` y se verificaron contra el router de
<https://neurozen-web-frontend.vercel.app/>:

| Acción | Ruta |
| --- | --- |
| Crear cuenta / Comenzar gratis | `/register` |
| Iniciar sesión | `/login` |
| Ver planes | `/subscriptions` |
| Comprar plan | `/subscriptions/purchase?plan=advanced\|professional` |
| Agendar cita | `/book-session` |
| Directorio de psicólogos | `/therapists` |

Las rutas protegidas redirigen a `/login?redirect=…` y, tras iniciar sesión, la Web App devuelve al usuario al destino.

## 📱 Aplicación Android (APK)

- Archivo: `public/downloads/NeuroZen.apk` → URL pública `/downloads/NeuroZen.apk`.
- Datos mostrados (versión, requisitos) en `src/consts/app.ts`; tamaño y SHA-256 se calculan en el build.
- `public/_headers` (Netlify) sirve el APK con `Content-Type: application/vnd.android.package-archive` y
  `Content-Disposition: attachment; filename="NeuroZen.apk"`.
- Para publicar una nueva versión: reemplaza el APK y actualiza `version` en `src/consts/app.ts`.

## 🚀 Estructura

```text
/
├── public/
│   ├── downloads/NeuroZen.apk   # APK servido como archivo estático
│   ├── favicon.png, apple-touch-icon.png, og-image.png
├── scripts/verify-dist.mjs      # verificación del build (enlaces, idioma, APK)
├── src/
│   ├── assets/                  # imágenes (incl. capturas de la app en AppScreens/)
│   ├── components/
│   │   ├── DownloadComponents/  # ficha de descarga del APK
│   │   ├── ErrorComponents/     # 404 bilingüe
│   │   ├── FooterComponents/
│   │   ├── HeaderComponents/    # header, menú móvil, selector de idioma
│   │   └── MainComponents/      # secciones de la home y UI (botones)
│   ├── consts/                  # links.ts, app.ts, social.ts, menú, datos
│   ├── i18n/                    # ui.ts (traducciones) y utils.ts (rutas localizadas)
│   ├── layouts/Layout.astro     # SEO, Open Graph, hreflang
│   ├── pages/                   # index, descargar, compra (redirección), 404 + en/
│   └── styles/global.css        # tokens de marca y estilos de botones
├── astro.config.mjs
└── package.json
```

## 📄 Páginas

| Español | Inglés | Descripción |
| --- | --- | --- |
| `/` | `/en/` | Home |
| `/descargar` | `/en/download` | Descarga de la app Android |
| `/compra` | `/en/compra` | Compatibilidad: redirige a la compra real en la Web App |
| `/playstore` | `/en/playstore` | Compatibilidad: redirige a la página de descarga |
| `/404` | `/en/404` | Página no encontrada |

## 🧞 Comandos

| Comando | Acción |
| :-- | :-- |
| `pnpm install` | Instala dependencias |
| `pnpm dev` | Servidor local en `localhost:4321` |
| `pnpm build` | Build de producción en `./dist/` |
| `pnpm preview` | Previsualiza el build |
| `pnpm check` | Verificación de tipos (`astro check`) |
| `pnpm verify` | Verifica `dist/`: enlaces, anclas, idioma y validez del APK |
| `node tests/e2e.cjs` | Pruebas E2E con Playwright + axe-core (ver cabecera del archivo) |

## 🌐 Despliegue

El sitio está publicado en **Netlify**: <https://neurozen-landing.netlify.app/>. La configuración del
despliegue (comando de build, carpeta `dist`, rama) se mantiene en el panel de Netlify; el proyecto no la modifica.

## 🔧 Configuración

- **URL del sitio** (canonical, hreflang y Open Graph absolutos): define `SITE_URL`
  (p. ej. `SITE_URL=https://tu-dominio.com`). En Netlify se usa automáticamente la URL del sitio (`https://neurozen-landing.netlify.app`).
- **Redes sociales**: añade los perfiles reales en `src/consts/social.ts` y aparecerán en el footer.
- **Colores de marca**: `src/styles/global.css` (`--color-brand: #2D5A4A`, contraste 7.86:1 con blanco).

## 🛠️ Stack

- [Astro](https://astro.build) 5.14 · [Tailwind CSS](https://tailwindcss.com) 4.1 · TypeScript · pnpm · Node 22

---

**Built with ❤️ by the NeuroZen team**
