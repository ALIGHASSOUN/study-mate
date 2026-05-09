import axios from "axios";

const api = axios.create({
  baseURL: "/api", // will be proxied to backend
  withCredentials: true, // send cookies
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
