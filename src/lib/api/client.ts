import axios from "axios";
import { toast } from "sonner";
import { useAuthStore } from "../stores/useAuthStore";
import { getApiErrorCode, getApiErrorMessage } from "./error";

const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/identity";

const apiClient = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true, // Gửi httpOnly cookies (refresh token)
});

// ============================================
// Request Interceptor: Gắn access token
// ============================================
apiClient.interceptors.request.use(
    (config) => {
        const accessToken = useAuthStore.getState().accessToken;
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        } else {
            console.log(
                `📭 [REQUEST] ${config.method?.toUpperCase()} ${config.url}`,
                `\n   No token`,
            );
        }
        return config;
    },
    (error) => Promise.reject(error),
);

// ============================================
// Response Interceptor: Auto refresh token khi 401
// ============================================
let isRefreshing = false;
let hasShownSessionExpiredToast = false;
let failedQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
}> = [];

const AUTH_ENDPOINTS_WITHOUT_REFRESH = [
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/auth/verify",
    "/auth/refresh",
    "/auth/logout",
];

const shouldSkipRefresh = (url?: string) => {
    if (!url) {
        return false;
    }
    return AUTH_ENDPOINTS_WITHOUT_REFRESH.some((endpoint) =>
        url.includes(endpoint),
    );
};

const notifySessionExpired = (message?: string) => {
    if (
        typeof window !== "undefined" &&
        window.location.pathname === "/login"
    ) {
        hasShownSessionExpiredToast = false;
        return;
    }

    if (hasShownSessionExpiredToast) {
        return;
    }

    toast.error(
        message || "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
    );
    hasShownSessionExpiredToast = true;
};

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

apiClient.interceptors.response.use(
    (response) => {
        console.log(
            `✅ [RESPONSE] ${response.config.method?.toUpperCase()} ${response.config.url}`,
            `\n   Status: ${response.status}`,
        );
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        if (!originalRequest) {
            return Promise.reject(error);
        }

        const requestUrl = `${originalRequest.method?.toUpperCase()} ${originalRequest.url}`;

        // Check for USER_2001 error code (User not found) - logout immediately
        const errorCode = getApiErrorCode(error);
        if (errorCode === "USER_2001") {
            notifySessionExpired(
                "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.",
            );
            useAuthStore.getState().logout();
            return Promise.reject(error);
        }

        const status = error.response?.status;
        const isUnauthorized = status === 401;
        const requestIsAuthEndpoint = shouldSkipRefresh(originalRequest.url);

        if (isUnauthorized && requestIsAuthEndpoint) {
            if (originalRequest.url?.includes("/auth/refresh")) {
                notifySessionExpired(getApiErrorMessage(error));
                useAuthStore.getState().logout();
            }
            return Promise.reject(error);
        }

        // Nếu 401 và chưa retry
        if (isUnauthorized && !originalRequest._retry) {
            console.log(`🔒 [401 UNAUTHORIZED] ${requestUrl}`);

            // Nếu đang refresh thì queue lại
            if (isRefreshing) {
                console.log(
                    `⏳ [QUEUE] ${requestUrl}`,
                    `\n   Đang có request khác refresh, thêm vào queue (${failedQueue.length + 1})`,
                );

                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return apiClient(originalRequest);
                });
            }

            console.log(
                `🔄 [REFRESH START] ${requestUrl}`,
                `\n   Request đầu tiên bị 401, bắt đầu refresh...`,
            );
            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const { refreshAccessToken } = useAuthStore.getState();
                console.log(`🔑 [CALLING REFRESH API]...`);
                const newToken = await refreshAccessToken();

                if (newToken) {
                    hasShownSessionExpiredToast = false;
                    console.log(
                        `✅ [REFRESH SUCCESS]`,
                        `\n   Token mới: ${newToken.substring(0, 20)}...`,
                    );
                    processQueue(null, newToken);

                    console.log(`🔄 [RETRY] ${requestUrl} với token mới`);
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return apiClient(originalRequest);
                } else {
                    console.log(
                        `❌ [REFRESH FAILED] Không có token mới, logout...`,
                    );
                    notifySessionExpired();
                    processQueue(new Error("Refresh failed"), null);
                    useAuthStore.getState().logout();
                    return Promise.reject(error);
                }
            } catch (refreshError) {
                console.log(`❌ [REFRESH ERROR]`, refreshError);
                notifySessionExpired(getApiErrorMessage(refreshError));
                processQueue(refreshError, null);
                useAuthStore.getState().logout();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
                console.log(`🏁 [REFRESH END] isRefreshing = false`);
            }
        }

        return Promise.reject(error);
    },
);

export default apiClient;
