import { create } from "zustand";
import { persist } from "zustand/middleware";
import { refreshToken as apiRefreshToken, UserData } from "../api/auth";

interface AuthState {
    accessToken: string | null;
    refreshToken: string | null;
    user: UserData | null;
    isAuthenticated: boolean;

    setAuth: (
        accessToken: string,
        refreshToken: string,
        user: UserData,
    ) => void;
    logout: () => void;
    refreshAccessToken: () => Promise<string | null>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            accessToken: null,
            refreshToken: null,
            user: null,
            isAuthenticated: false,

            setAuth: (accessToken, refreshToken, user) => {
                set({ accessToken, refreshToken, user, isAuthenticated: true });
                console.log("✅ [AUTH] User authenticated:", user.email);
            },

            logout: () => {
                set({
                    accessToken: null,
                    refreshToken: null,
                    user: null,
                    isAuthenticated: false,
                });
                console.log("🚪 [AUTH] User logged out");
            },

            refreshAccessToken: async () => {
                const storedRefreshToken = get().refreshToken;
                if (!storedRefreshToken) {
                    console.log(
                        "❌ [AUTH] No refresh token stored, logging out.",
                    );
                    get().logout();
                    return null;
                }
                try {
                    console.log(
                        "🔄 [AUTH] Attempting to refresh access token...",
                    );
                    const tokens = await apiRefreshToken(storedRefreshToken);
                    set({
                        accessToken: tokens.accessToken,
                        refreshToken: tokens.refreshToken ?? storedRefreshToken,
                    });
                    console.log(
                        "✅ [AUTH] Access token refreshed successfully",
                    );
                    return tokens.accessToken;
                } catch {
                    get().logout();
                    return null;
                }
            },
        }),
        {
            name: "auth-storage",
            partialize: (state) => ({
                // Persist user and refreshToken; accessToken is intentionally ephemeral
                user: state.user,
                refreshToken: state.refreshToken,
                accessToken: state.accessToken,
                isAuthenticated: state.isAuthenticated,
            }),
        },
    ),
);
