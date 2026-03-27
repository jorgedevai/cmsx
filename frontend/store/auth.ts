import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: string;
    username: string;
    email: string;
    role: string;
}

interface AuthState {
    /** @deprecated Tokens are now managed server-side via httpOnly cookies. Kept for backward compat. */
    accessToken: string | null;
    refreshToken: string | null;
    user: User | null;
    isAuthenticated: boolean;
    login: (accessToken: string, refreshToken: string, user?: User) => void;
    logout: () => void;
    setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            accessToken: null,
            refreshToken: null,
            user: null,
            isAuthenticated: false,
            login: (_accessToken, _refreshToken, user) =>
                set({
                    // Don't store tokens in client-side state — they live in httpOnly cookies
                    accessToken: null,
                    refreshToken: null,
                    user: user || null,
                    isAuthenticated: true,
                }),
            logout: () =>
                set({
                    accessToken: null,
                    refreshToken: null,
                    user: null,
                    isAuthenticated: false,
                }),
            setUser: (user) => set({ user }),
        }),
        {
            name: 'auth-storage',
        }
    )
);
