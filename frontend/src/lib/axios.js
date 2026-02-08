import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  timeout: 15000,
  headers: {
    "X-Requested-With": "XMLHttpRequest",
  },
});

axiosInstance.interceptors.request.use(async (config) => {
  const clerk = window?.Clerk;
  if (clerk?.session) {
    const token = await clerk.session.getToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default axiosInstance;
