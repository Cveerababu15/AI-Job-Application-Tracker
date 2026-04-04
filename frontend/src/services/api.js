import axios from "axios";

let apiURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Auto-append /api if the user forgot it in their environment variables
if (!apiURL.endsWith("/api")) {
  apiURL = apiURL.replace(/\/$/, "") + "/api";
}

const API = axios.create({
  baseURL: apiURL,
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

export default API;
