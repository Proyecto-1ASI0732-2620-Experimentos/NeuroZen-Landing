// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

/**
 * URL pública de la landing (para canonical, hreflang y Open Graph absolutos).
 * Prioridad: SITE_URL → URL principal que Netlify expone en el build (`URL`,
 * p. ej. https://neurozen-landing.netlify.app).
 * Si no hay ninguna, esas etiquetas se omiten o usan rutas relativas.
 */
const site =
  process.env.SITE_URL || (process.env.NETLIFY ? process.env.URL : undefined);

// https://astro.build/config
export default defineConfig({
  site,
  i18n: {
    defaultLocale: "es",
    locales: ["es", "en"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  redirects: {
    // La antigua página /playstore mostraba datos ficticios y un enlace a
    // Google Play inexistente; ahora redirige a la página real de descarga.
    "/playstore": "/descargar",
    "/en/playstore": "/en/download",
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
