"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Shield, Trash2, UserPlus, X, Users } from "lucide-react";

import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api/error";
import {
  getWorkspacePermissions,
  getWorkspaceRoles,
  type PermissionDefinition,
  type RoleDefinition,
  type SaveRolePayload,
  type Workspace,
} from "@/lib/api/workspace";
import { RoleManagementModal } from "./RoleManagementModal";

interface MembersModalProps {
  open: boolean;
  onClose: () => void;
  workspace: Workspace | null;
  currentUserId?: string;
  onInviteMember: (workspaceId: string, email: string, roleId: string) => Promise<void>;
  onRemoveMember: (workspaceId: string, memberId: string) => Promise<void>;
  onUpdateMemberRole: (workspaceId: string, memberId: string, roleId: string) => Promise<void>;
  onCreateRole: (workspaceId: string, payload: SaveRolePayload) => Promise<void>;
  onUpdateRole: (workspaceId: string, roleId: string, payload: SaveRolePayload) => Promise<void>;
  onDeleteRole: (workspaceId: string, roleId: string) => Promise<void>;
}

export function MembersModal({
  open,
  onClose,
  workspace,
  currentUserId,
  onInviteMember,
  onRemoveMember,
  onUpdateMemberRole,
  onCreateRole,
  onUpdateRole,
  onDeleteRole,
}: MembersModalProps) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState("");
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [permissions, setPermissions] = useState<PermissionDefinition[]>([]);
  const [loadingRbac, setLoadingRbac] = useState(false);
  const [submittingInvite, setSubmittingInvite] = useState(false);
  const [showRoleManager, setShowRoleManager] = useState(false);

  const workspaceId = workspace?.id || "";
  const members = workspace?.members || [];
  const currentMember = members.find((member) => member.userId === currentUserId);
  const isOwner = workspace?.role === "OWNER";
  const currentPermissions = new Set(currentMember?.role?.permissions || []);
  const canViewRoles = isOwner || currentPermissions.has("role:view");
  const canCreateRole = isOwner || currentPermissions.has("role:create");
  const canUpdateRole = isOwner || currentPermissions.has("role:update");
  const canDeleteRole = isOwner || currentPermissions.has("role:delete");
  const canManageRoles = canCreateRole || canUpdateRole || canDeleteRole;
  const canInviteMembers = isOwner || currentPermissions.has("ws:invite");
  const canChangeMemberRole = isOwner || currentPermissions.has("ws:change_role");
  const canRemoveMembers = isOwner || currentPermissions.has("ws:remove_member");

  const inviteRoleOptions = useMemo(
    () => roles.filter((role) => role.code !== "OWNER"),
    [roles],
  );

  const loadRbacData = useCallback(async () => {
    if (!canViewRoles && !canManageRoles && !canInviteMembers && !canChangeMemberRole) {
      setRoles([]);
      setPermissions([]);
      return;
    }

    try {
      setLoadingRbac(true);
      const [rolesResponse, permissionsResponse] = await Promise.all([
        getWorkspaceRoles(workspaceId),
        getWorkspacePermissions(workspaceId),
      ]);
      setRoles(rolesResponse);
      setPermissions(permissionsResponse);

      if (rolesResponse.length > 0) {
        const defaultRole = rolesResponse.find((role) => role.code === "MEMBER") || rolesResponse[0];
        setInviteRoleId((current) => current || defaultRole.id);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể tải danh sách role/permission"));
    } finally {
      setLoadingRbac(false);
    }
  }, [canChangeMemberRole, canInviteMembers, canManageRoles, canViewRoles, workspaceId]);

  useEffect(() => {
    if (!open || !workspace) {
      return;
    }
    loadRbacData();
  }, [loadRbacData, open, workspace]);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteRoleId) return;

    setSubmittingInvite(true);
    try {
      await onInviteMember(workspaceId, inviteEmail.trim(), inviteRoleId);
      setInviteEmail("");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể gửi lời mời"));
    } finally {
      setSubmittingInvite(false);
    }
  };

  const handleMemberRoleChange = async (memberUserId: string, roleId: string) => {
    try {
      await onUpdateMemberRole(workspaceId, memberUserId, roleId);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể cập nhật role thành viên"));
    }
  };

  const handleRemove = async (memberUserId: string) => {
    try {
      await onRemoveMember(workspaceId, memberUserId);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể xóa thành viên"));
    }
  };

  const handleRoleAction = async (action: () => Promise<void>) => {
    try {
      await action();
      await loadRbacData();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể cập nhật role"));
      throw error;
    }
  };

  if (!open || !workspace) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative flex h-[560px] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">
            Quản lý thành viên: {workspace.name}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {/* Invite Form */}
          {canInviteMembers && (
            <form onSubmit={handleInviteSubmit} className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-5 md:flex-row md:items-end">
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Mời thành viên</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Nhập email..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                />
              </div>

              <div className="w-full space-y-1.5 md:w-[200px]">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Vai trò</label>
                <select
                  value={inviteRoleId}
                  onChange={(event) => setInviteRoleId(event.target.value)}
                  disabled={loadingRbac || inviteRoleOptions.length === 0}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none"
                >
                  {inviteRoleOptions.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={submittingInvite || !inviteRoleId}
                className="flex h-[42px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60"
              >
                <UserPlus size={18} /> Mời
              </button>
            </form>
          )}

          <div className="flex items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 p-5 text-white shadow-lg shadow-cyan-600/20">
            <div className="space-y-1">
              <p className="text-sm font-bold">Quản lý Vai trò & Quyền</p>
              <p className="text-xs text-cyan-50/80">Tùy chỉnh phân quyền chi tiết cho từng nhóm thành viên.</p>
            </div>
            <button
              onClick={() => setShowRoleManager(true)}
              disabled={(!canViewRoles && !canManageRoles) || loadingRbac}
              className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2.5 text-sm font-bold backdrop-blur-md transition hover:bg-white/30 disabled:opacity-60"
            >
              <Shield size={16} /> Thiết lập
            </button>
          </div>

          {/* Member List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                Thành viên ({members.length})
              </h3>
            </div>
            
            {members.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <Users size={40} className="mb-2 opacity-20" />
                <p className="text-sm italic">Chưa có thành viên nào.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div 
                    key={member.userId} 
                    className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-4 transition hover:border-blue-100 hover:shadow-md hover:shadow-blue-500/5"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600 transition group-hover:bg-blue-50 group-hover:text-blue-600">
                        {member.fullName ? member.fullName.charAt(0).toUpperCase() : "?"}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {member.fullName || "Người dùng chưa tên"}
                          {member.userId === currentUserId && (
                            <span className="ml-2 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">BẠN</span>
                          )}
                        </p>
                        <p className="text-xs font-medium text-slate-500">{member.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {member.role?.code === "OWNER" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-[11px] font-bold text-indigo-600">
                          <Shield size={12} /> Chủ sở hữu
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          {canChangeMemberRole ? (
                            <select
                              value={member.role?.id || ""}
                              onChange={(e) => handleMemberRoleChange(member.userId, e.target.value)}
                              className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 outline-none transition focus:border-blue-500 focus:bg-white"
                            >
                              {inviteRoleOptions.map((role) => (
                                <option key={role.id} value={role.id}>
                                  {role.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="rounded-full bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-500">
                              {member.role?.name || member.role?.code}
                            </span>
                          )}

                          {canRemoveMembers && (
                            <button
                              onClick={() => handleRemove(member.userId)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                              title="Xóa thành viên"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <RoleManagementModal
        open={showRoleManager}
        onClose={() => setShowRoleManager(false)}
        workspaceId={workspace.id}
        workspaceName={workspace.name}
        roles={roles}
        permissions={permissions}
        canCreateRole={canCreateRole}
        canUpdateRole={canUpdateRole}
        canDeleteRole={canDeleteRole}
        onCreateRole={(workspaceId, payload) => handleRoleAction(() => onCreateRole(workspaceId, payload))}
        onUpdateRole={(workspaceId, roleId, payload) =>
          handleRoleAction(() => onUpdateRole(workspaceId, roleId, payload))
        }
        onDeleteRole={(workspaceId, roleId) => handleRoleAction(() => onDeleteRole(workspaceId, roleId))}
      />
    </div>
  );
}