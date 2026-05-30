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
        timeout: 120000,
    });

    return normalizeRecommendation(unwrapResponse(response.data));
}

export interface AiGeneratedTask {
    title: string;
    status: string;
    priority: string;
    description?: string;
    moduleId?: string;
    moduleName?: string;
    labelIds?: string[];
    estimatedHours?: number;
    storyPoints?: number;
    checklists?: string[];
    acceptanceCriteria?: string[];
}

export interface AiGeneratedTaskList {
    name: string;
    order?: number;
    tasks: AiGeneratedTask[];
}

export interface AiGeneratedProject {
    projectType?: string;
    lists: AiGeneratedTaskList[];
}

export async function generateProjectTasks(description: string, boardId?: string): Promise<AiGeneratedProject> {
    const response = await apiClient.post<any>(
        `${SERVICE}/generate-tasks`,
        { description, boardId },
        { timeout: 180000 }
    );
    const body = response.data;
    if (typeof body === "string") {
        try {
            return JSON.parse(body) as AiGeneratedProject;
        } catch {
            return { lists: [] };
        }
    }
    if (body && typeof body === "object") {
        if ("data" in body) {
            const unwrapped = body.data;
            if (typeof unwrapped === "string") {
                try {
                    return JSON.parse(unwrapped) as AiGeneratedProject;
                } catch {
                    return { lists: [] };
                }
            }
            return unwrapped as AiGeneratedProject;
        }
        return body as AiGeneratedProject;
    }
    return { lists: [] };
}

export interface ProjectProgressPayload {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    members: Array<{ name: string; taskCount: number }>;
}

export async function analyzeProjectProgress(boardId: string): Promise<string> {
    const response = await apiClient.post<any>(
        `${SERVICE}/boards/${boardId}/analyze-progress`,
        {},
        { timeout: 90000 }
    );
    const body = response.data;
    if (typeof body === "string") {
        return body;
    }
    if (body && typeof body === "object") {
        if ("data" in body) {
            return String(body.data || "");
        }
        return JSON.stringify(body);
    }
    return "";
}
