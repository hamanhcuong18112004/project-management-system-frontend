import apiClient from "./client";

const SERVICE = "task";

type ServiceEnvelope<T> = {
  data?: T;
  message?: string;
  status?: string;
  success?: boolean;
};

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE" | "ARCHIVED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface BoardTask {
  id: string;
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  position?: number | null;
  archived?: boolean;
  attachmentCount?: number;
  commentCount?: number;
  checklistCount?: number;
}

export interface BoardTaskList {
  id: string;
  boardId: string;
  name: string;
  position?: number | null;
  tasks: BoardTask[];
}

export interface CreateTaskListPayload {
  boardId: string;
  name: string;
  position?: number;
}

export interface CreateTaskPayload {
  taskListId: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  position?: number;
  archived?: boolean;
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
      throw new Error(envelope.message || "Task service request failed.");
    }

    if (envelope.status && envelope.status !== "success") {
      throw new Error(envelope.message || "Task service request failed.");
    }

    if (typeof envelope.data !== "undefined") {
      return envelope.data;
    }
  }

  return payload as T;
}

function normalizeTask(raw: Record<string, unknown>): BoardTask {
  return {
    id: String(raw.id || ""),
    title: String(raw.title || "Untitled task"),
    description: (raw.description as string | null | undefined) ?? null,
    status: (raw.status as TaskStatus | undefined) || "TODO",
    priority: (raw.priority as TaskPriority | undefined) || "MEDIUM",
    dueDate: (raw.dueDate as string | null | undefined) ?? null,
    position:
      typeof raw.position === "number"
        ? raw.position
        : raw.position
          ? Number(raw.position)
          : null,
    archived: Boolean(raw.archived),
    attachmentCount: Array.isArray(raw.attachments) ? raw.attachments.length : 0,
    commentCount: Array.isArray(raw.comments) ? raw.comments.length : 0,
    checklistCount: Array.isArray(raw.checklists) ? raw.checklists.length : 0,
  };
}

function normalizeTaskList(raw: Record<string, unknown>): BoardTaskList {
  const taskListReference =
    (raw.taskList as Record<string, unknown> | undefined) || undefined;

  const tasks = Array.isArray(raw.tasks)
    ? raw.tasks.map((task) => normalizeTask(task as Record<string, unknown>))
    : [];

  return {
    id: String(raw.id || ""),
    boardId: String(raw.boardId || taskListReference?.boardId || ""),
    name: String(raw.name || "Untitled list"),
    position:
      typeof raw.position === "number"
        ? raw.position
        : raw.position
          ? Number(raw.position)
          : null,
    tasks: tasks.sort((left, right) => (left.position || 0) - (right.position || 0)),
  };
}

export async function getTaskListsByBoardId(
  boardId: string,
): Promise<BoardTaskList[]> {
  const response = await apiClient.get<
    ServiceEnvelope<Record<string, unknown>[]> | Record<string, unknown>[]
  >(`${SERVICE}/api/task-lists/board/${boardId}`);

  return unwrapResponse(response.data)
    .map((taskList) => normalizeTaskList(taskList))
    .sort((left, right) => (left.position || 0) - (right.position || 0));
}

export async function createTaskList(
  payload: CreateTaskListPayload,
): Promise<BoardTaskList> {
  const response = await apiClient.post<ServiceEnvelope<Record<string, unknown>>>(
    `${SERVICE}/api/task-lists`,
    payload,
  );

  return normalizeTaskList(unwrapResponse(response.data));
}

export async function createTask(
  payload: CreateTaskPayload,
): Promise<BoardTask> {
  const response = await apiClient.post<ServiceEnvelope<Record<string, unknown>>>(
    `${SERVICE}/api/tasks`,
    payload,
  );

  return normalizeTask(unwrapResponse(response.data));
}
