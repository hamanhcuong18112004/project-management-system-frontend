export interface Task {
    id: string;
    title: string;
    priority: "low" | "medium" | "high";
    assignee: {
        name: string;
        avatar?: string;
    };
    progress: number;
    description?: string;
    order?: number;
}

export interface Column {
    id: string;
    name: string;
    tasks: Task[];
}

export interface Module {
    id: string;
    name: string;
    color: string;
    columns: Column[];
}

// ─────────────────────────────────────────────
// API response envelope
// ─────────────────────────────────────────────

export type ApiError = {
    code: string;
    details: unknown;
};

export type ApiSuccess<T> = {
    status: "success";
    code: number;
    message: string;
    data: T;
    error: null;
};

export type ApiFailure = {
    status: "error";
    code: number;
    message: string;
    data: null;
    error: ApiError;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

