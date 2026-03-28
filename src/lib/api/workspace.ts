import apiClient from "./client";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export type Visibility = "PUBLIC" | "PRIVATE";
export type Role = "OWNER" | "MEMBER";

export interface Board {
  id: string;
  name: string;
  background?: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Workspace {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  visibility: Visibility;
  createdAt: string;
  updatedAt: string;
  role?: Role; // BE cần trả về để phân quyền
  boards?: Board[]; // BE cần trả về danh sách bảng
  members?: Member[]; // BE cần trả về danh sách thành viên
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
export interface ApiResponse<T> {
  status: string;
  message?: string;
  data: T;
}

function unwrap<T>(res: { data: ApiResponse<T> }): T {
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

const SERVICE = "workspace"; // Chú ý: Cấu hình proxy ở frontend để gọi localhost:8082

// ─────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────

export async function getAllWorkspaces(): Promise<Workspace[]> {
  const res = await apiClient.get<ApiResponse<Workspace[]>>(`${SERVICE}/api/workspaces`);
  return unwrap(res) ?? [];
}

export async function getWorkspaceById(id: string): Promise<Workspace> {
  const res = await apiClient.get<ApiResponse<Workspace>>(`${SERVICE}/api/workspaces/${id}`);
  return unwrap(res);
}

export async function createWorkspace(payload: CreateWorkspacePayload): Promise<Workspace> {
  const res = await apiClient.post<ApiResponse<Workspace>>(`${SERVICE}/api/workspaces`, payload);
  return unwrap(res);
}

export async function updateWorkspace(id: string, payload: UpdateWorkspacePayload): Promise<Workspace> {
  const res = await apiClient.put<ApiResponse<Workspace>>(`${SERVICE}/api/workspaces/${id}`, payload);
  return unwrap(res);
}

export async function deleteWorkspace(id: string): Promise<void> {
  const res = await apiClient.delete<ApiResponse<null>>(`${SERVICE}/api/workspaces/${id}`);
  unwrap(res);
}

export async function getMyWorkspaces(): Promise<Workspace[]> {
  const res = await apiClient.get<ApiResponse<Workspace[]>>(`${SERVICE}/api/workspaces/my-workspaces`);
  return unwrap(res) ?? [];
}

export async function inviteToWorkspace(workspaceId: string, email: string): Promise<void> {
  const res = await apiClient.post<ApiResponse<null>>(`${SERVICE}/api/workspaces/${workspaceId}/invite`, { email });
  unwrap(res);
}