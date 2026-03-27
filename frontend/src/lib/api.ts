import axios from 'axios';
import { useAuthStore } from '@/store/auth';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add token
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().accessToken;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle errors (e.g., specific auth errors)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Add logic here to handle 401s (refresh token?)
        return Promise.reject(error);
    }
);

export default api;
