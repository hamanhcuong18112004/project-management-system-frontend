import axios from "axios";

type BackendErrorPayload = {
    message?: string;
    error?: {
        code?: string;
        details?: unknown;
    };
    errors?: {
        code?: string;
        details?: unknown;
    };
};

export function getApiErrorMessage(
    error: unknown,
    fallback = "Đã có lỗi xảy ra. Vui lòng thử lại.",
): string {
    if (axios.isAxiosError(error)) {
        const payload = error.response?.data as BackendErrorPayload | undefined;
        const serverMessage = payload?.message;
        if (typeof serverMessage === "string" && serverMessage.trim()) {
            return serverMessage;
        }
    }

    if (error instanceof Error && error.message.trim()) {
        return error.message;
    }

    return fallback;
}

export function getApiErrorCode(error: unknown): string | null {
    if (!axios.isAxiosError(error)) {
        return null;
    }

    const payload = error.response?.data as BackendErrorPayload | undefined;
    return payload?.errors?.code ?? payload?.error?.code ?? null;
}
