import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";

interface AuthUser {
    id: string;
    email: string;
    name: string;
    role?: string;
}

interface AuthState {
    accessToken: string | null;
    user: AuthUser | null;
    isAuthenticated: boolean;

    // Actions
    setAuth: (token: string, user: AuthUser) => void;
    logout: () => void;
    refreshAccessToken: () => Promise<string | null>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            accessToken: null,
            user: null,
            isAuthenticated: false,

            setAuth: (token: string, user: AuthUser) => {
                set({
                    accessToken: token,
                    user,
                    isAuthenticated: true,
                });
                console.log("✅ [AUTH] User authenticated:", user.email);
            },

            logout: () => {
                set({
                    accessToken: null,
                    user: null,
                    isAuthenticated: false,
                });
                console.log("🚪 [AUTH] User logged out");

                // Redirect to login page
                if (typeof window !== "undefined") {
                    window.location.href = "/login";
                }
            },

            refreshAccessToken: async () => {
                try {
                    console.log(
                        "🔄 [AUTH] Attempting to refresh access token...",
                    );

                    // Call your refresh token endpoint
                    // Assumes you have a /auth/refresh-token endpoint that uses httpOnly cookie
                    const response = await axios.post(
                        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"}/auth/refresh-token`,
                        {},
                        {
                            withCredentials: true, // Send httpOnly cookie
                        },
                    );

                    const newAccessToken = response.data?.data?.accessToken;

                    if (newAccessToken) {
                        set({ accessToken: newAccessToken });
                        console.log(
                            "✅ [AUTH] Access token refreshed successfully",
                        );
                        return newAccessToken;
                    }

                    console.log(
                        "❌ [AUTH] No access token in refresh response",
                    );
                    get().logout();
                    return null;
                } catch (error) {
                    console.error("❌ [AUTH] Refresh token failed:", error);
                    get().logout();
                    return null;
                }
            },
        }),
        {
            name: "auth-storage", // LocalStorage key
            partialize: (state) => ({
                // Only persist these fields (not accessToken for security)
                user: state.user,
            }),
        },
    ),
);
