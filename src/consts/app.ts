/**
 * Datos de la aplicación Android, extraídos del propio APK
 * (AndroidManifest.xml) con androguard:
 *   package     com.example.neurozen_front
 *   versionName 2.2.0 (versionCode 4)
 *   minSdk 26 (Android 8.0) · targetSdk 36 · firma APK v2
 *
 * El archivo se sirve desde /public/downloads/NeuroZen.apk.
 * Si se reemplaza el APK, actualiza también estos valores.
 */
export const androidApp = {
  name: "NeuroZen",
  fileName: "NeuroZen.apk",
  /** Ruta pública (relativa a la raíz del sitio). */
  downloadPath: "/downloads/NeuroZen.apk",
  /** Ruta del archivo dentro del proyecto, usada en build para tamaño/checksum. */
  projectFile: "public/downloads/NeuroZen.apk",
  version: "2.2.0",
  minAndroid: "8.0",
  packageName: "com.example.neurozen_front",
  developer: "NeuroZen",
} as const;
