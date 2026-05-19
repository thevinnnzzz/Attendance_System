// In development this is "" (uses same origin via Netlify Dev).
// In production, point this to your Netlify site URL.
const PROD_API_URL = "https://YOUR-NETLIFY-SITE.netlify.app";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? PROD_API_URL : "");
