import apiClient from "./client";

const SERVICE = "ai";

type ServiceEnvelope<T> = {
    data?: T;
    message?: string;
    status?: string;
    success?: boolean;
};

export interface AiRecommendedTaskItem {
    taskId: string;
    boardId: string;
    boardName: string;
    taskListId: string;
    taskListName: string;
    title: string;
    priority: string;
    status: string;
    dueDate: string | null;
    createdAt: string | null;
    score: number;
    reasons: string[];
}

export interface WorkspaceTaskRecommendation {
    workspaceId: string;
    generatedAt: string;
    model: string;
    strategyVersion: string;
    summary: string;
    recommendedTasks: AiRecommendedTaskItem[];
}

function unwrapResponse<T>(payload: ServiceEnvelope<T> | T): T {
    if (
        payload &&
        typeof payload === "object" &&
        !Array.isArray(payload) &&
        ("status" in payload || "success" in payload || "data" in payload)
    ) {
        const envelope = payload as ServiceEnvelope<T>;

        if (typeof envelope.success === "boolean" && !envelope.success) {
            throw new Error(envelope.message || "AI service request failed.");
        }

        if (envelope.status && envelope.status !== "success") {
            throw new Error(envelope.message || "AI service request failed.");
        }

        if (typeof envelope.data !== "undefined") {
            return envelope.data;
        }
    }

    return payload as T;
}

function normalizeRecommendedTask(
    raw: Record<string, unknown>,
): AiRecommendedTaskItem {
    return {
        taskId: String(raw.taskId || ""),
        boardId: String(raw.boardId || ""),
        boardName: String(raw.boardName || "Unknown board"),
        taskListId: String(raw.taskListId || ""),
        taskListName: String(raw.taskListName || "Unknown list"),
        title: String(raw.title || "Untitled task"),
        priority: String(raw.priority || "MEDIUM"),
        status: String(raw.status || "TODO"),
        dueDate: raw.dueDate ? String(raw.dueDate) : null,
        createdAt: raw.createdAt ? String(raw.createdAt) : null,
        score:
            typeof raw.score === "number" ? raw.score : Number(raw.score || 0),
        reasons: Array.isArray(raw.reasons)
            ? raw.reasons.map((reason) => String(reason))
            : [],
    };
}

function normalizeRecommendation(
    raw: Record<string, unknown>,
): WorkspaceTaskRecommendation {
    return {
        workspaceId: String(raw.workspaceId || ""),
        generatedAt: String(raw.generatedAt || new Date().toISOString()),
        model: String(raw.model || "unknown"),
        strategyVersion: String(raw.strategyVersion || "v1"),
        summary: String(raw.summary || ""),
        recommendedTasks: Array.isArray(raw.recommendedTasks)
            ? raw.recommendedTasks.map((task) =>
                  normalizeRecommendedTask(task as Record<string, unknown>),
              )
            : [],
    };
}

export async function getWorkspaceTaskRecommendations(
    workspaceId: string,
    limit = 10,
): Promise<WorkspaceTaskRecommendation> {
    const response = await apiClient.get<
        ServiceEnvelope<Record<string, unknown>> | Record<string, unknown>
    >(`${SERVICE}/workspaces/${workspaceId}/task-recommendations`, {
        params: {
            limit,
        },
    });

    return normalizeRecommendation(unwrapResponse(response.data));
}
