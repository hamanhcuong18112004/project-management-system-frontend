import axios from "axios";

type BackendErrorPayload = {
    message?: string;
    data?: {
        message?: string;
        error?: string;
        status?: number;
        path?: string;
    };
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
        const payload = error.response?.data as any;
        
        // 1. Ưu tiên message cấp cao nhất (format mới: { status, code, message, data, error })
        if (typeof payload?.message === "string" && payload.message.trim()) {
            let msg = payload.message.trim();
            
            // Loại bỏ các tiền tố như "403 FORBIDDEN" nếu có (do Spring mặc định đôi khi thêm vào)
            msg = msg.replace(/^[0-9]{3}\s+[A-Z_]+\s+["']?/, "").replace(/["']?$/, "");
            
            return msg;
        }

        // 2. Fallback cho format cũ hoặc nested data
        const nestedMessage = payload?.data?.message || payload?.data?.error;
        if (typeof nestedMessage === "string" && nestedMessage.trim()) {
            return nestedMessage;
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

    const payload = error.response?.data as any;
    return payload?.error?.code ?? payload?.errors?.code ?? null;
}
