import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" ? "http://localhost:5001/api" : "https://chattrix-y8fo.onrender.com/api",
  withCredentials: true,
});
