"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, PlusCircle, Shield, Trash2, X } from "lucide-react";
import type {
  PermissionDefinition,
  RoleDefinition,
  SaveRolePayload,
} from "@/lib/api/workspace";

type RoleManagementModalProps = {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  workspaceName: string;
  roles: RoleDefinition[];
  permissions: PermissionDefinition[];
  canCreateRole: boolean;
  canUpdateRole: boolean;
  canDeleteRole: boolean;
  onCreateRole: (workspaceId: string, payload: SaveRolePayload) => Promise<void>;
  onUpdateRole: (workspaceId: string, roleId: string, payload: SaveRolePayload) => Promise<void>;
  onDeleteRole: (workspaceId: string, roleId: string) => Promise<void>;
};

const DEFAULT_FORM: SaveRolePayload = {
  name: "",
  code: "",
  permissionIds: [],
};

const MODULE_LABELS: Record<string, string> = {
  WORKSPACE: "Không gian làm việc",
  MEMBER: "Thành viên",
  ROLE: "Vai trò",
  BOARD: "Bảng",
  LIST: "Danh sách",
  TASK: "Công việc",
  BILLING: "Thanh toán",
  SETTINGS: "Cài đặt",
  OTHER: "Khác",
};

export function RoleManagementModal({
  open,
  onClose,
  workspaceId,
  workspaceName,
  roles,
  permissions,
  canCreateRole,
  canUpdateRole,
  canDeleteRole,
  onCreateRole,
  onUpdateRole,
  onDeleteRole,
}: RoleManagementModalProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [form, setForm] = useState<SaveRolePayload>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedRoleId) || null,
    [roles, selectedRoleId],
  );

  const permissionGroups = useMemo(() => {
    return permissions.reduce<Record<string, PermissionDefinition[]>>((acc, permission) => {
      const moduleKey = permission.module || "OTHER";
      if (!acc[moduleKey]) {
        acc[moduleKey] = [];
      }
      acc[moduleKey].push(permission);
      return acc;
    }, {});
  }, [permissions]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!selectedRole) {
      setForm(DEFAULT_FORM);
      return;
    }

    setForm({
      name: selectedRole.name,
      code: selectedRole.code,
      permissionIds: selectedRole.permissions,
    });
  }, [open, selectedRole]);

  if (!open) {
    return null;
  }

  const isEditing = Boolean(selectedRole);
  const readOnlySystemRole = Boolean(selectedRole?.systemRole);
  const canSubmit = isEditing ? canUpdateRole : canCreateRole;

  const togglePermission = (permissionId: string) => {
    setForm((current) => {
      const exists = current.permissionIds.includes(permissionId);
      return {
        ...current,
        permissionIds: exists
          ? current.permissionIds.filter((id) => id !== permissionId)
          : [...current.permissionIds, permissionId],
      };
    });
  };

  const handleReset = () => {
    setSelectedRoleId(null);
    setForm(DEFAULT_FORM);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit || !form.name.trim() || !form.code.trim() || form.permissionIds.length === 0) {
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
      };

      if (selectedRole) {
        await onUpdateRole(workspaceId, selectedRole.id, payload);
      } else {
        await onCreateRole(workspaceId, payload);
      }

      handleReset();
    } catch {
      // Error toast is handled by parent callback.
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRole || selectedRole.systemRole || !canDeleteRole) {
      return;
    }

    if (!confirm(`Xóa role ${selectedRole.name}?`)) {
      return;
    }

    setSubmitting(true);
    try {
      await onDeleteRole(workspaceId, selectedRole.id);
      handleReset();
    } catch {
      // Error toast is handled by parent callback.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" onClick={onClose} />

      <div className="relative flex h-[90vh] w-full max-w-6xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl">
        {/* Sidebar */}
        <aside className="w-full max-w-[280px] flex flex-col border-r border-slate-100 bg-slate-50/50">
          <div className="p-6 border-b border-slate-100 bg-white">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Workspace Roles
              </span>
              <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
                <X size={16} />
              </button>
            </div>
            <h3 className="text-xl font-black text-slate-900 truncate">{workspaceName}</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <button
              onClick={handleReset}
              className={`flex w-full items-center gap-3 rounded-2xl border-2 border-dashed px-4 py-3 text-sm font-bold transition
                ${!selectedRoleId 
                  ? "border-blue-500 bg-blue-50 text-blue-600" 
                  : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-white"}`}
            >
              <PlusCircle size={18} />
              <span>Tạo vai trò mới</span>
            </button>

            <div className="pt-4 space-y-2">
              <span className="px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Danh sách vai trò</span>
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRoleId(role.id)}
                  className={`group relative w-full rounded-2xl p-4 text-left transition-all duration-200 ${
                    selectedRoleId === role.id
                      ? "bg-white shadow-lg shadow-slate-200/50 ring-1 ring-slate-200"
                      : "hover:bg-white/80"
                  }`}
                >
                  {selectedRoleId === role.id && (
                    <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-blue-600" />
                  )}
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-sm font-black ${selectedRoleId === role.id ? "text-blue-600" : "text-slate-700"}`}>
                      {role.name}
                    </p>
                    {role.systemRole && (
                      <Shield size={12} className="text-amber-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{role.code}</span>
                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                    <span className="text-[10px] font-bold text-slate-500">{role.permissions.length} quyền</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <section className="flex-1 flex flex-col bg-white overflow-hidden">
          <div className="flex items-center justify-between px-8 py-6 border-b border-slate-50">
            <div>
              <h2 className="text-2xl font-black text-slate-900">
                {isEditing ? "Cấu hình vai trò" : "Thiết lập vai trò mới"}
              </h2>
              <p className="text-sm font-medium text-slate-500">
                Định nghĩa các đặc quyền truy cập cho nhóm người dùng này.
              </p>
            </div>
            {readOnlySystemRole && (
              <div className="flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-[11px] font-bold text-amber-600 ring-1 ring-amber-100">
                <AlertTriangle size={14} /> 
                <span>VAI TRÒ HỆ THỐNG (CHỈ XEM)</span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Tên hiển thị</label>
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Ví dụ: Quản lý dự án"
                  disabled={!canSubmit || readOnlySystemRole || submitting}
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-sm font-bold text-slate-900 transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Mã định danh (Role Code)</label>
                <input
                  value={form.code}
                  onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))}
                  placeholder="PROJECT_MANAGER"
                  disabled={!canSubmit || readOnlySystemRole || submitting}
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-sm font-black tracking-widest text-blue-600 transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 outline-none disabled:opacity-50"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-end justify-between">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Phân quyền chi tiết</h4>
                <div className="px-3 py-1 rounded-full bg-blue-50 text-[10px] font-black text-blue-600 ring-1 ring-blue-100">
                  {form.permissionIds.length} QUYỀN ĐÃ CHỌN
                </div>
              </div>

              <div className="grid gap-6">
                {Object.entries(permissionGroups).map(([moduleName, modulePermissions]) => (
                  <div key={moduleName} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-px flex-1 bg-slate-100" />
                      <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-300">
                        {MODULE_LABELS[moduleName] || moduleName}
                      </span>
                      <div className="h-px flex-1 bg-slate-100" />
                    </div>
                    
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {modulePermissions.map((permission) => {
                        const checked = form.permissionIds.includes(permission.id);
                        return (
                          <button
                            key={permission.id}
                            type="button"
                            onClick={() => togglePermission(permission.id)}
                            disabled={!canSubmit || readOnlySystemRole || submitting}
                            className={`group flex items-start justify-between gap-3 rounded-2xl border p-4 text-left transition-all duration-200 ${
                              checked
                                ? "border-blue-200 bg-blue-50/50 ring-1 ring-blue-100"
                                : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm"
                            }`}
                          >
                            <div className="space-y-1">
                              <p className={`text-sm font-bold ${checked ? "text-blue-700" : "text-slate-700"}`}>
                                {permission.name}
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 font-mono opacity-60">
                                {permission.id}
                              </p>
                            </div>
                            <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                              checked 
                                ? "border-blue-600 bg-blue-600 text-white" 
                                : "border-slate-200 bg-white group-hover:border-slate-300"
                            }`}>
                              {checked && <Check size={12} strokeWidth={4} />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-8 py-6 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
            <button
              type="button"
              onClick={handleDelete}
              disabled={!canDeleteRole || !selectedRole || selectedRole.systemRole || submitting}
              className="group flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-red-500 transition hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <Trash2 size={18} className="transition group-hover:scale-110" />
              <span>Xóa vai trò này</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-700 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                onClick={handleSave}
                disabled={!canSubmit || readOnlySystemRole || submitting}
                className="rounded-2xl bg-slate-900 px-8 py-3 text-sm font-bold text-white shadow-xl shadow-slate-900/10 transition hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50"
              >
                {submitting ? "Đang lưu..." : isEditing ? "Lưu thay đổi" : "Tạo vai trò"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
