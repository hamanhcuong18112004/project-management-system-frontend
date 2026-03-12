import axios from "axios";
import { useAuthStore } from "../stores/useAuthStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

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
let failedQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
}> = [];

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
        const requestUrl = `${originalRequest.method?.toUpperCase()} ${originalRequest.url}`;

        // Check for USER_2001 error code (User not found) - logout immediately
        const errorCode = error.response?.data?.errors?.code;
        if (errorCode === "USER_2001") {
            useAuthStore.getState().logout();
            return Promise.reject(error);
        }

        // Nếu 401 và chưa retry
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Nếu là refresh-token endpoint bị 401 → logout ngay, không retry
            if (originalRequest.url?.includes("/auth/refresh-token")) {
                useAuthStore.getState().logout();
                return Promise.reject(error);
            }

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
                    processQueue(new Error("Refresh failed"), null);
                    useAuthStore.getState().logout();
                    return Promise.reject(error);
                }
            } catch (refreshError) {
                console.log(`❌ [REFRESH ERROR]`, refreshError);
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
