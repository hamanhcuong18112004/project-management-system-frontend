"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Shield, Trash2, UserPlus, X } from "lucide-react";
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
            <form onSubmit={handleInviteSubmit} className="grid gap-3 border-b border-slate-100 pb-6 md:grid-cols-[1fr_220px_auto]">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Nhập email của thành viên mới..."
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100"
              />

              <select
                value={inviteRoleId}
                onChange={(event) => setInviteRoleId(event.target.value)}
                disabled={loadingRbac || inviteRoleOptions.length === 0}
                className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100"
              >
                {inviteRoleOptions.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name} ({role.code})
                  </option>
                ))}
              </select>

              <button
                type="submit"
                disabled={submittingInvite || !inviteRoleId}
                className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                <UserPlus size={16} /> Mời
              </button>
            </form>
          )}

          <div className="flex items-center justify-between rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-cyan-900">Vai trò và quyền</p>
              <p className="text-xs text-cyan-700">Quản lý vai trò và gán quyền theo module cho workspace.</p>
            </div>
            <button
              onClick={() => setShowRoleManager(true)}
              disabled={(!canViewRoles && !canManageRoles) || loadingRbac}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-60"
            >
              <Shield size={16} /> Quản lý vai trò
            </button>
          </div>

          {/* Member List */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">
              Danh sách thành viên ({members.length})
            </h3>
            {members.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Chưa có thành viên nào.</p>
            ) : (
              members.map((member) => (
                <div key={member.userId} className="flex items-center justify-between gap-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center font-semibold text-gray-600 text-sm">
                      {member.fullName ? member.fullName.charAt(0).toUpperCase() : "?"}
                    </div>
                    <div>
                      {member.fullName ? (
                        <p className="text-sm font-medium text-gray-900">{member.fullName}</p>
                      ) : (
                        <p className="text-sm font-medium text-gray-900">N/A</p>
                      )}
                      <p className="text-xs text-gray-500">{member.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Role Tag/Selector */}
                    <span
                      className={`rounded px-2.5 py-1 text-xs font-medium ${
                        member.role?.code === "OWNER"
                          ? "bg-indigo-50 text-indigo-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {member.role?.name || member.role?.code || "Chưa gán role"}
                    </span>

                    {/* Placeholder phân quyền/xóa cho Owner */}
                    {(canChangeMemberRole || canRemoveMembers) && member.role?.code !== "OWNER" && (
                      <>
                        {canChangeMemberRole && (
                          <select
                            value={member.role?.id || ""}
                            onChange={(e) => handleMemberRoleChange(member.userId, e.target.value)}
                            className="rounded border border-gray-200 px-2 py-1 text-xs"
                          >
                            {inviteRoleOptions.map((role) => (
                              <option key={role.id} value={role.id}>
                                {role.name}
                              </option>
                            ))}
                          </select>
                        )}
                        {canRemoveMembers && (
                          <button
                            onClick={() => handleRemove(member.userId)}
                            className="text-gray-400 hover:text-red-600 p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))
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