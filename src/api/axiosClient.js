// frontend/src/api/axiosClient.js
import axios from "axios";

const API_HOST = (import.meta.env.VITE_API_URL || "http://127.0.0.1:4000").replace(/\/+$/, "");
const DEFAULT_BASE = `${API_HOST}/api`;

const axiosClient = axios.create({
  baseURL: DEFAULT_BASE,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// ---------- Request interceptor: attach token ----------
axiosClient.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      config.headers = { ...(config.headers || {}) };

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // 🔥 REQUIRED FOR AI ROUTES
      if (user?.role) {
        config.headers["x-user-role"] = user.role;
      }

      if (user?.id) {
        config.headers["x-user-id"] = user.id;
      }
    } catch (err) {
      console.warn("Axios request interceptor error:", err);
    }
    return config;
  },
  (err) => Promise.reject(err)
);

// ---------- Response interceptor: normalize errors ----------
axiosClient.interceptors.response.use(
  (resp) => resp,
  (err) => {
    const resp = err?.response;
    const payload = {};
    if (resp && resp.data && typeof resp.data === "object") {
      payload.status = resp.status;
      payload.data = resp.data;
      payload.message = resp.data.message || resp.statusText || "Request failed";
    } else {
      payload.status = resp?.status || 0;
      payload.message = err?.message || "Network Error";
    }
    const error = new Error(payload.message);
    error.payload = payload;
    error.response = resp;
    return Promise.reject(error);
  }
);

// ---------- Normalize paths ----------
function normalizePath(path) {
  if (!path || typeof path !== "string") return path;
  if (/^https?:\/\//i.test(path)) return path;
  try {
    const base = axiosClient.defaults?.baseURL || "";
    const baseEndsApi = base.replace(/\/+$/, "").endsWith("/api");
    if (baseEndsApi && path.startsWith("/api/")) {
      return path.replace(/^\/api/, "");
    }
    return path;
  // eslint-disable-next-line no-unused-vars
  } catch (err) {
    return path;
  }
}

// ---------- Safe axios wrappers ----------
async function safeGet(path, opts = {}) {
  return axiosClient.get(normalizePath(path), opts);
}
async function safePost(path, body = {}, opts = {}) {
  return axiosClient.post(normalizePath(path), body, opts);
}
async function safePatch(path, body = {}, opts = {}) {
  return axiosClient.patch(normalizePath(path), body, opts);
}
async function safeDelete(path, opts = {}) {
  return axiosClient.delete(normalizePath(path), opts);
}

// ---------- Set/remove auth token ----------
function setAuthToken(token) {
  try {
    if (token) {
      localStorage.setItem("token", token);
      axiosClient.defaults.headers = {
        ...(axiosClient.defaults.headers || {}),
        Authorization: `Bearer ${token}`,
      };
    } else {
      localStorage.removeItem("token");
      if (axiosClient.defaults?.headers) {
        const h = { ...axiosClient.defaults.headers };
        delete h.Authorization;
        axiosClient.defaults.headers = h;
      }
    }
  } catch (err) {
    console.warn("setAuthToken error:", err);
  }
}

// ---------- Attach helpers ----------
axiosClient.normalizePath = normalizePath;
axiosClient.safeGet = safeGet;
axiosClient.safePost = safePost;
axiosClient.safePatch = safePatch;
axiosClient.safeDelete = safeDelete;
axiosClient.setAuthToken = setAuthToken;

export default axiosClient;
