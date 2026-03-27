import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: string;
    username: string;
    email: string;
    role: string;
}

interface AuthState {
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
            login: (accessToken, refreshToken, user) =>
                set({
                    accessToken,
                    refreshToken,
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
            name: 'auth-storage', // unique name
        }
    )
);
