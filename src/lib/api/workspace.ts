import apiClient from "./client";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export type Visibility = "PUBLIC" | "PRIVATE";
export type WorkspaceRoleCode = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER" | string;
export type BoardVisibility = "PRIVATE" | "WORKSPACE" | "PUBLIC";
export type BoardBackgroundType = "IMAGE" | "COLOR";

export interface RoleDefinition {
  id: string;
  name: string;
  code: WorkspaceRoleCode;
  systemRole: boolean;
  permissions: string[];
}

export interface PermissionDefinition {
  id: string;
  name: string;
  description?: string;
  module: string;
}

export interface Board {
  id: string;
  name: string;
  description?: string | null;
  visibility?: BoardVisibility;
  background?: string;
  backgroundType?: BoardBackgroundType;
  backgroundValue?: string;
  workspaceId?: string;
}

export interface Member {
  email: string;
  fullName: string;
  joinedAt: string;
  role: RoleDefinition | null;
  userId: string;
}

export interface Workspace {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  visibility: Visibility;
  createdAt: string;
  updatedAt: string;
  role?: WorkspaceRoleCode;
  boards?: Board[]; // BE cần trả về danh sách bảng
  members?: Member[]; // BE cần trả về danh sách thành viên
  permissions?: string[];
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

export interface SaveRolePayload {
  name: string;
  code: string;
  permissionIds: string[];
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
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

    let data = envelope.data;
    if (data == null) {
      data = ([] as unknown) as T;
    }
    return data as T;
  }

  return payload as T;
}

type PermissionLike = string | { id?: string | null } | null | undefined;

function normalizePermissionIds(rawPermissions: unknown): string[] {
  if (!Array.isArray(rawPermissions)) {
    return [];
  }

  return (rawPermissions as PermissionLike[])
    .map((permission) => {
      if (typeof permission === "string") {
        return permission;
      }
      if (permission && typeof permission === "object" && permission.id) {
        return permission.id;
      }
      return null;
    })
    .filter((permissionId): permissionId is string => Boolean(permissionId));
}

function normalizeRole(role: unknown): RoleDefinition | null {
  if (!role || typeof role !== "object") {
    return null;
  }

  const parsed = role as Partial<RoleDefinition>;
  if (!parsed.id || !parsed.code || !parsed.name) {
    return null;
  }

  return {
    id: parsed.id,
    name: parsed.name,
    code: parsed.code,
    systemRole: Boolean(parsed.systemRole),
    permissions: normalizePermissionIds(parsed.permissions),
  };
}

function normalizeMember(member: Member): Member {
  return {
    ...member,
    role: normalizeRole(member.role),
  };
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
  const data = unwrap(res) ?? [];
  return data.map((workspace) => ({
    ...workspace,
    members: (workspace.members || []).map(normalizeMember),
  }));
}

export async function getWorkspaceMembers(workspaceId: string): Promise<Member[]> {
  const res = await apiClient.get<ApiResponse<Member[]>>(`${SERVICE}/api/workspaces/${workspaceId}/members`);
  const members = unwrap(res) ?? [];
  return members.map(normalizeMember);
}

export async function inviteToWorkspace(workspaceId: string, email: string, roleId: string): Promise<void> {
  const res = await apiClient.post<ApiResponse<null>>(`${SERVICE}/api/workspaces/${workspaceId}/invite`, { email, roleId });
  unwrap(res);
}

export async function getWorkspaceRoles(workspaceId: string): Promise<RoleDefinition[]> {
  const res = await apiClient.get<ApiResponse<RoleDefinition[]>>(`${SERVICE}/api/workspaces/${workspaceId}/roles`);
  return (unwrap(res) ?? []).map((role) => ({
    ...role,
    permissions: Array.isArray(role.permissions) ? role.permissions : [],
  }));
}

export async function getWorkspacePermissions(workspaceId: string): Promise<PermissionDefinition[]> {
  const res = await apiClient.get<ApiResponse<PermissionDefinition[]>>(`${SERVICE}/api/workspaces/${workspaceId}/permissions`);
  return unwrap(res) ?? [];
}

export async function getMyPermissions(workspaceId: string): Promise<string[]> {
  const res = await apiClient.get<ApiResponse<string[]>>(`${SERVICE}/api/workspaces/${workspaceId}/my-permissions`);
  return unwrap(res) ?? [];
}

export async function createWorkspaceRole(workspaceId: string, payload: SaveRolePayload): Promise<RoleDefinition> {
  const res = await apiClient.post<ApiResponse<RoleDefinition>>(`${SERVICE}/api/workspaces/${workspaceId}/roles`, payload);
  return unwrap(res);
}

export async function updateWorkspaceRole(workspaceId: string, roleId: string, payload: SaveRolePayload): Promise<RoleDefinition> {
  const res = await apiClient.put<ApiResponse<RoleDefinition>>(`${SERVICE}/api/workspaces/${workspaceId}/roles/${roleId}`, payload);
  return unwrap(res);
}

export async function deleteWorkspaceRole(workspaceId: string, roleId: string): Promise<void> {
  const res = await apiClient.delete<ApiResponse<null>>(`${SERVICE}/api/workspaces/${workspaceId}/roles/${roleId}`);
  unwrap(res);
}

export async function updateWorkspaceMemberRole(workspaceId: string, memberUserId: string, roleId: string): Promise<void> {
  const res = await apiClient.put<ApiResponse<null>>(`${SERVICE}/api/workspaces/${workspaceId}/members/${memberUserId}/role`, { roleId });
  unwrap(res);
}

export async function removeWorkspaceMember(workspaceId: string, memberUserId: string): Promise<void> {
  const res = await apiClient.delete<ApiResponse<null>>(`${SERVICE}/api/workspaces/${workspaceId}/members/${memberUserId}`);
  unwrap(res);
}

export async function leaveWorkspace(workspaceId: string): Promise<void> {
  const res = await apiClient.delete<ApiResponse<null>>(`${SERVICE}/api/workspaces/${workspaceId}/leave`);
  unwrap(res);
}

export async function acceptWorkspaceInvite(workspaceId: string, token: string): Promise<void> {
  const res = await apiClient.get<ApiResponse<null>>(`${SERVICE}/api/workspaces/${workspaceId}/accept-invite?token=${token}`);
  unwrap(res);
}

export async function rejectWorkspaceInvite(workspaceId: string, token: string, reason: string): Promise<void> {
  const res = await apiClient.post<ApiResponse<null>>(`${SERVICE}/api/workspaces/${workspaceId}/reject-invite?token=${token}&reason=${encodeURIComponent(reason)}`);
  unwrap(res);
}

export interface WorkspaceInviteResponse {
  id: string;
  email: string;
  inviterId: string;
  inviterName: string;
  inviteToken: string;
  status: string;
  createdAt: string;
  workspaceId: string;
  workspaceName: string;
  roleId: string;
  roleName: string;
}

export async function getMyInvitations(): Promise<WorkspaceInviteResponse[]> {
  const res = await apiClient.get<ApiResponse<WorkspaceInviteResponse[]>>(`${SERVICE}/api/workspaces/my-invitations`);
  return unwrap(res) ?? [];
}

