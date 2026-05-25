import axios from "axios";
import { toast } from "sonner";
import { useAuthStore } from "../stores/useAuthStore";
import { getApiErrorCode, getApiErrorMessage } from "./error";

const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const apiClient = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true, // Gửi httpOnly cookies (refresh token)
});

const ensureAuthStoreHydrated = async () => {
    if (typeof window === "undefined") {
        return;
    }

    const persistApi = useAuthStore.persist;
    if (!persistApi?.hasHydrated || persistApi.hasHydrated()) {
        return;
    }

    try {
        await persistApi.rehydrate?.();
    } catch {
        // Let downstream auth logic handle token absence gracefully.
    }
};

// ============================================
// Request Interceptor: Gắn access token
// ============================================
apiClient.interceptors.request.use(
    async (config) => {
        let accessToken = useAuthStore.getState().accessToken;

        if (!accessToken) {
            await ensureAuthStoreHydrated();
            accessToken = useAuthStore.getState().accessToken;
        }

        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
            
            const user = useAuthStore.getState().user;
            if (user) {
                if (user.id) config.headers["X-User-Id"] = user.id;
                if (user.fullName) config.headers["X-User-Name"] = encodeURIComponent(user.fullName);
                if (user.avatarUrl) config.headers["X-User-Avatar"] = user.avatarUrl;
            }
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
        if (status === 429) {
            if (typeof window !== "undefined") {
                toast.error("Bạn đã thực hiện quá nhiều yêu cầu. Vui lòng thử lại sau 1 phút.");
            }
            return Promise.reject(error);
        }
        const isUnauthorized = status === 401 || status === 403;
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
            console.log(
                `🔒 [401 UNAUTHORIZED] ${requestUrl} ${status} ${isUnauthorized}`,
            );

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
                await ensureAuthStoreHydrated();
                const { refreshAccessToken } = useAuthStore.getState();
                const hasRefreshToken = Boolean(
                    useAuthStore.getState().refreshToken,
                );
                console.log(
                    `🔑 [CALLING REFRESH API] hasRefreshToken=${hasRefreshToken}`,
                );
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

        // ============================================
        // Transient Network / Server Error Retry logic
        // ============================================
        const MAX_RETRIES = 3;
        const RETRY_DELAY_MIN = 3000;
        const RETRY_DELAY_MAX = 5000;

        const isNetworkError = !error.response;
        const isServerError = error.response && error.response.status >= 500;
        const isRetryable = isNetworkError || isServerError;

        if (isRetryable && (!originalRequest._retryCount || originalRequest._retryCount < MAX_RETRIES)) {
            originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
            const delay = Math.floor(Math.random() * (RETRY_DELAY_MAX - RETRY_DELAY_MIN + 1)) + RETRY_DELAY_MIN;
            
            console.warn(
                `[API RETRY] Request failed: ${requestUrl}. Error: ${error.message || "Network/Server Error"}. ` +
                `Attempt ${originalRequest._retryCount} of ${MAX_RETRIES}. Retrying in ${(delay / 1000).toFixed(1)}s...`
            );

            if (typeof window !== "undefined") {
                toast.info(`Lỗi kết nối. Đang thử lại yêu cầu (${originalRequest._retryCount}/${MAX_RETRIES}) sau ${(delay / 1000).toFixed(1)} giây...`);
            }

            await new Promise((resolve) => setTimeout(resolve, delay));
            return apiClient(originalRequest);
        }

        return Promise.reject(error);
    },
);

export default apiClient;
