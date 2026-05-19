// In development this is "" (uses same origin via Vite).
// In production, redirects in netlify.toml handle /api/* -> /.netlify/functions/*
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "";
