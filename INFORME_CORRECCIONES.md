# Informe de auditoría y correcciones: Landing Page de NeuroZen

Fecha: 26/11/2026 · Stack: Astro 5.14 · Tailwind CSS 4.1 · i18n ES/EN

## Metodología

1. Revisé el código fuente completo de la landing: páginas, componentes, i18n, estilos y configuración.
2. **Inspeccioné la Web App en producción** (`https://neurozen-web-frontend.vercel.app/`). Es una SPA en Vue con Vite. Extraje las rutas de su bundle JS (Vue Router) y comprobé qué rutas son públicas y cuáles exigen sesión. Así ningún destino es supuesto.
3. **Analicé el APK** con androguard:
   - paquete `com.example.neurozen_front`, versión 2.2.0 (código 4);
   - minSdk 26 (Android 8.0), targetSdk 36;
   - firma APK v2, 29.122.399 bytes;
   - SHA-256 `91664fb6d238fb47808ebaa7d3072e6e21f549c8994599f711c891c10c9e6108`.
4. Corregí, compilé y probé con Playwright, axe-core (WCAG 2.1 AA) y un verificador estático del build.

> **Hallazgo clave:** la raíz de la Web App (`/`) es el *Dashboard* y **requiere sesión**. Todos los botones antiguos apuntaban ahí, así que el usuario terminaba en el login sin saber por qué, incluso al pulsar «Registro» o «Agendar cita». Cada botón usa ahora su ruta específica. El dominio configurado se conserva, centralizado en `src/consts/links.ts`.

---

## B. Informe de correcciones

| ID | Problema detectado | Archivo o componente | Corrección realizada | Estado |
|---|---|---|---|---|
| A1 | Todos los CTA (planes, reservas, menú móvil, «NeuroZen App») apuntaban a la raíz de la Web App, que exige sesión y lleva al login. | `consts/links.ts`, `Hero`, `PriceCard`, `Prices`, `Psychologist(s)`, `MobileMenu` | Rutas verificadas en el router: `/register`, `/login`, `/subscriptions`, `/subscriptions/purchase?plan=…`, `/book-session`, `/therapists`. | Corregido |
| A1 | Footer con 7 enlaces a `#` (Sobre nosotros, Blog, Privacidad, Términos, Cookies y 3 redes sociales) y un ancla `#contacto` inexistente. | `Footer.astro`, `SocialNetworkLogo.astro` | Se eliminan los enlaces muertos. Las redes se configuran en `consts/social.ts` y solo se muestran si tienen URL real. Se añade la columna «Accede a NeuroZen». | Corregido |
| A1 | Las anclas del header y del footer (`#planes`…) no funcionaban fuera de la home. | `Header`, `MobileMenu`, `Footer` | Anclas absolutas por idioma (`/#planes`, `/en/#planes`) fuera de la home. | Corregido |
| A1 | `/playstore` enlazaba a `play.google.com/...id=com.neurozen.app`, que no existe (el paquete real es otro), y mostraba datos ficticios: «4.8 ★», «+50K descargas», «~150 MB». | `pages/playstore.astro` | Página eliminada. `/playstore` y `/en/playstore` redirigen a la nueva página de descarga. | Corregido |
| A1 | Cambiar de idioma en `/playstore` llevaba a `/en/playstore` → 404. | `LanguageSwitcher` | El selector usa un mapa de rutas localizadas (`/descargar` ↔ `/en/download`). | Corregido |
| A2 | Sin acceso a inicio de sesión ni a registro. | `Header`, `MobileMenu`, `Hero` | Header: «Iniciar sesión» con contorno y «Crear cuenta» destacado (≥ 640 px). En móvil, «Crear cuenta» compacto en el header y ambos accesos al inicio del menú. «¿Ya tienes cuenta? Iniciar sesión» en el hero. | Corregido |
| A3 | El CTA «NeuroZen App» junto a una insignia de Google Play era ambiguo, y el menú móvil decía «Solicitar demo». | `Hero`, `MobileMenu`, `ui.ts` | Principal: «Comenzar gratis» / «Get started for free» → `/register`. Secundario, en un botón aparte: «Descargar aplicación Android» / «Download Android app» → página de descarga. Nota aclaratoria bajo los botones. | Corregido |
| A4 | Botones con degradado `green-500 → emerald-600` y texto blanco: **2,28:1**. Botón móvil `#90ea66` con texto blanco: **1,48:1**. Números de beneficios: **2,03:1**. | `global.css`, `Link.astro`, `Benefit`, `Comment`, `404` | Fondo sólido **#2D5A4A** (contraste medido 7,86:1). Hover `#234839` (10,21:1), active `#1B382D` (12,73:1), estado disabled y foco visible de doble anillo en fondos claros y oscuros. Variantes `outline`, `light` y `ghost-light`. | Corregido |
| A4 | El color de `h2` (`#4ba25e`) sobre blanco daba 3,17:1. | `global.css` | `#2f7a45`: 5,26:1 sobre blanco y 4,82:1 sobre `#E8FAE6`. | Corregido |
| A5 | No había descarga Android real. | `DownloadComponents/AppDownload.astro`, `pages/descargar.astro`, `pages/en/download.astro`, `public/downloads/NeuroZen.apk`, `vercel.json` | Ficha de la app inspirada en una tienda, sin marcas de terceros ni datos inventados. Incluye icono, nombre, descripción, plataforma, versión, tamaño, requisitos, 11 capturas reales, la advertencia exigida (ES/EN), pasos de instalación y la huella SHA-256. El botón «Descargar APK» descarga el archivo real como `NeuroZen.apk`, tras comprobarlo con una petición HEAD; si no está disponible, muestra un error. | Corregido |
| A6 | `/en/compra` mostraba un formulario que **pedía datos de tarjeta y simulaba una compra exitosa** sin ninguna integración. Faltaba la versión en español. | `pages/compra.astro`, `pages/en/compra.astro` | Ambas páginas redirigen a la compra real de la Web App y conservan el plan (`Avanzado` → `?plan=advanced`). El plan básico va a `/register`. | Corregido |
| A6 | El newsletter del footer enviaba el formulario a la propia página (sin backend), sin validación ni respuesta. | `Footer.astro` | Se retira para no simular suscripciones. Ver «Pendientes». | Corregido |
| A6 | El build fallaba: `MissingSharp` al optimizar imágenes con pnpm. | `package.json` | Se declara `sharp` como dependencia. | Corregido |
| A6 | `pnpm-workspace.yaml` tenía valores de relleno inválidos (`set this to true or false`). | `pnpm-workspace.yaml` | Valores `true`. | Corregido |
| A6 | Los estilos globales de `h2`/`h3` estaban fuera de capa y **anulaban las utilidades de Tailwind**. Por eso el «Menú» blanco y los títulos del footer salían verdes de 24 px sobre fondo verde. | `Layout.astro` → `global.css` | Se mueven a `@layer base`. | Corregido |
| A6 | `<html lang="es">` fijo también en inglés; `meta charset` y `viewport` duplicados; título y descripción solo en español; sin Open Graph, canonical ni hreflang. | `Layout.astro`, `astro.config.mjs` | `lang` dinámico, metadatos traducidos, Open Graph y Twitter con `og-image.png` nuevo (1200×630), `apple-touch-icon`, canonical y hreflang (con `SITE_URL` o el dominio de Vercel). | Corregido |
| A6 | Textos sin traducir en la versión inglesa: alt de la galería, «Mujer meditando», «Foto …», aria-labels («Abrir menú», «Cambiar idioma», «Cerrar lightbox»…) y toda la página de compra. | `ui.ts` y componentes | 192 claves en cada idioma, con paridad verificada. Se eliminan las claves sin uso. | Corregido |
| A6 | El 404 en `/en/...` se mostraba en español (el hosting sirve `/404.html` para todo). | `ErrorComponents/NotFound.astro` | 404 bilingüe según la URL; botón con contraste corregido. | Corregido |
| A6 | Selector de idioma hecho con `<div role="button">` y JS, sin `href`. | `LanguageSwitcher.astro` | Enlace real (`<a hreflang>`) que funciona sin JS y conserva query y ancla. | Corregido |
| A6 | Menú móvil: sus enlaces seguían siendo tabulables con el menú cerrado; sin `aria-expanded` ni gestión del foco. | `MobileMenu.astro` | `inert` cuando está cerrado, `role="dialog"`, foco atrapado, Escape cierra, el foco vuelve al botón y se cierra al pasar a escritorio. | Corregido |
| A6 | Galería: imágenes clicables como `<div>` (inaccesibles con teclado); el lightbox tenía `<img src="">` (petición vacía) y no gestionaba el foco. | `Gallery.astro` | Botones con aria-label, visor `role="dialog"` con foco atrapado y restaurado, sin `src` vacío. | Corregido |
| A6 | Carrusel: indicadores como `<div>`, `throw` si faltaban elementos, autoplay sin respetar *reduced motion*, tarjetas ocultas expuestas a lectores de pantalla. | `Comments.astro`, `Comment.astro` | Indicadores como botones con `aria-current`, valoración legible («4 de 5»), `inert` en tarjetas ocultas, autoplay pausado con foco y con *reduced motion*. | Corregido |
| A6 | Iframes de video sin `title` ni carga diferida; desbordaban en el layout de 3 columnas. | `Video.astro`, `AboutUs.astro` | `title`, `loading="lazy"`, grid responsive 1/2/3 columnas y tarjetas alineadas. | Corregido |
| A6 | Imágenes enormes servidas tal cual: `Logo.png` de 786 KB mostrado a 48 px, fotos PNG de psicólogos (~900 KB) y galería (~1,5 MB). | Header, Footer, Psychologist, Gallery | `astro:assets` → WebP redimensionado (logo 786 KB → 3 KB). | Corregido |
| A6 | Importación con mayúscula errónea `@/types/Psychologist`, que falla en sistemas sensibles a mayúsculas. | `helpers/formatPsychologistName.ts` | Corregida; tipos de psicólogos con `ImageMetadata`. | Corregido |
| A6 | Logo del header sin enlace a inicio; dos imágenes con alt duplicado «NeuroZen Logo». | `Header`, `Footer` | Enlace a inicio con aria-label; imágenes decorativas con `alt=""`. | Corregido |
| A6 | Faltaba un enlace para saltar al contenido; no se respetaba *prefers-reduced-motion*. | `Layout.astro`, `global.css` | Añadidos. | Corregido |
| A6 | Insignia de Google Play (`gplaybutton.png`) usada para un enlace que no lleva a Google Play. | `Hero.astro` | Eliminada (marca de terceros que sugería una publicación inexistente). También se eliminan los iconos sin uso. | Corregido |

---

## C. Matriz de navegación

URL base de la Web App: `https://neurozen-web-frontend.vercel.app`

| Elemento | Ubicación | Destino | Resultado |
|---|---|---|---|
| Comenzar gratis | Hero | `/register` (Registro Web App) | Verificado |
| Descargar aplicación Android | Hero | `/descargar` · `/en/download` | Verificado |
| ¿Ya tienes cuenta? Iniciar sesión | Hero | `/login` | Verificado |
| Iniciar sesión | Header (≥ 640 px) | `/login` | Verificado |
| Crear cuenta | Header (todas las anchuras) | `/register` | Verificado |
| Crear cuenta / Iniciar sesión | Menú móvil | `/register` · `/login` | Verificado |
| Descargar aplicación Android | Menú móvil y footer | `/descargar` · `/en/download` | Verificado |
| Beneficios, Ejercicios, Sobre Nosotros, Planes, Comentarios, Psicólogos | Header, menú móvil, footer | Anclas de la home (`#beneficios`…, absolutas fuera de la home) | Verificado |
| Comenzar gratis (plan Básico) | Planes | `/register` | Verificado |
| Elegir plan (Avanzado) | Planes | `/subscriptions/purchase?plan=advanced` | Verificado |
| Elegir plan (Profesional) | Planes | `/subscriptions/purchase?plan=professional` | Verificado |
| Ver todos los planes en la Web App | Planes | `/subscriptions` | Verificado |
| Agendar cita (×5) | Psicólogos | `/book-session` (Reservas) | Verificado |
| Encuentra tu psicólogo ideal | Psicólogos | `/therapists` | Verificado |
| Descargar APK | Página de descarga | `/downloads/NeuroZen.apk` (archivo real) | Verificado |
| Comenzar gratis / Iniciar sesión | Página de descarga | `/register` · `/login` | Verificado |
| Volver al inicio | Página de descarga, 404 | `/` · `/en/` | Verificado |
| Selector de idioma | Header | Página equivalente en el otro idioma | Verificado |
| `/compra?plan=…` (enlaces antiguos) | Compatibilidad | Compra real en la Web App | Verificado |
| `/playstore` (enlace antiguo) | Compatibilidad | `/descargar` | Verificado |

«Verificado» significa:

- la ruta existe en el router de la Web App en producción;
- la URL responde HTTP 200;
- el enlace aparece en el HTML generado.

Las rutas de planes de pago, reservas y directorio exigen sesión. Sin sesión, la Web App muestra el login y después devuelve al usuario al destino (`?redirect=`; comportamiento comprobado en su código).

---

## D. Informe de pruebas

| Prueba | Resultado |
|---|---|
| `pnpm build` (producción) | ✅ 8 páginas más 2 redirecciones, sin errores ni avisos |
| `pnpm check` (`astro check`, TypeScript estricto) | ✅ 0 errores, 0 avisos, 0 sugerencias |
| Instalación limpia (`pnpm install --frozen-lockfile`) y build en una copia nueva | ✅ |
| `pnpm verify` (enlaces, anclas, idioma, APK en `dist/`) | ✅ 10 páginas sin problemas; prueba negativa: detecta `#`, rutas rotas y rutas inventadas |
| E2E con Playwright (`tests/e2e.cjs`) | ✅ **150/150** |
| axe-core WCAG 2.1 A/AA en `/`, `/en/`, `/descargar/`, `/en/download/`, `/404` | ✅ 0 violaciones |
| Errores de consola en todas las páginas | ✅ Ninguno |

### Pruebas funcionales

- Destinos y textos de los botones de hero, header y menú móvil, planes, reservas y footer, en ES y EN.
- Menú móvil: apertura, foco, cierre con Escape y navegación por anclas.
- Selector de idioma: `/` ↔ `/en/` y `/descargar` ↔ `/en/download`.
- Redirecciones de `/compra` (4 casos) y de `/playstore`.
- 404 bilingüe.
- Teclado: el primer Tab muestra «Saltar al contenido» y todos los elementos enfocados tienen indicador visible.
- El fondo del CTA principal es exactamente `rgb(45, 90, 74)` (#2D5A4A).

### Pruebas responsive

- Anchuras: 320, 375, 768, 1024, 1440 y 1920 px, en `/`, `/en/` y `/descargar/`.
- Sin desbordamiento horizontal y con objetivos táctiles de al menos 24 px.
- Revisé las capturas a mano. Encontré y corregí tres problemas: la jerarquía del hero, el header móvil y el margen de las capturas.

### Validación de idiomas

- Paridad: 192 claves en cada idioma.
- La versión inglesa no contiene textos en español y viceversa (comprobación automática sobre el texto visible).
- `<html lang>` correcto en cada página.

### Validación del APK

- El archivo existe en `dist/downloads/NeuroZen.apk`.
- Tamaño: 29.122.399 bytes (no está vacío).
- Es un APK válido: ZIP con `AndroidManifest.xml`, 14 `classes*.dex` y firma v2.
- Descarga real con emulación de Android (Pixel 7):
  - nombre del archivo: **`NeuroZen.apk`**;
  - mismo tamaño y **SHA-256 idéntico** al APK original;
  - aparece el mensaje «La descarga ha comenzado».
- Si el archivo devuelve 404, se muestra el error y no se descarga nada.
- En escritorio aparece un aviso de que el dispositivo no es Android.

### Requiere validación externa

1. **Despliegue real en Vercel.** No pude desplegar desde este entorno. El APK pesa 27,8 MB, por debajo de los límites habituales de archivos estáticos en Vercel y del aviso de 50 MB de GitHub. Aun así, tras el despliegue conviene confirmar:
   - que `/downloads/NeuroZen.apk` responde 200;
   - que las cabeceras de `vercel.json` (`Content-Type` y `Content-Disposition`) se aplican.
2. **Instalación en un dispositivo Android físico.** Se probó la descarga, pero no la instalación del APK en un teléfono real.
3. **Flujo autenticado en la Web App.** Solo verifiqué que las rutas existen y responden. No probé un inicio de sesión con credenciales ni una compra completa.
4. **Videos de Google Drive.** Se bloquearon en las pruebas para no depender de terceros. Su disponibilidad depende de los permisos de Drive.

### Pendientes (información que debe aportar el equipo)

- **Páginas legales** (Privacidad, Términos, Cookies), **Contacto** y **Blog**: no existe contenido real, así que no se inventó. Para una app que se distribuye como APK, se recomienda publicar una política de privacidad.
- **URL de redes sociales**: añadirlas en `src/consts/social.ts`.
- **Newsletter**: requiere un servicio real (Mailchimp, Brevo, un endpoint propio…). Cuando exista, puede reincorporarse con validación y estados de carga y error.
- **Captura 10 (perfil)**: muestra un nombre y un correo (`benjamin123@…`). Si no es una cuenta de demostración, conviene reemplazarla.
- El nombre de paquete del APK es `com.example.neurozen_front`. Funciona, pero `com.example.*` no se acepta en Google Play si en el futuro se publica allí.

---

## E. Resumen de cambios

- **Corregido.** Todos los CTA llevan a rutas reales y específicas de la Web App, ya no a una raíz protegida. Se eliminaron los enlaces muertos y la página con datos falsos de Google Play. El formulario que simulaba pagos con tarjeta ahora redirige a la compra real. Se corrigieron el contraste (WCAG AA), el build roto (Sharp, pnpm-workspace) y la capa CSS que anulaba estilos.
- **Funcionalidades nuevas:**
  - accesos de inicio de sesión y registro en el header y el menú móvil;
  - CTA principal «Comenzar gratis», separado de la descarga;
  - página de descarga Android bilingüe con el APK real, verificación de disponibilidad, advertencia, pasos, capturas y SHA-256.
- **Problemas adicionales encontrados:** más de 20, entre ellos `lang` fijo, textos sin traducir, 404 solo en español, menú móvil y galería inaccesibles, imágenes sin optimizar, una importación con mayúsculas incorrectas y `<img src="">`.
- **Mejoras:** SEO (Open Graph, hreflang, canonical), imágenes WebP (el logo pasa de 786 KB a 3 KB), soporte de *reduced motion*, verificación de tipos y scripts de verificación y E2E reutilizables.

### Commits (Conventional Commits, en el repositorio Git local)

```
cacb584 test(landing): validar navegación, descarga del APK, i18n y accesibilidad
587b84b fix(responsive): corregir jerarquía de CTA, header móvil y foco del menú
b5ef5d8 feat(download): integrar descarga directa del APK para Android
437d0c6 feat(auth): agregar accesos de inicio de sesión y registro; corregir destinos de CTA
c36821e fix(ui): mejorar contraste, accesibilidad por teclado y rendimiento
05d7f39 fix(i18n): completar traducciones ES/EN, metadatos SEO y selector de idioma
2ca8d6d fix(build): declarar sharp y añadir verificación de tipos (astro check)
94f050d fix(build): corregir valores de relleno inválidos en pnpm-workspace.yaml
c4aef7d chore: importar estado original de la landing
```
