// frontend/src/api/authApi.js
import axios from "axios";

const API_URL = "http://localhost:4000"; // <--- your backend

const client = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// helper to set auth header after login
export const setAuthToken = (token) => {
  if (token) client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  else delete client.defaults.headers.common["Authorization"];
};

export const loginUser = async (email, password) => {
  const res = await client.post("/api/auth/login", { email, password });
  return res.data;
};

export const signupUser = async (name, email, password) => {
  const res = await client.post("/api/auth/signup", { name, email, password });
  return res.data;
};
