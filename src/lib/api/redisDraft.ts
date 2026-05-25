import apiClient from "./client";

export interface TaskDraft {
  id?: string;
  title: string;
  description: string;
  assigneeId?: string;
  listId?: string;
  updatedAt?: number;
}

export interface ApiResponse<T> {
  status: string;
  message?: string;
  data: T;
}

function unwrap<T>(res: { data: ApiResponse<T> | T }): T {
  const payload = res.data as ApiResponse<T> | T;
  if (
    payload &&
    typeof payload === "object" &&
    "status" in payload &&
    "data" in payload
  ) {
    const envelope = payload as ApiResponse<T>;
    if (envelope.status !== "success") {
      throw new Error(envelope.message || "Đã có lỗi xảy ra.");
    }
    return envelope.data;
  }
  return payload as T;
}

const SERVICE = "workspace";

export async function getAllDrafts(): Promise<TaskDraft[]> {
  const res = await apiClient.get<ApiResponse<TaskDraft[]>>(`${SERVICE}/api/redis/drafts`);
  return unwrap(res) ?? [];
}

export async function getDraftById(id: string): Promise<TaskDraft> {
  const res = await apiClient.get<ApiResponse<TaskDraft>>(`${SERVICE}/api/redis/drafts/${id}`);
  return unwrap(res);
}

export async function createDraft(payload: TaskDraft): Promise<TaskDraft> {
  const res = await apiClient.post<ApiResponse<TaskDraft>>(`${SERVICE}/api/redis/drafts`, payload);
  return unwrap(res);
}

export async function updateDraft(id: string, payload: TaskDraft): Promise<TaskDraft> {
  const res = await apiClient.put<ApiResponse<TaskDraft>>(`${SERVICE}/api/redis/drafts/${id}`, payload);
  return unwrap(res);
}

export async function deleteDraft(id: string): Promise<void> {
  const res = await apiClient.delete<ApiResponse<null>>(`${SERVICE}/api/redis/drafts/${id}`);
  unwrap(res);
}
