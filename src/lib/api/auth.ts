import apiClient from "./client";
import type { ApiResponse } from "@/types";

// ─────────────────────────────────────────────
// Helper – unwrap the backend's { data: ... } envelope
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────

export type AuthData = {
    accessToken: string;
    refreshToken: string;
};

// ─────────────────────────────────────────────
// User
// ─────────────────────────────────────────────

export type UserData = {
    id: string;
    fullName: string | null;
    username: string;
    email: string;
    emailVerified: boolean;
    avatarUrl: string | null;
    createdAt: string;
};

// Combined auth response (tokens + user)
export type AuthResponse = AuthData & { user: UserData };

// ─────────────────────────────────────────────
// Password reset
// ─────────────────────────────────────────────

export type ForgotPasswordData = {
    success: boolean;
    message: string;
    email: string;
};

export type ResetPasswordData = {
    success: boolean;
    message: string;
    username: string;
};
function unwrap<T>(res: { data: ApiResponse<T> }): T {
    const payload = res.data;
    if (payload.status === "error") {
        throw new Error(payload.message || "Đã có lỗi xảy ra.");
    }
    return payload.data;
}

const service = "identity";
/**
 * POST /auth/register
 * Body: { username, email, password }
 * On success may return tokens + user, or just a message if email verification required.
 */
export async function register(
    username: string,
    email: string,
    password: string,
    fullName: string,
): Promise<UserData> {
    const res = await apiClient.post<ApiResponse<UserData>>(
        `${service}/auth/register`,
        {
            username,
            email,
            password,
            fullName,
        },
    );
    return unwrap(res);
}

/**
 * POST /auth/login
 * Body: { email, password }
 * Returns access token and refresh token (no user — call getMyProfile separately).
 */
export async function login(
    email: string,
    password: string,
): Promise<AuthData> {
    const res = await apiClient.post<ApiResponse<AuthData>>(
        `${service}/auth/login`,
        {
            email,
            password,
        },
    );
    return unwrap(res);
}

/**
 * POST /auth/refresh
 * Body: { refreshToken }
 * Returns new token pair.
 */
export async function refreshToken(
    currentRefreshToken: string,
): Promise<AuthData> {
    const res = await apiClient.post<ApiResponse<AuthData>>(
        `${service}/auth/refresh`,
        {
            refreshToken: currentRefreshToken,
        },
    );
    return unwrap(res);
}

/**
 * POST /auth/logout
 * Body: { refreshToken }
 * Invalidates the refresh token server-side.
 */
export async function logout(currentRefreshToken: string): Promise<void> {
    await apiClient.post(`${service}/auth/logout`, {
        refreshToken: currentRefreshToken,
    });
}

/**
 * GET /auth/verify?token=...
 * Confirms email address using the verification token.
 */
export async function verifyEmail(token: string): Promise<void> {
    await apiClient.get(`${service}/auth/verify`, { params: { token } });
}

/**
 * POST /auth/forgot-password
 * Body: { email }
 * Sends a password-reset link to the given email.
 */
export async function forgotPassword(
    email: string,
): Promise<ForgotPasswordData> {
    const res = await apiClient.post<ApiResponse<ForgotPasswordData>>(
        `${service}/auth/forgot-password`,
        { email },
    );
    return unwrap(res);
}

/**
 * POST /auth/reset-password
 * Body: { token, newPassword }
 * Sets a new password using the reset token from the email link.
 */
export async function resetPassword(
    token: string,
    newPassword: string,
    confirmPassword: string,
): Promise<ResetPasswordData> {
    const res = await apiClient.post<ApiResponse<ResetPasswordData>>(
        `${service}/auth/reset-password`,
        { token, newPassword, confirmPassword },
    );
    return unwrap(res);
}

// ─────────────────────────────────────────────
// User endpoints
// ─────────────────────────────────────────────

/**
 * GET /users/me
 * Returns the currently authenticated user's profile.
 */
export async function getMyProfile(): Promise<UserData> {
    const res = await apiClient.get<ApiResponse<UserData>>(
        `${service}/users/me`,
    );
    return unwrap(res);
}
