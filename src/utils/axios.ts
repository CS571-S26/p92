import axios from 'axios';
import { getAuth } from 'firebase/auth';

const api = axios.create({
  baseURL: "/api",
});

api.interceptors.request.use(async (config) => {
  const auth = getAuth();
  const token = await auth.currentUser?.getIdToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

