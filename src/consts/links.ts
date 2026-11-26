/**
 * Destinos de la Web App oficial de NeuroZen.
 *
 * Las rutas se verificaron contra el router (Vue Router) de la Web App
 * desplegada en https://neurozen-web-frontend.vercel.app/ :
 *   - /register                → "Register"      (solo invitados)
 *   - /login                   → "Login"         (solo invitados, admite ?redirect=)
 *   - /subscriptions           → "Subscriptions" (requiere sesión → redirige a /login?redirect=...)
 *   - /subscriptions/purchase  → "Purchase"      (requiere sesión, ?plan=basic|advanced|professional)
 *   - /book-session            → "BookSession"   (requiere sesión)
 *   - /therapists              → "TherapistList" (requiere sesión)
 *
 * Las rutas protegidas envían al usuario sin sesión a /login y, tras
 * autenticarse, la Web App lo devuelve automáticamente al destino original.
 */
export const WEB_APP_URL = "https://neurozen-web-frontend.vercel.app";

export type PlanKey = "basic" | "advanced" | "professional";

export const webAppLinks = {
  home: `${WEB_APP_URL}/`,
  register: `${WEB_APP_URL}/register`,
  login: `${WEB_APP_URL}/login`,
  plans: `${WEB_APP_URL}/subscriptions`,
  purchase: (plan: PlanKey) =>
    `${WEB_APP_URL}/subscriptions/purchase?plan=${plan}`,
  bookSession: `${WEB_APP_URL}/book-session`,
  therapists: `${WEB_APP_URL}/therapists`,
} as const;
