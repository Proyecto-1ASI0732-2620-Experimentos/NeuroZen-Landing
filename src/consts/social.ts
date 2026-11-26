/**
 * Redes sociales oficiales de NeuroZen.
 *
 * Antes el footer mostraba iconos de Facebook, X e Instagram que apuntaban a
 * "#" (no llevaban a ningún sitio). Se ocultan hasta disponer de las URL
 * reales: añade aquí cada perfil y el footer lo mostrará automáticamente.
 *
 * Ejemplo:
 *   { network: "instagram", label: "Instagram", href: "https://www.instagram.com/<cuenta>" }
 */
export type SocialNetwork = "facebook" | "x" | "instagram";

export interface SocialLink {
  network: SocialNetwork;
  label: string;
  href: string;
}

export const socialLinks: SocialLink[] = [];
