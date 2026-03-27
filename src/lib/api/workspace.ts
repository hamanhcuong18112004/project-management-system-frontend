import apiClient from "./client";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type Visibility = "PUBLIC" | "PRIVATE";

export interface Workspace {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  visibility: Visibility;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkspacePayload {
  name: string;
  description?: string;
  visibility?: Visibility;
}

export interface UpdateWorkspacePayload {
  name?: string;
  description?: string;
  visibility?: Visibility;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * workspace-service wraps responses in { success, message, data }
 * via GlobalResponseAdvice.
 */
function unwrap<T>(res: { data: { status: string; message: string; data: T } }): T {
  const payload = res.data;

  if (payload.status !== "success") {
    throw new Error(payload.message || "Đã có lỗi xảy ra.");
  }

  let data = payload.data;

  if (data == null) {
    data = ([] as unknown) as T;
  }

  return data as T;
}

const SERVICE = "workspace";

// ─────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────

/** GET /api/workspaces - Lấy tất cả workspace */
export async function getAllWorkspaces(): Promise<Workspace[]> {
  const res = await apiClient.get<{ success: boolean; message: string; data: Workspace[] }>(
    `${SERVICE}/api/workspaces`
  );
  const data = unwrap<Workspace[]>(res);
  return data ?? [];
}

/** GET /api/workspaces/{id} - Lấy workspace theo id */
export async function getWorkspaceById(id: string): Promise<Workspace> {
  const res = await apiClient.get<{ success: boolean; message: string; data: Workspace }>(
    `${SERVICE}/api/workspaces/${id}`
  );
  return unwrap(res);
}

/** POST /api/workspaces - Tạo workspace */
export async function createWorkspace(payload: CreateWorkspacePayload): Promise<Workspace> {
  const res = await apiClient.post<{ success: boolean; message: string; data: Workspace }>(
    `${SERVICE}/api/workspaces`,
    payload
  );
  return unwrap(res);
}

/** PUT /api/workspaces/{id} - Cập nhật workspace */
export async function updateWorkspace(
  id: string,
  payload: UpdateWorkspacePayload
): Promise<Workspace> {
  const res = await apiClient.put<{ success: boolean; message: string; data: Workspace }>(
    `${SERVICE}/api/workspaces/${id}`,
    payload
  );
  return unwrap(res);
}

/** DELETE /api/workspaces/{id} - Xóa workspace */
export async function deleteWorkspace(id: string): Promise<void> {
  await apiClient.delete(`${SERVICE}/api/workspaces/${id}`);
}

/** GET /api/workspaces/my-workspaces - Lấy workspace của user hiện tại */
export async function getMyWorkspaces(): Promise<Workspace[]> {
  const res = await apiClient.get<{ success: boolean; message: string; data: Workspace[] }>(
    `${SERVICE}/api/workspaces/my-workspaces`
  );
  const data = unwrap<Workspace[]>(res);
  return data ?? [];
}

/** POST /api/workspaces/{id}/invite - Mời user vào workspace */
export async function inviteToWorkspace(workspaceId: string, email: string): Promise<void> {
  await apiClient.post(`${SERVICE}/api/workspaces/${workspaceId}/invite`, { email });
}
