"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, Mail, Search, Shield, UserMinus, X } from "lucide-react";
import type { BoardMemberSummary } from "@/lib/api/board";
import type { Member as WorkspaceMember } from "@/lib/api/workspace";

// Board member roles — OWNER is treated as ADMIN everywhere (no special owner concept)
const ASSIGNABLE_ROLES = ["ADMIN", "MEMBER", "VIEWER"] as const;
type BoardRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

const ROLE_LABELS: Record<BoardRole, string> = {
  OWNER: "Admin",
  ADMIN: "Admin",
  MEMBER: "Thành viên",
  VIEWER: "Xem",
};

interface BoardMembersDialogProps {
  open: boolean;
  boardName: string;
  boardMembers: BoardMemberSummary[];
  workspaceMembers: WorkspaceMember[];
  ownerId?: string;
  currentUserId?: string;
  currentUserRole?: string;
  onClose: () => void;
  onConfirm: (draft: { userId: string; role: string }[]) => Promise<void>;
  onLookupByEmail?: (email: string) => Promise<{ userId: string; email: string }>;
}

interface DraftMember {
  userId: string;
  fullName: string;
  email: string;
  role: BoardRole;
  isNew?: boolean;
}

function getInitials(name: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const AVATAR_COLORS = [
  "bg-sky-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-indigo-500",
];

function avatarColor(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function BoardMembersDialog({
  open,
  boardName,
  boardMembers,
  workspaceMembers,
  ownerId,
  currentUserId,
  currentUserRole,
  onClose,
  onConfirm,
  onLookupByEmail,
}: BoardMembersDialogProps) {
  const [draft, setDraft] = useState<DraftMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [openRoleDropdown, setOpenRoleDropdown] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const enriched: DraftMember[] = boardMembers
      .filter((m) => m.userId || m.id)
      .map((m) => {
        const uid = (m.userId || m.id) as string;
        const ws = workspaceMembers.find((w) => w.userId === uid);
        const role = ((m.role?.toUpperCase() === "OWNER" ? "ADMIN" : m.role?.toUpperCase()) as BoardRole) || "MEMBER";
        return {
          userId: uid,
          fullName: m.fullName || ws?.fullName || "",
          email: m.email || ws?.email || "",
          role,
        };
      });
    setDraft(enriched);
    setInviteEmail("");
    setInviteError(null);
    setConfirmOpen(false);
    setOpenRoleDropdown(null);
  }, [open, boardMembers, workspaceMembers]);

  useEffect(() => {
    if (!openRoleDropdown) return;
    const handler = (e: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target as Node)) {
        setOpenRoleDropdown(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openRoleDropdown]);

  if (!open) return null;

  const canManage = currentUserRole === "OWNER" || currentUserRole === "ADMIN";
  const adminCount = draft.filter(
    (m) => m.role === "ADMIN" || m.role === "OWNER",
  ).length;
  const hasOtherPrivileged = (excludeUserId: string) =>
    draft.some(
      (m) =>
        m.userId !== excludeUserId &&
        (m.role === "ADMIN" || m.role === "OWNER"),
    );

  // ── Invite ──────────────────────────────────────────────────────────────
  const handleAddByEmail = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;

    // Check duplicate in draft first
    if (draft.some((d) => d.email?.toLowerCase() === email)) {
      setInviteError("Người dùng này đã là thành viên của board.");
      return;
    }

    // Use API lookup to support users outside the workspace
    if (onLookupByEmail) {
      setInviting(true);
      setInviteError(null);
      try {
        const result = await onLookupByEmail(email);
        if (draft.some((d) => d.userId === result.userId)) {
          setInviteError("Người dùng này đã là thành viên của board.");
          return;
        }
        const ws = workspaceMembers.find((m) => m.userId === result.userId);
        setDraft((prev) => [
          ...prev,
          {
            userId: result.userId,
            fullName: ws?.fullName || "",
            email: result.email,
            role: "MEMBER" as const,
            isNew: true,
          },
        ]);
        setInviteEmail("");
        setInviteError(null);
        inputRef.current?.focus();
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          (err instanceof Error ? err.message : null) ||
          "Không tìm thấy người dùng với email này.";
        setInviteError(message);
      } finally {
        setInviting(false);
      }
      return;
    }

    // Fallback: search within workspaceMembers (no API)
    const ws = workspaceMembers.find((m) => m.email?.toLowerCase() === email);
    if (!ws) {
      setInviteError("Không tìm thấy người dùng này trong workspace.");
      return;
    }
    if (draft.some((d) => d.userId === ws.userId)) {
      setInviteError("Người dùng này đã là thành viên của board.");
      return;
    }
    setDraft((prev) => [
      ...prev,
      {
        userId: ws.userId,
        fullName: ws.fullName || ws.email || ws.userId,
        email: ws.email || "",
        role: "MEMBER",
        isNew: true,
      },
    ]);
    setInviteEmail("");
    setInviteError(null);
    inputRef.current?.focus();
  };

  // ── Role change ──────────────────────────────────────────────────────────
  const handleRoleChange = (userId: string, value: string) => {
    if (value === "remove" || value === "leave") {
      handleRemove(userId);
      return;
    }
    const role = value as BoardRole;
    setDraft((prev) => prev.map((m) => (m.userId === userId ? { ...m, role } : m)));
  };

  // ── Remove ───────────────────────────────────────────────────────────────
  const handleRemove = (userId: string) => {
    setDraft((prev) => prev.filter((m) => m.userId !== userId));
  };

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      await onConfirm(draft.map((m) => ({ userId: m.userId, role: m.role })));
      setConfirmOpen(false);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const pendingChanges =
    draft.length !== boardMembers.length ||
    draft.some((d) => {
      const orig = boardMembers.find((b) => (b.userId || b.id) === d.userId);
      if (!orig) return true; // new member
      return (orig.role?.toUpperCase() || "MEMBER") !== d.role;
    });

  const suggestions =
    inviteEmail.length > 0
      ? workspaceMembers
          .filter(
            (wm) =>
              (wm.email?.toLowerCase().includes(inviteEmail.toLowerCase()) ||
                wm.fullName?.toLowerCase().includes(inviteEmail.toLowerCase())) &&
              !draft.some((d) => d.userId === wm.userId),
          )
          .slice(0, 5)
      : [];

  return (
    <>
      <div className="fixed inset-0 z-96 flex items-center justify-center bg-slate-900/30 px-4 py-6 backdrop-blur-sm">
        <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} />

        <div className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20">

          {/* Header */}
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Board members</p>
              <h3 className="mt-0.5 text-lg font-bold text-slate-900">{boardName}</h3>
            </div>
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 p-2 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700">
              <X size={16} />
            </button>
          </div>

          {/* Invite by email — only for admin/owner */}
          {canManage ? (
            <div className="border-b border-slate-100 px-5 py-4">
              <p className="mb-2 text-xs font-semibold text-slate-500">Mời thành viên qua email</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    ref={inputRef}
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => { setInviteEmail(e.target.value); setInviteError(null); }}
                    onKeyDown={(e) => { if (e.key === "Enter") void handleAddByEmail(); }}
                    placeholder="Nhập email (workspace hoặc bên ngoài)..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white"
                  />
                </div>
                <button type="button" onClick={() => void handleAddByEmail()} disabled={inviting} className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60">
                  {inviting ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : "Thêm"}
                </button>
              </div>
              {inviteError ? <p className="mt-1.5 text-xs text-rose-500">{inviteError}</p> : null}

              {suggestions.length > 0 ? (
                <ul className="mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                  {suggestions.map((wm) => (
                    <li key={wm.userId}>
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          const ws = workspaceMembers.find((m) => m.userId === wm.userId);
                          if (ws && !draft.some((d) => d.userId === ws.userId)) {
                            setDraft((prev) => [...prev, { userId: ws.userId, fullName: ws.fullName || ws.email || ws.userId, email: ws.email || "", role: "MEMBER", isNew: true }]);
                            setInviteEmail("");
                            setInviteError(null);
                            inputRef.current?.focus();
                          }
                        }}
                        className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition hover:bg-slate-50"
                      >
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${avatarColor(wm.userId)}`}>
                          {getInitials(wm.fullName || wm.email || "U")}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-800">{wm.fullName || wm.email}</p>
                          <p className="truncate text-xs text-slate-400">{wm.email}</p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {/* Member list */}
          <div className="px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500">Thành viên ({draft.length})</p>
              {pendingChanges ? (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600">Có thay đổi chưa lưu</span>
              ) : null}
            </div>

            {draft.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center">
                <Search size={20} className="mx-auto mb-2 text-slate-300" />
                <p className="text-sm text-slate-400">Chưa có thành viên nào.</p>
              </div>
            ) : (
              <ul className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
                {draft.map((m) => {
                  const isSelf = m.userId === currentUserId;
                  const displayName = m.fullName || m.email || "";
                  const shortId = (m.userId ?? "").slice(0, 8);
                  const showName = displayName || `...${shortId}`;

                  // If this member is the only admin left in the draft, no one can change their role
                  const isOnlyAdmin =
                    (m.role === "ADMIN" || m.role === "OWNER") &&
                    adminCount === 1;
                  const canManageThisMember = canManage && !isOnlyAdmin;

                  // Can current user leave? Only if another admin exists (for ADMINs), or any time for non-ADMINs
                  const canLeave =
                    isSelf &&
                    (m.role !== "ADMIN" || hasOtherPrivileged(m.userId));

                  return (
                    <li key={m.userId} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${avatarColor(m.userId)}`}>
                        {getInitials(displayName || shortId)}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1">
                          <p className="text-sm font-semibold text-slate-800">{showName}</p>
                          {isSelf ? <span className="rounded bg-sky-50 px-1 py-px text-[10px] font-semibold text-sky-600">Bạn</span> : null}
                          {m.isNew ? <span className="rounded bg-emerald-50 px-1 py-px text-[10px] font-semibold text-emerald-600">Mới</span> : null}
                        </div>
                        {m.email ? (
                          <p className="truncate text-xs text-slate-400">{m.email}</p>
                        ) : (
                          <p className="truncate font-mono text-[10px] text-slate-300">{m.userId}</p>
                        )}
                      </div>

                      {/* Role badge — clickable dropdown if can manage or leave, static otherwise */}
                      {(canManageThisMember || canLeave) ? (
                        <div ref={openRoleDropdown === m.userId ? roleDropdownRef : undefined} className="relative shrink-0">
                          {/* Clickable role badge */}
                          <button
                            type="button"
                            onClick={() => setOpenRoleDropdown((prev) => prev === m.userId ? null : m.userId)}
                            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold transition hover:opacity-80 ${
                              m.role === "ADMIN"
                                ? "border-violet-200 bg-violet-50 text-violet-700"
                                : m.role === "VIEWER"
                                  ? "border-slate-200 bg-slate-50 text-slate-500"
                                  : "border-slate-200 bg-slate-100 text-slate-600"
                            }`}
                          >
                            {m.role === "ADMIN" ? <Shield size={11} /> : null}
                            {ROLE_LABELS[m.role]}
                            <ChevronDown size={10} className="opacity-60" />
                          </button>

                          {/* Dropdown */}
                          {openRoleDropdown === m.userId ? (
                            <div
                              className="absolute right-0 top-full z-20 mt-1 min-w-[148px] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              {/* Role options: only admins can change roles */}
                              {canManageThisMember ? (
                                <>
                                  {ASSIGNABLE_ROLES.map((r) => (
                                    <button
                                      key={r}
                                      type="button"
                                      onClick={() => { handleRoleChange(m.userId, r); setOpenRoleDropdown(null); }}
                                      className={`flex w-full items-center gap-2 px-3 py-1.5 text-xs font-semibold transition hover:bg-slate-50 ${
                                        m.role === r ? "text-sky-600" : "text-slate-700"
                                      }`}
                                    >
                                      {r === "ADMIN" ? <Shield size={11} /> : <span className="w-[11px]" />}
                                      {ROLE_LABELS[r]}
                                      {m.role === r ? <span className="ml-auto text-sky-500">✓</span> : null}
                                    </button>
                                  ))}
                                  <div className="my-1 border-t border-slate-100" />
                                </>
                              ) : null}
                              {isSelf ? (
                                canLeave ? (
                                  <button
                                    type="button"
                                    onClick={() => { handleRoleChange(m.userId, "leave"); setOpenRoleDropdown(null); }}
                                    className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                                  >
                                    <LogOut size={11} /> Rời board
                                  </button>
                                ) : null
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => { handleRoleChange(m.userId, "remove"); setOpenRoleDropdown(null); }}
                                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                                >
                                  <UserMinus size={11} /> Xóa khỏi board
                                </button>
                              )}
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        /* Read-only role badge */
                        <span
                          title={isOnlyAdmin ? "Admin duy nhất — không thể đổi role" : undefined}
                          className={`shrink-0 inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold ${
                          m.role === "ADMIN"
                            ? "border-violet-200 bg-violet-50 text-violet-700"
                            : m.role === "VIEWER"
                              ? "border-slate-200 bg-slate-50 text-slate-500"
                              : "border-slate-200 bg-slate-100 text-slate-600"
                        }`}>
                          {m.role === "ADMIN" ? <Shield size={11} /> : null}
                          {ROLE_LABELS[m.role]}
                          {isOnlyAdmin ? <span className="ml-0.5 opacity-50">🔒</span> : null}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-4">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
              Đóng
            </button>
            {pendingChanges ? (
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Lưu thay đổi
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {confirmOpen ? (
        <div className="fixed inset-0 z-97 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
          <button type="button" className="absolute inset-0 cursor-default" onClick={() => setConfirmOpen(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h4 className="text-base font-bold text-slate-900">Xác nhận cập nhật</h4>
            <p className="mt-2 text-sm text-slate-600">
              Bảng <span className="font-semibold text-slate-800">{boardName}</span> sẽ có{" "}
              <span className="font-semibold text-slate-800">{draft.length}</span> thành viên.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmOpen(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                Quay lại
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Đang lưu..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}