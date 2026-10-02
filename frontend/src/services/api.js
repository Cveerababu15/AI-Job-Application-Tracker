import axios from "axios";

let apiURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
if (!apiURL.endsWith("/api")) {
  apiURL = apiURL.replace(/\/$/, "") + "/api";
}

const API = axios.create({ baseURL: apiURL });

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});
API.interceptors.response.use((res)=> res,(error)=>{
  if(error.response?.status === 401){
    localStorage.removeItem("token");
    localStorage.removeItem("user")
    if(window.location.pathname !=="/login"){
      window.location.assign("/login")
    }
  }
  return Promise.reject(error)
})

export default API;
