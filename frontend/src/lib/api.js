import axios from "axios";

/** Absolute API origin when frontend is hosted separately (e.g. Static Web Apps). Empty = same-origin `/api`. */
const apiOrigin = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
export const API_BASE = apiOrigin ? `${apiOrigin}/api` : "/api";

/** Resolve uploaded/API media paths for img src (keeps public frontend assets as-is). */
export function mediaUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path) || path.startsWith("data:")) return path;
  if (path.startsWith("/uploads/") && apiOrigin) return `${apiOrigin}${path}`;
  return path;
}

/** Product image src; use thumb=true on shop grids so Mustek proxy stays light. */
export function productImageUrl(path, { thumb = false } = {}) {
  const src = mediaUrl(path);
  if (!src || !thumb) return src;
  if (!src.includes("/api/mustek/image")) return src;
  if (/([?&])size=/.test(src)) return src;
  return `${src}${src.includes("?") ? "&" : "?"}size=thumb`;
}

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (!config.headers) config.headers = {};

  if (token) {
    if (typeof config.headers.set === "function") {
      config.headers.set("Authorization", `Bearer ${token}`);
    } else {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  const isFormData = typeof FormData !== "undefined" && config.data instanceof FormData;

  // Never force application/json on FormData — breaks product image uploads (missing multipart boundary).
  if (isFormData) {
    if (typeof config.headers.delete === "function") {
      config.headers.delete("Content-Type");
      config.headers.delete("content-type");
    }
    if (typeof config.headers.set === "function") {
      // Axios: false omits the header so the browser sets multipart boundary
      config.headers.set("Content-Type", false);
    } else {
      delete config.headers["Content-Type"];
      delete config.headers["content-type"];
    }
  } else if (config.data != null && typeof config.data === "object") {
    const hasType =
      (typeof config.headers.get === "function" && config.headers.get("Content-Type")) ||
      config.headers["Content-Type"] ||
      config.headers["content-type"];
    if (!hasType) {
      if (typeof config.headers.set === "function") {
        config.headers.set("Content-Type", "application/json");
      } else {
        config.headers["Content-Type"] = "application/json";
      }
    }
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const path = window.location.pathname || "";
      const isPublic =
        path === "/" ||
        path === "/login" ||
        path === "/register" ||
        path.startsWith("/shop") ||
        path.startsWith("/about") ||
        path.startsWith("/courses") ||
        path.startsWith("/contact") ||
        path.startsWith("/training") ||
        path.startsWith("/donation") ||
        path.startsWith("/career") ||
        path.startsWith("/verify") ||
        path.startsWith("/forgot") ||
        path.startsWith("/reset");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Only force login redirect on protected areas (dashboards / checkout / cart)
      if (!isPublic && !path.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;
