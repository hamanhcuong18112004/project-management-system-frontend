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
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex h-[86vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <aside className="w-full max-w-xs border-r border-slate-200 bg-gradient-to-b from-slate-50 to-white p-5">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Quản lý vai trò
              </p>
              <h3 className="mt-2 text-lg font-bold text-slate-900">{workspaceName}</h3>
            </div>
            <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
              <X size={18} />
            </button>
          </div>

          <button
            onClick={handleReset}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-cyan-300 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-700 hover:bg-cyan-100"
          >
            <PlusCircle size={16} /> Tạo vai trò mới
          </button>

          <div className="space-y-2 overflow-y-auto pr-1">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRoleId(role.id)}
                className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                  selectedRoleId === role.id
                    ? "border-cyan-400 bg-cyan-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{role.name}</p>
                  {role.systemRole && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                          <Shield size={12} /> Hệ thống
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{role.code}</p>
                <p className="mt-2 text-xs text-slate-500">{role.permissions.length} quyền</p>
              </button>
            ))}
          </div>
        </aside>

        <section className="flex-1 overflow-y-auto bg-white p-6">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {isEditing ? "Chỉnh sửa vai trò" : "Tạo vai trò mới"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Gán quyền theo module để kiểm soát truy cập ở mức production.
              </p>
            </div>
            {readOnlySystemRole && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                <AlertTriangle size={14} /> Vai trò hệ thống chỉ xem
              </span>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Tên vai trò</span>
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Ví dụ: Người đánh giá QA"
                  disabled={!canSubmit || readOnlySystemRole || submitting}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-cyan-500 focus:outline-none"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Mã vai trò</span>
                <input
                  value={form.code}
                  onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))}
                  placeholder="QA_REVIEWER"
                  disabled={!canSubmit || readOnlySystemRole || submitting}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm uppercase tracking-wider focus:border-cyan-500 focus:outline-none"
                />
              </label>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">Quyền</p>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">
                  {form.permissionIds.length} đã chọn
                </p>
              </div>

              <div className="space-y-4">
                {Object.entries(permissionGroups).map(([moduleName, modulePermissions]) => (
                  <div key={moduleName} className="rounded-xl border border-slate-200 bg-white p-3">
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                        {MODULE_LABELS[moduleName] || moduleName}
                      </h4>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {modulePermissions.map((permission) => {
                        const checked = form.permissionIds.includes(permission.id);
                        return (
                          <button
                            key={permission.id}
                            type="button"
                            onClick={() => togglePermission(permission.id)}
                            disabled={!canSubmit || readOnlySystemRole || submitting}
                            className={`flex items-start justify-between gap-2 rounded-lg border px-3 py-2 text-left transition ${
                              checked
                                ? "border-cyan-400 bg-cyan-50"
                                : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                          >
                            <div>
                              <p className="text-sm font-medium text-slate-800">{permission.name}</p>
                              <p className="text-xs text-slate-500">{permission.id}</p>
                            </div>
                            {checked && <Check size={15} className="mt-0.5 text-cyan-700" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
              <button
                type="button"
                onClick={handleDelete}
                disabled={!canDeleteRole || !selectedRole || selectedRole.systemRole || submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={15} /> Xóa vai trò
              </button>

              <button
                type="submit"
                disabled={!canSubmit || readOnlySystemRole || submitting}
                className="rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isEditing ? "Lưu cập nhật" : "Tạo vai trò"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
