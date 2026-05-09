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
  memberCount?: number;
  assigneeIds?: string[];
  boardId?: string;
  taskListName?: string;
}

export interface TaskAttachment {
  id: string;
  fileUrl: string;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
  uploadedBy?: string | null;
  createdAt?: string | null;
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

export interface UpdateTaskListPayload {
  name?: string;
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

export interface UpdateTaskPayload {
  taskListId?: string;
  title?: string;
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
    attachmentCount:
      typeof raw.attachmentCount === "number"
        ? raw.attachmentCount
        : Array.isArray(raw.attachments)
          ? raw.attachments.length
          : 0,
    commentCount:
      typeof raw.commentCount === "number"
        ? raw.commentCount
        : Array.isArray(raw.comments)
          ? raw.comments.length
          : 0,
    checklistCount:
      typeof raw.checklistCount === "number"
        ? raw.checklistCount
        : Array.isArray(raw.checklists)
          ? raw.checklists.length
          : 0,
    memberCount:
      typeof raw.memberCount === "number"
        ? raw.memberCount
        : Array.isArray(raw.assigneeIds)
          ? (raw.assigneeIds as unknown[]).length
          : 0,
    assigneeIds: Array.isArray(raw.assigneeIds)
      ? (raw.assigneeIds as unknown[]).map(String)
      : [],
    boardId: (raw.boardId as string | undefined) || undefined,
    taskListName: (raw.taskListName as string | undefined) || undefined,
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

export async function updateTaskList(
  taskListId: string,
  payload: UpdateTaskListPayload,
): Promise<BoardTaskList> {
  const response = await apiClient.put<ServiceEnvelope<Record<string, unknown>>>(
    `${SERVICE}/api/task-lists/${taskListId}`,
    payload,
  );

  return normalizeTaskList(unwrapResponse(response.data));
}

export async function deleteTaskList(taskListId: string): Promise<void> {
  await apiClient.delete(`${SERVICE}/api/task-lists/${taskListId}`);
}

export async function deleteTaskListsByBoardId(boardId: string): Promise<void> {
  await apiClient.delete(`${SERVICE}/api/task-lists/board/${boardId}`);
}

function createTaskUpdateBody(payload: UpdateTaskPayload) {
  const nextPayload: Record<string, unknown> = { ...payload };

  if (Object.prototype.hasOwnProperty.call(payload, "dueDate")) {
    nextPayload.dueDate = payload.dueDate ?? "";
  }

  return nextPayload;
}

export async function updateTask(
  taskId: string,
  payload: UpdateTaskPayload,
): Promise<BoardTask> {
  const response = await apiClient.put<ServiceEnvelope<Record<string, unknown>>>(
    `${SERVICE}/api/tasks/${taskId}`,
    createTaskUpdateBody(payload),
  );

  return normalizeTask(unwrapResponse(response.data));
}

export async function deleteTask(taskId: string): Promise<void> {
  await apiClient.delete(`${SERVICE}/api/tasks/${taskId}`);
}

export async function getCalendarTasks(month: number, year: number): Promise<BoardTask[]> {
  const response = await apiClient.get<ServiceEnvelope<Record<string, unknown>[]> | Record<string, unknown>[]>(
    `${SERVICE}/api/tasks/calendar`,
    { params: { month, year } }
  );

  return unwrapResponse(response.data).map(normalizeTask);
}

// ── Task Members ──────────────────────────────────────────────────────────────

export async function getTaskMembers(taskId: string): Promise<string[]> {
  const response = await apiClient.get<unknown>(
    `${SERVICE}/api/tasks/${taskId}/members`,
  );
  const data = unwrapResponse(response.data as ServiceEnvelope<string[]> | string[]);
  return Array.isArray(data) ? data.map(String) : [];
}

export async function assignTaskMember(
  taskId: string,
  userId: string,
): Promise<void> {
  await apiClient.post(`${SERVICE}/api/tasks/${taskId}/members`, { userId });
}

export async function unassignTaskMember(
  taskId: string,
  userId: string,
): Promise<void> {
  await apiClient.delete(`${SERVICE}/api/tasks/${taskId}/members/${userId}`);
}

// ── Task Attachments ──────────────────────────────────────────────────────────

function normalizeAttachment(raw: Record<string, unknown>): TaskAttachment {
  return {
    id: String(raw.id || ""),
    fileUrl: String(raw.fileUrl || ""),
    fileName: (raw.fileName as string | null | undefined) ?? null,
    fileType: (raw.fileType as string | null | undefined) ?? null,
    fileSize: typeof raw.fileSize === "number" ? raw.fileSize : null,
    uploadedBy: raw.uploadedBy ? String(raw.uploadedBy) : null,
    createdAt: (raw.createdAt as string | null | undefined) ?? null,
  };
}

export async function getTaskAttachments(
  taskId: string,
): Promise<TaskAttachment[]> {
  const response = await apiClient.get<unknown>(
    `${SERVICE}/api/tasks/${taskId}/attachments`,
  );
  const data = unwrapResponse(
    response.data as ServiceEnvelope<Record<string, unknown>[]> | Record<string, unknown>[],
  );
  return Array.isArray(data)
    ? data.map((item) => normalizeAttachment(item as Record<string, unknown>))
    : [];
}

export async function uploadTaskAttachment(
  taskId: string,
  file: File,
  uploadedBy?: string,
): Promise<TaskAttachment> {
  const formData = new FormData();
  formData.append("file", file);
  if (uploadedBy) {
    formData.append("uploadedBy", uploadedBy);
  }

  const response = await apiClient.post<unknown>(
    `${SERVICE}/api/tasks/${taskId}/attachments`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );

  const data = unwrapResponse(
    response.data as ServiceEnvelope<Record<string, unknown>> | Record<string, unknown>,
  );
  return normalizeAttachment(data as Record<string, unknown>);
}

export async function deleteTaskAttachment(
  taskId: string,
  attachmentId: string,
): Promise<void> {
  await apiClient.delete(
    `${SERVICE}/api/tasks/${taskId}/attachments/${attachmentId}`,
  );
}

// ── Task Comments ─────────────────────────────────────────────────────────────

export interface TaskComment {
  id: string;
  userId: string;
  userFullName?: string;
  userAvatarUrl?: string;
  content: string;
  imageUrl?: string;
  parentId?: string;
  createdAt: string;
  reactionCounts?: Record<string, number>;
  myReactions?: string[];
  replies?: TaskComment[];
}

export async function getTaskComments(taskId: string): Promise<TaskComment[]> {
  const response = await apiClient.get<unknown>(
    `${SERVICE}/api/tasks/${taskId}/comments`,
  );
  return unwrapResponse(response.data as ServiceEnvelope<TaskComment[]> | TaskComment[]);
}

export async function addTaskComment(
  taskId: string,
  content: string,
   image?: File,
   parentId?: string,
   userFullName?: string,
   userAvatarUrl?: string
 ): Promise<TaskComment> {
   if (image) {
     const formData = new FormData();
     formData.append("content", content);
     formData.append("image", image);
     if (parentId) formData.append("parentId", parentId);
     if (userFullName) formData.append("userFullName", userFullName);
     if (userAvatarUrl) formData.append("userAvatarUrl", userAvatarUrl);
 
     const response = await apiClient.post<unknown>(
       `${SERVICE}/api/tasks/${taskId}/comments`,
       formData,
       { headers: { "Content-Type": "multipart/form-data" } }
     );
     return unwrapResponse(response.data as ServiceEnvelope<TaskComment> | TaskComment);
   } else {
     const response = await apiClient.post<unknown>(
       `${SERVICE}/api/tasks/${taskId}/comments`,
       { content, parentId, userFullName, userAvatarUrl }
     );
     return unwrapResponse(response.data as ServiceEnvelope<TaskComment> | TaskComment);
   }
 }

export async function deleteTaskComment(commentId: string): Promise<void> {
  await apiClient.delete(`${SERVICE}/api/comments/${commentId}`);
}

export async function toggleCommentReaction(
  commentId: string,
  type: string
): Promise<void> {
  await apiClient.post(`${SERVICE}/api/comments/${commentId}/react`, null, {
    params: { type },
  });
}

