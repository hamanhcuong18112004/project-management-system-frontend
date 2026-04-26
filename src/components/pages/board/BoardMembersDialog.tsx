"use client";

import { useEffect, useRef, useState } from "react";
import { Crown, Mail, Search, UserMinus, X } from "lucide-react";
import type { BoardMemberSummary } from "@/lib/api/board";
import type { Member as WorkspaceMember } from "@/lib/api/workspace";

interface BoardMembersDialogProps {
  open: boolean;
  boardName: string;
  boardMembers: BoardMemberSummary[];
  workspaceMembers: WorkspaceMember[];
  ownerId?: string;
  onClose: () => void;
  onConfirm: (userIds: string[]) => Promise<void>;
}

interface DraftMember {
  userId: string;
  fullName: string;
  email: string;
  role: string;
}

function getInitials(name: string) {
  return name
    .split(" ")
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
  onClose,
  onConfirm,
}: BoardMembersDialogProps) {
  const [draft, setDraft] = useState<DraftMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
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
          role: m.role || "MEMBER",
        };
      });
    setDraft(enriched);
    setInviteEmail("");
    setInviteError(null);
    setConfirmOpen(false);
  }, [open, boardMembers, workspaceMembers]);

  if (!open) return null;

  const handleAddByEmail = () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
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
      { userId: ws.userId, fullName: ws.fullName || ws.email || ws.userId, email: ws.email || "", role: "MEMBER" },
    ]);
    setInviteEmail("");
    setInviteError(null);
    inputRef.current?.focus();
  };

  const handleRemove = (userId: string) => {
    setDraft((prev) => prev.filter((m) => m.userId !== userId));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const nonOwnerIds = draft.filter((m) => m.userId !== ownerId).map((m) => m.userId);
      await onConfirm(nonOwnerIds);
      setConfirmOpen(false);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const pendingChanges =
    draft.length !== boardMembers.length ||
    draft.some((d) => !boardMembers.find((b) => (b.userId || b.id) === d.userId));

  const suggestions = inviteEmail.length > 0
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
      <div className="fixed inset-0 z-[96] flex items-center justify-center bg-slate-900/30 px-4 py-6 backdrop-blur-sm">
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

          {/* Invite by email */}
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="mb-2 text-xs font-semibold text-slate-500">Mời thành viên workspace qua email</p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={inputRef}
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => { setInviteEmail(e.target.value); setInviteError(null); }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddByEmail(); }}
                  placeholder="Nhập email thành viên workspace..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white"
                />
              </div>
              <button type="button" onClick={handleAddByEmail} className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500">
                Thêm
              </button>
            </div>
            {inviteError ? <p className="mt-1.5 text-xs text-rose-500">{inviteError}</p> : null}

            {/* Suggestions dropdown */}
            {suggestions.length > 0 ? (
              <ul className="mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                {suggestions.map((wm) => (
                  <li key={wm.userId}>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setInviteEmail(wm.email || "");
                        setTimeout(() => {
                          const ws = workspaceMembers.find((m) => m.userId === wm.userId);
                          if (ws && !draft.some((d) => d.userId === ws.userId)) {
                            setDraft((prev) => [...prev, { userId: ws.userId, fullName: ws.fullName || ws.email || ws.userId, email: ws.email || "", role: "MEMBER" }]);
                            setInviteEmail("");
                            setInviteError(null);
                            inputRef.current?.focus();
                          }
                        }, 0);
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

          {/* Member list */}
          <div className="px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500">Thành viên hiện tại ({draft.length})</p>
              {pendingChanges ? (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600">Có thay đổi chưa lưu</span>
              ) : null}
            </div>

            {draft.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center">
                <Search size={20} className="mx-auto mb-2 text-slate-300" />
                <p className="text-sm text-slate-400">Chưa có thành viên nào. Mời bằng email ở trên.</p>
              </div>
            ) : (
              <ul className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
                {draft.map((m) => {
                  const isOwner = m.userId === ownerId || m.role === "OWNER";
                  const displayName = m.fullName || m.email || m.userId;
                  return (
                    <li key={m.userId} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${avatarColor(m.userId)}`}>
                        {getInitials(displayName)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-semibold text-slate-800">{displayName}</p>
                          {isOwner ? (
                            <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600">
                              <Crown size={9} /> Owner
                            </span>
                          ) : (
                            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">Member</span>
                          )}
                        </div>
                        {m.email ? <p className="truncate text-xs text-slate-400">{m.email}</p> : null}
                      </div>
                      {!isOwner ? (
                        <button type="button" onClick={() => handleRemove(m.userId)} className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600" title="Xóa khỏi board">
                          <UserMinus size={14} />
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
              Hủy
            </button>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={!pendingChanges}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Lưu thay đổi
            </button>
          </div>
        </div>
      </div>

      {confirmOpen ? (
        <div className="fixed inset-0 z-[97] flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
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
