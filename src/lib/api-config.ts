// In development this is "" (uses same origin via Vite/server.ts).
// In production, point this to your Render backend URL.
const PROD_API_URL = "https://attendance-system-api-abk6.onrender.com";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? PROD_API_URL : "");
