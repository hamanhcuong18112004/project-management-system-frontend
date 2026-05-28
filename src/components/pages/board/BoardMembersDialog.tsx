"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut, Search, UserMinus, X } from "lucide-react";
import type { BoardMemberSummary } from "@/lib/api/board";
import type { Member as WorkspaceMember, RoleDefinition } from "@/lib/api/workspace";

interface BoardMembersDialogProps {
  open: boolean;
  boardName: string;
  boardMembers: BoardMemberSummary[];
  workspaceMembers: WorkspaceMember[];
  currentUserId?: string;
  canManage: boolean;
  onClose: () => void;
  onConfirm: (userIds: string[]) => Promise<void>;
}

interface DraftMember {
  userId: string;
  fullName: string;
  email: string;
  wsRole: RoleDefinition | null;
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

function wsRoleBadge(role: RoleDefinition | null | undefined) {
  const code = role?.code?.toUpperCase();
  switch (code) {
    case "OWNER":
      return { label: "Chủ sở hữu", cls: "border-amber-200 bg-amber-50 text-amber-700" };
    case "ADMIN":
      return { label: "Quản trị viên", cls: "border-violet-200 bg-violet-50 text-violet-700" };
    case "VIEWER":
      return { label: "Xem", cls: "border-slate-200 bg-slate-50 text-slate-500" };
    default:
      return { label: role?.name || "Thành viên", cls: "border-slate-200 bg-slate-100 text-slate-600" };
  }
}

export function BoardMembersDialog({
  open,
  boardName,
  boardMembers,
  workspaceMembers,
  currentUserId,
  canManage,
  onClose,
  onConfirm,
}: BoardMembersDialogProps) {
  const [draft, setDraft] = useState<DraftMember[]>([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const enriched: DraftMember[] = boardMembers
      .filter((m) => m.userId || m.id)
      .map((m) => {
        const uid = (m.userId || m.id) as string;
        const ws = workspaceMembers.find((w) => w.userId === uid);
        return {
          userId: uid,
          fullName: m.fullName || ws?.fullName || "",
          email: m.email || ws?.email || "",
          wsRole: ws?.role ?? null,
        };
      });
    setDraft(enriched);
    setSearch("");
    setConfirmOpen(false);
  }, [open, boardMembers, workspaceMembers]);

  if (!open) return null;

  // -- Add from workspace ---------------------------------------------------
  const handleAdd = (wm: WorkspaceMember) => {
    if (draft.some((d) => d.userId === wm.userId)) return;
    setDraft((prev) => [
      ...prev,
      {
        userId: wm.userId,
        fullName: wm.fullName || wm.email || wm.userId,
        email: wm.email || "",
        wsRole: wm.role ?? null,
        isNew: true,
      },
    ]);
    setSearch("");
    inputRef.current?.focus();
  };

  // -- Remove ---------------------------------------------------------------
  const handleRemove = (userId: string) => {
    setDraft((prev) => prev.filter((m) => m.userId !== userId));
  };

  // -- Save -----------------------------------------------------------------
  const handleSave = async () => {
    setSaving(true);
    try {
      await onConfirm(draft.map((m) => m.userId));
      setConfirmOpen(false);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const currentBoardMemberIds = new Set(boardMembers.map((b) => (b.userId || b.id) as string));
  const pendingChanges =
    draft.length !== boardMembers.length ||
    draft.some((d) => !currentBoardMemberIds.has(d.userId));

  const suggestions =
    canManage && search.length > 0
      ? workspaceMembers
          .filter(
            (wm) =>
              (wm.email?.toLowerCase().includes(search.toLowerCase()) ||
                wm.fullName?.toLowerCase().includes(search.toLowerCase())) &&
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

          {/* Add workspace member � only for managers */}
          {canManage ? (
            <div className="border-b border-slate-100 px-5 py-4">
              <p className="mb-2 text-xs font-semibold text-slate-500">Thêm thành viên từ workspace</p>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm tên hoặc email trong workspace..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white"
                />
              </div>
              {suggestions.length > 0 ? (
                <ul className="mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                  {suggestions.map((wm) => {
                    const badge = wsRoleBadge(wm.role);
                    return (
                      <li key={wm.userId}>
                        <button
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); handleAdd(wm); }}
                          className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition hover:bg-slate-50"
                        >
                          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${avatarColor(wm.userId)}`}>
                            {getInitials(wm.fullName || wm.email || "U")}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-slate-800">{wm.fullName || wm.email}</p>
                            <p className="truncate text-xs text-slate-400">{wm.email}</p>
                          </div>
                          <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : search.length > 0 ? (
                <p className="mt-1.5 text-xs text-slate-400">Không tìm thấy thành viên workspace phù hợp.</p>
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
                  const badge = wsRoleBadge(m.wsRole);

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

                      {/* Workspace role badge (read-only) */}
                      <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold ${badge.cls}`}>
                        {badge.label}
                      </span>

                      {/* Action: remove (for manager, non-self) or leave (for self) */}
                      {canManage && !isSelf ? (
                        <button
                          type="button"
                          onClick={() => handleRemove(m.userId)}
                          title="Xóa khỏi board"
                          className="ml-1 shrink-0 rounded-lg border border-slate-200 p-1.5 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500"
                        >
                          <UserMinus size={13} />
                        </button>
                      ) : isSelf ? (
                        <button
                          type="button"
                          onClick={() => handleRemove(m.userId)}
                          title="Rời board"
                          className="ml-1 shrink-0 rounded-lg border border-slate-200 p-1.5 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500"
                        >
                          <LogOut size={13} />
                        </button>
                      ) : null}
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
