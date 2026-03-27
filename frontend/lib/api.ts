import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/auth';

/**
 * Axios client that routes through the server-side proxy.
 * - No backend URL exposed to the browser
 * - No JWT tokens in client-side headers (proxy injects them from httpOnly cookies)
 * - Auto-redirect to /login on auth failure
 */
const api = axios.create({
    baseURL: '/api/proxy',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Response interceptor: redirect to login on 401
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        if (error.response?.status === 401) {
            // Proxy already tried to refresh — session is dead
            const { logout } = useAuthStore.getState();
            logout();
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
