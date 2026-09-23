import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api";

export const api = axios.create({ baseURL });

const TOKEN_KEY = "labelcheck_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Centralized handling: an expired/invalid token should drop the user back
// to the login screen rather than showing a confusing broken page.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearToken();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export function extractErrorMessage(err: unknown, fallback = "Something went wrong."): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message ?? err.message ?? fallback;
  }
  return fallback;
}

/**
 * Uploaded package images are served from the backend's origin at /uploads
 * (outside the /api prefix), so this strips /api off the configured API
 * base URL to build a usable <img src>.
 */
export function assetUrl(relativePath: string): string {
  const origin = baseURL.replace(/\/api\/?$/, "");
  return `${origin}${relativePath}`;
}
